"""
backend/app/models/brand_rule.py
SQLAlchemy ORM model for BrandRule.

Rule categories supported by the deterministic review engine:
  - prohibited_phrase   : text that must NOT appear
  - required_phrase     : text that MUST appear
  - required_disclaimer : a specific disclaimer that must be present
  - brand_terminology   : the approved term that must be used instead of variants
"""
import datetime
from sqlalchemy import String, Text, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class BrandRule(Base):
    __tablename__ = "brand_rules"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    company_id: Mapped[int | None] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=True, index=True
    )
    category: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # prohibited_phrase, required_phrase, required_disclaimer, brand_terminology
    rule_text: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity: Mapped[str] = mapped_column(
        String(20), default="warning", nullable=False
    )  # critical, warning, info
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_protected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    source_document_id: Mapped[int | None] = mapped_column(
        ForeignKey("source_documents.id", ondelete="SET NULL"), nullable=True, index=True
    )
    source_excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    company: Mapped["Company | None"] = relationship(  # noqa: F821
        "Company", back_populates="brand_rules"
    )
    source_document: Mapped["SourceDocument | None"] = relationship(  # noqa: F821
        "SourceDocument", back_populates="rules"
    )

    def __repr__(self) -> str:
        approved = "✓" if self.is_approved else "draft"
        return f"<BrandRule id={self.id} category={self.category!r} [{approved}]>"
