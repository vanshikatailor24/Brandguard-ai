"""
backend/app/models/__init__.py
Exports all SQLAlchemy models so they are discovered and registered on Base.metadata.
"""
from app.models.company import Company
from app.models.brand_rule import BrandRule
from app.models.content_review import ContentReview
from app.models.source_document import SourceDocument
from app.models.protected_element import ProtectedBrandElement
from app.models.user import User

__all__ = [
    "Company",
    "BrandRule",
    "ContentReview",
    "SourceDocument",
    "ProtectedBrandElement",
    "User",
]
