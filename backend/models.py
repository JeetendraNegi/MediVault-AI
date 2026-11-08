from sqlalchemy import Column, String, Text, Float, Date, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship as orm_relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    profiles = orm_relationship("FamilyProfile", back_populates="owner", cascade="all, delete-orphan")

class FamilyProfile(Base):
    __tablename__ = "family_profiles"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    relationship = Column(String(50), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    blood_group = Column(String(10), nullable=True)
    avatar_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = orm_relationship("User", back_populates="profiles")
    documents = orm_relationship("MedicalDocument", back_populates="profile", cascade="all, delete-orphan")
    lab_results = orm_relationship("LabResult", back_populates="profile", cascade="all, delete-orphan")
    medications = orm_relationship("Medication", back_populates="profile", cascade="all, delete-orphan")

class MedicalDocument(Base):
    __tablename__ = "medical_documents"

    id = Column(String(36), primary_key=True)
    profile_id = Column(String(36), ForeignKey("family_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    document_type = Column(String(50), nullable=False) # Lab Report, Prescription, Discharge Summary
    document_date = Column(Date, nullable=True)
    raw_ocr_text = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = orm_relationship("FamilyProfile", back_populates="documents")
    lab_results = orm_relationship("LabResult", back_populates="document", cascade="all, delete-orphan")
    medications = orm_relationship("Medication", back_populates="document", cascade="all, delete-orphan")

class LabResult(Base):
    __tablename__ = "lab_results"

    id = Column(String(36), primary_key=True)
    document_id = Column(String(36), ForeignKey("medical_documents.id", ondelete="CASCADE"), nullable=False)
    profile_id = Column(String(36), ForeignKey("family_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    parameter_name = Column(String(255), nullable=False) # e.g. Fasting Blood Glucose, HbA1c, TSH
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=True)
    reference_range = Column(String(100), nullable=True)
    status = Column(String(20), default="Normal") # Normal, High, Low
    test_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = orm_relationship("MedicalDocument", back_populates="lab_results")
    profile = orm_relationship("FamilyProfile", back_populates="lab_results")

class Medication(Base):
    __tablename__ = "medications"

    id = Column(String(36), primary_key=True)
    document_id = Column(String(36), ForeignKey("medical_documents.id", ondelete="CASCADE"), nullable=True)
    profile_id = Column(String(36), ForeignKey("family_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    medicine_name = Column(String(255), nullable=False)
    dosage = Column(String(100), nullable=True)
    frequency = Column(String(100), nullable=True)
    duration = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = orm_relationship("MedicalDocument", back_populates="medications")
    profile = orm_relationship("FamilyProfile", back_populates="medications")
