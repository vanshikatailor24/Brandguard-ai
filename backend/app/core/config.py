"""
backend/app/core/config.py
Application-wide settings loaded from environment variables / .env file.
Supports PostgreSQL (Render cloud), cloud MySQL, local MySQL, and automatic SQLite fallback.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # ── Application ────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-in-production"

    # ── Database (individual fields — local MySQL dev) ──────────────────────
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "brandguard_ai"
    DB_USER: str = ""
    DB_PASSWORD: str = ""

    # ── Database (single URL — Render / cloud PostgreSQL / MySQL) ───────────
    # Set DATABASE_URL in Render env vars and this takes priority.
    DATABASE_URL: str = ""

    # ── AI (optional) ──────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    GOOGLE_AI_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def database_url(self) -> str:
        """
        Return a SQLAlchemy-compatible DB connection URL.
        Priority: DATABASE_URL env var > individual DB_* fields > SQLite fallback.
        Fixes Render's 'postgres://' prefix to 'postgresql+psycopg2://'.
        """
        if self.DATABASE_URL and self.DATABASE_URL.strip():
            url = self.DATABASE_URL.strip()
            # Render and cloud PostgreSQL supply postgres:// — SQLAlchemy 2.x needs postgresql+psycopg2://
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+psycopg2://", 1)
            elif url.startswith("postgresql://") and "+psycopg2" not in url:
                url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
            # Cloud MySQL providers often provide mysql:// — SQLAlchemy needs mysql+pymysql://
            elif url.startswith("mysql://") and "+pymysql" not in url:
                url = url.replace("mysql://", "mysql+pymysql://", 1)
            return url
        if self.DB_USER and self.DB_PASSWORD:
            return (
                f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            )
        # Automatic fallback: SQLite database for zero-config out-of-the-box operation
        return "sqlite:///./brandguard.db"

    @property
    def db_configured(self) -> bool:
        """True when any DB connection string is available (including SQLite fallback)."""
        return bool(self.database_url)


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (reads .env once)."""
    return Settings()
