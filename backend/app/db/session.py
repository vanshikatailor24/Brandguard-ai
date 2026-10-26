"""
backend/app/db/session.py
SQLAlchemy engine and session factory.
The engine is created lazily — only when DB credentials are configured.
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from app.core.config import get_settings

settings = get_settings()

# Only build an engine when credentials are present
_engine = None
_SessionLocal = None

if settings.db_configured:
    _engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,   # detect stale connections automatically
        pool_recycle=3600,    # recycle connections every hour
    )
    _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


from fastapi import HTTPException, status

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
                "Copy backend/.env.example to backend/.env and fill in your MySQL credentials."
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
    if not settings.db_configured:
        return {
            "status": "not_configured",
            "message": (
                "Database credentials are missing. "
                "Copy backend/.env.example to backend/.env and fill in your MySQL credentials."
            ),
        }
    try:
        with _engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "connected", "message": "MySQL connection successful."}
    except Exception as exc:
        return {"status": "error", "message": str(exc)}
