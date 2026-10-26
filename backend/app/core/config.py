"""
backend/app/core/config.py
Application-wide settings loaded from environment variables / .env file.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # ── Application ────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-in-production"

    # ── Database ───────────────────────────────────────────────────────────
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "brandguard_ai"
    DB_USER: str = ""
    DB_PASSWORD: str = ""

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
        """Build a SQLAlchemy-compatible MySQL connection URL."""
        if not self.DB_USER or not self.DB_PASSWORD:
            return ""
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def db_configured(self) -> bool:
        """True only when the minimum DB credentials are present."""
        return bool(self.DB_USER and self.DB_PASSWORD and self.DB_NAME)


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (reads .env once)."""
    return Settings()
