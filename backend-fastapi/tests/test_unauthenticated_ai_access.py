"""Test Unauthenticated AI Access.

Validates that visitors can use the AI Travel Chatbot and AI Itinerary Generation
without requiring account registration or login.
"""
from unittest.mock import patch, AsyncMock
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_unauthenticated_chat_success():
    """Unauthenticated visitor can send general travel queries to Groq AI chatbot."""
    mock_reply = "Pack light cotton clothing, sunscreen, swimwear, and comfortable footwear for Goa!"
    with patch("app.services.groq_service.groq_service.chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = mock_reply
        response = client.post(
            "/api/v1/chat",
            json={"message": "What should I pack for Goa in November?"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["reply"] == mock_reply
        assert "timestamp" in data["data"]


def test_unauthenticated_itinerary_generation_and_viewing():
    """Unauthenticated visitor can generate and view itineraries without login."""
    mock_plan = {
        "title": "3-Day Jaipur Heritage Discovery",
        "summary": "Explore royal palaces and Amber fort.",
        "days": [
            {
                "dayNumber": 1,
                "date": "2026-11-15",
                "theme": "Arrival & City Palace",
                "activities": [
                    {
                        "name": "City Palace Jaipur",
                        "description": "Courtyards and royal museum.",
                        "category": "sightseeing",
                        "startTime": "10:00",
                        "durationMinutes": 120,
                        "estimatedCost": 700.0,
                    }
                ],
            }
        ],
    }

    with patch("app.services.groq_service.groq_service.generate_itinerary", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_plan

        # 1. Generate without auth
        gen_response = client.post(
            "/api/v1/itineraries/generate",
            json={
                "preferences": {
                    "destination": "Jaipur, India",
                    "start_date": "2026-11-15",
                    "end_date": "2026-11-17",
                    "budget": 20000.0,
                    "currency": "INR",
                    "travel_style": "cultural",
                }
            },
        )
        assert gen_response.status_code == 201
        itin_data = gen_response.json()["data"]
        itin_id = itin_data["id"]
        assert itin_data["title"] == "3-Day Jaipur Heritage Discovery"

        # 2. View itinerary without auth
        get_response = client.get(f"/api/v1/itineraries/{itin_id}")
        assert get_response.status_code == 200
        assert get_response.json()["data"]["id"] == itin_id

        # 3. View deterministic budget without auth
        budget_response = client.get(f"/api/v1/itineraries/{itin_id}/budget")
        assert budget_response.status_code == 200
        assert "categories" in budget_response.json()["data"]

        # 4. Export PDF without auth
        pdf_response = client.get(f"/api/v1/itineraries/{itin_id}/export/pdf")
        assert pdf_response.status_code == 200
        assert pdf_response.headers["content-type"] == "application/pdf"
