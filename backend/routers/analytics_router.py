import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from database import get_db
from models import User, FamilyProfile, MedicalDocument, LabResult, Medication
from schemas import ParameterTrend, TrendPoint, TimelineEvent, AIAssistantRequest, AIAssistantResponse
from auth import get_current_user
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analytics", tags=["Health Analytics & Trends"])

@router.get("/trends/{profile_id}", response_model=List[ParameterTrend])
def get_health_trends(
    profile_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(FamilyProfile).filter(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    lab_records = (
        db.query(LabResult)
        .filter(LabResult.profile_id == profile_id)
        .order_by(LabResult.test_date.asc())
        .all()
    )

    grouped = {}
    for record in lab_records:
        param = record.parameter_name
        if param not in grouped:
            grouped[param] = []
        grouped[param].append(TrendPoint(
            date=record.test_date.isoformat(),
            value=record.value,
            unit=record.unit,
            status=record.status,
            reference_range=record.reference_range
        ))

    results = []
    for param_name, points in grouped.items():
        points.sort(key=lambda x: x.date)
        latest = points[-1]
        results.append(ParameterTrend(
            parameter_name=param_name,
            latest_value=latest.value,
            unit=latest.unit,
            latest_status=latest.status,
            history=points
        ))

    return results

@router.get("/timeline/{profile_id}", response_model=List[TimelineEvent])
def get_health_timeline(
    profile_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(FamilyProfile).filter(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    documents = (
        db.query(MedicalDocument)
        .filter(MedicalDocument.profile_id == profile_id)
        .order_by(MedicalDocument.document_date.desc())
        .all()
    )

    events = []
    for doc in documents:
        date_str = doc.document_date.isoformat() if doc.document_date else doc.created_at.strftime("%Y-%m-%d")
        events.append(TimelineEvent(
            id=doc.id,
            date=date_str,
            title=f"{doc.document_type}: {doc.file_name}",
            type=doc.document_type,
            summary=doc.ai_summary or "Medical report record digitized.",
            lab_count=len(doc.lab_results),
            med_count=len(doc.medications),
            file_url=doc.file_path
        ))

    return events

def query_ai_assistant_with_context(user_query: str, profile_name: str, lab_summary: str) -> str:
    if not settings.GEMINI_API_KEY:
        return ""
    try:
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        prompt = f"""You are MediVault AI, an intelligent clinical health assistant for {profile_name}.
Below are the actual digitized health records and lab parameters for {profile_name}:

{lab_summary}

User Question: "{user_query}"

Provide a clear, empathetic, and clinically precise answer directly addressing the user's question using their actual numbers, status indicators (Normal/High/Low), and historical trends. Include actionable lifestyle/diet tips if asked, and end with a brief medical disclaimer."""
        
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        logger.debug("Assistant invocation note: %s", e)
    return ""

def _resolve_clinical_fallback(query: str, profile_name: str, latest_labs: list, documents: list) -> str:
    q = query.lower()

    if any(k in q for k in ("liver", "hepatic", "lft", "alt", "ast", "sgot", "sgpt", "bilirubin", "alp")):
        params = [r for r in latest_labs if any(k in r.parameter_name.lower() for k in ("liver", "alt", "ast", "sgot", "sgpt", "bilirubin", "alkaline"))]
        if params:
            lines = [f"• **{r.parameter_name}**: `{r.value} {r.unit or ''}` (Status: **{r.status}**, Ref: `{r.reference_range or 'N/A'}`)" for r in params]
            return f"### 🧪 Liver Function Panel (LFT) for {profile_name}\n\n" + "\n".join(lines) + "\n\n**Clinical Guidance**: Maintain a low-fat diet, limit alcohol intake, and consult your physician if liver enzyme levels are elevated."
        available = "\n".join([f"• **{r.parameter_name}**: `{r.value} {r.unit or ''}` ({r.status})" for r in latest_labs])
        return f"### 🧪 Liver Report Query for {profile_name}\n\nNo specific Liver Function Test (LFT) parameters (ALT, AST, Bilirubin) are currently logged in the digitized vault for {profile_name}.\n\n**Current Available Digitized Parameters**:\n{available}\n\n*To inspect liver health, upload a Liver Function Test PDF or report photo using Smart Upload!*"

    if any(k in q for k in ("kidney", "renal", "creatinine", "urea", "bun", "egfr", "uric")):
        params = [r for r in latest_labs if any(k in r.parameter_name.lower() for k in ("creatinine", "urea", "bun", "kidney", "uric"))]
        if params:
            lines = [f"• **{r.parameter_name}**: `{r.value} {r.unit or ''}` (Status: **{r.status}**, Ref: `{r.reference_range or 'N/A'}`)" for r in params]
            return f"### 🧪 Kidney Function Panel (KFT) for {profile_name}\n\n" + "\n".join(lines) + "\n\n**Guidance**: Ensure adequate daily hydration (2.5L water) and monitor protein intake."
        return f"### 🧪 Kidney Report Query for {profile_name}\n\nNo specific Kidney Function Test (KFT) parameters (Creatinine, Urea) are logged yet for {profile_name}. Upload a Renal Panel report to track kidney metrics."

    if any(k in q for k in ("glucose", "sugar", "diabetes", "hba1c")):
        g_item = next((r for r in latest_labs if "glucose" in r.parameter_name.lower() or "sugar" in r.parameter_name.lower()), None)
        h_item = next((r for r in latest_labs if "hba1c" in r.parameter_name.lower()), None)
        parts = []
        if g_item:
            parts.append(f"• **Fasting Blood Glucose**: `{g_item.value} {g_item.unit or 'mg/dL'}` (Status: **{g_item.status}**, Ref: `{g_item.reference_range or '70-99'}`).")
        if h_item:
            parts.append(f"• **HbA1c**: `{h_item.value} {h_item.unit or '%'}` (Status: **{h_item.status}**, Ref: `{h_item.reference_range or '<5.7'}`).")
        if parts:
            insight = ("Elevated blood sugar levels require monitoring. Maintain a low-glycemic index diet, reduce simple sugars, and consult your primary physician for glycemic management."
                       if any(r.status != 'Normal' for r in (g_item, h_item) if r) else "Your blood sugar parameters are within normal healthy reference ranges!")
            return f"### 🩸 Blood Sugar Evaluation for {profile_name}\n\n" + "\n".join(parts) + f"\n\n**Health Insights**: {insight}"
        return f"No specific blood glucose records found yet for {profile_name}. Upload a blood report PDF or photo to extract your glucose levels."

    if any(k in q for k in ("hemoglobin", "hgb", "cbc", "anemia", "blood count")):
        hb = next((r for r in latest_labs if "hemoglobin" in r.parameter_name.lower() or "hgb" in r.parameter_name.lower()), None)
        if hb:
            guidance = ("Hemoglobin is within optimal range. Maintain balanced iron and vitamin intake." if hb.status == 'Normal'
                        else "Hemoglobin level is out of normal reference range. Consult your physician regarding dietary iron or vitamin supplementation.")
            return f"### 🩺 Hemoglobin Status for {profile_name}\n\n• **Latest Hemoglobin**: `{hb.value} {hb.unit or 'g/dL'}` (Status: **{hb.status}**, Ref: `{hb.reference_range or '12-16'}`).\n\n**Guidance**: {guidance}"
        if latest_labs:
            highlights = "\n".join([f"• **{r.parameter_name}**: `{r.value} {r.unit or ''}` (Status: **{r.status}**)" for r in latest_labs[:4]])
            return f"### 🩺 Hemoglobin & Blood Parameters for {profile_name}\n\nYour digitized lab reports show valid parameters. Here are your latest recorded key lab indicators:\n{highlights}"
        return f"No hemoglobin test records logged yet for {profile_name}."

    if any(k in q for k in ("cholesterol", "lipid", "triglycerides", "heart")):
        c_item = next((r for r in latest_labs if "cholesterol" in r.parameter_name.lower()), None)
        t_item = next((r for r in latest_labs if "triglyceride" in r.parameter_name.lower()), None)
        parts = []
        if c_item:
            parts.append(f"• **Total Cholesterol**: `{c_item.value} {c_item.unit or 'mg/dL'}` (Status: **{c_item.status}**, Ref: `{c_item.reference_range or '<200'}`).")
        if t_item:
            parts.append(f"• **Triglycerides**: `{t_item.value} {t_item.unit or 'mg/dL'}` (Status: **{t_item.status}**, Ref: `{t_item.reference_range or '<150'}`).")
        if parts:
            return f"### 🫀 Lipid Profile Overview for {profile_name}\n\n" + "\n".join(parts) + "\n\n**Recommendation**: Limit saturated fats, incorporate soluble fiber (oats, legumes), and engage in 30 minutes of regular aerobic exercise daily."
        return f"No lipid profile test records logged yet for {profile_name}."

    if any(k in q for k in ("report", "document", "pdf", "file", "vault", "show my")):
        if documents:
            doc_lines = [f"• **{d.file_name}** ({d.document_type}, Date: {d.document_date or 'Recent'}): {len(d.lab_results)} extracted parameters." for d in documents]
            param_lines = [f"• **{r.parameter_name}**: `{r.value} {r.unit or ''}` (Status: **{r.status}**)" for r in latest_labs]
            return f"### 📄 Digitized Medical Reports for {profile_name}\n\nHere are the medical files stored in {profile_name}'s vault:\n\n" + "\n".join(doc_lines) + "\n\n**Extracted Parameters**:\n" + "\n".join(param_lines)
        return f"No medical report files uploaded yet for {profile_name}."

    matching = [r for r in latest_labs if any(w in r.parameter_name.lower() for w in q.split() if len(w) > 2)]
    if matching:
        match_lines = [f"• **{r.parameter_name}**: `{r.value} {r.unit or ''}` (Status: **{r.status}**, Ref: `{r.reference_range or 'N/A'}`)" for r in matching]
        return f"### 🔍 Search Results for '{query}' ({profile_name})\n\n" + "\n".join(match_lines)

    if any(k in q for k in ("improve", "advice", "diet", "lifestyle", "help", "health")):
        abnormal = [r for r in latest_labs if r.status != 'Normal']
        if abnormal:
            ab_str = ", ".join([f"**{r.parameter_name}** ({r.value} {r.unit or ''})" for r in abnormal])
            return f"### 💡 Personalized Health Improvement Advice for {profile_name}\n\nBased on your records, elevated parameters were detected for: {ab_str}.\n\n**Actionable Steps**:\n1. 🥗 **Nutrition**: Reduce processed carbs, refined sugars, and saturated fats. Increase fiber-rich vegetables.\n2. 🏃 **Physical Activity**: Aim for 150 minutes of moderate exercise weekly.\n3. 💧 **Hydration**: Drink 2.5 - 3 liters of water daily.\n4. 👨‍⚕️ **Clinical Follow-up**: Review parameters with your physician."
        return f"### 🌟 Health Maintenance Advice for {profile_name}\n\nAll recorded lab parameters are within healthy reference ranges! Continue maintaining a balanced diet, regular exercise, and annual preventative health checkups."

    if latest_labs:
        lab_str = "\n".join([f"• **{r.parameter_name}**: `{r.value} {r.unit or ''}` (Status: **{r.status}**)" for r in latest_labs])
        return f"### 🤖 MediVault AI Health Summary for {profile_name}\n\nHere are all digitized lab parameters for {profile_name}:\n\n{lab_str}\n\n*Try asking specific queries like 'Show my glucose', 'Show my liver report', 'Show my cholesterol', or 'How to improve my health?'*"

    return f"Hello! I am your MediVault AI Assistant for {profile_name}. Upload your blood reports to extract lab parameters and ask health queries."

@router.post("/ai-assistant", response_model=AIAssistantResponse)
async def ask_ai_assistant(
    payload: AIAssistantRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(FamilyProfile).filter(
        FamilyProfile.id == payload.profile_id,
        FamilyProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    lab_records = (
        db.query(LabResult)
        .filter(LabResult.profile_id == payload.profile_id)
        .order_by(LabResult.test_date.desc())
        .all()
    )

    documents = (
        db.query(MedicalDocument)
        .filter(MedicalDocument.profile_id == payload.profile_id)
        .order_by(MedicalDocument.document_date.desc())
        .all()
    )

    labs_formatted = []
    seen = set()
    latest_labs = []

    for r in lab_records:
        labs_formatted.append(f"- {r.parameter_name}: {r.value} {r.unit or ''} (Status: {r.status}, Ref: {r.reference_range or 'N/A'}, Date: {r.test_date})")
        if r.parameter_name not in seen:
            seen.add(r.parameter_name)
            latest_labs.append(r)

    lab_context_str = "\n".join(labs_formatted) if labs_formatted else "No historical lab results recorded yet."

    answer = ""
    if settings.GEMINI_API_KEY:
        try:
            answer = await run_in_threadpool(
                query_ai_assistant_with_context, payload.query, profile.name, lab_context_str
            )
        except Exception:
            answer = ""

    if not answer:
        answer = _resolve_clinical_fallback(payload.query, profile.name, latest_labs, documents)

    return AIAssistantResponse(
        query=payload.query,
        answer=answer,
        suggested_actions=["What is my latest Glucose level?", "Show my liver report", "Show my progress", "How can I improve my health?"]
    )
