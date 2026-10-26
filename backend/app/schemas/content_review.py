"""
backend/app/schemas/content_review.py
Pydantic schemas for ContentReview requests, responses, findings, and corrections.
"""
from datetime import datetime
from pydantic import BaseModel, Field


# ── Request ────────────────────────────────────────────────────────────────────

class ReviewRequest(BaseModel):
    content_text: str = Field(
        ...,
        min_length=5,
        max_length=20_000,
        description="The text content to be reviewed.",
    )
    title: str | None = Field(
        None,
        description="Optional title or content identifier (e.g. 'Q4 Launch Email')",
    )
    content_type: str = Field(
        "general",
        description="general | social_post | email | press_release | blog_post | advertisement",
    )
    company_id: int | None = Field(
        None,
        description="Optional company ID to scope the review.",
    )


# ── Findings ───────────────────────────────────────────────────────────────────

class ReviewFinding(BaseModel):
    finding_id: str = ""
    rule_id: int | None = None
    rule_category: str
    rule_text: str
    finding_type: str = "violation"       # "violation" | "warning" | "info"
    severity: str = "warning"             # "critical" | "warning" | "info"
    matched_text: str | None = None
    start_index: int | None = None
    end_index: int | None = None
    reason: str
    applicable_rule: str = ""
    evidence: str = ""
    certainty: str = "certain"            # "certain" | "needs_review"
    requires_human_review: bool = False
    is_protected_conflict: bool = False
    suggestion: str | None = None


# ── Response ───────────────────────────────────────────────────────────────────

class ReviewResponse(BaseModel):
    id: int | None = None
    title: str | None = None
    content_text: str | None = None
    corrected_text: str | None = None
    content_type: str
    review_status: str                    # "pass" | "fail" | "no_rules"
    rules_checked: int
    violations_found: int
    findings: list[ReviewFinding]
    message: str = ""
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class ReviewListResponse(BaseModel):
    reviews: list[ReviewResponse]
    total: int
    message: str = ""


# ── Automatic Correction Schemas ───────────────────────────────────────────────

class CorrectionRequest(BaseModel):
    content_text: str = Field(..., min_length=1)
    findings: list[ReviewFinding] = Field(default_factory=list)
    company_id: int | None = None


class ProposedChangeSchema(BaseModel):
    change_id: str
    original_text: str
    proposed_text: str
    start_index: int | None = None
    end_index: int | None = None
    reason: str
    rule_id: int | None = None
    is_safe: bool = True
    blocked_reason: str | None = None


class CorrectionResponse(BaseModel):
    original_text: str
    proposed_text: str
    changes: list[ProposedChangeSchema]
    manual_guidance: list[str]
    protected_elements_guarded: list[str]
    has_changes: bool
