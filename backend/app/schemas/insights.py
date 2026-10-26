"""
backend/app/schemas/insights.py
Pydantic schemas for aggregated compliance statistics.
"""
from pydantic import BaseModel


class ViolationCategoryCount(BaseModel):
    category: str
    count: int


class ContentTypeCount(BaseModel):
    content_type: str
    count: int
    pass_count: int
    fail_count: int


class InsightsResponse(BaseModel):
    total_reviews: int
    passed_reviews: int
    failed_reviews: int
    pass_rate_percentage: float
    total_rules: int
    approved_rules: int
    draft_rules: int
    total_documents: int
    reviews_by_content_type: list[ContentTypeCount]
    top_violated_categories: list[ViolationCategoryCount]
    governance_health_status: str  # "Excellent" | "Moderate" | "Needs Attention" | "No Data"
