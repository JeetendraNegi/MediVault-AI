import os
import uuid
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from config import settings

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from models import User, FamilyProfile, MedicalDocument, LabResult, Medication
    from auth import get_password_hash
    Base.metadata.create_all(bind=engine)

    # Seed data if empty
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == "demo@medivault.ai").first()
        if not existing_user:
            demo_user = User(
                id="u-demo-101",
                email="demo@medivault.ai",
                password_hash=get_password_hash("password123"),
                full_name="Jeetendra Negi"
            )
            db.add(demo_user)
            db.flush()

            profiles = [
                FamilyProfile(id="p-self-01", user_id="u-demo-101", name="Jeetendra Negi", relationship="Self", date_of_birth=datetime.date(1998, 5, 15), gender="Male", blood_group="O+", avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Jeetendra"),
                FamilyProfile(id="p-father-02", user_id="u-demo-101", name="Ramesh Negi (Father)", relationship="Father", date_of_birth=datetime.date(1965, 8, 20), gender="Male", blood_group="B+", avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Ramesh"),
                FamilyProfile(id="p-mother-03", user_id="u-demo-101", name="Sunita Negi (Mother)", relationship="Mother", date_of_birth=datetime.date(1968, 11, 10), gender="Female", blood_group="A+", avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Sunita"),
                FamilyProfile(id="p-daughter-04", user_id="u-demo-101", name="Ananya Negi (Child)", relationship="Daughter", date_of_birth=datetime.date(2020, 3, 25), gender="Female", blood_group="O+", avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya"),
            ]
            db.add_all(profiles)
            db.flush()

            docs = [
                MedicalDocument(
                    id="doc-fat-01", profile_id="p-father-02", file_name="Annual_Blood_Work_2023.pdf", file_path="/uploads/Annual_Blood_Work_2023.pdf", document_type="Lab Report", document_date=datetime.date(2023, 6, 12),
                    raw_ocr_text="MAX HEALTHCARE LAB REPORT\nFasting Blood Glucose: 95 mg/dL\nHbA1c: 5.6 %\nTotal Cholesterol: 185 mg/dL",
                    ai_summary="Fasting glucose and lipid profile are within normal limits. Normal metabolic status."
                ),
                MedicalDocument(
                    id="doc-fat-02", profile_id="p-father-02", file_name="Comprehensive_Metabolic_2024.pdf", file_path="/uploads/Comprehensive_Metabolic_2024.pdf", document_type="Lab Report", document_date=datetime.date(2024, 7, 15),
                    raw_ocr_text="LAL PATHLABS REPORT\nFasting Blood Glucose: 112 mg/dL\nHbA1c: 6.1 %\nTotal Cholesterol: 215 mg/dL",
                    ai_summary="Mildly elevated Fasting Glucose (112 mg/dL) and HbA1c (6.1%), indicating pre-diabetes. Total cholesterol slightly elevated (215 mg/dL)."
                ),
                MedicalDocument(
                    id="doc-fat-03", profile_id="p-father-02", file_name="Diabetic_Evaluation_2025.pdf", file_path="/uploads/Diabetic_Evaluation_2025.pdf", document_type="Lab Report", document_date=datetime.date(2025, 8, 5),
                    raw_ocr_text="APOLLO DIAGNOSTICS\nFasting Blood Glucose: 135 mg/dL\nHbA1c: 6.8 %\nTotal Cholesterol: 230 mg/dL",
                    ai_summary="Fasting glucose (135 mg/dL) and HbA1c (6.8%) confirm Type 2 Diabetes Mellitus. Metformin therapy initiated."
                ),
                MedicalDocument(
                    id="doc-fat-04", profile_id="p-father-02", file_name="Quarterly_Checkup_2026.pdf", file_path="/uploads/Quarterly_Checkup_2026.pdf", document_type="Lab Report", document_date=datetime.date(2026, 2, 18),
                    raw_ocr_text="APOLLO DIAGNOSTICS\nFasting Blood Glucose: 108 mg/dL\nHbA1c: 6.2 %\nTotal Cholesterol: 195 mg/dL",
                    ai_summary="Significant improvement in Fasting Glucose (108 mg/dL) and HbA1c (6.2%) following medication and diet control."
                ),
                MedicalDocument(
                    id="doc-mot-01", profile_id="p-mother-03", file_name="Thyroid_Profile_2024.pdf", file_path="/uploads/Thyroid_Profile_2024.pdf", document_type="Lab Report", document_date=datetime.date(2024, 4, 10),
                    raw_ocr_text="DR LAL PATHLABS\nTSH: 6.5 uIU/mL\nFasting Blood Glucose: 88 mg/dL",
                    ai_summary="Elevated TSH levels (6.5 uIU/mL) indicating mild subclinical hypothyroidism. Thyroxine supplementation advised."
                ),
                MedicalDocument(
                    id="doc-mot-02", profile_id="p-mother-03", file_name="Thyroid_Followup_2025.pdf", file_path="/uploads/Thyroid_Followup_2025.pdf", document_type="Lab Report", document_date=datetime.date(2025, 5, 14),
                    raw_ocr_text="DR LAL PATHLABS\nTSH: 2.8 uIU/mL\nFasting Blood Glucose: 90 mg/dL",
                    ai_summary="Thyroid Stimulating Hormone (TSH) successfully normalized at 2.8 uIU/mL on current Thyroxine 25mcg dose."
                )
            ]
            db.add_all(docs)
            db.flush()

            labs = [
                LabResult(id="lr-01", document_id="doc-fat-01", profile_id="p-father-02", parameter_name="Fasting Blood Glucose", value=95.0, unit="mg/dL", reference_range="70-99", status="Normal", test_date=datetime.date(2023, 6, 12)),
                LabResult(id="lr-02", document_id="doc-fat-01", profile_id="p-father-02", parameter_name="HbA1c", value=5.6, unit="%", reference_range="<5.7", status="Normal", test_date=datetime.date(2023, 6, 12)),
                LabResult(id="lr-03", document_id="doc-fat-01", profile_id="p-father-02", parameter_name="Total Cholesterol", value=185.0, unit="mg/dL", reference_range="<200", status="Normal", test_date=datetime.date(2023, 6, 12)),

                LabResult(id="lr-04", document_id="doc-fat-02", profile_id="p-father-02", parameter_name="Fasting Blood Glucose", value=112.0, unit="mg/dL", reference_range="70-99", status="High", test_date=datetime.date(2024, 7, 15)),
                LabResult(id="lr-05", document_id="doc-fat-02", profile_id="p-father-02", parameter_name="HbA1c", value=6.1, unit="%", reference_range="<5.7", status="High", test_date=datetime.date(2024, 7, 15)),
                LabResult(id="lr-06", document_id="doc-fat-02", profile_id="p-father-02", parameter_name="Total Cholesterol", value=215.0, unit="mg/dL", reference_range="<200", status="High", test_date=datetime.date(2024, 7, 15)),

                LabResult(id="lr-07", document_id="doc-fat-03", profile_id="p-father-02", parameter_name="Fasting Blood Glucose", value=135.0, unit="mg/dL", reference_range="70-99", status="High", test_date=datetime.date(2025, 8, 5)),
                LabResult(id="lr-08", document_id="doc-fat-03", profile_id="p-father-02", parameter_name="HbA1c", value=6.8, unit="%", reference_range="<5.7", status="High", test_date=datetime.date(2025, 8, 5)),
                LabResult(id="lr-09", document_id="doc-fat-03", profile_id="p-father-02", parameter_name="Total Cholesterol", value=230.0, unit="mg/dL", reference_range="<200", status="High", test_date=datetime.date(2025, 8, 5)),

                LabResult(id="lr-10", document_id="doc-fat-04", profile_id="p-father-02", parameter_name="Fasting Blood Glucose", value=108.0, unit="mg/dL", reference_range="70-99", status="High", test_date=datetime.date(2026, 2, 18)),
                LabResult(id="lr-11", document_id="doc-fat-04", profile_id="p-father-02", parameter_name="HbA1c", value=6.2, unit="%", reference_range="<5.7", status="High", test_date=datetime.date(2026, 2, 18)),
                LabResult(id="lr-12", document_id="doc-fat-04", profile_id="p-father-02", parameter_name="Total Cholesterol", value=195.0, unit="mg/dL", reference_range="<200", status="Normal", test_date=datetime.date(2026, 2, 18)),

                LabResult(id="lr-13", document_id="doc-mot-01", profile_id="p-mother-03", parameter_name="TSH", value=6.5, unit="uIU/mL", reference_range="0.4-4.2", status="High", test_date=datetime.date(2024, 4, 10)),
                LabResult(id="lr-14", document_id="doc-mot-02", profile_id="p-mother-03", parameter_name="TSH", value=2.8, unit="uIU/mL", reference_range="0.4-4.2", status="Normal", test_date=datetime.date(2025, 5, 14)),
            ]
            db.add_all(labs)

            meds = [
                Medication(id="med-01", document_id="doc-fat-03", profile_id="p-father-02", medicine_name="Metformin 500mg", dosage="500mg", frequency="Twice daily after meals", duration="Ongoing", notes="Take with warm water"),
                Medication(id="med-02", document_id="doc-fat-03", profile_id="p-father-02", medicine_name="Atorvastatin 10mg", dosage="10mg", frequency="Once daily at bedtime", duration="Ongoing", notes="Cholesterol management"),
                Medication(id="med-03", document_id="doc-mot-01", profile_id="p-mother-03", medicine_name="Thyronorm 25mcg", dosage="25mcg", frequency="Once daily early morning empty stomach", duration="Ongoing", notes="Thyroid hormone replacement")
            ]
            db.add_all(meds)

            db.commit()
    except Exception as e:
        print(f"Error seeding DB: {e}")
        db.rollback()
    finally:
        db.close()
