-- ==========================================
-- MediVault AI - Database Schema (PostgreSQL)
-- ==========================================

-- 1. Users Table (Primary Account Holders)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Family Profiles Table (Up to 15 profiles per primary user account)
CREATE TABLE IF NOT EXISTS family_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50) NOT NULL, -- e.g., Self, Father, Mother, Spouse, Child, Grandparent
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index to optimize querying family members by user
CREATE INDEX IF NOT EXISTS idx_family_profiles_user ON family_profiles(user_id);

-- 3. Medical Documents Table (Uploaded Reports, Prescriptions, Summaries)
CREATE TABLE IF NOT EXISTS medical_documents (
    id VARCHAR(36) PRIMARY KEY,
    profile_id VARCHAR(36) NOT NULL REFERENCES family_profiles(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- Lab Report, Prescription, Discharge Summary, Vaccination, Imaging
    document_date DATE,
    raw_ocr_text TEXT,
    ai_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index to quickly query documents per family profile
CREATE INDEX IF NOT EXISTS idx_medical_documents_profile ON medical_documents(profile_id);

-- 4. Lab Results Table (Structured lab parameters parsed by AI)
CREATE TABLE IF NOT EXISTS lab_results (
    id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL REFERENCES medical_documents(id) ON DELETE CASCADE,
    profile_id VARCHAR(36) NOT NULL REFERENCES family_profiles(id) ON DELETE CASCADE,
    parameter_name VARCHAR(255) NOT NULL, -- e.g., Fasting Blood Glucose, HbA1c, TSH, Cholesterol
    value NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(50), -- e.g., mg/dL, %, uIU/mL
    reference_range VARCHAR(100), -- e.g., 70-99
    status VARCHAR(20) DEFAULT 'Normal', -- Normal, High, Low
    test_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast trend graph queries by profile and parameter
CREATE INDEX IF NOT EXISTS idx_lab_results_profile ON lab_results(profile_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_trend ON lab_results(profile_id, parameter_name, test_date);

-- 5. Medications Table (Parsed prescriptions and current meds)
CREATE TABLE IF NOT EXISTS medications (
    id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(36) REFERENCES medical_documents(id) ON DELETE CASCADE,
    profile_id VARCHAR(36) NOT NULL REFERENCES family_profiles(id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100), -- e.g., 500mg
    frequency VARCHAR(100), -- e.g., Once daily after meals
    duration VARCHAR(100), -- e.g., 10 days
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medications_profile ON medications(profile_id);
