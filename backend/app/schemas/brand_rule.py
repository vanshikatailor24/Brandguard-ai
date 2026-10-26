"""
backend/app/schemas/brand_rule.py
Pydantic schemas for BrandRule CRUD and list responses.
"""
from datetime import datetime
from pydantic import BaseModel, Field


class BrandRuleBase(BaseModel):
    category: str = Field(
        ...,
        description="prohibited_phrase | required_phrase | required_disclaimer | brand_terminology",
    )
    rule_text: str = Field(..., min_length=2, description="The core rule text or phrase")
    description: str | None = Field(
        None, description="Detailed guidance or comma-separated variants for brand_terminology"
    )
    severity: str = Field(
        "warning", description="critical | warning | info"
    )
    company_id: int | None = None


class BrandRuleCreate(BrandRuleBase):
    is_approved: bool = Field(False, description="Whether rule is immediately approved")
    is_protected: bool = Field(False, description="Whether rule protects a core brand asset")
    source_document_id: int | None = None
    source_excerpt: str | None = None


class BrandRuleUpdate(BaseModel):
    category: str | None = None
    rule_text: str | None = None
    description: str | None = None
    severity: str | None = None
    is_approved: bool | None = None
    is_protected: bool | None = None


class BrandRuleOut(BaseModel):
    id: int
    company_id: int | None = None
    category: str
    rule_text: str
    description: str | None = None
    severity: str = "warning"
    is_approved: bool
    is_protected: bool = False
    source_document_id: int | None = None
    source_excerpt: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class BrandRuleListResponse(BaseModel):
    rules: list[BrandRuleOut]
    total: int
    message: str = ""
