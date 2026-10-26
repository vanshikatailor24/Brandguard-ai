# Brandguard AI

> AI-assisted brand governance platform for companies — built by **SYNTAX DUO** for the hackathon.

**Team Members:** Vanshika Tailor · Lokendra Singh Shekhawat  
**Repository:** `brandguard-ai` · **Working Branch:** `develop`

---

## What is Brandguard AI?

**Brandguard AI** is a multi-company brand governance platform that empowers organizations to maintain consistent brand identity, enforce mandatory disclaimers, safeguard protected brand assets, and safely remediate copy violations across all written communications.

### Core Governance Workflow
```
Upload Guidelines (PDF/DOCX/TXT)
          ↓
Extract Candidate Rules (draft / unapproved)
          ↓
Human-in-the-Loop Review & Approval (makes rules authoritative)
          ↓
Submit Content for Review (text or graphics)
          ↓
Instant Findings (what is wrong, why it matters, evidence)
          ↓
"Guide Me" (manual revision guidance) or "Fix It for Me" (automatic correction & diffs)
          ↓
Guard Protected Facts (prices, specs, dates, protected names)
          ↓
Accept Revision & Save Audit History
```

---

## Features Implemented

1. **Dashboard & Overview**: Real metrics derived from stored reviews and guidelines. Quick launch actions and live status summaries.
2. **Brand Guidelines Catalog**: View, create, edit, filter, approve, and protect rules across 4 categories (`prohibited_phrase`, `required_phrase`, `required_disclaimer`, `brand_terminology`) with severity levels (`critical`, `warning`, `info`).
3. **Policy & Guidelines Document Ingestion**: Secure document upload (`.pdf`, `.docx`, `.txt`) with magic-byte signature validation, 10MB size restriction, text extraction, and automated candidate rule discovery.
4. **Content Review Engine**: Deterministic string and word-boundary matching combined with contextual claim heuristics (flagging hyperbolic claims as `needs_review`).
5. **"Guide Me" (Manual Guidance)**: Detailed finding cards displaying the rule category, violation reason, exact matched text, evidence excerpt, and actionable guidance.
6. **"Fix It for Me" (Automatic Text Correction)**: Replaces unapproved brand terminology, appends missing disclaimers, generates side-by-side revision comparisons and diffs, while guarding prices, numbers, and dates.
7. **Visual Asset Review**: Image format and dimension inspection (`.png`, `.jpg`, `.jpeg`, `.webp`), OCR engine detection (Tesseract) with fallback transcript input, and brand rule evaluation.
8. **Review History Audit Trail**: Searchable audit log of past reviews with original copy, accepted revisions, and detailed violation findings.
9. **Governance Analytics & Insights**: Real calculated statistics (channel breakdown, frequent violation categories, pass rates, governance health status).
10. **Workspace Settings & Protected Elements**: Management of protected brand assets (names, slogans, disclaimers, specs) and live system connectivity diagnostics.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, React Router v6, Vanilla CSS Design System |
| **Backend** | Python 3.14 / 3.11+, FastAPI, Uvicorn |
| **ORM & Database**| SQLAlchemy 2.0, MySQL 8, PyMySQL driver |
| **Document Parsing** | pypdf (PDF extraction), python-docx (DOCX extraction) |
| **Image Inspection** | Pillow (PIL) |
| **Testing** | pytest, pytest-cov, Starlette TestClient, httpx |

### Color Palette (Custom Design System)
* **Deep Forest Green**: `#173F35`
* **Warm Ivory**: `#F7F6F0`
* **Soft Sage**: `#DCE8DF`
* **Muted Gold**: `#C5A46D`
* **Charcoal**: `#252B28`

---

## Repository Structure

