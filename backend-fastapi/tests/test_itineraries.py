"""Tests for Itineraries API routes including AI generation, day regeneration, budget recalculation, and PDF export."""
from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient
from app.repositories.itinerary_repository import ItineraryRepository
from app.services.groq_service import groq_service

itinerary_repo = ItineraryRepository()

MOCK_GENERATED_PLAN = {
    "title": "Himachal Mountain Retreat",
    "summary": "A peaceful mountain getaway exploring local nature and culture.",
    "days": [
        {
            "dayNumber": 1,
            "date": "2026-12-10",
            "theme": "Old Manali Riverside & Cafes",
            "activities": [
                {
                    "name": "Riverside Cafe Brunch",
                    "description": "Relax by the Beas river with hot tea and trout.",
                    "category": "food",
                    "startTime": "10:00",
                    "durationMinutes": 90,
                    "estimatedCost": 1200.0,
                    "costCurrency": "INR",
                    "location": {"name": "Old Manali Cafe"},
                    "transport": {"mode": "walking", "durationMinutes": 10, "estimatedCost": 0.0},
                    "sourceStatus": "unverified",
                },
                {
                    "name": "Hadimba Temple Walk",
                    "description": "Visit the historic cedar-wood temple.",
                    "category": "sightseeing",
                    "startTime": "12:30",
                    "durationMinutes": 120,
                    "estimatedCost": 200.0,
                    "costCurrency": "INR",
                    "location": {"name": "Hadimba Temple"},
                    "transport": {"mode": "taxi", "durationMinutes": 15, "estimatedCost": 250.0},
                    "sourceStatus": "unverified",
                },
            ],
        },
        {
            "dayNumber": 2,
            "date": "2026-12-11",
            "theme": "Solang Valley Snow Adventure",
            "activities": [
                {
                    "name": "Solang Valley Exploration",
                    "description": "Enjoy the mountain views and local sports.",
                    "category": "activities",
                    "startTime": "09:30",
                    "durationMinutes": 240,
                    "estimatedCost": 3500.0,
                    "costCurrency": "INR",
                    "location": {"name": "Solang Valley"},
                    "transport": {"mode": "4x4 Jeep", "durationMinutes": 45, "estimatedCost": 1500.0},
                    "sourceStatus": "unverified",
                }
            ],
        },
    ],
    "assumptions": ["Prices and hours are estimates and must be verified locally."],
}

MOCK_REGENERATED_DAY = {
    "dayNumber": 1,
    "date": "2026-12-10",
    "theme": "Art & Himalayan Heritage",
    "activities": [
        {
            "name": "Naggar Castle & Roerich Gallery",
            "description": "Explore heritage Himalayan art and traditional architecture.",
            "category": "cultural",
            "startTime": "10:30",
            "durationMinutes": 180,
            "estimatedCost": 500.0,
            "costCurrency": "INR",
            "location": {"name": "Naggar Castle"},
            "transport": {"mode": "taxi", "durationMinutes": 40, "estimatedCost": 800.0},
            "sourceStatus": "unverified",
        }
    ],
}


@pytest.fixture
async def sample_trip_and_itinerary(client: TestClient, auth_headers_user_a: dict[str, str]):
    """Create a sample trip and mock itinerary for testing calculations and exports."""
    trip_res = client.post(
        "/api/v1/trips",
        json={
            "destination": "Manali, Himachal Pradesh",
            "start_date": "2026-12-10",
            "end_date": "2026-12-13",
            "budget": 20000,
            "currency": "INR",
        },
        headers=auth_headers_user_a,
    )
    assert trip_res.status_code == 201
    trip_data = trip_res.json()["data"]
    trip_id = trip_data["id"]

    raw_itinerary = {
        "trip_id": trip_id,
        "user_id": trip_data["user_id"],
        "title": "Manali Mountain Escape",
        "summary": "3-day adventure in the Himalayas",
        "status": "generated",
        "days": [
            {
                "day_number": 1,
                "date": "2026-12-10",
                "theme": "Arrival & Old Manali",
                "activities": [
                    {
                        "name": "Check-in & Cafes",
                        "description": "Relax at Old Manali riverside cafes",
                        "category": "food",
                        "start_time": "12:00",
                        "duration_minutes": 120,
                        "estimated_cost": 1500.0,
                        "cost_currency": "INR",
                        "transport": {"estimated_cost": 300.0, "mode": "taxi"},
                    }
                ],
            }
        ],
        "budget": {
            "currency": "INR",
            "total_estimated": 1800.0,
            "categories": {
                "transport": 300.0,
                "accommodation": 0.0,
                "food": 1500.0,
                "activities": 0.0,
                "miscellaneous": 0.0,
            },
        },
    }
    created_itinerary = await itinerary_repo.create(raw_itinerary)
    return trip_data, created_itinerary


