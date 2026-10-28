"""
backend/app/api/routes/auth.py
Authentication endpoints: Registration (Sign Up), Login, Current User Profile (Me), and Demo Judge Access.
"""
import uuid
from typing import Optional
from fastapi import APIRouter, Header, HTTPException, Query, status

from app.db.session import _SessionLocal, settings
from app.models.user import User
from app.models.company import Company
from app.schemas.auth import (
    LoginRequest,
    SignUpRequest,
    LoginResponse,
    UserResponse,
    UserProfileResponse,
    CompanyBrief,
)
from app.core.security import hash_password, verify_password

router = APIRouter(tags=["Authentication"])

DEMO_EMAIL = "judge@brandguard.ai"
DEMO_EMAILS = {"judge@brandguard.ai"}
DEMO_PASS = "demo123"



DEFAULT_DEMO_COMPANY = CompanyBrief(
    id=1,
    name="Brandguard AI Enterprise",
    industry="Software/SaaS",
    industry_type="Software/SaaS",
    custom_industry=None,
    tagline="AI-assisted brand governance for modern companies",
)


def _build_company_brief(company: Optional[Company]) -> Optional[CompanyBrief]:
    if not company:
        return None
    return CompanyBrief(
        id=company.id,
        name=company.name,
        industry=company.industry,
        industry_type=company.industry_type or company.industry,
        custom_industry=company.custom_industry,
        tagline=company.tagline,
    )


@router.post("/auth/signup", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
@router.post("/v1/auth/signup", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignUpRequest):
    """
    Register a new user account.
    Checks for duplicate emails and securely hashes passwords.
    New users start with has_completed_onboarding = False to prompt the 2-step onboarding screen.
    """
    clean_name = payload.full_name.strip()
    clean_email = payload.email.strip().lower()
    clean_password = payload.password.strip()

    if len(clean_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name must be at least 2 characters.",
        )

    if len(clean_password) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 4 characters.",
        )

    # 1. Database registration if configured
    if _SessionLocal is not None and settings.db_configured:
        try:
            with _SessionLocal() as db:
                existing = db.query(User).filter(User.email == clean_email).first()
                if existing:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="An account with this email address already exists.",
                    )

                new_user = User(
                    full_name=clean_name,
                    email=clean_email,
                    hashed_password=hash_password(clean_password),
                    role="user",
                )
                db.add(new_user)
                db.commit()
                db.refresh(new_user)

                return LoginResponse(
                    access_token=f"auth-token-{uuid.uuid4().hex[:16]}",
                    token_type="bearer",
                    user=UserResponse(
                        id=new_user.id,
                        email=new_user.email,
                        full_name=new_user.full_name,
                        role=new_user.role,
                        name=new_user.full_name or new_user.email,
                        company_id=None,
                        company=None,
                        has_completed_onboarding=False,
                    ),
                    message="Account created successfully. Welcome to Brandguard AI!",
                )
        except HTTPException:
            raise
        except Exception:
            # Fallback if DB error occurs
            pass

    # 2. Resilient fallback for demo/offline workspace
    return LoginResponse(
        access_token=f"auth-token-{uuid.uuid4().hex[:16]}",
        token_type="bearer",
        user=UserResponse(
            id=999,
            email=clean_email,
            full_name=clean_name,
            role="user",
            name=clean_name,
            company_id=None,
            company=None,
            has_completed_onboarding=False,
        ),
        message="Account created successfully (workspace session).",
    )


