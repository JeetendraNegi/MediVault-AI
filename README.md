# MediVault AI — Complete Source Code Submission Package

**Candidate Name:** Jeetendra Singh Negi  
**Degree:** Master of Computer Applications (MCA) — Artificial Intelligence & Machine Learning  
**Institution:** School of Computer Science, University of Petroleum and Energy Studies (UPES), Dehradun  
**Project Title:** MediVault AI: An Intelligent, Longitudinal Personal Health Record (PHR) & Clinical Document Ingestion System  

---

## 📁 Repository Directory Structure

This clean submission package contains the complete source code across all four core architectural tiers, with build caches, dependencies (`node_modules`, `.venv`), and compiled binaries (`.dll`, `.exe`, `.apk`) excluded for rapid upload, review, and reproducible installation:

```
MediVault-AI-SourceCode/
|-- backend/                 # FastAPI REST backend & OCR microservice
|   |-- routers/             # Modular API endpoints (auth, profiles, docs, analytics, assistant)
|   |-- services/            # Ingestion service, hybrid OCR (PyMuPDF + Tesseract), Gemini NLP
|   |-- static/              # Branding assets & UI reference screenshots
|   |-- uploads/             # Empty directory for runtime document storage (.gitkeep)
|   |-- auth.py              # JWT HMAC-SHA256 & bcrypt security module
|   |-- config.py            # Environment settings & configuration
|   |-- database.py          # SQLAlchemy session manager & auto-seeder
|   |-- Dockerfile           # Backend containerization configuration
|   |-- main.py              # Application entrypoint & CORS middleware
|   |-- models.py            # Relational database models (users, profiles, docs, labs)
|   |-- requirements.txt     # Python dependencies
|   `-- schemas.py           # Pydantic data schemas
|
|-- db/                      # Relational Database SQL scripts
|   |-- 01_schema.sql        # PostgreSQL DDL schema & composite B-tree indexes
|   `-- 02_seed.sql          # 4-year longitudinal clinical seed data
|
|-- frontend/                # React 18 Web Progressive Web App (PWA)
|   |-- public/              # Static public web assets
|   |-- src/                 # React UI components, Recharts visualizations & API client
|   |-- Dockerfile           # Frontend web containerization
|   |-- index.html           # HTML5 entrypoint
|   |-- package.json         # Frontend Node dependencies & scripts
|   |-- package-lock.json    # Exact dependency lockfile
|   `-- vite.config.js       # Vite development & build configuration
|
|-- android/                 # Dedicated Native Android Mobile Application
|   |-- android/             # Native Android Gradle project (app, gradle wrapper, manifests)
|   |-- assets/              # Mobile icons, splash screens, and image assets
|   |-- src/                 # React Native mobile screens, components, and services
|   |-- App.js               # Mobile application entrypoint & state providers
|   |-- app.json             # Expo / React Native application configuration
|   |-- build-local-apk.ps1  # Automated release APK build PowerShell script
|   |-- install-android-sdk.ps1 # Command-line Android SDK installer
|   |-- package.json         # Mobile dependencies
|   `-- package-lock.json    # Mobile dependency lockfile
|
|-- docker-compose.yml       # Multi-container orchestration (PostgreSQL, Backend, Frontend)
`-- README.md                # Comprehensive execution and evaluation guide
```

---

## 🚀 Quick Setup & Execution Guide

### 1. Backend Microservices (`/backend`)
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
* API Documentation: `http://localhost:8000/docs` (Swagger UI)
* Backend Health: `http://localhost:8000/health`

### 2. Relational Database (`/db`)
* The backend automatically initializes and seeds an internal SQLite database (`medivault.db`) on first startup if no PostgreSQL connection is provided.
* For enterprise PostgreSQL deployment, execute:
```bash
psql -U postgres -d postgres -f db/01_schema.sql
psql -U postgres -d medivault -f db/02_seed.sql
```

### 3. Frontend Web Application (`/frontend`)
```bash
cd frontend
npm install
npm run dev
```
* Local Web Portal: `http://localhost:5173`
* Default Demo Account:
  * **Email:** `demo@medivault.ai`
  * **Password:** `demo123`

### 4. Android Mobile Application (`/android`)
```bash
cd android
npm install
npx expo start
```
* To build the standalone release APK:
```powershell
./build-local-apk.ps1
```

---

## 🔒 Security & Privacy Notice
All sensitive secrets, build binaries (`.dll`, `.exe`, `.apk`), environment cache files (`.venv`, `node_modules`, `.gradle`), and patient PDF uploads have been excluded from this source distribution in compliance with university code submission standards and academic integrity.
