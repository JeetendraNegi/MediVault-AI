import json
import re
import datetime
import logging
import concurrent.futures
from config import settings
from services.medical_rules import (
    MONTH_MAP,
    DATE_PATTERNS,
    PREFIX_PATTERNS,
    IGNORE_TOKENS,
    DISCARD_PHRASES,
    LINE_MATCH_PATTERN,
    VALUE_LINE_PATTERN,
    UNIT_ONLY_PATTERN
)

logger = logging.getLogger(__name__)

def _try_parse_date_string(date_str: str):
    if not date_str:
        return None
    date_str = date_str.strip(',. ')

    alpha_match = re.search(r'^(\d{1,2})[\/\-\s]+([A-Za-z]{3,9})[\/\-\s]+(\d{2,4})$', date_str)
    if alpha_match:
        day = int(alpha_match.group(1))
        mon_name = alpha_match.group(2).lower()
        yr_val = int(alpha_match.group(3))
        if yr_val < 100:
            yr_val += 2000
        mon = MONTH_MAP.get(mon_name)
        if mon and 1 <= day <= 31 and 1990 <= yr_val <= 2035:
            try:
                return datetime.date(yr_val, mon, day)
            except ValueError:
                pass

    num_match = re.search(r'^(\d{1,4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,4})$', date_str)
    if num_match:
        p1, p2, p3 = int(num_match.group(1)), int(num_match.group(2)), int(num_match.group(3))
        if p1 >= 1990 and 1 <= p2 <= 12 and 1 <= p3 <= 31:
            try:
                return datetime.date(p1, p2, p3)
            except ValueError:
                pass
        if p3 >= 1990 and 1 <= p2 <= 12 and 1 <= p1 <= 31:
            try:
                return datetime.date(p3, p2, p1)
            except ValueError:
                pass
        if p3 >= 1990 and 1 <= p1 <= 12 and 1 <= p2 <= 31:
            try:
                return datetime.date(p3, p1, p2)
            except ValueError:
                pass

    return None

def parse_date_from_text(raw_text: str) -> str:
    today_str = datetime.date.today().isoformat()
    if not raw_text:
        return today_str

    candidates = []
    for pat in DATE_PATTERNS:
        matches = pat.findall(raw_text)
        for m in matches:
            candidates.append(m.strip())

    header_text = "\n".join(raw_text.split('\n')[:35])
    candidates.extend(re.findall(r'\b(\d{1,2}[\/\-\s]+[A-Za-z]{3,9}[\/\-\s]+\d{2,4})\b', header_text))
    candidates.extend(re.findall(r'\b(\d{2,4}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b', header_text))

    for cand in candidates:
        parsed_dt = _try_parse_date_string(cand)
        if parsed_dt:
            return parsed_dt.isoformat()

    return today_str

def _call_gemini_api(prompt: str) -> dict:
    from google import genai
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents=prompt
    )
    raw = response.text.strip()
    if raw.startswith("```json"):
        raw = raw.replace("```json", "", 1).rstrip("`").strip()
    return json.loads(raw)

def parse_reference_range(ref_str: str):
    if not ref_str:
        return 0.0, 99999.0

    range_match = re.search(r'(\d+\.?\d*)\s*[\-\–\—\to]+\s*(\d+\.?\d*)', ref_str, re.IGNORECASE)
    if range_match:
        return float(range_match.group(1)), float(range_match.group(2))

    upper_match = re.search(r'[<\=]+\s*(\d+\.?\d*)', ref_str)
    if upper_match:
        return 0.0, float(upper_match.group(1))

    lower_match = re.search(r'[>\=]+\s*(\d+\.?\d*)', ref_str)
    if lower_match:
        return float(lower_match.group(1)), 99999.0

    return 0.0, 99999.0

