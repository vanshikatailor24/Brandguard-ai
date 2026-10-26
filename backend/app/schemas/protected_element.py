"""
backend/app/schemas/protected_element.py
Pydantic schemas for protected brand assets and factual elements.
"""
from datetime import datetime
from pydantic import BaseModel, Field


class ProtectedElementCreate(BaseModel):
    element_type: str = Field(
        ...,
        description="brand_name | product_name | slogan | legal_disclaimer | product_spec",
    )
    canonical_text: str = Field(..., min_length=2)
    forbidden_variations: str | None = None
    description: str | None = None
    is_active: bool = True
    company_id: int | None = None


class ProtectedElementOut(BaseModel):
    id: int
    company_id: int | None = None
    element_type: str
    canonical_text: str
    forbidden_variations: str | None = None
    description: str | None = None
    is_active: bool
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class ProtectedElementListResponse(BaseModel):
    elements: list[ProtectedElementOut]
    total: int
