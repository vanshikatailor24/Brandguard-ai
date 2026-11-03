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
from app.services.ocr_service import get_active_ocr_engine_info
from app.services.ai_service import get_ai_status
from app.core.config import get_settings
from app.api.deps import require_admin_or_judge, AuthUser

router = APIRouter(tags=["Settings"])


@router.get("/settings/system")
@router.get("/v1/settings/system")
def get_system_diagnostics():
    """Return backend environment status, DB connectivity, engine availability, and AI status."""
    settings = get_settings()
    db_status = check_db_connection()
    ocr_info = get_active_ocr_engine_info()
    ai_status = get_ai_status()

    return {
        "app_env": settings.APP_ENV,
        "database": {
            "status": db_status.get("status"),
            "host": settings.DB_HOST,
            "port": settings.DB_PORT,
            "name": settings.DB_NAME,
            "engine": db_status.get("engine", "sqlite"),
            "message": db_status.get("message"),
        },
        "ocr_engine": {
            "available": ocr_info["available"],
            "engine": ocr_info["engine"],
            "message": ocr_info["message"],
        },
        "ai_integration": {
            "openai_configured": ai_status["openai_configured"],
            "google_ai_configured": ai_status["google_ai_configured"],
            "gemini_configured": ai_status["gemini_configured"],
            "active_provider": ai_status["active_provider"],
            "active_model": ai_status["active_model"],
            "fallback_guarantee": ai_status["fallback_guarantee"],
            "fallback_engine": ai_status["fallback_engine"],
        },
    }


@router.get("/settings/protected-elements", response_model=ProtectedElementListResponse)
@router.get("/v1/settings/protected-elements", response_model=ProtectedElementListResponse)
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
@router.post("/v1/settings/protected-elements", response_model=ProtectedElementOut, status_code=status.HTTP_201_CREATED)
def create_protected_element(
    payload: ProtectedElementCreate,
    current_user: AuthUser = Depends(require_admin_or_judge),
    db: Session = Depends(get_db),
):
    """Register a new protected brand element (requires Admin or Judge role)."""
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
@router.delete("/v1/settings/protected-elements/{element_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_protected_element(
    element_id: int,
    current_user: AuthUser = Depends(require_admin_or_judge),
    db: Session = Depends(get_db),
):
    """Remove a protected brand element (requires Admin or Judge role)."""
    try:
        pe = db.query(ProtectedBrandElement).filter(ProtectedBrandElement.id == element_id).first()
        if not pe:
            raise HTTPException(status_code=404, detail=f"Protected element #{element_id} not found.")
        db.delete(pe)
        db.commit()
        return None
    except HTTPException:
        raise
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.get("/companies")
@router.get("/v1/companies")
def list_companies(db: Session = Depends(get_db)):
    """List registered companies/workspaces."""
    try:
        companies = db.query(Company).all()
        return [
            {
                "id": c.id,
                "name": c.name,
                "industry": c.industry,
                "industry_type": c.industry_type,
                "tagline": c.tagline,
                "created_at": c.created_at,
            }
            for c in companies
        ]
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
