"""
backend/app/api/routes/insights.py
REST API endpoints for Brand Governance Insights & Real Stored Analytics.

Calculates real statistics from actual stored reviews and rules without fabricated metrics.
"""
import json
from collections import Counter, defaultdict
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.content_review import ContentReview
from app.models.brand_rule import BrandRule
from app.models.source_document import SourceDocument
from app.schemas.insights import (
    InsightsResponse,
    ContentTypeCount,
    ViolationCategoryCount,
)

router = APIRouter(tags=["Insights"])


@router.get("/insights", response_model=InsightsResponse)
def get_governance_insights(
    company_id: int | None = Query(None, description="Filter by company ID"),
    db: Session = Depends(get_db),
):
    """
    Calculate and return real governance metrics derived from database records.
    Returns honest empty states when no data exists.
    """
    try:
        # 1. Rules breakdown
        rules_query = db.query(BrandRule)
        if company_id is not None:
            rules_query = rules_query.filter(BrandRule.company_id == company_id)
        all_rules = rules_query.all()
        total_rules = len(all_rules)
        approved_rules = sum(1 for r in all_rules if r.is_approved)
        draft_rules = total_rules - approved_rules

        # 2. Documents count
        docs_query = db.query(SourceDocument)
        if company_id is not None:
            docs_query = docs_query.filter(SourceDocument.company_id == company_id)
        total_documents = docs_query.count()

        # 3. Reviews breakdown
        rev_query = db.query(ContentReview)
        if company_id is not None:
            rev_query = rev_query.filter(ContentReview.company_id == company_id)
        reviews = rev_query.all()
        total_reviews = len(reviews)
        passed_reviews = sum(1 for r in reviews if r.review_status == "pass")
        failed_reviews = sum(1 for r in reviews if r.review_status == "fail")

        pass_rate = round((passed_reviews / total_reviews * 100), 1) if total_reviews > 0 else 0.0

        # Health status
        if total_reviews == 0:
            health_status = "No Data"
        elif pass_rate >= 80:
            health_status = "Excellent"
        elif pass_rate >= 50:
            health_status = "Moderate"
        else:
            health_status = "Needs Attention"

        # Content type breakdown
        type_stats = defaultdict(lambda: {"count": 0, "pass": 0, "fail": 0})
        category_counter = Counter()

        for r in reviews:
            c_type = r.content_type or "general"
            type_stats[c_type]["count"] += 1
            if r.review_status == "pass":
                type_stats[c_type]["pass"] += 1
            elif r.review_status == "fail":
                type_stats[c_type]["fail"] += 1

            if r.findings_json:
                try:
                    findings = json.loads(r.findings_json)
                    for f in findings:
                        cat = f.get("rule_category")
                        if cat:
                            category_counter[cat] += 1
                except Exception:
                    pass

        content_type_list = [
            ContentTypeCount(
                content_type=k,
                count=v["count"],
                pass_count=v["pass"],
                fail_count=v["fail"],
            )
            for k, v in type_stats.items()
        ]

        top_categories = [
            ViolationCategoryCount(category=k, count=v)
            for k, v in category_counter.most_common(5)
        ]

        return InsightsResponse(
            total_reviews=total_reviews,
            passed_reviews=passed_reviews,
            failed_reviews=failed_reviews,
            pass_rate_percentage=pass_rate,
            total_rules=total_rules,
            approved_rules=approved_rules,
            draft_rules=draft_rules,
            total_documents=total_documents,
            reviews_by_content_type=content_type_list,
            top_violated_categories=top_categories,
            governance_health_status=health_status,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
