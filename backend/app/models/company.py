"""
backend/app/models/company.py
SQLAlchemy ORM model for Company.
"""
import datetime
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    industry: Mapped[str] = mapped_column(String(100), nullable=True)
    industry_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    custom_industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tagline: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    users: Mapped[list["User"]] = relationship(  # noqa: F821
        "User", back_populates="company"
    )
    brand_rules: Mapped[list["BrandRule"]] = relationship(  # noqa: F821
        "BrandRule", back_populates="company", cascade="all, delete-orphan"
    )
    reviews: Mapped[list["ContentReview"]] = relationship(  # noqa: F821
        "ContentReview", back_populates="company", cascade="all, delete-orphan"
    )
    documents: Mapped[list["SourceDocument"]] = relationship(  # noqa: F821
        "SourceDocument", back_populates="company", cascade="all, delete-orphan"
    )
    protected_elements: Mapped[list["ProtectedBrandElement"]] = relationship(  # noqa: F821
        "ProtectedBrandElement", back_populates="company", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Company id={self.id} name={self.name!r}>"

