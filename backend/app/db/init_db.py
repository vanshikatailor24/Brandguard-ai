"""
backend/app/db/init_db.py
Database table creation and initial seed data for Brandguard AI.

Usage:
    cd backend
    python -m app.db.init_db
"""
import sys
from app.db.base import Base
from app.db.session import _engine, settings, check_db_connection
from app.models import Company, BrandRule, ContentReview, SourceDocument, ProtectedBrandElement, User
from sqlalchemy.orm import Session


def init_db() -> bool:
    """Initialize database tables and create default seed records if needed."""
    print("Checking database configuration...")
    status = check_db_connection()
    if status.get("status") != "connected":
        print(f"Error: {status.get('message')}")
        print("Please configure your MySQL credentials in backend/.env before running init_db.")
        return False

    target = f"{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}" if not settings.DATABASE_URL else "cloud database URL"
    print(f"Connected to database successfully ({target}).")
    print("Creating tables if they do not already exist...")
    Base.metadata.create_all(bind=_engine)
    print("Tables verified/created successfully.")

    # Apply incremental column migrations if needed for existing MySQL tables
    try:
        from sqlalchemy import inspect, text
        with _engine.connect() as conn:
            insp = inspect(_engine)
            if "users" in insp.get_table_names():
                u_cols = [c["name"] for c in insp.get_columns("users")]
                if "full_name" not in u_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR(200) NULL"))
                if "company_id" not in u_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN company_id INT NULL"))
            if "companies" in insp.get_table_names():
                c_cols = [c["name"] for c in insp.get_columns("companies")]
                if "industry_type" not in c_cols:
                    conn.execute(text("ALTER TABLE companies ADD COLUMN industry_type VARCHAR(100) NULL"))
                if "custom_industry" not in c_cols:
                    conn.execute(text("ALTER TABLE companies ADD COLUMN custom_industry VARCHAR(100) NULL"))
                if "tagline" not in c_cols:
                    conn.execute(text("ALTER TABLE companies ADD COLUMN tagline VARCHAR(255) NULL"))
            conn.commit()
    except Exception as e:
        print(f"Note on column verification: {e}")

    # Seed starter company and guidelines if empty
    with Session(_engine) as db:
        existing_company = db.query(Company).first()
        if not existing_company:
            print("Seeding default company...")
            company = Company(
                name="Brandguard AI Enterprise",
                industry="Software/SaaS",
                industry_type="Software/SaaS",
                tagline="AI-assisted brand governance for modern companies",
            )
            db.add(company)
            db.commit()
            db.refresh(company)

            print("Seeding starter brand guidelines...")
            seed_rules = [
                BrandRule(
                    company_id=company.id,
                    category="prohibited_phrase",
                    rule_text="100% guaranteed",
                    description="Never guarantee absolute outcomes in marketing copy.",
                    severity="critical",
                    is_approved=True,
                    is_protected=True,
                    source_excerpt="Section 4.1: Avoid absolute promises or 100% guarantees in marketing.",
                ),
                BrandRule(
                    company_id=company.id,
                    category="prohibited_phrase",
                    rule_text="cheapest on the market",
                    description="Do not make unsubstantiated price claims.",
                    severity="warning",
                    is_approved=True,
                    source_excerpt="Section 4.3: Comparative pricing claims must be verified before publication.",
                ),
                BrandRule(
                    company_id=company.id,
                    category="brand_terminology",
                    rule_text="Brandguard AI",
                    description="brand guard, brandguard, BrandGuard, brandguard.ai",
                    severity="critical",
                    is_approved=True,
                    is_protected=True,
                    source_excerpt="Section 1.2: The official company and product name is 'Brandguard AI'.",
                ),
                BrandRule(
                    company_id=company.id,
                    category="required_disclaimer",
                    rule_text="Results may vary based on individual deployment.",
                    description="Mandatory disclaimer for any ROI or benchmark statements.",
                    severity="warning",
                    is_approved=True,
                    source_excerpt="Section 6: Performance claims must be accompanied by the standard variance disclaimer.",
                ),
                BrandRule(
                    company_id=company.id,
                    category="required_phrase",
                    rule_text="Terms and conditions apply",
                    description="Required on promotional and discount announcements.",
                    severity="info",
                    is_approved=True,
                    source_excerpt="Section 7: Promotional campaigns require terms reference.",
                ),
            ]
            db.add_all(seed_rules)

            print("Seeding protected brand elements...")
            seed_elements = [
                ProtectedBrandElement(
                    company_id=company.id,
                    element_type="brand_name",
                    canonical_text="Brandguard AI",
                    forbidden_variations="Brand Guard, brandguard, brand guard ai",
                    description="Official brand identity name. Never separate or decapitalize.",
                ),
                ProtectedBrandElement(
                    company_id=company.id,
                    element_type="slogan",
                    canonical_text="AI-assisted brand governance for modern companies",
                    description="Official company tagline.",
                ),
                ProtectedBrandElement(
                    company_id=company.id,
                    element_type="legal_disclaimer",
                    canonical_text="Results may vary based on individual deployment.",
                    description="Protected legal disclaimer required on promotional benchmarks.",
                ),
            ]
            db.add_all(seed_elements)
            db.commit()
            print("Seed data created successfully.")
        else:
            company = existing_company
            # Ensure industry_type and tagline are populated on existing company
            if not company.industry_type:
                company.industry_type = company.industry or "Software/SaaS"
            if not company.tagline:
                company.tagline = "AI-assisted brand governance for modern companies"
            db.commit()

        # Seed default demo user if not present or link company
        existing_user = db.query(User).filter(User.email == "judge@brandguard.ai").first()

        if not existing_user:
            print("Seeding default demo user (judge@brandguard.ai)...")
            from app.core.security import hash_password
            demo_user = User(
                full_name="Demo Judge",
                email="judge@brandguard.ai",
                hashed_password=hash_password("demo123"),
                role="judge",
                company_id=company.id,
            )
            db.add(demo_user)
            db.commit()
            print("Default demo user created.")
        else:
            if not existing_user.company_id and company:
                existing_user.company_id = company.id
            existing_user.full_name = "Demo Judge"
            db.commit()


    print("Database initialization complete.")
    return True


if __name__ == "__main__":
    success = init_db()
    sys.exit(0 if success else 1)
