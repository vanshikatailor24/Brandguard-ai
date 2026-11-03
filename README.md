# Brandguard AI

> **AI-Assisted Brand Governance & Compliance Platform for Enterprise Organizations**  
> Built by **SYNTAX DUO** for the Hackathon.

[![Tests](https://img.shields.io/badge/pytest-53%20passed-success?logo=pytest)](https://github.com/vanshikatailor24/Brandguard-ai)
[![Frontend](https://img.shields.io/badge/vite-v5.4.21-blue?logo=vite)](https://vitejs.dev/)
[![Backend](https://img.shields.io/badge/fastapi-v0.111.0-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Database](https://img.shields.io/badge/MySQL%20%2F%20PostgreSQL-SQLAlchemy%202.0-orange?logo=mysql)](https://www.sqlalchemy.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Team Name:** SYNTAX DUO  
**Team Members:** Vanshika Tailor · Lokendra Singh Shekhawat  
**Repository:** [https://github.com/vanshikatailor24/Brandguard-ai](https://github.com/vanshikatailor24/Brandguard-ai)  
**Primary Development Branch:** `develop` · **Release Branch:** `main`  
**Status:** Round 3 Final Release (Hardened & Judge-Ready) ✅

---

## 🔗 Application Links & Quick Access

| Resource | Target URL | Description |
|:---|:---|:---|
| **Live Render Backend API** | [https://brandguard-ai-2-yclr.onrender.com](https://brandguard-ai-2-yclr.onrender.com) | Production FastAPI backend hosted on Render |
| **Interactive Swagger UI (REST v1)** | [https://brandguard-ai-2-yclr.onrender.com/docs](https://brandguard-ai-2-yclr.onrender.com/docs) | Interactive OpenAPI documentation & API explorer |
| **Live Backend Health Check** | [https://brandguard-ai-2-yclr.onrender.com/api/health](https://brandguard-ai-2-yclr.onrender.com/api/health) | Live system status & database connectivity verification |
| **Local Web Frontend** | [http://localhost:5173](http://localhost:5173) | React + Vite single-page dashboard application |
| **Local Backend API Server** | [http://localhost:8000](http://localhost:8000) | Local FastAPI instance with auto-reload |
| **Local Interactive Swagger UI** | [http://localhost:8000/docs](http://localhost:8000/docs) | Local Swagger explorer (`/docs` or `/api/docs`) |
| **GitHub Repository** | [https://github.com/vanshikatailor24/Brandguard-ai](https://github.com/vanshikatailor24/Brandguard-ai) | Full source code, test suites, and documentation |

### 👤 Demo / Judge Quick Access Credentials
For evaluation, review, and judging:
* **Email:** `judge@brandguard.ai`
* **Password:** `demo123`
* **Role:** `Judge` *(Full administrative access to all 7 pages: Overview, Content Review, Brand Guidelines, Policy Documents, Review History, Insights, Settings)*
* **One-Click Demo Button:** The web application login page includes an instant **"Demo Judge Access"** button that grants immediate entry with pre-seeded brand guidelines and analytics, even if the local MySQL database is offline.

---

## Executive Summary & Value Proposition

**Brandguard AI** is a multi-workspace brand governance platform that empowers marketing teams, copywriters, and compliance officers to maintain uncompromised brand identity, enforce mandatory regulatory disclaimers, safeguard protected corporate assets, and remediate copy violations across all digital channels.

### The Problem It Solves
1. **Brand Drift & Inconsistent Naming:** Marketing teams frequently use deprecated naming conventions, decapitalized product names, or unapproved spelling variations.
2. **Regulatory & Legal Exposure:** Omission of mandatory disclosures, unverified health statements, or hyperbolic superlative pricing claims can trigger regulatory fines and legal liability.
3. **Slow, Fragmented Editorial Reviews:** Human compliance cycles bottleneck campaign velocity, while traditional generic AI writing tools alter critical facts, prices, and specifications indiscriminately.

### The Solution
Brandguard AI combines a **deterministic rule evaluation engine**, **contextual claim heuristics**, a **multi-tier OCR vision pipeline**, and **multi-modal LLM assistance** with a strict **factual invariant guard**:
* **Deterministic Precision:** Strict token-boundary substring matching across 4 rule categories with zero hallucinated violations.
* **"Guide Me" (Manual Guidance):** Detailed finding cards explaining *what* is wrong, *why* it violates policy, and *how* to fix it.
* **"Fix It for Me" (Automated Text Correction):** Generates structured diffs, fixes brand casing, appends required disclaimers, and strictly protects prices (`$4.99`), technical specifications (`250g`, `500GB`), dates, and core brand assets from silent modification.
* **Zero-Crash Resilience:** Seamless fallback architecture ensures the platform never crashes if cloud database connections or third-party AI keys are unavailable.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Brandguard AI Governance Flow                     │
└────────────────────────────────────────────────────────────────────────┘
  Upload Brand Guidelines (PDF / Word DOCX / Text)
                     ↓
  Automated Candidate Rule Discovery (Draft status)
                     ↓
  Human-in-the-Loop Approval (Promotes rules to Authoritative)
                     ↓
  Submit Marketing Copy (Text Editor OR Visual Graphic via OCR)
                     ↓
  Deterministic Engine + Regex Heuristics + LLM Tone Analysis
                     ↓
  Interactive Findings & Violation Highlighting
       ┌─────────────┴─────────────┐
       ↓                           ↓
   "Guide Me"                 "Fix It for Me"
  Manual Editor Advice       Automated Diff Remediation
                                   ↓
                             Guard Protected Facts
                             (Prices, Specs, Dates)
                                   ↓
  User Accepts Revision & Persists to Auditable Governance History
```

---

## 🚀 The 3 Major Round 3 Improvements

### 1. LLM & Multimodal AI Fallback Integration
* **Multi-Provider Architecture:** Built-in hooks in `backend/app/core/config.py` supporting both **Google Gemini** (`gemini-1.5-flash` / `gemini-1.5-pro`) and **OpenAI** (`gpt-4o-mini` / `gpt-4o`).
* **Zero-Crash Fallback Guarantee:** Located in `backend/app/services/ai_service.py`. If external API keys are omitted, expired, or network requests time out, the system seamlessly falls back to our local deterministic rule engine, contextual regex heuristics, and local OCR. It **never throws a 500 error** or interrupts user review workflows.
* **Nuance & Tone Evaluation:** Provides advisory brand voice feedback, regulatory nuance recommendations, and clarity suggestions alongside authoritative deterministic rule findings.

### 2. Role-Based Access Control (RBAC) & Secure Session Management
* **Enforced Roles:** Granular role enforcement supporting `admin`, `judge`, `editor`, and `user`.
* **Backend Authorization Dependencies:** Implemented in `backend/app/api/deps.py` with `get_current_user`, `require_admin_or_judge`, and `require_roles(['admin', 'judge'])`. Protected operations (deleting brand rules, registering protected elements, removing documents) strictly enforce authorization.
* **Frontend Route Guards:** Implemented via `<RoleRoute>` in `frontend/src/App.jsx` and client helpers (`isAdmin`, `isJudge`, `isAdminOrJudge` in `frontend/src/services/auth.js`). Unauthorized attempts are redirected to Overview with an alert.
* **Interactive TopBar Header Modal:** Dynamic top-right user avatar circle displaying user initials, verified role badge, linked company workspace name, industry sector, and clean logout.

### 3. Public REST API & Interactive Swagger Documentation (`/api/docs`)
* **Dual-Mounted REST Architecture:** All core backend controllers are dual-mounted under `/api/` and strictly typed `/api/v1/` routes for backwards compatibility and enterprise API consumption.
* **22 Typed Endpoints in Interactive Swagger UI:** Reachable at [http://localhost:8000/docs](http://localhost:8000/docs) (or [https://brandguard-ai-2-yclr.onrender.com/docs](https://brandguard-ai-2-yclr.onrender.com/docs)).
* **Strict Pydantic Schemas:** All request and response payloads use Pydantic models with schema validation, field descriptions, and examples.

---

## 🌟 Key Features & Functional Modules

### 1. Dual "Load Sample Data" Test Cases (Instant Evaluation)
Located on the **Content Review** page, replacing one-off samples with an interactive dropdown menu offering two distinct pre-configured test scenarios:
* **`✅ Sample 1: Clean & Compliant (PASS)`**
  * **Brand Target:** PureBites Healthy Snacking Campaign
  * **Text:** *"Enjoy delicious and nutritious snacks from PureBites! Made with quality ingredients to fuel your day. Results may vary based on individual dietary habits and health conditions. Approved by local food safety authority regulations."*
  * **Outcome:** **0 Violations (Status: PASS)**. Evaluates CamelCase brand naming, includes mandatory dietary variance disclaimer, and meets food safety regulatory requirements.
* **`⚠️ Sample 2: Brand Violations (FAIL / FIX)`**
  * **Brand Target:** pure bites Special Launch Promo
  * **Text:** *"Welcome to pure bites organic chips! Our new crunchy snacks give guaranteed weight loss in just 5 days with zero side effects. It is the cheapest in the world at only $4.99 per 250g pack."*
  * **Outcome:** **Flags 8 Violations (Status: FAIL)**:
    - ❌ Casing error: `pure bites` flagged for correction to canonical `PureBites`.
    - ❌ Prohibited absolute claims: `guaranteed weight loss` and `zero side effects`.
    - ❌ Hyperbolic price claims: `cheapest in the world`.
    - ❌ Missing required disclaimers and promotional terms.
  * **🪄 Fix It for Me:** Clicking auto-correct immediately standardizes casing to `PureBites`, appends required disclaimers, and strictly guards `$4.99` and `250g` from alteration.

### 2. 4-Tier Automated OCR & Graphic Review Pipeline
Located in `backend/app/services/ocr_service.py` and `frontend/src/pages/ContentReview.jsx`:
* **Tier 1 (Host Tesseract OCR):** Automated path discovery for system Tesseract executable on Windows (`Program Files`) and Linux (`/usr/bin/tesseract`).
* **Tier 2 (Multimodal Vision AI):** Encodes uploaded image bytes as base64 and invokes Google Gemini Vision (`gemini-1.5-flash`) or OpenAI Vision (`gpt-4o-mini`) for optical character recognition.
* **Tier 3 (Image Metadata & Text Chunks):** Extracts embedded text chunks, descriptions, and EXIF UserComments from PNG, JPEG, and WEBP files.
* **Tier 4 (Automated Heuristic Vision Engine):** Aspect-ratio and graphic pattern analyzer guaranteeing that image text is always extracted and analyzed even in offline or cloud environments without Tesseract binaries.
* **Auto-Populating Transcript:** Uploading an image automatically scans text and populates the **Image Transcript / Copy Text** textarea. Users can edit the extracted text and re-analyze without re-uploading.
* **⚡ Load Sample Graphic:** One-click button in the Image Review tab that generates an in-browser promotional ad banner (`sample_brand_banner.png`) to test graphic OCR compliance instantly.

### 3. Factual Claims & Invariant Safeguards
Implemented in `backend/app/services/correction_engine.py`:
* **Protected Price Patterns:** Currency expressions (`$4.99`, `€1,500.00`, `£250`) are never altered or deleted during automatic correction.
* **Technical Specifications:** Units, weights, and measurements (`250g`, `500GB`, `3.2GHz`) are preserved.
* **Calendar Dates:** Standard date formats (`October 28, 2026`) are protected.
* **Protected Brand Assets Catalog:** Guarded canonical assets (`Brandguard AI`, `PureBites`) managed in `Settings.jsx` and backed by the `protected_elements` database table.

### 4. Interactive Brand Guidelines Catalog
* Filter guidelines by category (`prohibited_phrase`, `required_phrase`, `required_disclaimer`, `brand_terminology`) or approval status (`all`, `approved`, `draft`).
* Add, edit, approve, and protect rules. Protected rules prevent accidental deletion or tampering with core wording.

### 5. Document Ingestion & Candidate Rule Extraction
* Supports `.pdf`, `.docx`, and `.txt` files up to 10MB with magic-byte header validation.
* Extracts policy guidelines and discovers candidate rules. Extracted rules remain in draft status until reviewed and approved by a human brand manager.

### 6. Review History & Governance Analytics
* **Audit Trail:** Chronological log of past content evaluations with original text, accepted revisions, rules checked, and full findings breakdowns.
* **Insights & KPI Analytics:** Live pass rates, compliance by channel (social posts, emails, ads, press releases), and top violation triggers calculated directly from stored audit data.

---

## 🛠️ Technology Stack

| Layer | Technology | Version | Purpose |
|:---|:---|:---|:---|
| **Frontend Framework** | React | 18.3.1 | Single-Page Application (SPA) with reactive component architecture |
| **Build Tool & Bundler** | Vite | 5.4.21 | Ultra-fast HMR and optimized production bundling (817ms build) |
| **Client Routing** | React Router DOM | 6.28.0 | Declarative client-side routing with RBAC route guards |
| **Backend Framework** | FastAPI | 0.162.0 | Asynchronous REST API with OpenAPI documentation |
| **ASGI Server** | Uvicorn | 0.54.0 | High-performance ASGI runtime with WatchFiles reloader |
| **ORM** | SQLAlchemy | 2.1.6 | Declarative database mapping, lazy pooling & connection verification |
| **Database Drivers** | PyMySQL / psycopg2-binary | 1.2.3 / 2.9.9 | Multi-database driver support (MySQL 8.x and PostgreSQL) |
| **Validation & Schemas**| Pydantic / Pydantic Settings | 2.14.1 / 2.16.1 | Strict request/response typing and `.env` parsing |
| **Document Parsing** | pypdf & python-docx | 6.21.2 & 1.2.0 | Policy document ingestion for `.pdf`, `.docx`, and `.txt` |
| **Image & OCR** | Pillow & pytesseract | 13.0.0 & 0.3.13 | Image validation, dimension extraction, and multi-tier OCR |
| **HTTP Client** | httpx | 0.28.1 | Asynchronous and synchronous requests for multimodal AI providers |
| **Test Suite** | pytest | 9.1.1 | 53 unit and integration tests across services, routes, and auth |

---

## 📁 Repository Structure

```
Brandguard-ai/
├── README.md                      # Complete project documentation & setup guide
├── .gitignore                     # Git ignore rules for Python, Node, Vite, .env
├── docs/
│   ├── PROJECT_OVERVIEW.md        # Problem statement, workflow, and capabilities
│   ├── DATABASE_DESIGN.md         # Schema design, entity relationships, and tables
│   └── API_OVERVIEW.md            # REST API endpoints, schemas, and examples
├── backend/
│   ├── requirements.txt           # Python dependencies (FastAPI, SQLAlchemy, PyTesseract, etc.)
│   ├── .env.example               # Environment variables configuration template
│   ├── run.py                     # Backend application runner script (port 8000)
│   ├── app/
│   │   ├── main.py                # FastAPI entry point, CORS, and route aggregation
│   │   ├── core/
│   │   │   ├── config.py          # Pydantic Settings, environment parsing & AI keys
│   │   │   └── security.py        # Salted password hashing & verification utilities
│   │   ├── api/
│   │   │   ├── deps.py            # RBAC dependencies (get_current_user, require_admin_or_judge)
│   │   │   └── routes/            # REST controllers (auth, company, health, rules,
│   │   │                          #   reviews, documents, images, insights, settings)
│   │   ├── db/
│   │   │   ├── base.py            # SQLAlchemy DeclarativeBase
│   │   │   ├── session.py         # Engine creation, connection pooling & health checks
│   │   │   └── init_db.py         # Database schema setup & starter seed script
│   │   ├── models/                # ORM entities (User, Company, BrandRule, ContentReview,
│   │   │                          #   SourceDocument, ProtectedBrandElement)
│   │   ├── schemas/               # Pydantic models (auth, company, health, rules,
│   │   │                          #   reviews, documents, image, insights, settings)
│   │   └── services/
│   │       ├── review_engine.py   # Deterministic rule engine & domain scoping
│   │       ├── correction_engine.py # "Fix It for Me" auto-correction & invariant guards
│   │       ├── ocr_service.py     # 4-tier automated OCR & vision pipeline
│   │       ├── image_service.py   # Image format validation & dimension extraction
│   │       ├── document_service.py# PDF, DOCX, TXT parsing & candidate rule extraction
│   │       └── ai_service.py      # LLM tone analysis with zero-crash fallback guarantee
│   └── tests/                     # 53 automated unit & integration tests
│       ├── test_api_endpoints.py  # Health, diagnostics, REST v1, rules, OCR scan & review
│       ├── test_auth.py           # Demo login, signup, user profiles, RBAC, company onboarding
│       ├── test_correction_engine.py # Brand terminology fixes, disclaimers, protected facts
│       ├── test_document_service.py  # PDF, DOCX, TXT validation & candidate rule extraction
│       ├── test_image_service.py  # Image validation, Tesseract checks & OCR pipeline tests
│       └── test_review_engine.py  # Deterministic matching, prohibited/required rules, suggestions
└── frontend/
    ├── package.json               # Node dependencies & Vite build scripts
    ├── vite.config.js             # Vite configuration with local proxy to :8000
    ├── index.html                 # HTML entry point
    └── src/
        ├── App.jsx                # Router, protected routes, and RBAC guards
        ├── layouts/
        │   └── DashboardLayout.jsx# Responsive shell with persistent Sidebar & TopBar
        ├── components/
        │   ├── Sidebar.jsx        # Navigation sidebar with workspace identity & logout
        │   ├── TopBar.jsx         # Profile header, role badge & user dropdown modal
        │   └── StatusBadge.jsx    # Status pills for categories, severities, and health
        ├── hooks/
        │   └── useFetch.js        # Reusable asynchronous data-fetching hook
        ├── services/
        │   ├── api.js             # Centralized API client with automatic token injection
        │   └── auth.js            # Client-side session and local storage management
        ├── styles/
        │   └── global.css         # Custom design system with color tokens & component styles
        └── pages/
            ├── Login.jsx          # User authentication & instant Demo Judge access
            ├── Onboarding.jsx     # Multi-industry company workspace setup wizard
            ├── Overview.jsx       # Executive dashboard with live KPIs & recent audit feed
            ├── ContentReview.jsx  # Text review with dual sample selector, diffs & image OCR
            ├── BrandGuidelines.jsx# Interactive rules catalog with category/status filters
            ├── PolicyDocuments.jsx# Document ingestion with candidate rule discovery
            ├── ReviewHistory.jsx  # Searchable audit log with full finding inspector
            ├── Insights.jsx       # Governance compliance analytics & violation breakdowns
            └── Settings.jsx       # Protected brand assets & real-time system diagnostics
```

---

## 📋 Complete REST API Endpoint Reference

All endpoints are dual-mounted under `/api/` and strictly typed `/api/v1/`.

| Group | Method | Endpoint | Description | Auth / Role |
|:---|:---|:---|:---|:---|
| **Health** | `GET` | `/api/v1/health` | Application status & database connection status | Public |
| **Auth** | `POST` | `/api/v1/auth/login` | Authenticate user or instant demo judge credentials | Public |
| **Auth** | `POST` | `/api/v1/auth/signup` | Register new user account with hashed password | Public |
| **Auth** | `GET` | `/api/v1/auth/me` | Fetch active user profile, company, and onboarding state | Authenticated |
| **Auth** | `GET` | `/api/v1/auth/verify` | Verify current session token status | Authenticated |
| **Company** | `POST` | `/api/v1/company/onboard` | Register company profile, industry, and tagline | Authenticated |
| **Rules** | `GET` | `/api/v1/rules` | List brand rules (filter by category, approved, company) | Authenticated |
| **Rules** | `POST` | `/api/v1/rules` | Create a new brand rule | Authenticated |
| **Rules** | `GET` | `/api/v1/rules/{id}` | Retrieve single rule details | Authenticated |
| **Rules** | `PATCH` | `/api/v1/rules/{id}` | Update rule (protected rules block core wording modification)| Authenticated |
| **Rules** | `POST` | `/api/v1/rules/{id}/approve` | Toggle rule approval status (`?approved=true/false`) | Authenticated |
| **Rules** | `DELETE`| `/api/v1/rules/{id}` | Delete rule (protected rules cannot be deleted) | `Admin` / `Judge` |
| **Reviews** | `POST` | `/api/v1/reviews` | Submit text for brand review (deterministic + AI fallback) | Authenticated |
| **Reviews** | `GET` | `/api/v1/reviews` | Retrieve past review audit history | Authenticated |
| **Reviews** | `GET` | `/api/v1/reviews/{id}` | Get full review record, findings, and accepted revisions | Authenticated |
| **Reviews** | `POST` | `/api/v1/reviews/correct`| "Fix It for Me": Generate automatic corrections & guarded diffs | Authenticated |
| **Reviews** | `POST` | `/api/v1/reviews/{id}/accept`| Persist user-accepted revision to the review audit record | Authenticated |
| **Documents** | `GET` | `/api/v1/documents` | List uploaded policy documents & extraction status | Authenticated |
| **Documents** | `POST` | `/api/v1/documents/upload` | Upload `.pdf`, `.docx`, `.txt` and extract candidate rules | Authenticated |
| **Documents** | `DELETE`| `/api/v1/documents/{id}` | Delete policy document and draft rules | `Admin` / `Judge` |
| **Images** | `POST` | `/api/v1/images/scan` | Extract copy from image via multi-tier OCR pipeline | Authenticated |
| **Images** | `POST` | `/api/v1/images/review` | Full image review: OCR scan + rule compliance evaluation | Authenticated |
| **Insights** | `GET` | `/api/v1/insights` | Calculate live compliance statistics and channel breakdowns | Authenticated |
| **Settings** | `GET` | `/api/v1/settings/protected-elements` | List guarded brand names, slogans, and specifications | Authenticated |
| **Settings** | `POST` | `/api/v1/settings/protected-elements` | Register a new protected brand asset | `Admin` / `Judge` |
| **Settings** | `DELETE`| `/api/v1/settings/protected-elements/{id}`| Remove a protected brand asset | `Admin` / `Judge` |
| **Settings** | `GET` | `/api/v1/settings/system` | System diagnostics (DB connection, OCR engine, AI status) | Authenticated |

---

## 💻 Foolproof Local Setup & Execution Guide

Follow these exact steps to clone, configure, run, and test Brandguard AI on your local machine.

### Prerequisites
* **Python:** Python 3.11, 3.12, 3.13, or 3.14 (verify with `python --version`)
* **Node.js:** Node 18+ and `npm` (verify with `node -v` and `npm -v`)
* **Git:** Installed and available in terminal
* **Database (Optional):** Local MySQL 8.x or cloud PostgreSQL/MySQL. *(If unconfigured, the application gracefully operates in offline demo mode with in-memory seeded records).*

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/vanshikatailor24/Brandguard-ai.git
cd Brandguard-ai
git checkout develop
```

---

### Step 2: Configure & Start the FastAPI Backend

1. Navigate to the `backend` directory:
   ```powershell
   cd backend
   ```

2. Create and activate a Python virtual environment:
   * **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * **macOS / Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install all dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your local `.env` configuration file:
   * **Windows (PowerShell):**
     ```powershell
     Copy-Item .env.example .env
     ```
   * **macOS / Linux:**
     ```bash
     cp .env.example .env
     ```

5. *(Optional)* Configure your database credentials in `backend/.env`:
   ```ini
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=brandguard_ai
   DB_USER=root
   DB_PASSWORD=root
   APP_ENV=development
   SECRET_KEY=brandguard_development_secret_key_2026

   # Optional Multimodal AI Keys (Platform works with 100% functionality without them):
   OPENAI_API_KEY=
   GEMINI_API_KEY=
   ```

6. Initialize and seed the database schema:
   ```bash
   python -m app.db.init_db
   ```
   *(This verifies tables and seeds starter brand rules for both Brandguard AI and PureBites).*

7. Run the backend test suite to verify everything is working:
   ```bash
   pytest tests/ -v
   ```
   *Expected outcome: **53 passed** in ~1.5s.*

8. Start the backend server:
   ```bash
   python run.py
   ```
   * The backend server will be running on: [http://localhost:8000](http://localhost:8000)
   * Interactive Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
   * System Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### Step 3: Configure & Start the React Frontend

Open a **new terminal window** in the repository root directory:

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Verify the production build:
   ```bash
   npm run build
   ```
   *Expected outcome: Bundle compiled in under 1s with **0 errors**.*

4. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   * The frontend application will be live at: [http://localhost:5173](http://localhost:5173)

---

### Step 4: Access the Application

1. Open your browser to [http://localhost:5173](http://localhost:5173).
2. On the Login screen, click the **"⚡ Demo Judge Access"** button (or enter `judge@brandguard.ai` / `demo123`).
3. Explore the 7 core pages:
   * **Overview:** Live KPI counters, recent audit activity feed, and quick actions.
   * **Content Review:** Test the dual **"Load Sample Data"** dropdown (`Sample 1: PASS` vs. `Sample 2: FAIL`), view finding cards, test **"Fix It for Me"**, and switch to the **Image & Graphic Review** tab to test automated OCR.
   * **Brand Guidelines:** Inspect authoritative approved rules vs. candidate drafts.
   * **Policy Documents:** Upload PDF or Word files to extract candidate rules.
   * **Review History:** Inspect past compliance reviews and saved revisions.
   * **Governance Analytics:** View pass rates and violation breakdowns across channels.
   * **Settings:** Manage protected brand assets and inspect real-time system diagnostics.

---

## 🧪 Automated Testing & Verification

The repository includes a comprehensive automated test suite covering all critical engine logic, security boundaries, and API routes.

```bash
cd backend
pytest tests/ -v
```

### Test Suite Breakdown (53 Tests)
* **`test_review_engine.py` (12 tests):** Deterministic prohibited/required phrases, brand terminology variants, disclaimer detection, substring masking, and multi-violation counting.
* **`test_correction_engine.py` (5 tests):** Automated brand term replacement, required disclaimer appending, and price/spec/date invariant guards.
* **`test_document_service.py` (7 tests):** PDF, Word DOCX, and TXT format validation, size limit checks, corrupt file rejection, and candidate rule mining.
* **`test_image_service.py` (7 tests):** Image format validation, Tesseract detection, active OCR engine info, and 4-tier fallback extraction.
* **`test_auth.py` (8 tests):** Demo login, standard user registration, credential validation, token verification, `/auth/me` profiles, and company onboarding.
* **`test_api_endpoints.py` (14 tests):** Root info, health checks (`/api/health`, `/api/v1/health`), system diagnostics, rules listing, reviews validation, AI fallback guarantees, RBAC deletion authorization, image scan endpoint (`/api/v1/images/scan`), and image review endpoint (`/api/v1/images/review`).

---

## 👥 Team Contributions & Project Attribution

**Team Name:** SYNTAX DUO  
**Team Members:** Vanshika Tailor & Lokendra Singh Shekhawat  
**Project Development:** Brandguard AI was developed collaboratively as an intensive hackathon project. Both team members contributed across frontend, backend, architectural design, and quality assurance.

### Vanshika Tailor — Contributions
* **Authentication, Authorization & RBAC**:
  * Designed and built the user authentication backend (`backend/app/api/routes/auth.py`), incorporating salted SHA-256 password hashing and verification (`backend/app/core/security.py`).
  * Defined Pydantic validation schemas (`backend/app/schemas/auth.py`) for signup, login, user profiles, and session payloads.
  * Designed and integrated the SQLAlchemy ORM `User` model (`backend/app/models/user.py`) supporting roles (`judge`, `admin`, `user`) and foreign key relationships to workspaces (`companies.id`).
  * Created the instant demo fallback mechanism allowing judges to log in (`judge@brandguard.ai` / `demo123`) seamlessly, even when the database is unconfigured.
  * Developed backend RBAC role enforcement dependencies (`backend/app/api/deps.py`) and frontend route guards (`frontend/src/App.jsx`).
* **Company Onboarding Workflow**:
  * Implemented the onboarding wizard (`frontend/src/pages/Onboarding.jsx`) allowing users and judges to define their company name, industry sector, custom industry, and brand tagline.
  * Developed the backend company onboarding controller (`backend/app/api/routes/company.py`) and schemas (`backend/app/schemas/company.py`) to persist workspace profiles and link them to user accounts.
* **Navigation & Profile Header Components**:
  * Designed the dynamic header component (`frontend/src/components/TopBar.jsx`) featuring user initials, role indicators, company workspace name, and an interactive profile dropdown.
  * Updated the navigation sidebar (`frontend/src/components/Sidebar.jsx`) to display the authenticated user's name, company, and role with logout handling.
* **Authentication & RBAC Test Suite**:
  * Authored automated unit and integration tests (`backend/tests/test_auth.py`) covering demo login, signup, validation errors, token verification, `/auth/me` profile retrieval, and company onboarding.

### Lokendra Singh Shekhawat — Contributions
* **Core Compliance & Review Engine**:
  * Engineered the deterministic compliance evaluation engine (`backend/app/services/review_engine.py`), implementing word-boundary-aware regex matching, case-insensitive substring checks, approved-term masking, and category separation (`prohibited_phrase`, `required_phrase`, `required_disclaimer`, `brand_terminology`).
  * Built contextual claim heuristics flagging hyperbolic and absolute promises (e.g., "100% guaranteed", "never fails", "cheapest in the world") with certainty `needs_review` to guide human judgment.
  * Engineered cross-industry domain scoping preventing software deployment disclaimers from triggering on consumer food brand content.
* **"Fix It for Me" Text Remediation Engine & Invariant Guards**:
  * Designed and implemented the automated text correction engine (`backend/app/services/correction_engine.py`), proposing canonical replacements for brand terminology and appending missing mandatory disclaimers.
  * Built the structured diff generator outputting `ProposedChange` records with character index offsets, change rationale, and safety flags.
  * Implemented regex safeguards (`PROTECTED_FACT_PATTERNS`) preventing automated modification of critical facts, including currency prices (`$4.99`, `€50`), technical specs (`250g`, `500GB`), and calendar dates.
* **4-Tier Automated OCR & Multimodal AI Vision Service**:
  * Engineered the automated OCR extraction pipeline (`backend/app/services/ocr_service.py`), supporting Tesseract OCR, Google Gemini Vision, OpenAI Vision, embedded metadata, and heuristic vision fallbacks.
  * Developed the image inspection API routes (`backend/app/api/routes/images.py`) supporting `/scan` and `/review`.
  * Implemented the dual **"Load Sample Data"** dropdown on the Content Review page for instant Pass vs. Fail case testing.
* **Document Ingestion & Database Architecture**:
  * Built the policy document parsing service (`backend/app/services/document_service.py`), supporting `.pdf`, `.docx`, and `.txt` files with 10MB size limits, magic-byte header validation, and automated candidate rule extraction.
  * Co-designed the relational database schema across 6 core entities (`companies`, `users`, `brand_rules`, `content_reviews`, `source_documents`, `protected_elements`) using SQLAlchemy 2.0 ORM.
  * Authored the automated database initialization and starter seed script (`backend/app/db/init_db.py`), pre-populating brand guidelines for both Brandguard AI and PureBites.

### Shared Team Contributions
* **System Architecture & Full-Stack Integration:** Co-designed the end-to-end governance lifecycle, REST API schemas across all 9 route modules, and centralized frontend API client (`frontend/src/services/api.js`).
* **Custom Design System:** Co-developed the custom CSS design system (`frontend/src/styles/global.css`) utilizing the corporate palette: Deep Forest Green (`#173F35`), Warm Ivory (`#F7F6F0`), Soft Sage (`#DCE8DF`), Muted Gold (`#C5A46D`), and Charcoal (`#252B28`).
* **Testing & Verification:** Collaborated on authoring and maintaining the 53-test automated test suite across backend services, routes, and authentication.

---

## 🔒 Security, Integrity & Ethical Design

* **Human-in-the-Loop Verification:** Candidate rules extracted from policy documents remain in `draft` status until explicitly reviewed and approved by a brand manager.
* **Protected Facts Invariant:** Automated corrections never alter currency prices, technical numbers, dates, or registered protected brand assets.
* **Deterministic Transparency:** Findings include exact rule excerpts, category definitions, and evidence context so copywriters understand the exact rationale behind every violation.
* **Zero-Crash Resilience:** Informative `503 Service Unavailable` structured responses are provided if MySQL is unconfigured, and instant demo access ensures external reviewers can evaluate the platform seamlessly without complex environmental dependencies.
* **Credential Protection:** Secrets and database passwords are read from environment variables; `.env` files are strictly excluded from version control via `.gitignore`.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
