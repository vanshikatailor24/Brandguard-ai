"""
backend/app/services/image_service.py

Image review & compliance service for Brandguard AI.

Safety & Integrity:
  - Validates image dimensions, formats (PNG, JPG, WEBP), and file signatures via Pillow.
  - Checks for host OCR engine (pytesseract).
  - Explicitly separates extracted text findings from original image pixels.
  - Never claims to have visually edited or replaced image pixels without verification.
"""
from __future__ import annotations

import io
import os
import shutil
from typing import Any
from PIL import Image

MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB
ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


def is_tesseract_installed() -> bool:
    """Check if tesseract OCR executable is available on system PATH."""
    return shutil.which("tesseract") is not None


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


def extract_text_from_image(content: bytes) -> tuple[str, bool, str]:
    """
    Attempt to extract text from image bytes using OCR.
    Returns (extracted_text, ocr_available, status_message).
    """
    if not is_tesseract_installed():
        return (
            "",
            False,
            "Tesseract OCR executable is not installed on this host environment. "
            "You can enter or verify the copy text from your image in the review box below.",
        )

    try:
        import pytesseract  # type: ignore
        img = Image.open(io.BytesIO(content))
        text = pytesseract.image_to_string(img).strip()
        if not text:
            return (
                "",
                True,
                "OCR completed, but no readable text was detected in the image.",
            )
        return text, True, "Text extracted successfully via OCR."
    except Exception as exc:
        return (
            "",
            False,
            f"OCR text extraction failed: {exc}",
        )
