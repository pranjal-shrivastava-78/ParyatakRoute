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


def test_swagger_docs_and_openapi_security(client: TestClient):
    """Verify /docs HTML, /openapi.json schema, HTTPBearer security scheme, and logical tags."""
    # 1. /docs returns custom branded Swagger UI HTML with no-cache headers
    docs_resp = client.get("/docs")
    assert docs_resp.status_code == 200
    assert "ParyatakRoute" in docs_resp.text
    assert "text/html" in docs_resp.headers.get("content-type", "")
    assert "no-cache" in docs_resp.headers.get("cache-control", "").lower()

    # 2. /openapi.json returns valid OpenAPI 3.x schema with no-cache headers
    oa_resp = client.get("/openapi.json")
    assert oa_resp.status_code == 200
    assert "no-cache" in oa_resp.headers.get("cache-control", "").lower()
    schema = oa_resp.json()
    assert schema["info"]["title"] == "ParyatakRoute API"

    # 3. /redoc returns custom ReDoc HTML with no-cache headers
    redoc_resp = client.get("/redoc")
    assert redoc_resp.status_code == 200
    assert "no-cache" in redoc_resp.headers.get("cache-control", "").lower()

    # 4. Security schemes include HTTPBearer
    sec_schemes = schema.get("components", {}).get("securitySchemes", {})
    assert "HTTPBearer" in sec_schemes
    assert sec_schemes["HTTPBearer"]["type"] == "http"
    assert sec_schemes["HTTPBearer"]["scheme"] == "bearer"

    # 5. Protected endpoints declare HTTPBearer security requirement
    trips_post = schema["paths"]["/api/v1/trips"]["post"]
    assert {"HTTPBearer": []} in trips_post.get("security", [])

    # 6. Core tags are properly configured
    tags = {t["name"] for t in schema.get("tags", [])}
    assert {"Health", "Authentication", "Trips", "Itineraries", "Favourites", "Chat", "Travel Data"}.issubset(tags)

