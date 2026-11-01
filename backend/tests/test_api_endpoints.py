"""
backend/tests/test_api_endpoints.py
Integration tests for FastAPI endpoints (v1 and core routes) using TestClient.
"""
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import get_db
from app.services.ai_service import get_ai_status, analyze_tone_nuance_with_ai

client = TestClient(app)


class TestAPIEndpoints:
    def test_health_check_returns_200(self):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("application") == "ok"
        assert "database" in data
        assert data.get("team") == "Brandguard AI"

    def test_v1_health_check_returns_200(self):
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("application") == "ok"
        assert "database" in data

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
        assert "ai_integration" in data
        ai = data["ai_integration"]
        assert "fallback_guarantee" in ai

    def test_v1_system_diagnostics_endpoint(self):
        response = client.get("/api/v1/settings/system")
        assert response.status_code == 200
        data = response.json()
        assert "ai_integration" in data

    def test_rules_returns_valid_or_503_when_db_not_configured(self):
        response = client.get("/api/rules")
        assert response.status_code in (200, 503)
        if response.status_code == 503:
            data = response.json()
            assert "Database is not configured" in data.get("detail", "")
        else:
            data = response.json()
            assert "rules" in data

    def test_v1_rules_returns_valid(self):
        response = client.get("/api/v1/rules")
        assert response.status_code in (200, 503)

    def test_v1_insights_returns_valid(self):
        response = client.get("/api/v1/insights")
        assert response.status_code in (200, 503)

    def test_review_validation_rejects_too_short_content(self):
        class MockSession:
            pass
        app.dependency_overrides[get_db] = lambda: MockSession()
        try:
            response = client.post("/api/reviews", json={"content_text": "hi"})
            # Fails schema validation (min_length=5)
            assert response.status_code == 422
        finally:
            app.dependency_overrides.pop(get_db, None)

    def test_ai_service_fallback_without_keys(self):
        status = get_ai_status()
        assert "fallback_guarantee" in status
        assert status["fallback_guarantee"] == "active"
        # Test tone analysis handles unconfigured key gracefully with 0 crashes
        res = analyze_tone_nuance_with_ai("Sample marketing copy for Brandguard AI", ["Use Brandguard AI"])
        assert "ai_applied" in res
        assert "provider" in res
        assert "tone_analysis" in res

    def test_rbac_delete_rule_requires_admin_or_judge(self):
        # A request with no auth or guest should be 403 Forbidden
        response = client.delete("/api/v1/rules/999")
        assert response.status_code == 403
        data = response.json()
        assert "Access denied" in data.get("detail", "")

    def test_rbac_delete_rule_authorized_for_judge(self):
        # Demo judge token should pass authorization check (returns 404 or 503 for non-existent rule)
        headers = {"Authorization": "Bearer demo-token-123456"}
        response = client.delete("/api/v1/rules/999999", headers=headers)
        # Auth passed (not 403)
        assert response.status_code in (404, 503)
