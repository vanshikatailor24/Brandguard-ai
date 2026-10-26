"""
backend/app/schemas/document.py
Pydantic schemas for policy & brand documents and candidate rule extraction.
"""
from datetime import datetime
from pydantic import BaseModel


class CandidateRuleOut(BaseModel):
    category: str
    rule_text: str
    description: str | None = None
    severity: str = "warning"
    source_excerpt: str = ""
    is_approved: bool = False


class SourceDocumentOut(BaseModel):
    id: int
    company_id: int | None = None
    filename: str
    file_type: str
    file_size: int
    processing_status: str
    error_message: str | None = None
    rules_extracted_count: int = 0
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class DocumentUploadResponse(BaseModel):
    document: SourceDocumentOut
    candidate_rules: list[CandidateRuleOut]
    message: str = ""


class DocumentListResponse(BaseModel):
    documents: list[SourceDocumentOut]
    total: int
