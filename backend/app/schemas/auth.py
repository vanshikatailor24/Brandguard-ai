"""
backend/app/schemas/auth.py
Pydantic schemas for User login, signup, and authentication responses.
"""
import datetime
from typing import Optional
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
    password: str


class SignUpRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=4, max_length=128)


class CompanyBrief(BaseModel):
    id: int
    name: str
    industry: Optional[str] = None
    industry_type: Optional[str] = None
    custom_industry: Optional[str] = None
    tagline: Optional[str] = None


class UserResponse(BaseModel):
    id: int | None = None
    email: str
    full_name: str | None = None
    role: str = "judge"
    name: str = "Demo Judge"

    company_id: int | None = None
    company: Optional[CompanyBrief] = None
    has_completed_onboarding: bool = False


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    message: str = "Authentication successful."


class UserProfileResponse(BaseModel):
    id: int | None = None
    email: str
    full_name: str | None = None
    name: str = "User"
    role: str = "judge"
    created_at: Optional[datetime.datetime] = None
    company: Optional[CompanyBrief] = None
    has_completed_onboarding: bool = False

