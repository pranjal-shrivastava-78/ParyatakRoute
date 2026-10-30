"""
ParyatakRoute Phase 3 Stage 4 Integration Test Suite
Validates:
1. Day-wise surgical regeneration (POST /itineraries/{id}/days/{day}/regenerate)
2. Deterministic budget analytics (GET /itineraries/{id}/budget)
3. PDF report generation and binary download (GET /itineraries/{id}/export/pdf)
4. Nominatim destination geocoding (GET /destinations)
5. Open-Meteo live weather forecasts (GET /weather)
6. Project OSRM driving route calculations (POST /directions)
7. ExchangeRate-API currency rates & conversion (GET /currency/rates, GET /currency/convert)
8. Guest itinerary claim lifecycle & duplicate claim prevention
"""

import json
import random
import sys
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000/api/v1"

def make_req(method, endpoint, data=None, token=None, return_raw_bytes=False):
    url = f"{BASE_URL}{endpoint}"
    encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content_type = resp.headers.get("Content-Type", "")
            raw = resp.read()
            if return_raw_bytes or "application/pdf" in content_type:
                return resp.status, raw, content_type
            parsed = json.loads(raw.decode("utf-8")) if raw else {}
            return resp.status, parsed, content_type
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            parsed = json.loads(raw.decode("utf-8"))
        except Exception:
            parsed = {"raw": raw.decode("utf-8", errors="replace")}
        return e.code, parsed, e.headers.get("Content-Type", "")

