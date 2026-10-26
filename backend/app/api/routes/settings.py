"""
backend/app/api/routes/settings.py
REST API endpoints for Workspace Settings, Protected Brand Elements, and System Diagnostics.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db, check_db_connection
from app.models.company import Company
from app.models.protected_element import ProtectedBrandElement
from app.schemas.protected_element import (
    ProtectedElementCreate,
    ProtectedElementOut,
    ProtectedElementListResponse,
)
from app.services.image_service import is_tesseract_installed
from app.core.config import get_settings

router = APIRouter(tags=["Settings"])


@router.get("/settings/system")
def get_system_diagnostics():
    """Return backend environment status, DB connectivity, and engine availability."""
    settings = get_settings()
    db_status = check_db_connection()
    ocr_installed = is_tesseract_installed()

    return {
        "app_env": settings.APP_ENV,
        "database": {
            "status": db_status.get("status"),
            "host": settings.DB_HOST,
            "port": settings.DB_PORT,
            "name": settings.DB_NAME,
            "message": db_status.get("message"),
        },
        "ocr_engine": {
            "available": ocr_installed,
            "engine": "Tesseract OCR" if ocr_installed else "Not Installed",
            "message": "OCR enabled" if ocr_installed else "Host lacks tesseract binary; manual image transcript input available.",
        },
        "ai_integration": {
            "openai_configured": bool(settings.OPENAI_API_KEY),
            "google_ai_configured": bool(settings.GOOGLE_AI_API_KEY),
        },
    }


@router.get("/settings/protected-elements", response_model=ProtectedElementListResponse)
def list_protected_elements(
    company_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    """List protected brand identity elements (names, slogans, disclaimers, specs)."""
    try:
        query = db.query(ProtectedBrandElement)
        if company_id is not None:
            query = query.filter(ProtectedBrandElement.company_id == company_id)
        elements = query.order_by(ProtectedBrandElement.created_at.desc()).all()
        return ProtectedElementListResponse(
            elements=[ProtectedElementOut.model_validate(e) for e in elements],
            total=len(elements),
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.post("/settings/protected-elements", response_model=ProtectedElementOut, status_code=status.HTTP_201_CREATED)
def create_protected_element(
    payload: ProtectedElementCreate,
    db: Session = Depends(get_db),
):
    """Register a new protected brand element."""
    try:
        pe = ProtectedBrandElement(
            company_id=payload.company_id,
            element_type=payload.element_type,
            canonical_text=payload.canonical_text.strip(),
            forbidden_variations=payload.forbidden_variations.strip() if payload.forbidden_variations else None,
            description=payload.description.strip() if payload.description else None,
            is_active=payload.is_active,
        )
        db.add(pe)
        db.commit()
        db.refresh(pe)
        return ProtectedElementOut.model_validate(pe)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.delete("/settings/protected-elements/{element_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_protected_element(element_id: int, db: Session = Depends(get_db)):
    """Remove a protected brand element."""
    try:
        pe = db.query(ProtectedBrandElement).filter(ProtectedBrandElement.id == element_id).first()
        if not pe:
            raise HTTPException(status_code=404, detail=f"Protected element #{element_id} not found.")
        db.delete(pe)
        db.commit()
        return None
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.get("/companies")
def list_companies(db: Session = Depends(get_db)):
    """List registered companies/workspaces."""
    try:
        companies = db.query(Company).all()
        return [
            {"id": c.id, "name": c.name, "industry": c.industry, "created_at": c.created_at}
            for c in companies
        ]
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
