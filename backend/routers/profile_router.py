import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, FamilyProfile, MedicalDocument, LabResult, Medication
from schemas import ProfileCreate, ProfileUpdate, ProfileResponse
from auth import get_current_user

router = APIRouter(prefix="/profiles", tags=["Family Profiles"])

@router.get("", response_model=List[ProfileResponse])
def list_profiles(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(FamilyProfile).filter(FamilyProfile.user_id == current_user.id).all()

@router.post("", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile(
    profile_data: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing_count = db.query(FamilyProfile).filter(FamilyProfile.user_id == current_user.id).count()
    if existing_count >= 15:
        raise HTTPException(
            status_code=400,
            detail="Maximum profile limit reached. MediVault AI supports up to 15 family profiles per account."
        )

    profile_id = f"p-{uuid.uuid4().hex[:8]}"
    avatar = profile_data.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={profile_data.name}"
    
    new_profile = FamilyProfile(
        id=profile_id,
        user_id=current_user.id,
        name=profile_data.name,
        relationship=profile_data.relationship,
        date_of_birth=profile_data.date_of_birth,
        gender=profile_data.gender,
        blood_group=profile_data.blood_group,
        avatar_url=avatar
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile

@router.get("/{profile_id}", response_model=ProfileResponse)
def get_profile(
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
    return profile

@router.put("/{profile_id}", response_model=ProfileResponse)
def update_profile(
    profile_id: str,
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(FamilyProfile).filter(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    for key, value in profile_data.dict(exclude_unset=True).items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return profile

@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(
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
    
    total = db.query(FamilyProfile).filter(FamilyProfile.user_id == current_user.id).count()
    if total <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete primary profile when only 1 profile exists.")

    # Clean up associated lab results, medications, and documents
    db.query(LabResult).filter(LabResult.profile_id == profile_id).delete()
    db.query(Medication).filter(Medication.profile_id == profile_id).delete()
    db.query(MedicalDocument).filter(MedicalDocument.profile_id == profile_id).delete()

    db.delete(profile)
    db.commit()
    return None
