"""Tests for Chat API route (/api/v1/chat) including context pruning, BOLA checks, and Groq fast model integration."""
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.services.groq_service import groq_service


def test_chat_without_trip_context(client: TestClient, auth_headers_user_a: dict[str, str]):
    """Chat message without trip context provides general travel advice."""
    with patch.object(groq_service, "chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = "The best time to visit Himachal Pradesh is between March and June."

        payload = {
            "message": "When is the best time to visit Himachal Pradesh?",
            "history": [
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi! How can I assist with your travels?"},
            ],
        }
        response = client.post("/api/v1/chat", json=payload, headers=auth_headers_user_a)
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["reply"] == "The best time to visit Himachal Pradesh is between March and June."
        assert data["trip_context_applied"] is False
        assert data["itinerary_context_applied"] is False
        assert "timestamp" in data
        assert mock_chat.call_count == 1


def test_chat_with_trip_and_itinerary_context(client: TestClient, auth_headers_user_a: dict[str, str]):
    """Chat applies pruned trip and itinerary details when user owns the resources."""
    # 1. Create a trip
    trip_res = client.post(
        "/api/v1/trips",
        json={
            "destination": "Goa, India",
            "start_date": "2026-11-20",
            "end_date": "2026-11-23",
            "budget": 30000,
            "currency": "INR",
            "travel_style": "relaxed",
            "interests": ["beaches", "seafood"],
        },
        headers=auth_headers_user_a,
    )
    assert trip_res.status_code == 201
    trip_id = trip_res.json()["data"]["id"]

    with patch.object(groq_service, "chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = "For a relaxed beach vibe in Goa, head to Palolem or Agonda."

        payload = {
            "message": "Which beaches should I prioritize for relaxing?",
            "tripId": trip_id,
        }
        response = client.post("/api/v1/chat", json=payload, headers=auth_headers_user_a)
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["reply"] == "For a relaxed beach vibe in Goa, head to Palolem or Agonda."
        assert data["trip_context_applied"] is True

        # Verify that the system prompt passed to Groq contained the destination
        _, kwargs = mock_chat.call_args
        system_prompt = kwargs.get("system_prompt", "")
        assert "Goa, India" in system_prompt
        assert "relaxed" in system_prompt


def test_chat_cross_user_bola_protection(
    client: TestClient,
    auth_headers_user_a: dict[str, str],
    auth_headers_user_b: dict[str, str],
):
    """User B cannot use User A's tripId in chat (must be rejected with 403 Forbidden)."""
    # User A creates trip
    trip_res = client.post(
        "/api/v1/trips",
        json={
            "destination": "Kashmir, India",
            "start_date": "2026-12-01",
            "end_date": "2026-12-05",
            "budget": 45000,
            "currency": "INR",
        },
        headers=auth_headers_user_a,
    )
    trip_id = trip_res.json()["data"]["id"]

    # User B queries chat with User A's tripId
    response = client.post(
        "/api/v1/chat",
        json={
            "message": "What is the budget for my trip?",
            "tripId": trip_id,
        },
        headers=auth_headers_user_b,
    )
    assert response.status_code == 403
    assert response.json()["success"] is False
    assert response.json()["error"]["code"] == "FORBIDDEN"
