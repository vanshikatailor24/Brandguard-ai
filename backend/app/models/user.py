"""
backend/app/models/user.py
SQLAlchemy ORM model for User authentication and role management.
"""
import datetime
from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="judge", nullable=False)  # judge | admin | user
    company_id: Mapped[int | None] = mapped_column(ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    company: Mapped["Company | None"] = relationship("Company", back_populates="users")  # noqa: F821

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r} role={self.role!r} company_id={self.company_id}>"

