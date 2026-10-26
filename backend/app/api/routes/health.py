"""
backend/app/api/routes/health.py
GET /api/health — application and database health check.
"""
from fastapi import APIRouter
from app.db.session import check_db_connection
from app.core.config import get_settings

router = APIRouter()


@router.get("/health", tags=["Health"])
def health_check():
    """
    Returns the application status and a separate database connectivity check.
    The application is considered healthy even when the database is not configured —
    database-dependent endpoints will return informative errors in that case.
    """
    settings = get_settings()
    db_status = check_db_connection()

    return {
        "application": "ok",
        "version": "0.1.0",
        "project": "Brandguard AI",
        "team": "SYNTAX DUO",
        "environment": settings.APP_ENV,
        "database": db_status,
    }
