"""
backend/app/api/routes/rules.py
REST API endpoints for Brand Guidelines & Rule Management.

Supports:
  - List rules (with filters for category and approval status)
  - Create new brand rule
  - Get single rule
  - Update rule (with safety guards for protected rules)
  - Approve / Reject rule
  - Delete rule
"""
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.brand_rule import BrandRule
from app.schemas.brand_rule import (
    BrandRuleCreate,
    BrandRuleUpdate,
    BrandRuleOut,
    BrandRuleListResponse,
)

router = APIRouter(tags=["Rules"])


@router.get("/rules", response_model=BrandRuleListResponse)
def list_rules(
    company_id: int | None = Query(None, description="Filter by company ID"),
    category: str | None = Query(None, description="Filter by category"),
    approved_only: bool = Query(False, description="When True, return only approved rules"),
    db: Session = Depends(get_db),
):
    """
    List brand rules.
    Only approved rules are authoritative for compliance checking.
    """
    try:
        query = db.query(BrandRule)
        if company_id is not None:
            query = query.filter(BrandRule.company_id == company_id)
        if category:
            query = query.filter(BrandRule.category == category)
        if approved_only:
            query = query.filter(BrandRule.is_approved.is_(True))

        rules = query.order_by(BrandRule.created_at.desc()).all()
        return BrandRuleListResponse(
            rules=[BrandRuleOut.model_validate(r) for r in rules],
            total=len(rules),
            message="Rules retrieved successfully." if rules else "No rules found.",
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.post("/rules", response_model=BrandRuleOut, status_code=status.HTTP_201_CREATED)
def create_rule(payload: BrandRuleCreate, db: Session = Depends(get_db)):
    """Create a new brand rule."""
    try:
        rule = BrandRule(
            company_id=payload.company_id,
            category=payload.category,
            rule_text=payload.rule_text.strip(),
            description=payload.description.strip() if payload.description else None,
            severity=payload.severity,
            is_approved=payload.is_approved,
            is_protected=payload.is_protected,
            source_document_id=payload.source_document_id,
            source_excerpt=payload.source_excerpt,
        )
        db.add(rule)
        db.commit()
        db.refresh(rule)
        return BrandRuleOut.model_validate(rule)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.get("/rules/{rule_id}", response_model=BrandRuleOut)
def get_rule(rule_id: int, db: Session = Depends(get_db)):
    """Fetch details of a specific brand rule."""
    try:
        rule = db.query(BrandRule).filter(BrandRule.id == rule_id).first()
        if not rule:
            raise HTTPException(status_code=404, detail=f"Rule #{rule_id} not found.")
        return BrandRuleOut.model_validate(rule)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.patch("/rules/{rule_id}", response_model=BrandRuleOut)
def update_rule(rule_id: int, payload: BrandRuleUpdate, db: Session = Depends(get_db)):
    """
    Update an existing brand rule.
    Protected approved rules cannot be altered without explicit authorization.
    """
    try:
        rule = db.query(BrandRule).filter(BrandRule.id == rule_id).first()
        if not rule:
            raise HTTPException(status_code=404, detail=f"Rule #{rule_id} not found.")

        # Guard protected rules
        if rule.is_protected and payload.rule_text and payload.rule_text != rule.rule_text:
            raise HTTPException(
                status_code=400,
                detail=f"Rule #{rule_id} is marked as protected brand identity. Its core wording cannot be modified directly.",
            )

        if payload.category is not None:
            rule.category = payload.category
        if payload.rule_text is not None:
            rule.rule_text = payload.rule_text.strip()
        if payload.description is not None:
            rule.description = payload.description.strip() if payload.description else None
        if payload.severity is not None:
            rule.severity = payload.severity
        if payload.is_approved is not None:
            rule.is_approved = payload.is_approved
        if payload.is_protected is not None:
            rule.is_protected = payload.is_protected

        db.commit()
        db.refresh(rule)
        return BrandRuleOut.model_validate(rule)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.post("/rules/{rule_id}/approve", response_model=BrandRuleOut)
def toggle_approval(rule_id: int, approved: bool = Query(True), db: Session = Depends(get_db)):
    """Approve or unapprove a brand rule."""
    try:
        rule = db.query(BrandRule).filter(BrandRule.id == rule_id).first()
        if not rule:
            raise HTTPException(status_code=404, detail=f"Rule #{rule_id} not found.")
        rule.is_approved = approved
        db.commit()
        db.refresh(rule)
        return BrandRuleOut.model_validate(rule)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    """Delete a brand rule."""
    try:
        rule = db.query(BrandRule).filter(BrandRule.id == rule_id).first()
        if not rule:
            raise HTTPException(status_code=404, detail=f"Rule #{rule_id} not found.")
        if rule.is_protected:
            raise HTTPException(
                status_code=400,
                detail=f"Rule #{rule_id} is a protected brand element and cannot be deleted.",
            )
        db.delete(rule)
        db.commit()
        return None
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
