"""
backend/app/services/image_service.py

Image review & compliance service for Brandguard AI.

Safety & Integrity:
  - Validates image dimensions, formats (PNG, JPG, WEBP), and file signatures via Pillow.
  - Multi-tier OCR pipeline (Tesseract, Gemini/OpenAI Vision AI, Metadata, and Heuristics).
  - Explicitly separates extracted text findings from original image pixels.
  - Never claims to have visually edited or replaced image pixels without verification.
"""
from __future__ import annotations

import io
import os
from typing import Any
from PIL import Image

from app.services.ocr_service import (
    is_tesseract_installed,
    extract_text_from_image_bytes,
    get_active_ocr_engine_info,
)

MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB
ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


def validate_image_file(filename: str, content: bytes) -> tuple[bool, str, dict[str, Any]]:
    """
    Validate image file extension, size, and header integrity via Pillow.
    Returns (is_valid, error_message, metadata).
    """
    if not filename:
        return False, "Filename cannot be empty.", {}

    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        return False, f"Unsupported image format '{ext}'. Allowed: .png, .jpg, .jpeg, .webp.", {}

    if len(content) == 0:
        return False, "Image file is empty (0 bytes).", {}

    if len(content) > MAX_IMAGE_SIZE_BYTES:
        return False, f"Image exceeds maximum allowed size of 10MB ({len(content)} bytes).", {}

    try:
        img = Image.open(io.BytesIO(content))
        img.verify()  # verify integrity
        # Re-open for metadata reading since verify() closes/invalidates the stream
        img = Image.open(io.BytesIO(content))
        metadata = {
            "format": img.format,
            "width": img.width,
            "height": img.height,
            "mode": img.mode,
            "size_bytes": len(content),
        }
        return True, "", metadata
    except Exception as exc:
        return False, f"Invalid or corrupted image file: {exc}", {}


def extract_text_from_image(content: bytes, filename: str = "image.png") -> tuple[str, bool, str, str]:
    """
    Extract text from image bytes using the 4-tier OCR pipeline:
      Tier 1: Tesseract OCR (if binary installed)
      Tier 2: Multi-Modal Vision AI (Gemini / OpenAI if keys provided)
      Tier 3: Embedded Image Metadata & Text Chunks (PNG/EXIF)
      Tier 4: Automated Heuristic Vision Engine Fallback

    Returns:
      (extracted_text, ocr_available, status_message, ocr_engine)
    """
    res = extract_text_from_image_bytes(content, filename)
    return (
        res["text"],
        res["ocr_available"],
        res["status_message"],
        res["ocr_engine"],
    )
