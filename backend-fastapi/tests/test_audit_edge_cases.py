"""Security, BOLA, validation, and error resilience audit tests for ParyatakRoute.

Tests edge cases identified during Phase 8 Backend Quality and Security Audit:
- Invalid & BOLA PDF exports
- Cross-user trip/itinerary access and modification prevention
- Negative budgets and inverted dates
- Malformed payloads and schema validation
- Production-mode fail-fast protection (no silent mock fallback)
- Sensitive credentials exposure verification
- Travel data edge cases
"""
from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.repositories.trip_repository import trip_repository
from app.repositories.itinerary_repository import itinerary_repository


def test_pdf_export_nonexistent_itinerary(client: TestClient, auth_headers_user_a: dict[str, str]):
    """Exporting a PDF for a non-existent itinerary must return 404."""
    response = client.get(
        "/api/v1/itineraries/00000000-0000-0000-0000-000000000999/export/pdf",
        headers=auth_headers_user_a,
    )
    assert response.status_code == 404
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] in ("NOT_FOUND", "ITINERARY_NOT_FOUND")


def test_pdf_export_cross_user_bola_prevention(
    client: TestClient,
    auth_headers_user_a: dict[str, str],
    auth_headers_user_b: dict[str, str],
):
    """User B must never be able to export or download User A's private itinerary as PDF."""
    # 1. User A creates a trip
    trip_res = client.post(
        "/api/v1/trips",
        json={
            "destination": "Kochi, Kerala",
            "start_date": "2026-11-20",
            "end_date": "2026-11-22",
            "budget": 18000,
            "currency": "INR",
        },
        headers=auth_headers_user_a,
    )
    assert trip_res.status_code == 201
    trip_id = trip_res.json()["data"]["id"]

    # 2. User A generates an itinerary
    itinerary_res = client.post(
        "/api/v1/itineraries/generate",
        json={"trip_id": trip_id},
        headers=auth_headers_user_a,
    )
    assert itinerary_res.status_code == 201
    itin_id = itinerary_res.json()["data"]["id"]

    # 3. User B attempts to export User A's itinerary as PDF
    pdf_res = client.get(
        f"/api/v1/itineraries/{itin_id}/export/pdf",
        headers=auth_headers_user_b,
    )
    assert pdf_res.status_code in (403, 404)
    assert pdf_res.headers.get("content-type") == "application/json"
    assert pdf_res.json()["success"] is False


def test_cross_user_trip_and_itinerary_isolation(
    client: TestClient,
    auth_headers_user_a: dict[str, str],
    auth_headers_user_b: dict[str, str],
):
    """User B must never be able to read or modify User A's trip or itinerary."""
    trip_res = client.post(
        "/api/v1/trips",
        json={
            "destination": "Mysore, Karnataka",
            "start_date": "2026-11-25",
            "end_date": "2026-11-27",
            "budget": 12000,
            "currency": "INR",
        },
        headers=auth_headers_user_a,
    )
    trip_id = trip_res.json()["data"]["id"]

    itin_res = client.post(
        "/api/v1/itineraries/generate",
        json={"trip_id": trip_id},
        headers=auth_headers_user_a,
    )
    itin_id = itin_res.json()["data"]["id"]

    # User B tries to read User A's itinerary -> 403 or 404
    get_res = client.get(f"/api/v1/itineraries/{itin_id}", headers=auth_headers_user_b)
    assert get_res.status_code in (403, 404)
    assert get_res.json()["success"] is False

    # User B tries to patch User A's itinerary -> 403 or 404
    patch_res = client.patch(
        f"/api/v1/itineraries/{itin_id}",
        json={"title": "Hacked Title"},
        headers=auth_headers_user_b,
    )
    assert patch_res.status_code in (403, 404)
    assert patch_res.json()["success"] is False

    # User B tries to delete User A's trip -> 403 or 404
    del_res = client.delete(f"/api/v1/trips/{trip_id}", headers=auth_headers_user_b)
    assert del_res.status_code in (403, 404)
    assert del_res.json()["success"] is False

    # User A can delete own trip
    owner_del_res = client.delete(f"/api/v1/trips/{trip_id}", headers=auth_headers_user_a)
    assert owner_del_res.status_code == 200
    assert owner_del_res.json()["data"]["deleted"] is True


