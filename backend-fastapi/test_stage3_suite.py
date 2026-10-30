"""
ParyatakRoute Phase 3 Stage 3 Integration Test Suite
Validates:
- Trip creation, listing, updating, deletion, and duplicate
- Favourite bookmarking, listing, and deletion
- Profile info fetching and updating (PATCH /auth/me)
- Guest itinerary claiming flow (POST /itineraries/{id}/claim)
- Cross-user data isolation and authorization (BOLA)
- Unauthenticated access control (401)
"""

import json
import random
import sys
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000/api/v1"

def make_req(method, endpoint, data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            parsed = json.loads(content)
        except Exception:
            parsed = {"raw": content}
        return e.code, parsed

def run_tests():
    print("=== STARTING STAGE 3 FULL INTEGRATION TEST SUITE ===")

    # 1. Register User 1
    u1_email = f"stage3_user1_{random.randint(10000, 99999)}@example.com"
    print(f"\n[Test 1] Register User 1 ({u1_email})...")
    status, res = make_req("POST", "/auth/register", {
        "email": u1_email,
        "password": "Password123!",
        "name": "User One"
    })
    assert status == 201, f"Expected 201, got {status}: {res}"
    user1_token = res["data"]["tokens"]["accessToken"]
    user1_id = res["data"]["user"]["id"]
    print(f" -> User 1 registered. ID: {user1_id}")

    # 2. Get User 1 Profile (GET /auth/me)
    print("\n[Test 2] Fetch profile GET /auth/me...")
    status, res = make_req("GET", "/auth/me", token=user1_token)
    assert status == 200, f"Expected 200, got {status}: {res}"
    assert res["data"]["name"] == "User One"
    print(f" -> Profile verified: {res['data']['name']} ({res['data']['email']})")

    # 3. Update User 1 Profile (PATCH /auth/me)
    print("\n[Test 3] Update profile PATCH /auth/me...")
    status, res = make_req("PATCH", "/auth/me", {"name": "User One Senior"}, token=user1_token)
    assert status == 200, f"Expected 200, got {status}: {res}"
    assert res["data"]["name"] == "User One Senior", f"Name was not updated: {res}"
    print(f" -> Profile updated successfully to '{res['data']['name']}'")

    # 4. Verify Trips Empty State (GET /trips)
    print("\n[Test 4] Verify initial trips empty state...")
    status, res = make_req("GET", "/trips", token=user1_token)
    assert status == 200, f"Expected 200, got {status}: {res}"
    assert res["data"]["total"] == 0
    print(f" -> Trips count is 0 as expected.")

    # 5. Create a Trip (POST /trips)
    print("\n[Test 5] Create a new trip (POST /trips)...")
    trip_payload = {
        "destination": "Goa, India",
        "starting_city": "Mumbai",
        "start_date": "2026-12-10",
        "end_date": "2026-12-15",
        "status": "planned",
        "budget": 35000,
        "currency": "INR",
        "travelers_count": 2,
        "additional_notes": "Book sunset cruise in advance"
    }
    status, res = make_req("POST", "/trips", trip_payload, token=user1_token)
    assert status == 201, f"Expected 201, got {status}: {res}"
    trip1_id = res["data"]["id"]
    print(f" -> Trip created successfully with ID: {trip1_id}")

    # 6. Retrieve Trip Details (GET /trips/{id})
    print(f"\n[Test 6] Retrieve trip details GET /trips/{trip1_id}...")
    status, res = make_req("GET", f"/trips/{trip1_id}", token=user1_token)
    assert status == 200, f"Expected 200, got {status}: {res}"
    assert res["data"]["destination"] == "Goa, India"
    assert res["data"]["budget"] == 35000
    print(" -> Trip details retrieved and validated.")

    # 7. Update Trip (PUT /trips/{id})
    print(f"\n[Test 7] Update trip details PUT /trips/{trip1_id}...")
    update_payload = {
        "budget": 42000,
        "status": "planned",
        "additional_notes": "Book sunset cruise and luxury beach resort"
    }
    status, res = make_req("PUT", f"/trips/{trip1_id}", update_payload, token=user1_token)
    assert status == 200, f"Expected 200, got {status}: {res}"
    assert res["data"]["budget"] == 42000
    print(f" -> Trip updated successfully: destination={res['data']['destination']}, budget={res['data']['budget']}")

    # 8. Add Destination to Favourites (POST /favourites)
    print("\n[Test 8] Add destination to favourites (POST /favourites)...")
    fav_payload = {
        "place_id": "osm_rel_jaipur_01",
        "name": "Jaipur, Rajasthan",
        "display_name": "Jaipur, Rajasthan, India",
        "latitude": 26.9124,
        "longitude": 75.7873,
        "category": "tourism",
        "type": "destination",
        "notes": "Must visit Amber Fort & Hawa Mahal"
    }
    status, res = make_req("POST", "/favourites", fav_payload, token=user1_token)
    assert status == 201, f"Expected 201, got {status}: {res}"
    fav_id = res["data"]["id"]
    print(f" -> Destination favourited successfully with ID: {fav_id}")

    # 9. List Favourites (GET /favourites)
    print("\n[Test 9] List favourites GET /favourites...")
    status, res = make_req("GET", "/favourites", token=user1_token)
    assert status == 200, f"Expected 200, got {status}: {res}"
    fav_items = res["data"]["items"]
    assert len(fav_items) >= 1
    assert any(f["place_id"] == "osm_rel_jaipur_01" for f in fav_items)
    print(f" -> Favourites listed successfully. Count: {len(fav_items)}")

    # 10. Delete Favourite (DELETE /favourites/{id})
    print(f"\n[Test 10] Delete favourite DELETE /favourites/{fav_id}...")
    status, res = make_req("DELETE", f"/favourites/{fav_id}", token=user1_token)
    assert status == 200, f"Expected 200, got {status}: {res}"
    # Verify removal
    _, res_after = make_req("GET", "/favourites", token=user1_token)
    assert not any(f["id"] == fav_id for f in res_after["data"]["items"])
    print(" -> Favourite deleted and confirmed absent from list.")

    # 11. Guest Itinerary Generation (POST /itineraries/generate without token)
    print("\n[Test 11] Generate guest itinerary anonymously (POST /itineraries/generate)...")
    guest_gen_payload = {
        "preferences": {
            "destination": "Shimla, Himachal Pradesh",
            "start_date": "2026-11-15",
            "end_date": "2026-11-18",
            "travelers_count": 2,
            "budget": 25000,
            "currency": "INR",
            "travel_style": "balanced",
            "interests": ["mountains", "nature"]
        }
    }
    status, res = make_req("POST", "/itineraries/generate", guest_gen_payload)
    assert status in (200, 201), f"Expected 200/201, got {status}: {res}"
    guest_itin_id = res["data"]["id"]
    print(f" -> Guest itinerary generated successfully! ID: {guest_itin_id}")

    # 12. Claim Guest Itinerary (POST /itineraries/{id}/claim with User 1 token)
    print(f"\n[Test 12] Claim guest itinerary into User 1's account (POST /itineraries/{guest_itin_id}/claim)...")
    status, res = make_req("POST", f"/itineraries/{guest_itin_id}/claim", token=user1_token)
    assert status == 200, f"Expected 200, got {status}: {res}"
    claimed_itin = res["data"]
    assert claimed_itin["user_id"] == user1_id, f"Expected {user1_id}, got {claimed_itin.get('user_id')}"
    assert claimed_itin["trip_id"] is not None
    print(f" -> Itinerary claimed! Associated Trip ID: {claimed_itin['trip_id']}, User ID: {claimed_itin['user_id']}")

    # 13. Verify Trips Count is now 2
    print("\n[Test 13] Verify User 1 trips count after claim...")
    status, res = make_req("GET", "/trips", token=user1_token)
    assert status == 200, f"Expected 200, got {status}: {res}"
    assert res["data"]["total"] == 2
    print(f" -> User 1 trips count confirmed: {res['data']['total']}")

    # 14. BOLA (Broken Object Level Authorization) Check with User 2
    u2_email = f"stage3_user2_{random.randint(10000, 99999)}@example.com"
    print(f"\n[Test 14] Register User 2 ({u2_email}) for cross-user isolation checks...")
    status, res = make_req("POST", "/auth/register", {
        "email": u2_email,
        "password": "Password123!",
        "name": "User Two"
    })
    assert status == 201
    user2_token = res["data"]["tokens"]["accessToken"]

    print(f" -> User 2 attempting to GET User 1's trip ({trip1_id})...")
    status, res = make_req("GET", f"/trips/{trip1_id}", token=user2_token)
    assert status == 403, f"Expected 403 Forbidden for User 2 reading User 1's trip, got {status}: {res}"
    print(f" -> BOLA Protected: GET returned {status} Forbidden.")

    print(f" -> User 2 attempting to DELETE User 1's trip ({trip1_id})...")
    status, res = make_req("DELETE", f"/trips/{trip1_id}", token=user2_token)
    assert status == 403, f"Expected 403 Forbidden for User 2 deleting User 1's trip, got {status}: {res}"
    print(f" -> BOLA Protected: DELETE returned {status} Forbidden.")

    # 15. User 1 Deletes Trip
    print(f"\n[Test 15] User 1 deletes their own trip ({trip1_id})...")
    status, res = make_req("DELETE", f"/trips/{trip1_id}", token=user1_token)
    assert status == 200, f"Expected 200, got {status}: {res}"
    status, res = make_req("GET", "/trips", token=user1_token)
    assert res["data"]["total"] == 1
    print(f" -> Trip deleted. Remaining trips: {res['data']['total']}")

    # 16. Unauthenticated Access Protection
    print("\n[Test 16] Verify unauthenticated requests to protected endpoints return 401...")
    status, _ = make_req("GET", "/trips")
    assert status == 401, f"Expected 401, got {status}"
    status, _ = make_req("GET", "/favourites")
    assert status == 401, f"Expected 401, got {status}"
    status, _ = make_req("GET", "/auth/me")
    assert status == 401, f"Expected 401, got {status}"
    print(" -> All protected endpoints strictly require authentication (401 returned).")

    print("\n========================================================")
    print("ALL 16 INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
    print("========================================================")

if __name__ == "__main__":
    run_tests()