def test_ai_generate_creates_itinerary(client: TestClient, auth_headers_user_a: dict[str, str]):
    """Verify POST /api/v1/itineraries/generate generates and saves itinerary using Groq AI."""
    # 1. Create a trip
    trip_res = client.post(
        "/api/v1/trips",
        json={
            "destination": "Shimla, Himachal Pradesh",
            "start_date": "2026-12-10",
            "end_date": "2026-12-11",
            "budget": 15000,
            "currency": "INR",
        },
        headers=auth_headers_user_a,
    )
    assert trip_res.status_code == 201
    trip_id = trip_res.json()["data"]["id"]

    # 2. Generate itinerary with mocked Groq response
    with patch.object(groq_service, "generate_itinerary", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = MOCK_GENERATED_PLAN

        gen_res = client.post(
            "/api/v1/itineraries/generate",
            json={"trip_id": trip_id},
            headers=auth_headers_user_a,
        )
        assert gen_res.status_code == 201
        data = gen_res.json()["data"]
        assert data["title"] == "Himachal Mountain Retreat"
        assert len(data["days"]) == 2
        assert mock_gen.call_count == 1
        # Deterministic Python budget recalculation:
        # Day 1: 1200 (food) + 200 (act) + 250 (trans) = 1650
        # Day 2: 3500 (act) + 1500 (trans) = 5000
        # Total = 6650
        assert data["budget"]["total_estimated"] == 6650.0

        # 3. Token optimization: duplicate generate call without regenerate=True reuses saved itinerary (0 Groq calls!)
        repeat_res = client.post(
            "/api/v1/itineraries/generate",
            json={"trip_id": trip_id, "regenerate": False},
            headers=auth_headers_user_a,
        )
        assert repeat_res.status_code == 201
        assert repeat_res.json()["data"]["id"] == data["id"]
        assert mock_gen.call_count == 1  # Not called again!


def test_ai_generate_bola_prevention(
    client: TestClient,
    auth_headers_user_a: dict[str, str],
    auth_headers_user_b: dict[str, str],
):
    """User B cannot generate an itinerary for User A's trip."""
    trip_res = client.post(
        "/api/v1/trips",
        json={
            "destination": "Udaipur, Rajasthan",
            "start_date": "2026-12-01",
            "end_date": "2026-12-03",
            "budget": 25000,
            "currency": "INR",
        },
        headers=auth_headers_user_a,
    )
    trip_id = trip_res.json()["data"]["id"]

    gen_res = client.post(
        "/api/v1/itineraries/generate",
        json={"trip_id": trip_id},
        headers=auth_headers_user_b,
    )
    assert gen_res.status_code in (403, 404)
    assert gen_res.json()["success"] is False


def test_ai_single_day_regenerate(
    client: TestClient,
    auth_headers_user_a: dict[str, str],
    sample_trip_and_itinerary,
):
    """Verify surgical single-day regeneration updates target day and recalculates budget."""
    trip_data, itinerary_data = sample_trip_and_itinerary
    itin_id = getattr(itinerary_data, "id", None) or itinerary_data["id"]

    with patch.object(groq_service, "regenerate_single_day", new_callable=AsyncMock) as mock_regen:
        mock_regen.return_value = MOCK_REGENERATED_DAY

        res = client.post(
            f"/api/v1/itineraries/{itin_id}/days/1/regenerate",
            json={"instruction": "Focus on art galleries and castles"},
            headers=auth_headers_user_a,
        )
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["days"][0]["theme"] == "Art & Himalayan Heritage"
        assert data["days"][0]["activities"][0]["name"] == "Naggar Castle & Roerich Gallery"
        # Deterministic Python recalculation: 500 (act) + 800 (trans) = 1300
        assert data["budget"]["total_estimated"] == 1300.0
        assert data["budget"]["categories"]["activities"] == 500.0
        assert data["budget"]["categories"]["transport"] == 800.0


@pytest.mark.asyncio
async def test_itinerary_retrieval_and_budget_analysis(
    client: TestClient,
    auth_headers_user_a: dict[str, str],
    sample_trip_and_itinerary,
):
    """Test itinerary fetch and budget breakdown analysis."""
    trip_data, itinerary_data = sample_trip_and_itinerary
    itin_id = getattr(itinerary_data, "id", None) or itinerary_data["id"]

    # Fetch itinerary
    get_res = client.get(f"/api/v1/itineraries/{itin_id}", headers=auth_headers_user_a)
    assert get_res.status_code == 200
    assert get_res.json()["data"]["title"] == "Manali Mountain Escape"

    # Fetch budget analysis
    budget_res = client.get(f"/api/v1/itineraries/{itin_id}/budget", headers=auth_headers_user_a)
    assert budget_res.status_code == 200
    b_data = budget_res.json()["data"]
    assert b_data["trip_budget"] == 20000.0
    assert b_data["total_estimated"] == 1800.0
    assert b_data["is_over_budget"] is False
    assert b_data["categories"]["food"] == 1500.0
    assert b_data["categories"]["transport"] == 300.0


@pytest.mark.asyncio
async def test_patch_itinerary_recalculates_budget(
    client: TestClient,
    auth_headers_user_a: dict[str, str],
    sample_trip_and_itinerary,
):
    """Patching itinerary activities triggers deterministic budget recalculation."""
    trip_data, itinerary_data = sample_trip_and_itinerary
    itin_id = getattr(itinerary_data, "id", None) or itinerary_data["id"]

    patch_payload = {
        "title": "Manali Snow Adventure",
        "days": [
            {
                "day_number": 1,
                "date": "2026-12-10",
                "theme": "Solang Valley Snow",
                "activities": [
                    {
                        "name": "Skiing at Solang",
                        "description": "Ski session with instructor",
                        "category": "activities",
                        "start_time": "10:00",
                        "duration_minutes": 180,
                        "estimated_cost": 5000.0,
                        "cost_currency": "INR",
                        "transport": {"estimated_cost": 1200.0, "mode": "4x4 Jeep"},
                    },
                    {
                        "name": "Mountain Hot Pot Dinner",
                        "description": "Hot local dinner",
                        "category": "food",
                        "start_time": "19:00",
                        "duration_minutes": 90,
                        "estimated_cost": 2000.0,
                        "cost_currency": "INR",
                    },
                ],
            }
        ],
    }

    patch_res = client.patch(f"/api/v1/itineraries/{itin_id}", json=patch_payload, headers=auth_headers_user_a)
    assert patch_res.status_code == 200
    updated_data = patch_res.json()["data"]
    assert updated_data["title"] == "Manali Snow Adventure"
    # Recalculated total = 5000 + 1200 + 2000 = 8200
    assert updated_data["budget"]["total_estimated"] == 8200.0
    assert updated_data["budget"]["categories"]["activities"] == 5000.0
    assert updated_data["budget"]["categories"]["transport"] == 1200.0
    assert updated_data["budget"]["categories"]["food"] == 2000.0


@pytest.mark.asyncio
async def test_export_itinerary_pdf(
    client: TestClient,
    auth_headers_user_a: dict[str, str],
    sample_trip_and_itinerary,
):
    """Exporting itinerary generates valid application/pdf binary."""
    trip_data, itinerary_data = sample_trip_and_itinerary
    itin_id = getattr(itinerary_data, "id", None) or itinerary_data["id"]

    pdf_res = client.get(f"/api/v1/itineraries/{itin_id}/export/pdf", headers=auth_headers_user_a)
    assert pdf_res.status_code == 200
    assert pdf_res.headers.get("content-type") == "application/pdf"
    assert pdf_res.content.startswith(b"%PDF-")
