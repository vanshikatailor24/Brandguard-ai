"""
backend/app/api/routes/reviews.py
REST API endpoints for Content Review, Review History, and Automatic Text Correction.

Supports:
  - Submit content for brand governance review (deterministic + contextual heuristics + AI fallback)
  - List review history
  - Get single review details
  - "Fix It for Me": Generate automatic correction suggestions & diffs
  - Accept and persist corrected version
"""
import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db, check_db_connection
from app.models.brand_rule import BrandRule
from app.models.content_review import ContentReview
from app.models.protected_element import ProtectedBrandElement
from app.schemas.content_review import (
    ReviewRequest,
    ReviewResponse,
    ReviewListResponse,
    ReviewFinding,
    CorrectionRequest,
    CorrectionResponse,
    ProposedChangeSchema,
)
from app.services.review_engine import run_review
from app.services.correction_engine import generate_correction
from app.services.ai_service import analyze_tone_nuance_with_ai

router = APIRouter(tags=["Reviews"])


def _build_review_response(review: ContentReview) -> ReviewResponse:
    """Convert an ORM ContentReview to a ReviewResponse Pydantic model."""
    findings: list[ReviewFinding] = []
    if review.findings_json:
        try:
            raw = json.loads(review.findings_json)
            findings = [ReviewFinding(**f) for f in raw]
        except (json.JSONDecodeError, TypeError):
            pass

    return ReviewResponse(
        id=review.id,
        title=review.title or f"Review #{review.id}",
        content_text=review.content_text,
        corrected_text=review.corrected_text,
        content_type=review.content_type,
        review_status=review.review_status,
        rules_checked=review.rules_checked,
        violations_found=review.violations_found,
        findings=findings,
        message="",
        created_at=review.created_at,
    )


