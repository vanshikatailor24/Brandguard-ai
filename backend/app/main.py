"""
backend/app/main.py
FastAPI application entry point for Brandguard AI.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    health,
    rules,
    reviews,
    documents,
    images,
    insights,
    settings as settings_router,
    auth,
    company,
)

# ── Application setup ──────────────────────────────────────────────────────────

app = FastAPI(
    title="Brandguard AI API",
    description=(
        "Backend API for Brandguard AI — an AI-assisted brand governance platform. "
        "Enforces brand guidelines, disclaimers, and copy consistency across enterprise communications."
    ),

    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
# FRONTEND_URL is set as an environment variable on Render (the deployed frontend).
_allowed_origins = [
    "http://localhost:5173",   # default Vite dev port
    "http://localhost:5174",   # secondary Vite dev port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]
_frontend_url = os.getenv("FRONTEND_URL", "").strip()
if _frontend_url:
    _allowed_origins.append(_frontend_url)
    # Also allow without trailing slash variant
    _allowed_origins.append(_frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,             prefix="/api")
app.include_router(company.router,          prefix="/api")
app.include_router(health.router,           prefix="/api")
app.include_router(rules.router,            prefix="/api")
app.include_router(reviews.router,          prefix="/api")
app.include_router(documents.router,        prefix="/api")
app.include_router(images.router,           prefix="/api")
app.include_router(insights.router,         prefix="/api")
app.include_router(settings_router.router,  prefix="/api")



from fastapi.responses import RedirectResponse

# ── Root redirect hint & aliases ──────────────────────────────────────────────
@app.get("/docs", include_in_schema=False)
def redirect_to_docs():
    return RedirectResponse(url="/api/docs")


@app.get("/", include_in_schema=False)
def root():
    return {
        "message": "Brandguard AI API is running.",
        "docs": "/api/docs",
        "health": "/api/health",
        "version": "1.0.0",
    }