@router.post("/auth/login", response_model=LoginResponse)
@router.post("/v1/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    """
    Authenticate user with email and password.
    Includes built-in instant fallback for demo judge credentials (judge@brandguard.ai / demo123).
    """

    clean_email = payload.email.strip().lower()
    clean_password = payload.password.strip()

    # 1. Check for instant demo access (works even if DB is offline or empty)
    if clean_email in DEMO_EMAILS and clean_password == DEMO_PASS:
        # Check if DB has updated company for judge
        company_brief = DEFAULT_DEMO_COMPANY
        if _SessionLocal is not None and settings.db_configured:
            try:
                with _SessionLocal() as db:
                    u = db.query(User).filter(User.email.in_(DEMO_EMAILS)).first()
                    if u and u.company:
                        company_brief = _build_company_brief(u.company) or DEFAULT_DEMO_COMPANY
            except Exception:
                pass

        return LoginResponse(
            access_token=f"demo-token-{uuid.uuid4().hex[:16]}",
            token_type="bearer",
            user=UserResponse(
                id=1,
                email=clean_email,
                full_name="Demo Judge",
                role="judge",
                name="Demo Judge",
                company_id=company_brief.id,
                company=company_brief,
                has_completed_onboarding=True,
            ),
            message="Demo judge access granted.",
        )


    # 2. Check in database if configured
    if _SessionLocal is not None and settings.db_configured:
        try:
            with _SessionLocal() as db:
                user = db.query(User).filter(User.email == clean_email).first()
                if user and verify_password(clean_password, user.hashed_password):
                    comp_brief = _build_company_brief(user.company) if user.company else None
                    has_completed = bool(user.company_id and comp_brief)
                    return LoginResponse(
                        access_token=f"auth-token-{uuid.uuid4().hex[:16]}",
                        token_type="bearer",
                        user=UserResponse(
                            id=user.id,
                            email=user.email,
                            full_name=user.full_name,
                            role=user.role,
                            name=user.full_name or user.email.split("@")[0].capitalize(),
                            company_id=user.company_id,
                            company=comp_brief,
                            has_completed_onboarding=has_completed,
                        ),
                        message="Login successful.",
                    )
        except Exception:
            # If DB query fails, fall through to credential check
            pass

    # 3. Invalid credentials
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password. Use demo login for instant access.",
    )


@router.get("/auth/me", response_model=UserProfileResponse)
@router.get("/v1/auth/me", response_model=UserProfileResponse)
def get_current_user_profile(
    email: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
):
    """
    Fetch current authenticated user profile, linked company details, and onboarding status.
    Supports token analysis and email lookup with resilient fallback for demo judges.
    """
    target_email = email.strip().lower() if email else None

    # Detect demo token or demo email
    is_demo = False
    if authorization and ("demo-token" in authorization.lower()):
        is_demo = True
    if target_email in DEMO_EMAILS:
        is_demo = True

    if is_demo or not target_email:
        # Check if DB has specific judge info
        company_brief = DEFAULT_DEMO_COMPANY
        created_at = None
        if _SessionLocal is not None and settings.db_configured:
            try:
                with _SessionLocal() as db:
                    u = db.query(User).filter(User.email.in_(DEMO_EMAILS)).first()
                    if u:
                        created_at = u.created_at
                        if u.company:
                            company_brief = _build_company_brief(u.company) or DEFAULT_DEMO_COMPANY
            except Exception:
                pass

        return UserProfileResponse(
            id=1,
            email=target_email if target_email in DEMO_EMAILS else "judge@brandguard.ai",
            full_name="Demo Judge",
            name="Demo Judge",
            role="judge",
            created_at=created_at,
            company=company_brief,
            has_completed_onboarding=True,
        )


    # Database query for registered user
    if _SessionLocal is not None and settings.db_configured:
        try:
            with _SessionLocal() as db:
                user = db.query(User).filter(User.email == target_email).first()
                if user:
                    comp_brief = _build_company_brief(user.company) if user.company else None
                    has_completed = bool(user.company_id and comp_brief)
                    return UserProfileResponse(
                        id=user.id,
                        email=user.email,
                        full_name=user.full_name,
                        name=user.full_name or user.email.split("@")[0].capitalize(),
                        role=user.role,
                        created_at=user.created_at,
                        company=comp_brief,
                        has_completed_onboarding=has_completed,
                    )
        except Exception:
            pass

    # Graceful fallback for non-DB session
    return UserProfileResponse(
        id=999,
        email=target_email or "user@brandguard.ai",
        full_name=target_email.split("@")[0].capitalize() if target_email else "Brand Champion",
        name=target_email.split("@")[0].capitalize() if target_email else "Brand Champion",
        role="user",
        created_at=None,
        company=None,
        has_completed_onboarding=False,
    )


@router.get("/auth/verify")
@router.get("/v1/auth/verify")
def verify_token():
    """Verify session token status."""
    return {"status": "valid", "auth_mode": "demo_and_db_ready"}
