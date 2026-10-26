"""
backend/app/schemas/company.py
Pydantic schemas for Company onboarding and profile management.
"""
import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class CompanyOnboardRequest(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=200)
    industry_type: str = Field(..., min_length=2, max_length=100)
    custom_industry: Optional[str] = Field(None, max_length=100)
    tagline: Optional[str] = Field(None, max_length=255)
    user_email: Optional[str] = None


class CompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    industry: Optional[str] = None
    industry_type: Optional[str] = None
    custom_industry: Optional[str] = None
    tagline: Optional[str] = None
    created_at: Optional[datetime.datetime] = None



class CompanyOnboardResponse(BaseModel):
    success: bool = True
    company: CompanyResponse
    message: str = "Company onboarding completed successfully."
