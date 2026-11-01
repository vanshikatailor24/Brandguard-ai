"""
backend/app/api/deps.py

Role-Based Access Control (RBAC) & Authentication Dependencies for Brandguard AI.
Enforces role boundaries (Admin, Judge, Editor/User) across protected routes.
"""
from typing import Optional, Callable
from pydantic import BaseModel
from fastapi import Header, Query, HTTPException, status, Depends
from sqlalchemy.orm import Session

from app.db.session import _SessionLocal, settings
from app.models.user import User


class AuthUser(BaseModel):
    id: int
    email: str
    full_name: str
    role: str  # "admin" | "judge" | "editor" | "user" | "guest"
    company_id: Optional[int] = None


DEMO_EMAILS = {"judge@brandguard.ai"}


def get_current_user(
    authorization: Optional[str] = Header(None),
    x_user_email: Optional[str] = Header(None),
    email: Optional[str] = Query(None),
) -> AuthUser:
    """
    Extract current authenticated user and role from Bearer token or email identifier.
    Gracefully handles demo judge session, token-based sessions, and offline sessions.
    """
    token = None
    if authorization:
        parts = authorization.strip().split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
        elif len(parts) == 1:
            token = parts[0]

    target_email = (x_user_email or email or "").strip().lower()

    # 1. Check for Demo Judge Access
    if (token and "demo-token" in token.lower()) or (target_email in DEMO_EMAILS):
        return AuthUser(
            id=1,
            email=target_email or "judge@brandguard.ai",
            full_name="Demo Judge",
            role="judge",
            company_id=1,
        )

    # 2. Check Database if configured
    if _SessionLocal is not None and settings.db_configured:
        try:
            with _SessionLocal() as db:
                user = None
                if target_email:
                    user = db.query(User).filter(User.email == target_email).first()
                if user:
                    return AuthUser(
                        id=user.id,
                        email=user.email,
                        full_name=user.full_name or user.email.split("@")[0].capitalize(),
                        role=user.role or "user",
                        company_id=user.company_id,
                    )
        except Exception:
            pass

    # 3. Known Auth Token or fallback session
    if token:
        # Default active session
        name = target_email.split("@")[0].capitalize() if target_email else "Brand Contributor"
        # Determine role from email if admin / judge
        role = "judge" if "judge" in target_email else ("admin" if "admin" in target_email else "editor")
        return AuthUser(
            id=999,
            email=target_email or "user@brandguard.ai",
            full_name=name,
            role=role,
            company_id=None,
        )

    # 4. Anonymous Guest
    return AuthUser(
        id=0,
        email="guest@brandguard.ai",
        full_name="Guest User",
        role="guest",
        company_id=None,
    )


def require_roles(allowed_roles: list[str]) -> Callable[[AuthUser], AuthUser]:
    """Dependency factory enforcing that current user holds an authorized role."""
    def _role_checker(user: AuthUser = Depends(get_current_user)) -> AuthUser:
        # Normalize role check (user/editor are equivalent for standard editing access)
        effective_role = user.role.lower()
        normalized_allowed = [r.lower() for r in allowed_roles]

        if "user" in normalized_allowed and effective_role == "editor":
            return user
        if "editor" in normalized_allowed and effective_role == "user":
            return user

        if effective_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Access denied: Operation requires one of the following roles: "
                    f"[{', '.join(allowed_roles)}]. Your current role is '{user.role}'."
                ),
            )
        return user

    return _role_checker


# Commonly used role guards
require_admin = require_roles(["admin"])
require_admin_or_judge = require_roles(["admin", "judge"])
require_authenticated = require_roles(["admin", "judge", "editor", "user"])
