"""Tests for Supabase Auth JWT validation, 401 handling, profile inspection, and auth flow parity."""
import time
import jwt
from fastapi.testclient import TestClient
from app.core.config import settings
from tests.conftest import USER_A_ID, USER_A_EMAIL


def test_missing_auth_token_returns_401(client: TestClient):
    """Accessing protected endpoints without Authorization header must return 401."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] in ("UNAUTHORIZED", "AUTH_TOKEN_MISSING")


def test_malformed_auth_token_returns_401(client: TestClient):
    """Malformed Bearer token must return 401."""
    response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-valid-jwt-token"})
    assert response.status_code == 401
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] in ("UNAUTHORIZED", "AUTH_TOKEN_INVALID", "INVALID_TOKEN")


def test_expired_auth_token_returns_401(client: TestClient):
    """Expired JWT must be rejected with 401."""
    expired_payload = {
        "sub": USER_A_ID,
        "email": USER_A_EMAIL,
        "aud": "authenticated",
        "role": "authenticated",
        "iat": int(time.time()) - 7200,
        "exp": int(time.time()) - 3600,
    }
    expired_token = jwt.encode(expired_payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert response.status_code == 401
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] in ("UNAUTHORIZED", "AUTH_TOKEN_EXPIRED", "TOKEN_EXPIRED")


def test_valid_auth_token_resolves_profile(client: TestClient, auth_headers_user_a: dict[str, str]):
    """Valid JWT resolves authenticated user profile."""
    response = client.get("/api/v1/auth/me", headers=auth_headers_user_a)
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["id"] == USER_A_ID
    assert body["data"]["email"] == USER_A_EMAIL


def test_register_and_login_flow(client: TestClient):
    """Registration and login return valid tokens and user profile."""
    unique_email = f"test_flow_{int(time.time())}@paryatakroute.org"
    register_payload = {
        "name": "Integration User",
        "email": unique_email,
        "password": "SecurePassword123!",
    }

    # 1. Register new user
    reg_res = client.post("/api/v1/auth/register", json=register_payload)
    assert reg_res.status_code == 201
    reg_body = reg_res.json()
    assert reg_body["success"] is True
    assert "tokens" in reg_body["data"]
    assert "user" in reg_body["data"]
    assert reg_body["data"]["user"]["email"] == unique_email
    access_token = reg_body["data"]["tokens"]["accessToken"]
    refresh_token = reg_body["data"]["tokens"]["refreshToken"]

    # 2. Duplicate registration returns 409
    dup_res = client.post("/api/v1/auth/register", json=register_payload)
    assert dup_res.status_code == 409

    # 3. Login with registered credentials
    login_res = client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": "SecurePassword123!",
    })
    assert login_res.status_code == 200
    login_body = login_res.json()
    assert login_body["success"] is True
    assert "tokens" in login_body["data"]

    # 4. Login with invalid password returns 401
    bad_login = client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": "WrongPassword!",
    })
    assert bad_login.status_code == 401

    # 5. Token refresh
    refresh_res = client.post("/api/v1/auth/refresh", json={"refreshToken": refresh_token})
    assert refresh_res.status_code == 200
    refresh_body = refresh_res.json()
    assert refresh_body["success"] is True
    assert "accessToken" in refresh_body["data"]

    # 6. Logout
    logout_res = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert logout_res.status_code == 200
    assert logout_res.json()["success"] is True
