-- ==========================================
-- MediVault AI - Seed Data
-- ==========================================

-- Seed Demo Primary User (Password is 'password123')
INSERT INTO users (id, email, password_hash, full_name, created_at)
VALUES (
    'u-demo-101',
    'demo@medivault.ai',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', -- bcrypt hash of 'password123'
    'Jeetendra Negi',
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- Seed Family Profiles (up to 15 supported)
INSERT INTO family_profiles (id, user_id, name, relationship, date_of_birth, gender, blood_group, avatar_url)
VALUES 
    ('p-self-01', 'u-demo-101', 'Jeetendra Negi', 'Self', '1998-05-15', 'Male', 'O+', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jeetendra'),
    ('p-father-02', 'u-demo-101', 'Ramesh Negi (Father)', 'Father', '1965-08-20', 'Male', 'B+', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ramesh'),
    ('p-mother-03', 'u-demo-101', 'Sunita Negi (Mother)', 'Mother', '1968-11-10', 'Female', 'A+', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sunita'),
    ('p-daughter-04', 'u-demo-101', 'Ananya Negi (Child)', 'Daughter', '2020-03-25', 'Female', 'O+', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya')
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Medical Documents
INSERT INTO medical_documents (id, profile_id, file_name, file_path, document_type, document_date, raw_ocr_text, ai_summary)
VALUES
    ('doc-fat-01', 'p-father-02', 'Annual_Blood_Work_2023.pdf', '/uploads/Annual_Blood_Work_2023.pdf', 'Lab Report', '2023-06-12', 
     'MAX HEALTHCARE LAB REPORT\nPatient: Ramesh Negi Age: 58\nFasting Blood Glucose: 95 mg/dL (70-99)\nHbA1c: 5.6 % (<5.7)\nTotal Cholesterol: 185 mg/dL (<200)\nTSH: 2.1 uIU/mL (0.4-4.2)',
     'Fasting glucose and lipid profile are within normal limits. Normal metabolic status.'),
     
    ('doc-fat-02', 'p-father-02', 'Comprehensive_Metabolic_2024.pdf', '/uploads/Comprehensive_Metabolic_2024.pdf', 'Lab Report', '2024-07-15', 
     'LAL PATHLABS REPORT\nPatient: Ramesh Negi Age: 59\nFasting Blood Glucose: 112 mg/dL (70-99)\nHbA1c: 6.1 % (<5.7)\nTotal Cholesterol: 215 mg/dL (<200)\nTSH: 3.4 uIU/mL (0.4-4.2)',
     'Mildly elevated Fasting Glucose (112 mg/dL) and HbA1c (6.1%), indicating pre-diabetes. Total cholesterol slightly elevated (215 mg/dL). Lifestyle modifications recommended.'),

    ('doc-fat-03', 'p-father-02', 'Diabetic_Evaluation_2025.pdf', '/uploads/Diabetic_Evaluation_2025.pdf', 'Lab Report', '2025-08-05', 
     'APOLLO DIAGNOSTICS\nPatient: Ramesh Negi Age: 60\nFasting Blood Glucose: 135 mg/dL (70-99)\nHbA1c: 6.8 % (<5.7)\nTotal Cholesterol: 230 mg/dL (<200)\nTSH: 3.9 uIU/mL (0.4-4.2)',
     'Fasting glucose (135 mg/dL) and HbA1c (6.8%) confirm Type 2 Diabetes Mellitus. Lipid parameters also show hypercholesterolemia. Metformin therapy initiated.'),

    ('doc-fat-04', 'p-father-02', 'Quarterly_Checkup_2026.pdf', '/uploads/Quarterly_Checkup_2026.pdf', 'Lab Report', '2026-02-18', 
     'APOLLO DIAGNOSTICS\nPatient: Ramesh Negi Age: 61\nFasting Blood Glucose: 108 mg/dL (70-99)\nHbA1c: 6.2 % (<5.7)\nTotal Cholesterol: 195 mg/dL (<200)\nTSH: 2.5 uIU/mL (0.4-4.2)',
     'Significant improvement in Fasting Glucose (108 mg/dL) and HbA1c (6.2%) following medication and diet control. Cholesterol improved to 195 mg/dL.'),

    ('doc-mot-01', 'p-mother-03', 'Thyroid_Profile_2024.pdf', '/uploads/Thyroid_Profile_2024.pdf', 'Lab Report', '2024-04-10', 
     'DR LAL PATHLABS\nPatient: Sunita Negi Age: 56\nTSH: 6.5 uIU/mL (0.4-4.2)\nFasting Blood Glucose: 88 mg/dL (70-99)\nTotal Cholesterol: 175 mg/dL (<200)',
     'Elevated TSH levels (6.5 uIU/mL) indicating mild subclinical hypothyroidism. Thyroxine supplementation advised by physician.'),

    ('doc-mot-02', 'p-mother-03', 'Thyroid_Followup_2025.pdf', '/uploads/Thyroid_Followup_2025.pdf', 'Lab Report', '2025-05-14', 
     'DR LAL PATHLABS\nPatient: Sunita Negi Age: 57\nTSH: 2.8 uIU/mL (0.4-4.2)\nFasting Blood Glucose: 90 mg/dL (70-99)\nTotal Cholesterol: 180 mg/dL (<200)',
     'Thyroid Stimulating Hormone (TSH) successfully normalized at 2.8 uIU/mL on current Thyroxine 25mcg dose.')
ON CONFLICT (id) DO NOTHING;

-- Seed Historical Lab Parameter Trends for Ramesh Negi (Father)
INSERT INTO lab_results (id, document_id, profile_id, parameter_name, value, unit, reference_range, status, test_date)
VALUES
    ('lr-01', 'doc-fat-01', 'p-father-02', 'Fasting Blood Glucose', 95.0, 'mg/dL', '70-99', 'Normal', '2023-06-12'),
    ('lr-02', 'doc-fat-01', 'p-father-02', 'HbA1c', 5.6, '%', '<5.7', 'Normal', '2023-06-12'),
    ('lr-03', 'doc-fat-01', 'p-father-02', 'Total Cholesterol', 185.0, 'mg/dL', '<200', 'Normal', '2023-06-12'),
    
    ('lr-04', 'doc-fat-02', 'p-father-02', 'Fasting Blood Glucose', 112.0, 'mg/dL', '70-99', 'High', '2024-07-15'),
    ('lr-05', 'doc-fat-02', 'p-father-02', 'HbA1c', 6.1, '%', '<5.7', 'High', '2024-07-15'),
    ('lr-06', 'doc-fat-02', 'p-father-02', 'Total Cholesterol', 215.0, 'mg/dL', '<200', 'High', '2024-07-15'),
    
    ('lr-07', 'doc-fat-03', 'p-father-02', 'Fasting Blood Glucose', 135.0, 'mg/dL', '70-99', 'High', '2025-08-05'),
    ('lr-08', 'doc-fat-03', 'p-father-02', 'HbA1c', 6.8, '%', '<5.7', 'High', '2025-08-05'),
    ('lr-09', 'doc-fat-03', 'p-father-02', 'Total Cholesterol', 230.0, 'mg/dL', '<200', 'High', '2025-08-05'),

    ('lr-10', 'doc-fat-04', 'p-father-02', 'Fasting Blood Glucose', 108.0, 'mg/dL', '70-99', 'High', '2026-02-18'),
    ('lr-11', 'doc-fat-04', 'p-father-02', 'HbA1c', 6.2, '%', '<5.7', 'High', '2026-02-18'),
    ('lr-12', 'doc-fat-04', 'p-father-02', 'Total Cholesterol', 195.0, 'mg/dL', '<200', 'Normal', '2026-02-18'),

    -- Mother (Sunita Negi) TSH Trends
    ('lr-13', 'doc-mot-01', 'p-mother-03', 'TSH', 6.5, 'uIU/mL', '0.4-4.2', 'High', '2024-04-10'),
    ('lr-14', 'doc-mot-02', 'p-mother-03', 'TSH', 2.8, 'uIU/mL', '0.4-4.2', 'Normal', '2025-05-14')
ON CONFLICT (id) DO NOTHING;

-- Seed Medications
INSERT INTO medications (id, document_id, profile_id, medicine_name, dosage, frequency, duration, notes)
VALUES
    ('med-01', 'doc-fat-03', 'p-father-02', 'Metformin 500mg', '500mg', 'Twice daily after meals', 'Ongoing', 'Take with warm water'),
    ('med-02', 'doc-fat-03', 'p-father-02', 'Atorvastatin 10mg', '10mg', 'Once daily at bedtime', 'Ongoing', 'Cholesterol management'),
    ('med-03', 'doc-mot-01', 'p-mother-03', 'Thyronorm 25mcg', '25mcg', 'Once daily early morning empty stomach', 'Ongoing', 'Thyroid hormone replacement')
ON CONFLICT (id) DO NOTHING;
