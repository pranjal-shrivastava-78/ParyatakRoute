"""Tests for Trips API routes including validation, CRUD, and BOLA ownership enforcement."""
from fastapi.testclient import TestClient


def test_create_trip_valid(client: TestClient, auth_headers_user_a: dict[str, str]):
    """Verify trip creation with valid data returns 201 Created."""
    payload = {
        "destination": "Goa, India",
        "start_date": "2026-11-10",
        "end_date": "2026-11-15",
        "budget": 25000,
        "currency": "INR",
        "travelers_count": 2,
        "travel_style": "leisure",
        "interests": ["beaches", "seafood", "sunsets"],
    }
    response = client.post("/api/v1/trips", json=payload, headers=auth_headers_user_a)
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["destination"] == "Goa, India"
    assert body["data"]["budget"] == 25000.0
    assert "id" in body["data"]


def test_create_trip_validation_error(client: TestClient, auth_headers_user_a: dict[str, str]):
    """Validation failure on invalid date format and negative budget."""
    payload = {
        "destination": "Goa, India",
        "start_date": "invalid-date",
        "end_date": "2026-11-15",
        "budget": -500,  # Negative budget should fail
    }
    response = client.post("/api/v1/trips", json=payload, headers=auth_headers_user_a)
    assert response.status_code == 400
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"


def test_list_user_trips(client: TestClient, auth_headers_user_a: dict[str, str]):
    """List paginated trips owned by the user."""
    response = client.get("/api/v1/trips?page=1&limit=10", headers=auth_headers_user_a)
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "items" in body["data"]
    assert "total" in body["data"]
    assert body["data"]["total"] >= 1


def test_bola_cross_user_access_prevention(
    client: TestClient,
    auth_headers_user_a: dict[str, str],
    auth_headers_user_b: dict[str, str],
):
    """User B must be forbidden from accessing, updating, or deleting User A's trip."""
    # 1. User A creates a private trip
    create_res = client.post(
        "/api/v1/trips",
        json={
            "destination": "Jaipur, Rajasthan",
            "start_date": "2026-12-01",
            "end_date": "2026-12-05",
            "budget": 30000,
            "currency": "INR",
        },
        headers=auth_headers_user_a,
    )
    assert create_res.status_code == 201
    trip_id = create_res.json()["data"]["id"]

    # 2. User B tries to read User A's trip -> Rejected with 403 or 404
    get_res = client.get(f"/api/v1/trips/{trip_id}", headers=auth_headers_user_b)
    assert get_res.status_code in (403, 404)
    assert get_res.json()["success"] is False

    # 3. User B tries to update User A's trip -> Rejected with 403 or 404
    update_res = client.put(
        f"/api/v1/trips/{trip_id}",
        json={"destination": "Hacked Destination"},
        headers=auth_headers_user_b,
    )
    assert update_res.status_code in (403, 404)
    assert update_res.json()["success"] is False

    # 4. User B tries to delete User A's trip -> Rejected with 403 or 404
    delete_res = client.delete(f"/api/v1/trips/{trip_id}", headers=auth_headers_user_b)
    assert delete_res.status_code in (403, 404)
    assert delete_res.json()["success"] is False

    # 5. User A can successfully update and delete own trip
    update_success = client.put(
        f"/api/v1/trips/{trip_id}",
        json={"destination": "Jaipur (Pink City), Rajasthan"},
        headers=auth_headers_user_a,
    )
    assert update_success.status_code == 200
    assert update_success.json()["data"]["destination"] == "Jaipur (Pink City), Rajasthan"

    delete_success = client.delete(f"/api/v1/trips/{trip_id}", headers=auth_headers_user_a)
    assert delete_success.status_code == 200
    assert delete_success.json()["data"]["deleted"] is True
