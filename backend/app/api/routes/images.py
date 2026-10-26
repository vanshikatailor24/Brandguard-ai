"""
backend/app/api/routes/images.py
REST API endpoints for Image Upload, Text Extraction (OCR), and Brand Rule Compliance Review.

Safety:
  - Validates image dimensions, formats (PNG, JPG, WEBP), and header integrity via Pillow.
  - Distinguishes extracted text findings from original image pixels.
  - Never claims to have visually edited or replaced image pixels without verification.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.brand_rule import BrandRule
from app.schemas.content_review import ReviewResponse, ReviewFinding
from app.services.image_service import (
    validate_image_file,
    extract_text_from_image,
    is_tesseract_installed,
)
from app.services.review_engine import run_review

router = APIRouter(tags=["Images"])


@router.post("/images/review")
async def review_image_content(
    file: UploadFile = File(...),
    manual_transcript: str | None = Form(None),
    company_id: int | None = Form(None),
    db: Session = Depends(get_db),
):
    """
    Review image text against approved brand guidelines.
    Extracts text using OCR if installed or uses the provided image transcript.
    """
    try:
        content = await file.read()
        filename = file.filename or "image.png"

        # 1. Validate image
        is_valid, err_msg, meta = validate_image_file(filename, content)
        if not is_valid:
            raise HTTPException(status_code=400, detail=err_msg)

        # 2. Extract text (OCR)
        ocr_text, ocr_available, ocr_msg = extract_text_from_image(content)

        # Determine effective text for brand review
        effective_text = (manual_transcript or "").strip()
        if not effective_text and ocr_text:
            effective_text = ocr_text

        # 3. Check against approved rules if text is available
        review_data = None
        if effective_text:
            query = db.query(BrandRule).filter(BrandRule.is_approved.is_(True))
            if company_id is not None:
                query = query.filter(BrandRule.company_id == company_id)
            approved_rules = query.all()

            result = run_review(effective_text, approved_rules)
            review_data = {
                "review_status": result.review_status,
                "rules_checked": result.rules_checked,
                "violations_found": result.violations_found,
                "message": result.message,
                "findings": [
                    {
                        "finding_id": f.finding_id,
                        "rule_id": f.rule_id,
                        "rule_category": f.rule_category,
                        "rule_text": f.rule_text,
                        "finding_type": f.finding_type,
                        "severity": f.severity,
                        "matched_text": f.matched_text,
                        "reason": f.reason,
                        "applicable_rule": f.applicable_rule,
                        "evidence": f.evidence,
                        "certainty": f.certainty,
                        "suggestion": f.suggestion,
                    }
                    for f in result.findings
                ],
            }

        return {
            "filename": filename,
            "metadata": meta,
            "ocr_engine_available": ocr_available,
            "ocr_status_message": ocr_msg,
            "extracted_text": ocr_text,
            "effective_text_reviewed": effective_text,
            "review": review_data,
            "notice": (
                "Findings apply to extracted copy only. Original image graphics, colors, "
                "and logos are preserved without alteration. Apply recommended text updates "
                "in your graphics editor."
            ),
        }
    except HTTPException:
        raise
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Image processing error: {exc}")
