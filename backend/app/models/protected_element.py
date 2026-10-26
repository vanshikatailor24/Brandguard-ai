"""
backend/app/models/protected_element.py
SQLAlchemy ORM model for ProtectedBrandElement (protected names, logos, slogans, disclaimers, specs).
"""
import datetime
from sqlalchemy import String, Text, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class ProtectedBrandElement(Base):
    __tablename__ = "protected_elements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    company_id: Mapped[int | None] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=True, index=True
    )
    element_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # brand_name, product_name, slogan, legal_disclaimer, product_spec
    canonical_text: Mapped[str] = mapped_column(String(255), nullable=False)
    forbidden_variations: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    company: Mapped["Company"] = relationship("Company", back_populates="protected_elements")  # noqa: F821

    def __repr__(self) -> str:
        return f"<ProtectedBrandElement id={self.id} type={self.element_type!r} canonical={self.canonical_text!r}>"
