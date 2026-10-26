"""
backend/app/models/source_document.py
SQLAlchemy ORM model for SourceDocument (policy guides, brand books, guidelines).
"""
import datetime
from sqlalchemy import String, Text, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class SourceDocument(Base):
    __tablename__ = "source_documents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    company_id: Mapped[int | None] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=True, index=True
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(20), nullable=False)  # pdf, docx, txt
    file_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    content_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    processing_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="uploaded"
    )  # uploaded, processing, completed, failed
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    rules_extracted_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="documents")  # noqa: F821
    rules: Mapped[list["BrandRule"]] = relationship(  # noqa: F821
        "BrandRule", back_populates="source_document", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<SourceDocument id={self.id} filename={self.filename!r} status={self.processing_status!r}>"
