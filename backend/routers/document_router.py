import os
import uuid
import datetime
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from database import get_db
from models import User, FamilyProfile, MedicalDocument, LabResult, Medication
from schemas import DocumentResponse
from auth import get_current_user
from config import settings
from services.ocr_service import extract_text_from_file
from services.ai_parser import parse_medical_report_with_ai

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["Medical Documents"])

@router.get("/profile/{profile_id}", response_model=List[DocumentResponse])
def get_documents_by_profile(
    profile_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(FamilyProfile).filter(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Family profile not found")

    return (
        db.query(MedicalDocument)
        .filter(MedicalDocument.profile_id == profile_id)
        .order_by(MedicalDocument.document_date.asc(), MedicalDocument.created_at.asc())
        .all()
    )

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    profile_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(FamilyProfile).filter(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Target family profile not found")

    doc_id = f"doc-{uuid.uuid4().hex[:8]}"
    safe_filename = f"{doc_id}_{file.filename}"
    file_save_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    with open(file_save_path, "wb") as buffer:
        buffer.write(await file.read())

    raw_ocr_text = await run_in_threadpool(extract_text_from_file, file_save_path)
    parsed_payload = await run_in_threadpool(parse_medical_report_with_ai, raw_ocr_text)

    doc_date = datetime.date.today()
    if parsed_payload.get("document_date"):
        try:
            doc_date = datetime.datetime.strptime(parsed_payload["document_date"], "%Y-%m-%d").date()
        except ValueError:
            pass

    document = MedicalDocument(
        id=doc_id,
        profile_id=profile_id,
        file_name=file.filename,
        file_path=f"/uploads/{safe_filename}",
        document_type=parsed_payload.get("document_type", "Lab Report"),
        document_date=doc_date,
        raw_ocr_text=raw_ocr_text,
        ai_summary=parsed_payload.get("ai_summary", "Document digitized and indexed.")
    )
    db.add(document)
    db.flush()

    for item in parsed_payload.get("lab_results", []):
        db.add(LabResult(
            id=f"lr-{uuid.uuid4().hex[:6]}",
            document_id=doc_id,
            profile_id=profile_id,
            parameter_name=item["parameter_name"],
            value=float(item["value"]),
            unit=item.get("unit"),
            reference_range=item.get("reference_range"),
            status=item.get("status", "Normal"),
            test_date=doc_date
        ))

    for item in parsed_payload.get("medications", []):
        db.add(Medication(
            id=f"med-{uuid.uuid4().hex[:6]}",
            document_id=doc_id,
            profile_id=profile_id,
            medicine_name=item["medicine_name"],
            dosage=item.get("dosage"),
            frequency=item.get("frequency"),
            duration=item.get("duration"),
            notes=item.get("notes")
        ))

    db.commit()
    db.refresh(document)
    return document

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(MedicalDocument).join(FamilyProfile).filter(
        MedicalDocument.id == document_id,
        FamilyProfile.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    db.delete(doc)
    db.commit()
    return None
