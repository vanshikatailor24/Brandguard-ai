# Project Overview — Brandguard AI

> **Repository:** `brandguard-ai` · **Branch:** `develop`

---


## 🔗 Application Endpoints & Quick Links

* **Frontend Web Application:** [http://localhost:5173](http://localhost:5173)
* **Backend API Server:** [http://localhost:8000](http://localhost:8000)
* **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs) (or [http://localhost:8000/api/docs](http://localhost:8000/api/docs))
* **System Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## Product Summary


**Brandguard AI** is a multi-company brand governance platform designed to help organisations consistently enforce their brand identity across all communications.

The platform follows a complete, auditable governance lifecycle:
`Upload guidelines → Extract candidate rules → Review & approve rules → Submit content → Detect issues → Explain findings (Guide Me) → Automatic text correction (Fix It for Me) → Review diffs → Save review audit history.`

---

## Core Capabilities Implemented

1. **Brand Guidelines Management**:
   - Comprehensive rule catalog across 4 categories: `prohibited_phrase`, `required_phrase`, `required_disclaimer`, and `brand_terminology`.
   - Severity tagging: `critical`, `warning`, `info`.
   - Authoritative rule gating: Only **approved** rules are evaluated in the live review engine.
   - Protected brand assets: Guarded rules cannot be modified or deleted without explicit override.

2. **Policy & Guidelines Document Ingestion**:
   - Supported formats: `.pdf` (via `pypdf`), `.docx` (via `python-docx`), and `.txt`.
   - Security validation: 10MB file limit, magic byte signature verification, path sanitization.
   - Candidate Rule Extraction: Automatically extracts proposed rules from directives and policies, placing them in draft status awaiting human brand manager approval.

3. **Content Review Engine**:
   - Deterministic matching for prohibited wording, missing disclaimers, required phrases, and brand terminology.
   - Contextual checks flagging hyperbolic claims, absolute promises, and unverified pricing with certainty=`needs_review`.
   - Rich finding cards: Finding ID, rule reference, evidence excerpt, explanation, and remediation advice.

4. **"Guide Me" (Manual Guidance) & "Fix It for Me" (Automatic Text Correction)**:
   - "Guide Me": Actionable suggestions and evidence explaining how to manually rewrite copy.
   - "Fix It for Me": Proposes safe revisions, computes change diffs, appends missing disclaimers, and normalizes brand terminology.
   - Protected Factual Claims Guard: Strictly guards prices (`$199`, `€50`), dates, specifications (`500GB`), and protected assets from automated alteration.

5. **Visual Asset & Image Review**:
   - Upload & safe inspection for `.png`, `.jpg`, `.jpeg`, and `.webp` via Pillow.
   - OCR engine detection (Tesseract) with fallback transcript input.
   - Evaluates image copy against brand guidelines with explicit distinction between text findings and graphical image pixels.

6. **Audit Trail & Governance Analytics**:
   - Complete review audit history with original content and accepted revisions.
   - Real calculated analytics in the Insights dashboard (channel breakdown, frequent violation categories, pass rates).

7. **Workspace Settings & Diagnostics**:
   - System diagnostics for database connectivity, OCR availability, and environment settings.
   - Protected brand elements catalog.

---

## Architecture & Technology Stack

```
Frontend:   React 18 + Vite (SPA)
Design:     Forest green (#173F35), Warm ivory (#F7F6F0), Soft sage (#DCE8DF), Muted gold (#C5A46D), Charcoal (#252B28)
Backend:    Python 3.14 + FastAPI
ORM:        SQLAlchemy 2.0 (Declarative Base)
Database:   MySQL 8 (via PyMySQL driver)
Document:   pypdf, python-docx
Image:      Pillow (PIL)
Testing:    pytest (41 unit & integration tests)
```