```
Brandguard-ai/
├── README.md                      # Setup & product documentation
├── .gitignore                     # Git ignore rules for Python, Node, Vite, .env
├── docs/
│   ├── PROJECT_OVERVIEW.md        # Problem statement, workflow, and capabilities
│   ├── DATABASE_DESIGN.md         # Schema design, entity relationships, and tables
│   └── API_OVERVIEW.md            # REST API endpoints, schemas, and examples
├── backend/
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Environment variables template
│   ├── run.py                     # Backend runner script
│   ├── app/
│   │   ├── main.py                # FastAPI entry point & CORS configuration
│   │   ├── core/config.py         # Pydantic Settings configuration
│   │   ├── db/
│   │   │   ├── base.py            # Declarative base
│   │   │   ├── session.py         # SQLAlchemy engine & session dependency
│   │   │   └── init_db.py         # Database creation & seeding script
│   │   ├── models/                # ORM models (Company, BrandRule, ContentReview, SourceDocument, ProtectedBrandElement)
│   │   ├── schemas/               # Pydantic validation schemas
│   │   ├── services/
│   │   │   ├── review_engine.py   # Deterministic & contextual compliance engine
│   │   │   ├── correction_engine.py# "Fix It for Me" auto-correction engine
│   │   │   ├── document_service.py# Document parsing & candidate rule extraction
│   │   │   └── image_service.py   # Image validation & OCR extraction service
│   │   └── api/routes/            # REST route controllers (health, rules, reviews, documents, images, insights, settings)
│   └── tests/                     # 33 unit and integration tests
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx                # Router & page layout
        ├── layouts/               # DashboardLayout
        ├── components/            # Sidebar, TopBar, StatusBadge
        ├── styles/global.css      # Design system with palette tokens
        ├── services/api.js        # Centralized API client
        └── pages/                 # Overview, ContentReview, BrandGuidelines, PolicyDocuments, ReviewHistory, Insights, Settings
```

---

## Prerequisites (Windows)

1. **Python**: Python 3.11, 3.12, 3.13, or 3.14 (ensure `python` is added to system PATH).
2. **Node.js**: Node 18+ and `npm` (ensure `node` and `npm` are added to system PATH).
3. **MySQL**: MySQL 8.x server installed and running.

---

## Step-by-Step Setup Instructions (Windows)

### 1. Configure the Backend

Open PowerShell and navigate to the backend folder:
```powershell
cd c:\Users\kumar\Desktop\Brandguard-ai\backend
```

Create and activate the Python virtual environment:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install the dependencies:
```powershell
pip install -r requirements.txt
```

Create your `.env` configuration file from the template:
```powershell
Copy-Item .env.example .env
```

Edit `backend\.env` with your local MySQL password and database credentials:
```ini
DB_HOST=localhost
DB_PORT=3306
DB_NAME=brandguard_ai
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
APP_ENV=development
SECRET_KEY=brandguard_development_secret_key_2026
```

### 2. Initialize the MySQL Database

Run the automated database setup script to create tables and seed starter guidelines:
```powershell
# Ensure your MySQL service is running and credentials in .env are saved
python -m app.db.init_db
```

### 3. Run Backend Unit & Integration Tests

```powershell
pytest tests/ -v
```
*(All 33 tests should pass in ~1.2s)*

### 4. Start the Backend API Server

```powershell
python run.py
```
* **API Server:** [http://localhost:8000](http://localhost:8000)
* **Interactive Swagger UI:** [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
* **Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### 5. Start the Frontend React App

Open a second PowerShell window and navigate to the frontend folder:
```powershell
cd c:\Users\kumar\Desktop\Brandguard-ai\frontend
npm install
npm run dev
```
* **Web Application:** [http://localhost:5173](http://localhost:5173)

---

## Current Status, Limitations & Integrity Notes

* **Accuracy**: The review engine uses explicit, approved deterministic rules and contextual heuristics. It never claims 100% legal or regulatory accuracy.
* **Database Resilience**: If MySQL credentials are missing or the database is stopped, the backend reports an informative `503 Service Unavailable: Database is not configured` message with instructions on configuring `backend/.env`.
* **Visual Image Assets**: Image review inspects graphic copy and OCR text. It does not distort, redraw, or replace graphic logos or pixels on the original file.
* **Authentication**: Authentication and role-based permissions (RBAC) are documented foundations for enterprise deployment and are not falsely claimed as completed.
