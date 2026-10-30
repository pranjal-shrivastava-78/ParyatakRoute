"""Tests for health endpoints, CORS behavior, and configuration security."""
from fastapi.testclient import TestClient
from app.core.config import get_settings


def test_root_endpoint(client: TestClient):
    """Verify root / returns application metadata and 200 OK."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "ParyatakRoute"
    assert data["status"] == "online"
    assert "version" in data


def test_liveness_health_probe(client: TestClient):
    """Verify /health returns success=True."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "ok"


def test_readiness_probe(client: TestClient):
    """Verify /health/ready returns readiness and database probe status."""
    response = client.get("/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "ready"
    assert "database" in data["data"]


def test_api_v1_health_alias(client: TestClient):
    """Verify /api/v1/health functions properly."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_cors_preflight(client: TestClient):
    """Verify CORS preflight headers on allowed origin."""
    response = client.options(
        "/api/v1/trips",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Authorization,Content-Type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_settings_secret_masking():
    """Verify repr(settings) does not leak secrets, passwords, or keys."""
    settings = get_settings()
    settings_repr = repr(settings)
    assert "ParyatakRoute" in settings_repr
    # Ensure sensitive fields are not in the representation
    assert settings.SUPABASE_JWT_SECRET not in settings_repr
