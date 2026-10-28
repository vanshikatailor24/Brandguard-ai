"""
backend/app/db/session.py
SQLAlchemy engine and session factory.
Supports cloud PostgreSQL, cloud MySQL, local MySQL, and automatic SQLite fallback.
"""
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from fastapi import HTTPException, status

from app.core.config import get_settings

settings = get_settings()

_engine = None
_SessionLocal = None

if settings.db_configured:
    connect_args = {}
    if "sqlite" in settings.database_url:
        connect_args["check_same_thread"] = False
    elif "mysql" in settings.database_url or "postgresql" in settings.database_url:
        connect_args["connect_timeout"] = 5

    _engine = create_engine(
        settings.database_url,
        connect_args=connect_args,
        pool_pre_ping=True,   # detect stale connections automatically
        pool_recycle=3600,    # recycle connections every hour
    )
    _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency: yields a database session and closes it afterwards.
    Raises HTTPException(503) if the database is not configured.
    """
    if _SessionLocal is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Database is not configured. "
                "Set DATABASE_URL (PostgreSQL) or individual DB_* credentials in backend/.env."
            ),
        )
    db: Session = _SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> dict:
    """
    Attempt a lightweight query to verify the DB is reachable.
    Returns a status dict suitable for the health endpoint.
    """
    if not settings.db_configured or _engine is None:
        return {
            "status": "not_configured",
            "message": (
                "Database credentials are missing. "
                "Set DATABASE_URL (PostgreSQL/MySQL) in Render environment variables or backend/.env."
            ),
        }
    try:
        with _engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine_type = (
            "sqlite"
            if "sqlite" in settings.database_url
            else ("postgresql" if "postgresql" in settings.database_url else "mysql")
        )
        return {
            "status": "connected",
            "engine": engine_type,
            "message": f"Database connection successful ({engine_type}).",
        }
    except Exception as exc:
        return {"status": "error", "message": str(exc)}