@router.get("/reviews", response_model=ReviewListResponse)
@router.get("/v1/reviews", response_model=ReviewListResponse)
def list_reviews(
    company_id: int | None = Query(None, description="Filter by company ID"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Return saved content reviews (newest first)."""
    try:
        query = db.query(ContentReview)
        if company_id is not None:
            query = query.filter(ContentReview.company_id == company_id)
        reviews = query.order_by(ContentReview.created_at.desc()).limit(limit).all()
        return ReviewListResponse(
            reviews=[_build_review_response(r) for r in reviews],
            total=len(reviews),
            message="Reviews retrieved successfully." if reviews else "No reviews yet.",
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.post("/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
@router.post("/v1/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_review(payload: ReviewRequest, db: Session = Depends(get_db)):
    """
    Submit text content for brand-rule review.
    Evaluates against all approved brand rules for the company.
    Includes zero-crash LLM tone assistance fallback integration.
    """
    clean_text = payload.content_text.strip() if payload.content_text else ""
    if not clean_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Content text cannot be empty.",
        )
    if len(clean_text) > 100_000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Content text exceeds maximum permitted length (100,000 characters).",
        )

    try:
        # Fetch only approved rules
        query = db.query(BrandRule).filter(BrandRule.is_approved.is_(True))
        if payload.company_id is not None:
            query = query.filter(BrandRule.company_id == payload.company_id)
        approved_rules = query.all()

        # Run deterministic review engine + contextual heuristics
        result = run_review(clean_text, approved_rules)

        # Convert findings to dictionary for storage and response
        findings_data = [
            {
                "finding_id": f.finding_id,
                "rule_id": f.rule_id,
                "rule_category": f.rule_category,
                "rule_text": f.rule_text,
                "finding_type": f.finding_type,
                "severity": f.severity,
                "matched_text": f.matched_text,
                "start_index": f.start_index,
                "end_index": f.end_index,
                "reason": f.reason,
                "applicable_rule": f.applicable_rule,
                "evidence": f.evidence,
                "certainty": f.certainty,
                "requires_human_review": f.requires_human_review,
                "is_protected_conflict": f.is_protected_conflict,
                "suggestion": f.suggestion,
            }
            for f in result.findings
        ]

        # Seamless AI tone & nuance evaluation (zero-crash fallback guaranteed)
        rules_context = [r.rule_text for r in approved_rules]
        ai_eval = analyze_tone_nuance_with_ai(clean_text, rules_context)
        if ai_eval.get("ai_applied") and ai_eval.get("tone_analysis"):
            findings_data.append(
                {
                    "finding_id": f"fnd-ai-{len(findings_data) + 1}",
                    "rule_id": None,
                    "rule_category": "ai_tone_nuance",
                    "rule_text": "Contextual Tone Evaluation",
                    "finding_type": "info",
                    "severity": "info",
                    "matched_text": None,
                    "start_index": None,
                    "end_index": None,
                    "reason": f"AI Governance Insight ({ai_eval.get('provider')}): {ai_eval.get('tone_analysis')}",
                    "applicable_rule": "Brand Tone & Clarity Standard",
                    "evidence": f"Evaluated with {ai_eval.get('provider')} ({ai_eval.get('model')})",
                    "certainty": "needs_review",
                    "requires_human_review": True,
                    "is_protected_conflict": False,
                    "suggestion": "Review suggested tone adjustments if appropriate.",
                }
            )

        title = payload.title or clean_text[:40].replace("\n", " ") + "..."

        db_review = ContentReview(
            company_id=payload.company_id,
            title=title,
            content_text=clean_text,
            content_type=payload.content_type,
            review_status=result.review_status,
            findings_json=json.dumps(findings_data),
            rules_checked=result.rules_checked,
            violations_found=result.violations_found,
            created_at=datetime.datetime.now(datetime.timezone.utc),
        )
        db.add(db_review)
        db.commit()
        db.refresh(db_review)

        return ReviewResponse(
            id=db_review.id,
            title=db_review.title,
            content_text=db_review.content_text,
            corrected_text=db_review.corrected_text,
            content_type=db_review.content_type,
            review_status=result.review_status,
            rules_checked=result.rules_checked,
            violations_found=result.violations_found,
            findings=[ReviewFinding(**f) for f in findings_data],
            message=result.message,
            created_at=db_review.created_at,
        )
    except HTTPException:
        raise
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Review execution error: {exc}")


@router.get("/reviews/{review_id}", response_model=ReviewResponse)
@router.get("/v1/reviews/{review_id}", response_model=ReviewResponse)
def get_review(review_id: int, db: Session = Depends(get_db)):
    """Fetch details of a past content review."""
    try:
        review = db.query(ContentReview).filter(ContentReview.id == review_id).first()
        if not review:
            raise HTTPException(status_code=404, detail=f"Review #{review_id} not found.")
        return _build_review_response(review)
    except HTTPException:
        raise
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.post("/reviews/correct", response_model=CorrectionResponse)
@router.post("/v1/reviews/correct", response_model=CorrectionResponse)
def auto_correct_content(payload: CorrectionRequest, db: Session = Depends(get_db)):
    """
    'Fix It for Me' — Generate proposed automatic text corrections for findings.
    Safely preserves protected brand assets, prices, numbers, and facts.
    """
    try:
        # Load protected elements for safety check
        query = db.query(ProtectedBrandElement).filter(ProtectedBrandElement.is_active.is_(True))
        if payload.company_id is not None:
            query = query.filter(ProtectedBrandElement.company_id == payload.company_id)
        protected_elements = query.all()

        result = generate_correction(
            original_text=payload.content_text,
            findings=payload.findings,
            protected_elements=protected_elements,
        )

        return CorrectionResponse(
            original_text=result.original_text,
            proposed_text=result.proposed_text,
            changes=[
                ProposedChangeSchema(
                    change_id=c.change_id,
                    original_text=c.original_text,
                    proposed_text=c.proposed_text,
                    start_index=c.start_index,
                    end_index=c.end_index,
                    reason=c.reason,
                    rule_id=c.rule_id,
                    is_safe=c.is_safe,
                    blocked_reason=c.blocked_reason,
                )
                for c in result.changes
            ],
            manual_guidance=result.manual_guidance,
            protected_elements_guarded=result.protected_elements_guarded,
            has_changes=result.has_changes,
        )
    except HTTPException:
        raise
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.post("/reviews/{review_id}/accept", response_model=ReviewResponse)
@router.post("/v1/reviews/{review_id}/accept", response_model=ReviewResponse)
def accept_correction(
    review_id: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    """
    Persist user-accepted corrected content to the review audit trail.
    """
    try:
        review = db.query(ContentReview).filter(ContentReview.id == review_id).first()
        if not review:
            raise HTTPException(status_code=404, detail=f"Review #{review_id} not found.")

        corrected = payload.get("corrected_text")
        if corrected:
            review.corrected_text = corrected
            db.commit()
            db.refresh(review)

        return _build_review_response(review)
    except HTTPException:
        raise
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