def clean_test_name(raw_name: str) -> str:
    name = raw_name.strip(" ()[]:,-*")
    for _ in range(5):
        prev = name
        for pat in PREFIX_PATTERNS:
            name = pat.sub('', name).strip(" ()[]:,-*")
        if name == prev:
            break
    name = re.sub(r'^(SERUM|TOTAL|BLOOD|TEST|NAME|RESULT|ESTIMATION|DETERMINATION)\s+', '', name, flags=re.I).strip(" ()[]:,-*")
    if name.lower() in {"sensitive", "tsh sensitive", "tsh ultrasensitive", "ultrasensitive"}:
        name = "TSH"
    if name.startswith('(') and name.endswith(')'):
        name = name[1:-1].strip()
    return name

def is_valid_parameter_name(name: str) -> bool:
    if not name or len(name.strip()) < 2:
        return False
    lower = name.lower().strip()
    
    if lower in DISCARD_PHRASES or re.search(r'\b\d+\s*(?:to|\-)\s*$', lower) or lower.endswith(' to'):
        return False

    if re.search(r'^\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)', lower):
        return False
        
    if any(k in lower for k in ('industrial estate', 'new delhi', 'pin code', 'pincode', 'road, delhi')):
        return False

    if len(re.findall(r'[A-Za-z]', name)) < 2:
        return False
        
    if any(k in lower for k in IGNORE_TOKENS):
        return False
        
    return True

