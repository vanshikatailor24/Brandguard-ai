# API Overview — Brandguard AI

**Base URL (development):** `http://localhost:8000/api`  
**Interactive docs (Swagger UI):** `http://localhost:8000/api/docs`  
**OpenAPI JSON schema:** `http://localhost:8000/api/openapi.json`

All endpoints return JSON. In failure scenarios, standard error payloads are returned:
```json
{
  "detail": "Descriptive error message"
}
```

---

## Endpoint Summary

### 1. Health & Diagnostics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check returning application status & DB reachability |
| `GET` | `/settings/system` | System diagnostics (MySQL status, OCR engine availability, AI keys) |

---

### 2. Brand Guidelines (`/rules`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/rules` | List rules. Query params: `category`, `approved_only`, `company_id` |
| `POST` | `/rules` | Create a new brand rule |
| `GET` | `/rules/{id}` | Retrieve details for a specific rule |
| `PATCH`| `/rules/{id}` | Update rule (protected rules block core wording modification) |
| `POST` | `/rules/{id}/approve` | Toggle rule approval (`?approved=true/false`) |
| `DELETE`| `/rules/{id}` | Delete rule (protected rules cannot be deleted) |

---

### 3. Content Reviews (`/reviews`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/reviews` | Submit text for evaluation against approved rules |
| `GET` | `/reviews` | List recent reviews (audit log) |
| `GET` | `/reviews/{id}` | Get full review record, original text, and findings |
| `POST` | `/reviews/correct` | "Fix It for Me": Generate automatic corrections & guarded diffs |
| `POST` | `/reviews/{id}/accept` | Save user-accepted revision to the review audit record |

---

### 4. Policy & Documents (`/documents`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/documents` | List uploaded policy documents & extraction status |
| `POST` | `/documents/upload` | Upload `.pdf`, `.docx`, or `.txt` (multipart) & extract candidate rules |
| `DELETE`| `/documents/{id}` | Delete document and associated draft rules |

---

### 5. Visual Asset Review (`/images`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/images/review` | Upload `.png`, `.jpg`, `.webp` (multipart) + optional transcript, inspect OCR & check brand rules |

---

### 6. Governance Insights (`/insights`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/insights` | Calculate real compliance statistics, pass rate %, and channel breakdown |

---

### 7. Protected Assets & Workspace Settings (`/settings`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/settings/protected-elements` | List guarded brand names, slogans, disclaimers, and specs |
| `POST` | `/settings/protected-elements` | Register a new protected brand asset |
| `DELETE`| `/settings/protected-elements/{id}` | Remove a protected brand asset |
| `GET` | `/companies` | List registered companies / workspaces |
