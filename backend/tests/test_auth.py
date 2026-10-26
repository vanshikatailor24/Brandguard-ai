"""
backend/tests/test_auth.py
Unit and integration tests for authentication endpoints (signup, login, demo access).
"""
import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestAuthEndpoints:
    def test_demo_login_success(self):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "judge@syntaxduo.com", "password": "demo123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data.get("token_type") == "bearer"
        assert data.get("user", {}).get("email") == "judge@syntaxduo.com"
        assert data.get("user", {}).get("role") == "judge"

    def test_demo_login_on_unversioned_route(self):
        response = client.post(
            "/api/auth/login",
            json={"email": "judge@syntaxduo.com", "password": "demo123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    def test_signup_creates_new_user(self):
        unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "full_name": "Test Writer",
                "email": unique_email,
                "password": "securepassword123",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data.get("user", {}).get("email") == unique_email
        assert data.get("user", {}).get("full_name") == "Test Writer"

    def test_signup_validation_rejects_empty_fields(self):
        response = client.post(
            "/api/v1/auth/signup",
            json={"full_name": "", "email": "bad", "password": "1"},
        )
        assert response.status_code == 422

    def test_invalid_credentials_returns_401(self):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "unknown@company.com", "password": "wrongpassword"},
        )
        assert response.status_code == 401
        data = response.json()
        assert "Invalid email or password" in data.get("detail", "")

    def test_token_verify_endpoint(self):
        response = client.get("/api/auth/verify")
        assert response.status_code == 200
        assert response.json().get("status") == "valid"

    def test_auth_me_returns_judge_profile(self):
        response = client.get("/api/v1/auth/me?email=judge@syntaxduo.com")
        assert response.status_code == 200
        data = response.json()
        assert data.get("email") == "judge@syntaxduo.com"
        assert data.get("role") == "judge"
        assert data.get("company") is not None
        assert data.get("has_completed_onboarding") is True

    def test_company_onboard_endpoint(self):
        response = client.post(
            "/api/v1/company/onboard",
            json={
                "company_name": "Acme Global Dynamics",
                "industry_type": "Software/SaaS",
                "tagline": "Empowering enterprise brands safely",
                "user_email": "judge@syntaxduo.com",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert data.get("company", {}).get("name") == "Acme Global Dynamics"
        assert data.get("company", {}).get("industry_type") == "Software/SaaS"

