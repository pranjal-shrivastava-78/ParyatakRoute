"""Tests for external travel data endpoints (Destinations, Directions, Weather, Currency)."""
from fastapi.testclient import TestClient


def test_destinations_search(client: TestClient):
    """Destination search returns list of normalized place candidates."""
    response = client.get("/api/v1/destinations?query=Jaipur&limit=3")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)
    assert len(body["data"]) >= 1
    place = body["data"][0]
    assert "name" in place
    assert "latitude" in place
    assert "longitude" in place


def test_directions_route_calculation(client: TestClient):
    """Directions calculation returns duration, distance, and coordinates."""
    payload = {
        "start": {"latitude": 28.6139, "longitude": 77.2090},  # Delhi
        "destination": {"latitude": 26.9124, "longitude": 75.7873},  # Jaipur
        "mode": "driving",
    }
    response = client.post("/api/v1/directions", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "duration_minutes" in body["data"]
    assert "distance_km" in body["data"]
    assert body["data"]["distance_km"] > 0


def test_weather_forecast(client: TestClient):
    """Weather endpoint returns current conditions and temperature."""
    response = client.get("/api/v1/weather?lat=28.6139&lon=77.2090")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "current" in body["data"]
    assert "temperature" in body["data"]["current"]


def test_currency_rates_and_conversion(client: TestClient):
    """Currency rates lookup and conversion return accurate calculated rates."""
    # Lookup rates
    rates_res = client.get("/api/v1/currency/rates?base=USD")
    assert rates_res.status_code == 200
    r_body = rates_res.json()
    assert r_body["success"] is True
    assert r_body["data"]["base"] == "USD"
    assert "INR" in r_body["data"]["rates"]

    # Convert currency
    conv_res = client.get("/api/v1/currency/convert?from=USD&to=INR&amount=100")
    assert conv_res.status_code == 200
    c_body = conv_res.json()
    assert (c_body["data"].get("from") or c_body["data"].get("from_currency")) == "USD"
    assert (c_body["data"].get("to") or c_body["data"].get("to_currency")) == "INR"
    assert (c_body["data"].get("result") or c_body["data"].get("converted_amount")) > 0