def run_tests():
    print("=== STARTING STAGE 4 FULL INTEGRATION TEST SUITE ===")

    # 1. Test Nominatim Destination Geocoding
    print("\n[Test 1] Geocoding destination via Nominatim (GET /destinations)...")
    status, res, _ = make_req("GET", "/destinations?query=Varanasi&limit=3")
    assert status == 200, f"Expected 200, got {status}: {res}"
    dest_list = res.get("data", [])
    assert len(dest_list) > 0, "No destinations returned by Nominatim"
    place = dest_list[0]
    assert "name" in place and "latitude" in place and "longitude" in place
    print(f" -> Geocoded '{place['name']}' ({place['latitude']}, {place['longitude']}) via {place.get('attribution')}")

    # 2. Test Open-Meteo Weather Forecast
    print("\n[Test 2] Live weather forecast via Open-Meteo (GET /weather)...")
    status, res, _ = make_req("GET", f"/weather?lat={place['latitude']}&lon={place['longitude']}")
    assert status == 200, f"Expected 200, got {status}: {res}"
    w_data = res.get("data", {})
    forecasts = w_data.get("forecast_days", [])
    assert len(forecasts) > 0, "No weather forecast days returned"
    today_w = forecasts[0]
    assert "max_temp_c" in today_w and "min_temp_c" in today_w and "condition" in today_w
    print(f" -> Weather for {place['name']}: {today_w['condition']}, High {today_w['max_temp_c']}°C, Low {today_w['min_temp_c']}°C")

    # 3. Test Project OSRM Route Directions
    print("\n[Test 3] Calculate driving route via Project OSRM (POST /directions)...")
    delhi_coords = [77.2090, 28.6139]
    varanasi_coords = [place['longitude'], place['latitude']]
    dir_payload = {
        "coordinates": [delhi_coords, varanasi_coords]
    }
    status, res, _ = make_req("POST", "/directions", dir_payload)
    assert status == 200, f"Expected 200, got {status}: {res}"
    dir_data = res.get("data", {})
    assert "distance_km" in dir_data and "duration_minutes" in dir_data
    assert dir_data["distance_km"] > 0
    print(f" -> Route calculated: {dir_data['distance_km']} km, ~{round(dir_data['duration_minutes'])} mins via {dir_data.get('provider')}")

    # 4. Test Currency Exchange Rates & Conversion
    print("\n[Test 4] Exchange rates via ExchangeRate-API (GET /currency/rates)...")
    status, res, _ = make_req("GET", "/currency/rates?base=USD")
    assert status == 200, f"Expected 200, got {status}: {res}"
    rates = res["data"]["rates"]
    assert "INR" in rates and "EUR" in rates and "GBP" in rates
    print(f" -> Live Rates: 1 USD = {rates['INR']} INR, {rates['EUR']} EUR, {rates['GBP']} GBP")

    print("\n[Test 5] Currency amount conversion (GET /currency/convert)...")
    status, res, _ = make_req("GET", "/currency/convert?from=USD&to=INR&amount=250")
    assert status == 200, f"Expected 200, got {status}: {res}"
    conv = res["data"]
    assert conv["converted_amount"] > 0 and conv["rate"] > 0
    print(f" -> Converted 250 USD = {conv['converted_amount']} INR (Rate: {conv['rate']})")

    # 5. Generate Itinerary anonymously
    print("\n[Test 6] Generate itinerary anonymously (POST /itineraries/generate)...")
    gen_payload = {
        "preferences": {
            "destination": "Varanasi, Uttar Pradesh",
            "start_date": "2026-11-20",
            "end_date": "2026-11-22",
            "travelers_count": 2,
            "budget": 20000,
            "currency": "INR",
            "travel_style": "cultural",
            "interests": ["ghats", "spirituality", "street food"]
        }
    }
    status, res, _ = make_req("POST", "/itineraries/generate", gen_payload)
    assert status in (200, 201), f"Expected 200/201, got {status}: {res}"
    itin = res["data"]
    itin_id = itin["id"]
    assert len(itin.get("days", [])) >= 2
    day1_original_title = itin["days"][0].get("theme")
    print(f" -> Generated {len(itin['days'])}-day itinerary ID: {itin_id}")

    # 6. Surgical Day-wise Regeneration
    print(f"\n[Test 7] Surgically regenerate Day 1 (POST /itineraries/{itin_id}/days/1/regenerate)...")
    regen_payload = {
        "instruction": "Focus heavily on sunrise boat ride on the Ganges and ancient silk weavers",
        "preferences": {"pacing": "relaxed"}
    }
    status, res, _ = make_req("POST", f"/itineraries/{itin_id}/days/1/regenerate", regen_payload)
    assert status == 200, f"Expected 200, got {status}: {res}"
    updated_itin = res["data"]
    assert len(updated_itin["days"]) == len(itin["days"])
    # Day 2 should remain unchanged
    assert updated_itin["days"][1]["theme"] == itin["days"][1]["theme"]
    print(" -> Day 1 regenerated successfully. Day 2 schedule preserved.")

    # 7. Deterministic Budget Analytics
    print(f"\n[Test 8] Deterministic budget analysis (GET /itineraries/{itin_id}/budget)...")
    status, res, _ = make_req("GET", f"/itineraries/{itin_id}/budget")
    assert status == 200, f"Expected 200, got {status}: {res}"
    analysis = res["data"]
    assert "total_estimated" in analysis
    assert "categories" in analysis
    cats = analysis["categories"]
    assert "transport" in cats and "accommodation" in cats and "food" in cats and "activities" in cats
    print(f" -> Budget breakdown: Total={analysis['currency']} {analysis['total_estimated']} (Transport: {cats['transport']}, Food: {cats['food']}, Activities: {cats['activities']})")

    # 8. ReportLab PDF Document Export
    print(f"\n[Test 9] PDF Document export (GET /itineraries/{itin_id}/export/pdf)...")
    status, raw_pdf, content_type = make_req("GET", f"/itineraries/{itin_id}/export/pdf", return_raw_bytes=True)
    assert status == 200, f"Expected 200, got {status}"
    assert "application/pdf" in content_type, f"Expected application/pdf, got {content_type}"
    assert raw_pdf.startswith(b"%PDF-"), "Exported content does not have valid PDF magic byte header"
    print(f" -> PDF generated successfully! Size: {len(raw_pdf)} bytes. Magic header: {raw_pdf[:8].decode(errors='ignore')}")

    # 9. Register User and Test Guest Itinerary Claiming & Duplicate Prevention
    u1_email = f"stage4_user1_{random.randint(10000, 99999)}@example.com"
    print(f"\n[Test 10] Register User 1 ({u1_email}) and claim guest itinerary...")
    status, res, _ = make_req("POST", "/auth/register", {
        "email": u1_email,
        "password": "Password123!",
        "name": "Stage 4 Tester"
    })
    assert status == 201
    user1_token = res["data"]["tokens"]["accessToken"]
    user1_id = res["data"]["user"]["id"]

    status, res, _ = make_req("POST", f"/itineraries/{itin_id}/claim", token=user1_token)
    assert status == 200, f"Expected 200, got {status}: {res}"
    claimed_itin = res["data"]
    assert claimed_itin["user_id"] == user1_id
    assert claimed_itin["trip_id"] is not None
    print(f" -> Claimed itinerary! User ID: {claimed_itin['user_id']}, Trip ID: {claimed_itin['trip_id']}")

    print("\n[Test 11] Duplicate claim check for the SAME user (idempotency)...")
    status, res, _ = make_req("POST", f"/itineraries/{itin_id}/claim", token=user1_token)
    assert status == 200, f"Expected 200 idempotent response, got {status}: {res}"
    print(" -> Duplicate claim by same user handled idempotently.")

    print("\n[Test 12] Cross-user duplicate claim prevention (User 2 claiming User 1's claimed itinerary)...")
    u2_email = f"stage4_user2_{random.randint(10000, 99999)}@example.com"
    status, res, _ = make_req("POST", "/auth/register", {
        "email": u2_email,
        "password": "Password123!",
        "name": "Stage 4 Competitor"
    })
    assert status == 201
    user2_token = res["data"]["tokens"]["accessToken"]

    status, res, _ = make_req("POST", f"/itineraries/{itin_id}/claim", token=user2_token)
    assert status == 409, f"Expected 409 Conflict, got {status}: {res}"
    print(f" -> Duplicate claim prevented with status 409 Conflict: {res.get('error', {}).get('message')}")

    print("\n========================================================")
    print("ALL 12 STAGE 4 INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
    print("========================================================")

if __name__ == "__main__":
    run_tests()
