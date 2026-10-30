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


def test_jwt_invalid_audience_rejected(client: TestClient):
    """Tokens with an unauthorized audience (e.g. 'anon') must be rejected."""
    import jwt
    import time
    token = jwt.encode(
        {"sub": "00000000-0000-0000-0000-000000000001", "aud": "anon", "exp": int(time.time()) + 3600},
        settings.SUPABASE_JWT_SECRET,
        algorithm="HS256",
    )
    res = client.get("/api/v1/trips", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401
    assert "audience" in res.json()["error"]["message"].lower()


def test_jwt_missing_secret_rejects_hs256(client: TestClient, auth_headers_user_a: dict[str, str]):
    """If SUPABASE_JWT_SECRET is empty/missing, HS256 tokens are rejected safely."""
    with patch.object(settings, "SUPABASE_JWT_SECRET", ""):
        res = client.get("/api/v1/trips", headers=auth_headers_user_a)
        assert res.status_code == 401


@pytest.mark.asyncio
async def test_long_itinerary_chunked_generation_ordering_and_budget(client: TestClient, auth_headers_user_a: dict[str, str]):
    """Verify that multi-day itineraries (>3 days) use chunking and preserve chronological order and budget."""
    from unittest.mock import AsyncMock
    from app.services.groq_service import groq_service

    # Create a 5-day trip
    trip_res = client.post(
        "/api/v1/trips",
        json={
            "destination": "Ladakh, India",
            "start_date": "2026-07-01",
            "end_date": "2026-07-05",  # 5 days
            "budget": 50000,
            "currency": "INR",
        },
        headers=auth_headers_user_a,
    )
    assert trip_res.status_code == 201
    trip_id = trip_res.json()["data"]["id"]

    chunk_1 = {
        "title": "Ladakh High Altitude Adventure",
        "summary": "5 days exploring Leh and surrounding valleys",
        "days": [
            {
                "dayNumber": 1,
                "date": "2026-07-01",
                "theme": "Leh Acclimatization",
                "activities": [{"name": "Rest & Tea", "estimatedCost": 500, "category": "food", "startTime": "10:00", "durationMinutes": 60}],
            },
            {
                "dayNumber": 2,
                "date": "2026-07-02",
                "theme": "Monasteries",
                "activities": [{"name": "Thiksey Monastery", "estimatedCost": 300, "category": "cultural", "startTime": "10:00", "durationMinutes": 120}],
            },
            {
                "dayNumber": 3,
                "date": "2026-07-03",
                "theme": "Shanti Stupa Sunset",
                "activities": [{"name": "Shanti Stupa", "estimatedCost": 100, "category": "sightseeing", "startTime": "17:00", "durationMinutes": 90}],
            },
        ],
        "assumptions": ["Acclimatization is essential on Day 1."],
    }

    chunk_2 = {
        "days": [
            {
                "dayNumber": 4,
                "date": "2026-07-04",
                "theme": "Nubra Valley via Khardung La",
                "activities": [{"name": "Khardung La Pass", "estimatedCost": 2000, "category": "adventure", "startTime": "08:00", "durationMinutes": 240}],
            },
            {
                "dayNumber": 5,
                "date": "2026-07-05",
                "theme": "Pangong Lake & Return",
                "activities": [{"name": "Pangong Tso", "estimatedCost": 2500, "category": "sightseeing", "startTime": "09:00", "durationMinutes": 180}],
            },
        ]
    }

    with patch.object(groq_service, "_call_with_retry", new_callable=AsyncMock) as mock_call:
        # Mock choice response from Groq for each chunk
        mock_choice_1 = MagicMock()
        mock_choice_1.message.content = __import__("json").dumps(chunk_1)
        mock_completion_1 = MagicMock(choices=[mock_choice_1])

        mock_choice_2 = MagicMock()
        mock_choice_2.message.content = __import__("json").dumps(chunk_2)
        mock_completion_2 = MagicMock(choices=[mock_choice_2])

        mock_call.side_effect = [mock_completion_1, mock_completion_2]

        gen_res = client.post(
            "/api/v1/itineraries/generate",
            json={"trip_id": trip_id},
            headers=auth_headers_user_a,
        )
        assert gen_res.status_code == 201
        data = gen_res.json()["data"]

        # 1. Verify 2 chunk calls were made
        assert mock_call.call_count == 2

        # 2. Verify all 5 days are present and properly numbered
        assert len(data["days"]) == 5
        for idx, day in enumerate(data["days"]):
            day_num = day.get("dayNumber") or day.get("day_number")
            assert day_num == idx + 1
            assert day["date"] == f"2026-07-0{idx + 1}"

        # 3. Verify budget recalculation: 500 + 300 + 100 + 2000 + 2500 = 5400
        assert data["budget"]["total_estimated"] == 5400.0


@pytest.mark.asyncio
async def test_long_itinerary_failed_chunk_does_not_persist(client: TestClient, auth_headers_user_a: dict[str, str]):
    """If a subsequent chunk fails during multi-day generation, no partial database record is saved."""
    from unittest.mock import AsyncMock
    from app.core.exceptions import AppException
    from app.services.groq_service import groq_service
    from app.repositories.itinerary_repository import itinerary_repository

    trip_res = client.post(
        "/api/v1/trips",
        json={
            "destination": "Sikkim, India",
            "start_date": "2026-08-01",
            "end_date": "2026-08-06",  # 6 days -> 2 chunks of 3 days
            "budget": 35000,
            "currency": "INR",
        },
        headers=auth_headers_user_a,
    )
    assert trip_res.status_code == 201
    trip_id = trip_res.json()["data"]["id"]

    chunk_1 = {
        "title": "Sikkim Monasteries",
        "summary": "Exploring Gangtok and Pelling",
        "days": [
            {"dayNumber": 1, "date": "2026-08-01", "theme": "Gangtok Arrival", "activities": []},
            {"dayNumber": 2, "date": "2026-08-02", "theme": "Rumtek Monastery", "activities": []},
            {"dayNumber": 3, "date": "2026-08-03", "theme": "Tsomgo Lake", "activities": []},
        ],
    }

    with patch.object(groq_service, "_call_with_retry", new_callable=AsyncMock) as mock_call:
        mock_choice_1 = MagicMock()
        mock_choice_1.message.content = __import__("json").dumps(chunk_1)
        mock_completion_1 = MagicMock(choices=[mock_choice_1])

        # Chunk 2 fails with a controlled AI provider error
        mock_call.side_effect = [
            mock_completion_1,
            AppException("Groq API rate limit or outage on chunk 2", code="AI_PROVIDER_ERROR", status_code=502),
        ]

        gen_res = client.post(
            "/api/v1/itineraries/generate",
            json={"trip_id": trip_id},
            headers=auth_headers_user_a,
        )
        assert gen_res.status_code == 502
        assert gen_res.json()["error"]["code"] == "AI_PROVIDER_ERROR"

        # CRITICAL VERIFICATION: No partial itinerary was persisted in the repository!
        saved_itins = await itinerary_repository.list_by_trip(trip_id)
        assert len(saved_itins) == 0