def parse_medical_report_with_ai(raw_ocr_text: str) -> dict:
    today_str = datetime.date.today().isoformat()
    if not raw_ocr_text or len(raw_ocr_text.strip()) < 10:
        return {
            "document_type": "General",
            "document_date": today_str,
            "ai_summary": "No readable text could be extracted from this document. Please ensure the file is a clear lab report.",
            "lab_results": [],
            "medications": []
        }

    doc_date = parse_date_from_text(raw_ocr_text)

    if settings.GEMINI_API_KEY:
        try:
            prompt = f"""You are a senior clinical diagnostic extraction engine.
Analyze the following raw OCR text extracted from a real medical report:

```
{raw_ocr_text}
```

Extract EVERY SINGLE REAL numerical lab test parameter present in the text (extract all parameters present across all pages).
Use the EXACT parameter names (e.g. Hemoglobin, Fasting Blood Glucose, SGPT, SGOT, Creatinine, TSH, HbA1c, Cholesterol, Triglycerides, Vitamin D, Vitamin B12, Bilirubin, Uric Acid, Sodium, Potassium), EXACT numeric values, EXACT units, and EXACT printed reference ranges from the document.

Extract in strict JSON format:
1. "document_type": One of "Lab Report", "Prescription", "Discharge Summary", "Vaccination", or "General".
2. "document_date": Date in "YYYY-MM-DD" format found in report (extracted date is: {doc_date}).
3. "ai_summary": A layman-friendly 2-4 sentence summary of the findings, explaining any abnormal values simply.
4. "lab_results": List of objects with keys: "parameter_name", "value" (numeric float), "unit", "reference_range", "status" ("Normal", "High", or "Low"). Compare value to reference_range to determine status.
5. "medications": List of objects with keys: "medicine_name", "dosage", "frequency", "duration", "notes".

Return ONLY valid JSON with no extra commentary or markdown formatting."""

            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(_call_gemini_api, prompt)
                parsed = future.result(timeout=10)
                if parsed and isinstance(parsed, dict) and len(parsed.get('lab_results', [])) > 0:
                    parsed['document_date'] = doc_date
                    return parsed
        except Exception as err:
            logger.info("Gemini parsing bypassed: %s. Using local parser fallback.", err)

    doc_type = "Lab Report"
    text_lower = raw_ocr_text.lower()
    if "prescription" in text_lower or "tab" in text_lower or ("mg" in text_lower and "reference" not in text_lower and "lab" not in text_lower):
        doc_type = "Prescription"

    lab_results = []
    seen = set()
    lines = [line.strip() for line in raw_ocr_text.splitlines() if line.strip()]

    # Line-level parsing
    for line in lines:
        match = LINE_MATCH_PATTERN.search(line)
        if not match:
            continue
        raw_name, val_str = match.group(1), match.group(2)
        unit_str, ref_str = match.group(3) or "", match.group(4) or ""

        name_clean = clean_test_name(raw_name)
        if not is_valid_parameter_name(name_clean):
            continue

        try:
            val = float(val_str)
        except ValueError:
            continue

        canon_key = name_clean.lower().replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        if canon_key not in seen:
            low_b, high_b = parse_reference_range(ref_str)
            status = "Normal"
            if high_b < 99999.0 and val > high_b:
                status = "High"
            elif low_b > 0.0 and val < low_b:
                status = "Low"

            lab_results.append({
                "parameter_name": name_clean,
                "value": round(val, 2),
                "unit": unit_str,
                "reference_range": ref_str or "Standard Range",
                "status": status
            })
            seen.add(canon_key)

    # Multi-line block parsing
    i = 0
    total_lines = len(lines)
    while i < total_lines:
        current_line = lines[i]
        test_name_cand = current_line
        offset = 1

        if i + 1 < total_lines and re.search(r'^[A-Za-z\s\-\,\(\)]+$', lines[i+1]) and not re.search(r'^\d+\.?\d*$', lines[i+1]) and len(lines[i+1]) < 35:
            if not any(k in lines[i+1].lower() for k in ('mg/dl', 'g/dl', '%', 'u/l', 'mmol/l', 'fl', 'pg', 'ng/ml', 'page', 'result', 'unit', 'ref')):
                test_name_cand = f"{current_line} {lines[i+1]}"
                offset = 2

        name_clean = clean_test_name(test_name_cand)
        if not is_valid_parameter_name(name_clean) or i + offset >= total_lines:
            i += 1
            continue

        val_match = VALUE_LINE_PATTERN.search(lines[i + offset])
        if val_match:
            val = float(val_match.group(1))
            unit = val_match.group(2) or ""

            ref_idx = i + offset + 1
            if not unit and ref_idx < total_lines:
                unit_match = UNIT_ONLY_PATTERN.search(lines[ref_idx])
                if unit_match:
                    unit = lines[ref_idx]
                    ref_idx += 1

            ref_str = ""
            if ref_idx < total_lines:
                cand_ref = lines[ref_idx]
                if re.search(r'[\d\<\>\-\=]', cand_ref) and not any(k in cand_ref.lower() for k in ('page', 'patient', 'doctor', 'tata', 'note', 'comment')):
                    ref_str = cand_ref

            canon_key = name_clean.lower().replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
            if canon_key not in seen and len(name_clean) >= 2:
                low_b, high_b = parse_reference_range(ref_str)
                status = "Normal"
                if high_b < 99999.0 and val > high_b:
                    status = "High"
                elif low_b > 0.0 and val < low_b:
                    status = "Low"

                lab_results.append({
                    "parameter_name": name_clean,
                    "value": round(val, 2),
                    "unit": unit,
                    "reference_range": ref_str or "Standard Range",
                    "status": status
                })
                seen.add(canon_key)
                i += offset
                continue

        i += 1

    if lab_results:
        abnormal = [item['parameter_name'] for item in lab_results if item['status'] != 'Normal']
        if abnormal:
            summary = f"Extracted {len(lab_results)} diagnostic parameters. Out-of-range parameters detected for: {', '.join(abnormal)}. Recommend clinical evaluation."
        else:
            summary = f"Extracted {len(lab_results)} diagnostic parameters. All values are within normal healthy reference ranges."
    else:
        summary = "Document digitized and indexed."

    return {
        "document_type": doc_type,
        "document_date": doc_date,
        "ai_summary": summary,
        "lab_results": lab_results,
        "medications": []
    }
