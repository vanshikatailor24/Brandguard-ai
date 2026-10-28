"""
backend/tests/test_api_endpoints.py
Integration tests for FastAPI endpoints using TestClient.
"""
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import get_db

client = TestClient(app)


class TestAPIEndpoints:
    def test_health_check_returns_200(self):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("application") == "ok"
        assert "database" in data
        assert data.get("team") == "Brandguard AI"


    def test_root_route_returns_api_info(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "Brandguard AI" in data.get("message", "")
        assert data.get("docs") == "/api/docs"

    def test_system_diagnostics_endpoint(self):
        response = client.get("/api/settings/system")
        assert response.status_code == 200
        data = response.json()
        assert "database" in data
        assert "ocr_engine" in data

    def test_rules_returns_valid_or_503_when_db_not_configured(self):
        response = client.get("/api/rules")
        assert response.status_code in (200, 503)
        if response.status_code == 503:
            data = response.json()
            assert "Database is not configured" in data.get("detail", "")
        else:
            data = response.json()
            assert "rules" in data

    def test_review_validation_rejects_too_short_content(self):
        # Override get_db to bypass the 503 check so schema validation runs
        class MockSession:
            pass
        app.dependency_overrides[get_db] = lambda: MockSession()
        try:
            response = client.post("/api/reviews", json={"content_text": "hi"})
            # Fails schema validation (min_length=5)
            assert response.status_code == 422
        finally:
            app.dependency_overrides.pop(get_db, None)
