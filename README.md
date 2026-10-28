# Brandguard AI

> AI-assisted brand governance platform for companies — built by **SYNTAX DUO** for the hackathon.

**Team Name:** SYNTAX DUO  
**Team Members:** Vanshika Tailor · Lokendra Singh Shekhawat  
**Repository:** [https://github.com/vanshikatailor24/Brandguard-ai](https://github.com/vanshikatailor24/Brandguard-ai) · **Working Branch:** `develop`

---

## 🔗 Application Links & Quick Access

* **Frontend Web Application:** [http://localhost:5173](http://localhost:5173)
* **Backend API Server:** [http://localhost:8000](http://localhost:8000)
* **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs) (or [http://localhost:8000/api/docs](http://localhost:8000/api/docs))
* **System Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)
* **GitHub Repository:** [https://github.com/vanshikatailor24/Brandguard-ai](https://github.com/vanshikatailor24/Brandguard-ai)

### 👤 Demo / Judge Quick Access Credentials
For hackathon evaluation and testing:
* **Email:** `judge@brandguard.ai`
* **Password:** `demo123`
* **One-Click Access:** The web application login page includes a **"Demo Judge Access"** button that grants instant entry with pre-seeded brand guidelines and analytics, even if the local MySQL database is offline.

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

1. **User Authentication & Session Management**: Secure user registration, credential authentication with password hashing, session persistence, and one-click demo judge evaluation access (`/api/v1/auth`).
2. **Company Onboarding & Multi-Workspace Setup**: Multi-industry onboarding wizard (SaaS, E-Commerce, Healthcare, Fintech, Hardware, Agency), custom industry input, company taglines, and workspace-scoped data isolation (`/api/v1/company`).
3. **Dashboard & Overview**: Real metrics derived from stored reviews and guidelines. Quick launch actions, live KPI stat cards, and recent audit activity feed.
4. **Brand Guidelines Catalog**: View, create, edit, filter, approve, and protect rules across 4 categories (`prohibited_phrase`, `required_phrase`, `required_disclaimer`, `brand_terminology`) with severity levels (`critical`, `warning`, `info`).
5. **Policy & Guidelines Document Ingestion**: Secure document upload (`.pdf`, `.docx`, `.txt`) with magic-byte signature validation, 10MB size restriction, text extraction, and automated candidate rule discovery.
6. **Content Review Engine**: Deterministic string and word-boundary matching combined with contextual claim heuristics (flagging hyperbolic and unsubstantiated claims as `needs_review`).
7. **"Guide Me" (Manual Guidance)**: Detailed finding cards displaying the rule category, violation reason, exact matched text, evidence excerpt, and actionable guidance for human editors.
8. **"Fix It for Me" (Automatic Text Correction)**: Replaces unapproved brand terminology, appends missing disclaimers, and generates side-by-side revision comparisons and diffs, while guarding prices, numbers, and dates.
9. **Visual Asset Review**: Image format and dimension inspection (`.png`, `.jpg`, `.jpeg`, `.webp`), OCR engine detection (Tesseract) with fallback transcript input, and brand rule evaluation.
10. **Review History Audit Trail**: Searchable audit log of past reviews with original copy, accepted revisions, and detailed violation findings.
11. **Governance Analytics & Insights**: Real calculated statistics (channel breakdown, frequent violation categories, pass rates, governance health status).
12. **Workspace Settings & Protected Elements**: Management of protected brand assets (names, slogans, disclaimers, specs) and live system connectivity diagnostics.

---

## Team Contributions

**Team Name:** SYNTAX DUO  
**Team Members:** Vanshika Tailor & Lokendra Singh Shekhawat  
**Collaboration Model:** Brandguard AI was developed as an intensive, collaborative hackathon project. Both team members contributed across frontend, backend, architectural design, and quality assurance. The specific areas of focus and documented contributions are detailed below.

### Vanshika Tailor — Contributions

* **Authentication & Authorization System**:
  * Designed and built the user authentication backend (`backend/app/api/routes/auth.py`), incorporating salted SHA-256 password hashing and verification (`backend/app/core/security.py`).
  * Defined Pydantic validation schemas (`backend/app/schemas/auth.py`) for signup, login, user profiles, and session payloads.
  * Designed and integrated the SQLAlchemy ORM `User` model (`backend/app/models/user.py`) supporting roles (`judge`, `admin`, `user`) and foreign key relationships to workspaces (`companies.id`).
  * Created the instant demo fallback mechanism allowing judges to log in (`judge@brandguard.ai` / `demo123`) seamlessly, even when the database is unconfigured.

* **Client-Side Authentication & Session Architecture**:
  * Developed the client session manager (`frontend/src/services/auth.js`) handling token storage, user metadata caching, and reactive profile updates in `localStorage`.
  * Updated the centralized API client (`frontend/src/services/api.js`) to automatically attach Bearer authorization headers to outgoing requests.

* **Login & Registration Experience**:
  * Built the authentication interface (`frontend/src/pages/Login.jsx`) featuring tabbed mode switching between Sign In and Sign Up.
  * Implemented one-click Demo Judge access, responsive form validation, real-time error alerts, and branded UI styling.

* **Company Onboarding Workflow**:
  * Implemented the onboarding wizard (`frontend/src/pages/Onboarding.jsx`) allowing newly registered users and judges to define their company name, industry sector, custom industry, and brand tagline.
  * Developed the backend company onboarding controller (`backend/app/api/routes/company.py`) and schemas (`backend/app/schemas/company.py`) to persist workspace profiles and link them to user accounts.

* **Navigation & Profile Header Components**:
  * Designed the dynamic header component (`frontend/src/components/TopBar.jsx`) featuring user initials, role indicators, company workspace name, and an interactive profile dropdown.
  * Updated the navigation sidebar (`frontend/src/components/Sidebar.jsx`) to display the authenticated user's name, company, and role with logout handling.

* **Authentication Test Suite**:
  * Authored automated unit and integration tests (`backend/tests/test_auth.py`, 8 test cases) covering demo login, signup, validation errors, token verification, `/auth/me` profile retrieval, and company onboarding.

* *Collaborative Full-Stack Contributions*:
  * Participated in UI component styling, layout responsiveness, and end-to-end integration across frontend views and backend endpoints.

---

### Lokendra Singh Shekhawat — Contributions

* **Core Compliance & Review Engine**:
  * Engineered the deterministic compliance evaluation engine (`backend/app/services/review_engine.py`), implementing word-boundary-aware regex matching, case-insensitive substring checks, and category separation (`prohibited_phrase`, `required_phrase`, `required_disclaimer`, `brand_terminology`).
  * Implemented approved-term masking to eliminate false positives when unapproved variants appear as substrings of canonical brand names.
  * Built contextual claim heuristics flagging hyperbolic and absolute promises (e.g., "100% guaranteed", "never fails") with certainty `needs_review` to guide human judgment.

* **"Fix It for Me" Text Remediation Engine**:
  * Designed and implemented the automated text correction engine (`backend/app/services/correction_engine.py`), automatically proposing canonical replacements for brand terminology and appending missing mandatory disclaimers.
  * Built the structured diff generator outputting `ProposedChange` records with character index offsets, change rationale, and safety flags.

* **Protected Factual Claim Invariant Guards**:
  * Implemented regex safeguards (`PROTECTED_FACT_PATTERNS` in `backend/app/services/correction_engine.py`) to prevent automated modification of critical facts, including currency prices (`$199`, `€50`), technical specs (`500GB`, `3.2GHz`), and calendar dates.
  * Integrated protected elements checking against the `protected_elements` database table (`backend/app/models/protected_element.py`).

* **Document Ingestion & Image Inspection Services**:
  * Built the policy document parsing service (`backend/app/services/document_service.py`), supporting `.pdf` (`pypdf`), `.docx` (`python-docx`), and `.txt` files with 10MB size limits, magic-byte header validation, and automated candidate rule extraction.
  * Developed the visual asset inspection service (`backend/app/services/image_service.py`), utilizing Pillow for dimension and format validation, detecting system OCR (Tesseract), and evaluating extracted graphic text against brand guidelines.

* **Database Architecture & Seeding**:
  * Co-designed the relational database schema (`docs/DATABASE_DESIGN.md`) across 6 core entities (`companies`, `users`, `brand_rules`, `content_reviews`, `source_documents`, `protected_elements`) using SQLAlchemy 2.0 ORM.
  * Authored the automated database initialization and starter seed script (`backend/app/db/init_db.py`), pre-populating standard brand rules, protected elements, and demo records.

* **Governance Frontend Interfaces**:
  * Developed the content review interface (`frontend/src/pages/ContentReview.jsx`) with live word/token counts, channel selection, finding cards, "Guide Me" remediation tips, side-by-side diff comparisons, and graphic review tab.
  * Implemented the brand guidelines catalog (`frontend/src/pages/BrandGuidelines.jsx`), policy documents uploader (`frontend/src/pages/PolicyDocuments.jsx`), governance insights analytics (`frontend/src/pages/Insights.jsx`), and workspace settings (`frontend/src/pages/Settings.jsx`).

* *Collaborative Full-Stack Contributions*:
  * Contributed across frontend interface design, backend API routing, and unit test implementations.

---

### Shared Team Contributions

* **System Concept & Architecture Planning**:
  * Jointly conceptualized Brandguard AI's problem statement, user personas (Brand Managers, Copywriters, Compliance Auditors), and core governance lifecycle:
    $$\text{Upload Guidelines} \longrightarrow \text{Extract Rules} \longrightarrow \text{Human Approval} \longrightarrow \text{Review Content} \longrightarrow \text{Remediate (Guide/Fix)} \longrightarrow \text{Audit Log}$$

* **Full-Stack Integration & API Contracts**:
  * Collaboratively defined REST API contracts and data schemas across all 9 route modules (`auth`, `company`, `health`, `rules`, `reviews`, `documents`, `images`, `insights`, `settings`).
  * Implemented the centralized frontend API client (`frontend/src/services/api.js`) connecting React components to FastAPI endpoints with consistent JSON error handling.

* **Custom Design System & UI/UX Styling**:
  * Co-developed the custom CSS design system (`frontend/src/styles/global.css`) without heavy external CSS frameworks, establishing a distinctive corporate brand palette:
    * Deep Forest Green (`#173F35`), Warm Ivory (`#F7F6F0`), Soft Sage (`#DCE8DF`), Muted Gold (`#C5A46D`), Charcoal (`#252B28`).
  * Styled reusable UI components including `StatusBadge.jsx`, modal dialogs, side-by-side diff viewers, and responsive grid layouts.

* **Testing, Verification & Reliability**:
  * Collaborated on authoring and verifying the 41-test automated suite across 6 test files (`test_review_engine.py`, `test_correction_engine.py`, `test_document_service.py`, `test_image_service.py`, `test_auth.py`, `test_api_endpoints.py`).
  * Implemented graceful degradation throughout the platform: informative 503 error responses when MySQL is unconfigured, fallback OCR transcript input, and offline-resilient demo access.

* **Documentation & Hackathon Presentation**:
  * Co-authored the project documentation suite:
    * `README.md`: Product setup, feature overview, and team contributions.
    * `docs/PROJECT_OVERVIEW.md`: Architectural specification and governance workflows.
    * `docs/DATABASE_DESIGN.md`: Entity relationships, schema tables, and column definitions.
    * `docs/API_OVERVIEW.md`: REST API reference with endpoint descriptions and payloads.

> *Note on Individual Contribution Boundaries:* Because Brandguard AI was developed collaboratively as a two-person team where both members contributed to frontend and backend code, specific module boundaries are documented based on repository artifacts, commit history, and code modules. Specific individual allocations can be further confirmed or refined by team members as needed.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite 5, React Router v6 | Single-Page Application (SPA) with responsive client-side routing |
| **Styling** | Vanilla CSS Design System | Custom CSS token design system with scoped components and zero runtime overhead |
| **Backend** | Python 3.11+, FastAPI, Uvicorn | High-performance asynchronous REST API framework |
| **ORM & Database**| SQLAlchemy 2.0, MySQL 8 / PostgreSQL | Declarative ORM models, PyMySQL & psycopg2 drivers, lazy connection pooling |
| **Document Parsing** | pypdf, python-docx | Text extraction and candidate rule mining from `.pdf`, `.docx`, and `.txt` |
| **Image Inspection** | Pillow (PIL), pytesseract | Image header validation, dimension checks, and OCR text extraction |
| **Testing** | pytest, pytest-cov, Starlette TestClient, httpx | 41 unit and integration tests across services, routes, and authentication |

### Color Palette (Custom Design System)
* **Deep Forest Green**: `#173F35` (Primary brand accent, navigation, and headers)
* **Warm Ivory**: `#F7F6F0` (Background container and card surfaces)
* **Soft Sage**: `#DCE8DF` (Subtle borders, card highlights, and secondary badges)
* **Muted Gold**: `#C5A46D` (Accents, warnings, and brand callouts)
* **Charcoal**: `#252B28` (High-contrast typography and dark elements)

---

## Repository Structure

```
Brandguard-ai/
├── README.md                      # Setup, architecture & team contributions
├── .gitignore                     # Git ignore rules for Python, Node, Vite, .env
├── docs/
│   ├── PROJECT_OVERVIEW.md        # Problem statement, workflow, and capabilities
│   ├── DATABASE_DESIGN.md         # Schema design, entity relationships, and tables
│   └── API_OVERVIEW.md            # REST API endpoints, schemas, and examples
├── backend/
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Environment variables template
│   ├── run.py                     # Backend runner script (starts Uvicorn on :8000)
│   ├── app/
│   │   ├── main.py                # FastAPI entry point, CORS & route registration
│   │   ├── core/
│   │   │   ├── config.py          # Pydantic Settings configuration & env loading
│   │   │   └── security.py        # Password hashing & verification utilities
│   │   ├── db/
│   │   │   ├── base.py            # SQLAlchemy DeclarativeBase
│   │   │   ├── session.py         # SQLAlchemy engine, session dependency & DB check
│   │   │   └── init_db.py         # Database creation, column checks & starter seeding
│   │   ├── models/                # ORM models (User, Company, BrandRule, ContentReview,
│   │   │                          #             SourceDocument, ProtectedBrandElement)
│   │   ├── schemas/               # Pydantic validation schemas (auth, company, rules,
│   │   │                          #   reviews, documents, insights, protected elements)
│   │   ├── services/
│   │   │   ├── review_engine.py   # Deterministic & contextual compliance engine
│   │   │   ├── correction_engine.py # "Fix It for Me" auto-correction engine
│   │   │   ├── document_service.py # Document parsing & candidate rule extraction
│   │   │   └── image_service.py   # Image validation & OCR extraction service
│   │   └── api/routes/            # REST route controllers (auth, company, health, rules,
│   │                              #   reviews, documents, images, insights, settings)
│   └── tests/                     # 41 unit and integration tests across 6 test modules
│       ├── test_review_engine.py      # 12 tests: deterministic and contextual matching
│       ├── test_correction_engine.py  # 5 tests: automatic fixes & protected fact guards
│       ├── test_document_service.py   # 7 tests: PDF, DOCX, TXT validation & extraction
│       ├── test_image_service.py      # 4 tests: image format validation & OCR checks
│       ├── test_auth.py               # 8 tests: signup, login, demo judge, onboarding
│       └── test_api_endpoints.py      # 5 tests: health, diagnostics, rules, reviews
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx                # Router, protected routes & page layout
        ├── layouts/
        │   └── DashboardLayout.jsx# Responsive shell with persistent Sidebar & TopBar
        ├── components/
        │   ├── Sidebar.jsx        # Navigation menu, workspace identity & logout
        │   ├── TopBar.jsx         # Profile header, role indicator & user dropdown
        │   └── StatusBadge.jsx    # Unified status pills for categories & severities
        ├── hooks/
        │   └── useFetch.js        # Reusable asynchronous data-fetching hook
        ├── services/
        │   ├── api.js             # Centralized API client with automatic token injection
        │   └── auth.js            # Client-side session and local storage management
        ├── styles/
        │   └── global.css         # Custom design system with color tokens & component styles
        └── pages/
            ├── Login.jsx          # User authentication & instant Demo Judge entry
            ├── Onboarding.jsx     # Multi-industry company workspace setup wizard
            ├── Overview.jsx       # Executive dashboard with live KPIs & recent audit feed
            ├── ContentReview.jsx  # Dual-tab text & graphic review with diff comparison
            ├── BrandGuidelines.jsx# Interactive rules catalog with category/status filters
            ├── PolicyDocuments.jsx# Document ingestion with candidate rule discovery
            ├── ReviewHistory.jsx  # Searchable audit log with full finding inspector
            ├── Insights.jsx       # Governance compliance analytics & violation breakdowns
            └── Settings.jsx       # Protected brand assets & real-time system diagnostics
```

---

## API Documentation & Endpoints

Base URL: `http://localhost:8000/api` | Swagger UI: `http://localhost:8000/docs`

| Module | Method | Endpoint | Description |
|---|---|---|---|
| **Health** | `GET` | `/health` | Application status & database reachability check |
| **Auth** | `POST` | `/v1/auth/login` | Authenticate user or instant demo judge credentials |
| **Auth** | `POST` | `/v1/auth/signup` | Register a new user account |
| **Auth** | `GET` | `/v1/auth/me` | Retrieve profile and workspace details for active user |
| **Company** | `POST` | `/v1/company/onboard` | Initialize company workspace, industry sector, and tagline |
| **Brand Rules** | `GET` | `/rules` | List brand rules (filter by category, approved, company) |
| **Brand Rules** | `POST` | `/rules` | Create a new brand rule |
| **Brand Rules** | `PATCH` | `/rules/{id}` | Update rule (protected rules block core wording modification) |
| **Brand Rules** | `POST` | `/rules/{id}/approve` | Toggle rule approval status (`?approved=true/false`) |
| **Brand Rules** | `DELETE`| `/rules/{id}` | Delete rule (protected rules cannot be deleted) |
| **Reviews** | `POST` | `/reviews` | Submit text for evaluation against approved guidelines |
| **Reviews** | `GET` | `/reviews` | Retrieve past review audit records |
| **Reviews** | `GET` | `/reviews/{id}` | Get full review audit record, findings, and accepted revisions |
| **Reviews** | `POST` | `/reviews/correct` | "Fix It for Me": Generate automatic corrections & guarded diffs |
| **Reviews** | `POST` | `/reviews/{id}/accept`| Save user-accepted revision to the review audit record |
| **Documents** | `GET` | `/documents` | List uploaded policy documents & extraction status |
| **Documents** | `POST` | `/documents/upload` | Upload `.pdf`, `.docx`, `.txt` and extract candidate rules |
| **Documents** | `DELETE`| `/documents/{id}` | Delete policy document and associated draft rules |
| **Images** | `POST` | `/images/review` | Upload `.png`, `.jpg`, `.webp` + optional transcript for review |
| **Insights** | `GET` | `/insights` | Calculate live compliance statistics and channel breakdowns |
| **Settings** | `GET` | `/settings/protected-elements` | List guarded brand names, slogans, and specifications |
| **Settings** | `POST` | `/settings/protected-elements` | Register a new protected brand asset |
| **Settings** | `DELETE`| `/settings/protected-elements/{id}` | Remove a protected brand asset |
| **Settings** | `GET` | `/settings/system` | System diagnostics (DB connection, OCR engine, AI keys) |

*For complete request schemas, response formats, and error codes, refer to [`docs/API_OVERVIEW.md`](docs/API_OVERVIEW.md).*

---

## Prerequisites (Windows)

1. **Python**: Python 3.11, 3.12, 3.13, or 3.14 (ensure `python` is added to system PATH).
2. **Node.js**: Node 18+ and `npm` (ensure `node` and `npm` are added to system PATH).
3. **MySQL**: MySQL 8.x server installed and running (or use instant demo mode if MySQL is not installed).

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
DB_PASSWORD=root
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

Execute the automated test suite across all 6 test modules:
```powershell
pytest tests/ -v
```
*(All 41 tests should pass in ~1.3s)*

### 4. Start the Backend API Server

```powershell
python run.py
```
* **Backend API Server:** [http://localhost:8000](http://localhost:8000)
* **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs) (or [http://localhost:8000/api/docs](http://localhost:8000/api/docs))
* **System Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### 5. Start the Frontend React App

Open a second PowerShell window and navigate to the frontend folder:
```powershell
cd c:\Users\kumar\Desktop\Brandguard-ai\frontend
npm install
npm run dev
```
* **Frontend Web Application:** [http://localhost:5173](http://localhost:5173)  
*(Log in using the Demo Judge credentials above: `judge@brandguard.ai` / `demo123`, or click the one-click **"Demo Judge Access"** button on the login screen).*

---

## Current Status, Limitations & Integrity Notes

* **Accuracy & Human-in-the-Loop**: The review engine uses explicit, approved deterministic rules and contextual heuristics. It never claims 100% legal or regulatory accuracy. Human brand managers retain final approval over candidate rules and text revisions.
* **Database Resilience & Offline Evaluation**: If MySQL credentials are missing or the database server is stopped, the backend reports an informative `503 Service Unavailable: Database is not configured` message with instructions on configuring `backend/.env`. Furthermore, demo judge credentials (`judge@brandguard.ai` / `demo123`) operate smoothly with pre-configured in-memory defaults for instant hackathon evaluation.
* **Protected Factual Claims Invariant**: Automated corrections strictly guard prices (`$199`, `€50`), dates, product specifications (`500GB`), and registered protected assets from silent alteration.
* **Visual Image Assets**: Image review inspects graphic copy and OCR text. It analyzes extracted graphic text and evaluates brand compliance without distorting, redrawing, or replacing graphical logos or pixels on the original image file.
* **Authentication**: User authentication, password hashing, and multi-company workspace onboarding are implemented and fully functional. Enterprise SSO and granular multi-tenant permission matrices remain planned enhancements for future production releases.

---

## Future Improvements

* **Multimodal Visual Inspection**: Integrate vision-language models for advanced layout analysis, logo clear-space verification, and font typography compliance.
* **CMS & Workspace Integrations**: Connect directly to content management workflows (Contentful, WordPress, Google Docs, Notion) via webhooks and Chrome extensions.
* **Automated Regression Testing for Guidelines**: Enable brand managers to simulate policy changes against historical content batches to measure impact before publishing new rules.
* **Enterprise Multi-Tenancy**: Granular role-based access control (RBAC), SSO via SAML/OAuth2, and audit export capabilities (CSV/PDF) for regulatory compliance.
