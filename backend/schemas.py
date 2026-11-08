from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

# --- Auth Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Profile Schemas ---
class ProfileCreate(BaseModel):
    name: str
    relationship: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    avatar_url: Optional[str] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    relationship: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    avatar_url: Optional[str] = None

class ProfileResponse(BaseModel):
    id: str
    user_id: str
    name: str
    relationship: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Lab Results & Medications Schemas ---
class LabResultCreate(BaseModel):
    parameter_name: str
    value: float
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    status: Optional[str] = "Normal"
    test_date: date

class LabResultResponse(BaseModel):
    id: str
    document_id: str
    profile_id: str
    parameter_name: str
    value: float
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    status: str
    test_date: date

    class Config:
        from_attributes = True

class MedicationCreate(BaseModel):
    medicine_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    notes: Optional[str] = None

class MedicationResponse(BaseModel):
    id: str
    document_id: Optional[str] = None
    profile_id: str
    medicine_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

# --- Medical Document Schemas ---
class DocumentResponse(BaseModel):
    id: str
    profile_id: str
    file_name: str
    file_path: str
    document_type: str
    document_date: Optional[date] = None
    raw_ocr_text: Optional[str] = None
    ai_summary: Optional[str] = None
    created_at: datetime
    lab_results: List[LabResultResponse] = []
    medications: List[MedicationResponse] = []

    class Config:
        from_attributes = True

# --- Analytics & Timeline Schemas ---
class TrendPoint(BaseModel):
    date: str
    value: float
    unit: Optional[str] = None
    status: str
    reference_range: Optional[str] = None

class ParameterTrend(BaseModel):
    parameter_name: str
    latest_value: float
    unit: Optional[str] = None
    latest_status: str
    history: List[TrendPoint]

class TimelineEvent(BaseModel):
    id: str
    date: str
    title: str
    type: str # Lab Report, Prescription, Diagnosis
    summary: str
    lab_count: int
    med_count: int
    file_url: str

class AIAssistantRequest(BaseModel):
    profile_id: str
    query: str

class AIAssistantResponse(BaseModel):
    query: str
    answer: str
    suggested_actions: Optional[List[str]] = []

