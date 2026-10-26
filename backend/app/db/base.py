"""
backend/app/db/base.py
Declarative base shared by all SQLAlchemy models.
Import this in every model file so they are all registered on the same metadata.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """All ORM models inherit from this class."""
    pass
