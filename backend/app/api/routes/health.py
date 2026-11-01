"""
backend/app/api/routes/health.py
GET /api/health & /api/v1/health — application and database health check.
"""
from fastapi import APIRouter
from app.db.session import check_db_connection
from app.core.config import get_settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, tags=["Health"])
@router.get("/v1/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """
    Returns application status and database connectivity check.
    Application is healthy even when database is running on fallback storage.
    """
    settings = get_settings()
    db_status = check_db_connection()

    return {
        "application": "ok",
        "version": "1.0.0",
        "project": "Brandguard AI",
        "team": "Brandguard AI",
        "environment": settings.APP_ENV,
        "database": db_status,
    }
