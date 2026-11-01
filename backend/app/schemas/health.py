"""
backend/app/schemas/health.py
Pydantic schema for system health check endpoints.
"""
from typing import Any
from pydantic import BaseModel, Field


class DatabaseStatus(BaseModel):
    status: str = Field(..., description="Database connection status: 'connected' | 'not_configured' | 'error'")
    message: str = Field(..., description="Detailed status message")
    engine: str = Field("sqlite", description="Active storage dialect (sqlite, postgresql, or mysql)")


class HealthResponse(BaseModel):
    application: str = Field("ok", description="FastAPI core service status")
    version: str = Field("1.0.0", description="API version")
    project: str = Field("Brandguard AI", description="Project identity")
    team: str = Field("Brandguard AI", description="Team identifier")
    environment: str = Field("production", description="Active runtime environment")
    database: dict[str, Any] = Field(..., description="Database connectivity details")