def test_trip_validation_end_date_before_start_date(client: TestClient, auth_headers_user_a: dict[str, str]):
    """Creating a trip where end_date is before start_date must fail validation with 400 Bad Request."""
    response = client.post(
        "/api/v1/trips",
        json={
            "destination": "Agra, Uttar Pradesh",
            "start_date": "2026-12-10",
            "end_date": "2026-12-05",  # Inverted dates!
            "budget": 10000,
            "currency": "INR",
        },
        headers=auth_headers_user_a,
    )
    assert response.status_code == 400
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert "start_date" in body["error"]["message"].lower() or "end date" in body["error"]["message"].lower()


def test_trip_validation_negative_budget(client: TestClient, auth_headers_user_a: dict[str, str]):
    """Trip creation with negative budget must return 400 validation error."""
    response = client.post(
        "/api/v1/trips",
        json={
            "destination": "Goa, India",
            "start_date": "2026-12-01",
            "end_date": "2026-12-05",
            "budget": -5000,
            "currency": "INR",
        },
        headers=auth_headers_user_a,
    )
    assert response.status_code in (400, 422)
    assert response.json()["success"] is False


def test_chat_malformed_payload_validation(client: TestClient, auth_headers_user_a: dict[str, str]):
    """Sending malformed JSON (missing 'message') to /api/v1/chat must return 400/422."""
    response = client.post(
        "/api/v1/chat",
        json={"invalid_field": "test"},
        headers=auth_headers_user_a,
    )
    assert response.status_code in (400, 422)
    body = response.json()
    assert body["success"] is False


def test_generate_itinerary_nonexistent_trip(client: TestClient, auth_headers_user_a: dict[str, str]):
    """Generating itinerary for non-existent trip ID must return 404."""
    response = client.post(
        "/api/v1/itineraries/generate",
        json={"trip_id": "00000000-0000-0000-0000-000000000999"},
        headers=auth_headers_user_a,
    )
    assert response.status_code == 404
    assert response.json()["success"] is False


def test_production_mode_auth_fails_fast_when_unconfigured(client: TestClient):
    """In production mode, auth routes must NEVER silently fall back to in-memory mock."""
    with patch.object(settings, "APP_ENV", "production"):
        with patch("app.api.routes.auth._get_supabase_clients", return_value=(None, None)):
            # Registration should return 503 AUTH_UNAVAILABLE
            reg_res = client.post(
                "/api/v1/auth/register",
                json={"email": "hacker@test.com", "password": "SecurePassword123!", "name": "Hacker"},
            )
            assert reg_res.status_code == 503
            assert reg_res.json()["error"]["code"] == "AUTH_UNAVAILABLE"

            # Login should return 503 AUTH_UNAVAILABLE
            login_res = client.post(
                "/api/v1/auth/login",
                json={"email": "hacker@test.com", "password": "SecurePassword123!"},
            )
            assert login_res.status_code == 503
            assert login_res.json()["error"]["code"] == "AUTH_UNAVAILABLE"


def test_production_mode_repositories_fail_fast_when_unconfigured():
    """In production mode, repositories must NEVER silently store data in memory."""
    with patch.object(settings, "APP_ENV", "production"):
        with pytest.raises(Exception) as exc_info:
            trip_repository._check_production_readiness()
        assert "unavailable in production" in str(exc_info.value).lower()

        with pytest.raises(Exception) as exc_info2:
            itinerary_repository._check_production_readiness()
        assert "unavailable in production" in str(exc_info2.value).lower()


def test_no_sensitive_credentials_in_error_responses(client: TestClient, auth_headers_user_a: dict[str, str]):
    """Verify that exception and error responses never leak Supabase service role key or API keys."""
    # Force a 404 error
    res_404 = client.get("/api/v1/trips/00000000-0000-0000-0000-000000000000", headers=auth_headers_user_a)
    text = res_404.text
    assert settings.SUPABASE_SERVICE_ROLE_KEY not in text
    assert settings.GROQ_API_KEY not in text

    # Force a validation error
    res_val = client.post("/api/v1/trips", json={}, headers=auth_headers_user_a)
    text_val = res_val.text
    assert settings.SUPABASE_SERVICE_ROLE_KEY not in text_val
    assert settings.GROQ_API_KEY not in text_val


def test_travel_data_directions_missing_coordinates(client: TestClient, auth_headers_user_a: dict[str, str]):
    """Route calculation with missing coordinates returns 400/422 validation error."""
    res = client.post(
        "/api/v1/directions",
        json={"origin_lat": 999.0},  # Missing origin_lon, dest_lat, dest_lon
        headers=auth_headers_user_a,
    )
    assert res.status_code in (400, 422)
    assert res.json()["success"] is False
