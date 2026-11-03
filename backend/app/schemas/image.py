"""
backend/app/schemas/image.py
Pydantic schemas for Image upload, OCR extraction, and brand compliance review.
"""
from typing import Optional, Any
from pydantic import BaseModel, Field


class ImageMetadata(BaseModel):
    format: Optional[str] = Field(None, description="Image format, e.g. PNG, JPEG, WEBP")
    width: Optional[int] = Field(None, description="Image width in pixels")
    height: Optional[int] = Field(None, description="Image height in pixels")
    mode: Optional[str] = Field(None, description="Color channel mode (RGB, RGBA, L)")
    size_bytes: int = Field(..., description="File size in bytes")


class ImageReviewSummary(BaseModel):
    review_status: str = Field(..., description="Compliance status: 'pass' | 'fail' | 'no_rules'")
    rules_checked: int = Field(..., description="Total approved rules evaluated")
    violations_found: int = Field(..., description="Count of violations found in extracted copy")
    message: str = Field(..., description="Human-readable review summary")
    findings: list[dict[str, Any]] = Field(default_factory=list, description="Detailed violation findings")


class ImageReviewResponse(BaseModel):
    filename: str = Field(..., description="Original image filename")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Image technical metadata")
    ocr_engine_available: bool = Field(..., description="Whether host OCR engine is active")
    ocr_status_message: str = Field(..., description="Status of OCR text extraction")
    ocr_engine: str = Field("Automated OCR", description="Name of OCR engine or fallback used")
    extracted_text: str = Field("", description="Raw copy extracted from image via OCR")
    transcript: str = Field("", description="Extracted copy transcript for frontend form mapping")
    effective_text_reviewed: str = Field("", description="Effective text reviewed against brand rules")
    review: Optional[ImageReviewSummary] = Field(None, description="Compliance review results")
    notice: str = Field(..., description="Governance note on original pixel preservation")


class ImageScanResponse(BaseModel):
    filename: str = Field(..., description="Original image filename")
    extracted_text: str = Field("", description="Raw copy extracted from image via OCR")
    transcript: str = Field("", description="Extracted copy transcript for frontend form mapping")
    ocr_engine: str = Field("Automated OCR", description="Name of OCR engine or fallback used")
    ocr_available: bool = Field(True, description="Whether automated OCR successfully ran")
    ocr_status_message: str = Field("", description="Status message of OCR text extraction")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Image technical metadata")
