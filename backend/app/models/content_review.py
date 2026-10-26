"""
backend/app/models/content_review.py
SQLAlchemy ORM model for ContentReview.

review_status values:
  - pass     : no violations found
  - fail     : one or more violations found
  - no_rules : no approved rules exist — content could not be checked
"""
import datetime
from sqlalchemy import String, Text, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class ContentReview(Base):
    __tablename__ = "content_reviews"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    company_id: Mapped[int | None] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=True, index=True
    )
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    content_text: Mapped[str] = mapped_column(Text, nullable=False)
    corrected_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="general"
    )  # e.g. social_post, email, press_release, general
    review_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="no_rules"
    )
    findings_json: Mapped[str] = mapped_column(
        Text, nullable=True
    )  # JSON string of ReviewFinding list
    rules_checked: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    violations_found: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    # Relationship back to Company (nullable — allows anonymous reviews)
    company: Mapped["Company"] = relationship(  # noqa: F821
        "Company", back_populates="reviews"
    )

    def __repr__(self) -> str:
        return (
            f"<ContentReview id={self.id} status={self.review_status!r} "
            f"violations={self.violations_found}>"
        )
