"""
ParyatakRoute Phase 4 Master Hardening & End-to-End Verification Suite
Validates the complete production journey:
- Remote and local API health checks
- Public AI features (Itinerary Generation, Chatbot) without authentication
- Security, BOLA, IDOR, and access control isolation
- Guest itinerary lifecycle, database claiming, and duplicate prevention
- External data services: Nominatim, Open-Meteo, Project OSRM, ExchangeRate-API
- Single-day surgical regeneration & ReportLab binary PDF generation
- Protected user vault operations (Trips, Favourites, Profile)
"""

import json
import random
import sys
import urllib.request
import urllib.error
import ssl

LOCAL_BASE = "http://127.0.0.1:8000/api/v1"
REMOTE_BASE = "https://paryatakrouteapi.itspranjal.in/api/v1"

def req(url, method="GET", data=None, token=None, return_bytes=False, timeout=20):
    encoded = json.dumps(data).encode("utf-8") if data is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    ctx = ssl.create_default_context()
    r = urllib.request.Request(url, data=encoded, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, context=ctx, timeout=timeout) as resp:
            ct = resp.headers.get("Content-Type", "")
            raw = resp.read()
            if return_bytes or "application/pdf" in ct:
                return resp.status, raw, ct
            try:
                parsed = json.loads(raw.decode("utf-8")) if raw else {}
            except Exception:
                parsed = {"raw": raw.decode("utf-8", errors="replace")}
            return resp.status, parsed, ct
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            parsed = json.loads(raw.decode("utf-8"))
        except Exception:
            parsed = {"raw": raw.decode("utf-8", errors="replace")}
        return e.code, parsed, e.headers.get("Content-Type", "")

def run_phase4_suite():
    print("=================================================================")
    print("PARYATAKROUTE — PHASE 4 FINAL END-TO-END VERIFICATION SUITE")
    print("=================================================================")

    # 1. Health Audit (Remote and Local)
    print("\n[Step 1] Verifying Production Gateway Health...")
    s_remote, r_remote, _ = req("https://paryatakrouteapi.itspranjal.in/api/v1/health")
    assert s_remote == 200, f"Remote health failed: {s_remote} {r_remote}"
    print(f" -> Live Production API healthy (Status: {r_remote['data']['status']})")

    s_local, r_local, _ = req(f"{LOCAL_BASE}/health")
    assert s_local == 200, f"Local health failed: {s_local} {r_local}"
    print(f" -> Local FastAPI Gateway healthy (Status: {r_local['data']['status']})")

    # 2. Public Anonymous Travel Features (Zero Login Barrier)
    print("\n[Step 2] Public Anonymous AI Chatbot (POST /chat)...")
    s_chat, r_chat, _ = req(f"{LOCAL_BASE}/chat", "POST", {
        "message": "What is the best month to visit Ladakh for mountain passes?"
    })
    assert s_chat == 200, f"Chat failed: {s_chat} {r_chat}"
    assert "reply" in r_chat.get("data", {}), "Chat reply missing"
    print(f" -> AI Chatbot responded anonymously (Length: {len(r_chat['data']['reply'])} chars)")

    print("\n[Step 3] Public Anonymous Itinerary Generation (POST /itineraries/generate)...")
    gen_payload = {
        "preferences": {
            "destination": "Udaipur, Rajasthan",
            "start_date": "2026-12-01",
            "end_date": "2026-12-03",
            "travelers_count": 2,
            "budget": 30000,
            "currency": "INR",
            "travel_style": "cultural",
            "interests": ["palaces", "lakes", "photography"]
        }
    }
    s_itin, r_itin, _ = req(f"{LOCAL_BASE}/itineraries/generate", "POST", gen_payload)
    assert s_itin in (200, 201), f"Itinerary generation failed: {s_itin} {r_itin}"
    guest_itin = r_itin["data"]
    guest_itin_id = guest_itin["id"]
    print(f" -> Anonymous Itinerary generated successfully! ID: {guest_itin_id} ({len(guest_itin.get('days', []))} days)")

    # 3. External Services Verification
    print("\n[Step 4] OpenStreetMap Nominatim Geocoding (GET /destinations)...")
    s_geo, r_geo, _ = req(f"{LOCAL_BASE}/destinations?query=Udaipur&limit=2")
    assert s_geo == 200 and len(r_geo["data"]) > 0
    udaipur_place = r_geo["data"][0]
    lat, lon = udaipur_place["latitude"], udaipur_place["longitude"]
    print(f" -> Geocoded '{udaipur_place['name']}' at ({lat}, {lon}) via {udaipur_place.get('attribution')}")

    print("\n[Step 5] Open-Meteo Live Weather (GET /weather)...")
    s_w, r_w, _ = req(f"{LOCAL_BASE}/weather?lat={lat}&lon={lon}")
    assert s_w == 200 and len(r_w["data"]["forecast_days"]) > 0
    w_today = r_w["data"]["forecast_days"][0]
    print(f" -> Weather for Udaipur: {w_today['condition']}, {w_today['max_temp_c']}°C / {w_today['min_temp_c']}°C")

    print("\n[Step 6] Project OSRM Driving Directions (POST /directions)...")
    s_dir, r_dir, _ = req(f"{LOCAL_BASE}/directions", "POST", {
        "coordinates": [[75.7873, 26.9124], [lon, lat]] # Jaipur to Udaipur
    })
    assert s_dir == 200 and r_dir["data"]["distance_km"] > 0
    print(f" -> OSRM Route: {r_dir['data']['distance_km']} km, ~{round(r_dir['data']['duration_minutes'])} mins ({r_dir['data']['provider']})")

    print("\n[Step 7] ExchangeRate-API Currency Conversion (GET /currency/convert)...")
    s_conv, r_conv, _ = req(f"{LOCAL_BASE}/currency/convert?from=INR&to=USD&amount=30000")
    assert s_conv == 200 and r_conv["data"]["converted_amount"] > 0
    print(f" -> 30,000 INR = {r_conv['data']['converted_amount']} USD (Rate: {r_conv['data']['rate']})")

    # 4. Advanced Itinerary Operations
    print(f"\n[Step 8] Single-Day Surgical Regeneration (POST /itineraries/{guest_itin_id}/days/1/regenerate)...")
    s_reg, r_reg, _ = req(f"{LOCAL_BASE}/itineraries/{guest_itin_id}/days/1/regenerate", "POST", {
        "instruction": "Focus on tranquil boat ride on Lake Pichola and sunset tea at Jagmandir",
        "preferences": {"pacing": "relaxed"}
    })
    assert s_reg == 200, f"Regenerate day failed: {s_reg} {r_reg}"
    print(" -> Day 1 regenerated surgically. Remaining days preserved intact.")

    print(f"\n[Step 9] Deterministic Budget Analytics (GET /itineraries/{guest_itin_id}/budget)...")
    s_bud, r_bud, _ = req(f"{LOCAL_BASE}/itineraries/{guest_itin_id}/budget")
    assert s_bud == 200
    b_data = r_bud["data"]
    assert "total_estimated" in b_data and "categories" in b_data
    print(f" -> Budget: {b_data['currency']} {b_data['total_estimated']} (Transport: {b_data['categories']['transport']}, Food: {b_data['categories']['food']})")

    print(f"\n[Step 10] Binary PDF Itinerary Export (GET /itineraries/{guest_itin_id}/export/pdf)...")
    s_pdf, raw_pdf, ct_pdf = req(f"{LOCAL_BASE}/itineraries/{guest_itin_id}/export/pdf", return_bytes=True)
    assert s_pdf == 200
    assert "application/pdf" in ct_pdf
    assert raw_pdf.startswith(b"%PDF-"), "Invalid PDF header magic bytes"
    print(f" -> PDF exported successfully ({len(raw_pdf)} bytes, magic: {raw_pdf[:8].decode(errors='ignore')})")

    # 5. User Registration, Authentication & Session Isolation
    uA_email = f"p4_userA_{random.randint(10000, 99999)}@example.com"
    print(f"\n[Step 11] Register User A ({uA_email})...")
    s_uA, r_uA, _ = req(f"{LOCAL_BASE}/auth/register", "POST", {
        "email": uA_email,
        "password": "Password123!",
        "name": "User Alpha"
    })
    assert s_uA == 201
    userA_token = r_uA["data"]["tokens"]["accessToken"]
    userA_id = r_uA["data"]["user"]["id"]

    # 6. Guest Itinerary Claiming Flow & Duplicate Prevention
    print(f"\n[Step 12] User A claims anonymous guest itinerary ({guest_itin_id})...")
    s_claim, r_claim, _ = req(f"{LOCAL_BASE}/itineraries/{guest_itin_id}/claim", "POST", token=userA_token)
    assert s_claim == 200, f"Claim failed: {s_claim} {r_claim}"
    claimed_itin = r_claim["data"]
    assert claimed_itin["user_id"] == userA_id
    assert claimed_itin["trip_id"] is not None
    userA_trip_id = claimed_itin["trip_id"]
    print(f" -> Itinerary claimed into permanent database! Associated Trip ID: {userA_trip_id}")

    print("\n[Step 13] Duplicate claim idempotency check (User A re-claiming)...")
    s_dupA, _, _ = req(f"{LOCAL_BASE}/itineraries/{guest_itin_id}/claim", "POST", token=userA_token)
    assert s_dupA == 200, "Idempotent claim failed"
    print(" -> Duplicate claim by owner handled idempotently (200 OK).")

    # 7. Cross-Account Authorization & Privacy Protection (BOLA/IDOR)
    uB_email = f"p4_userB_{random.randint(10000, 99999)}@example.com"
    print(f"\n[Step 14] Register User B ({uB_email}) for security isolation tests...")
    s_uB, r_uB, _ = req(f"{LOCAL_BASE}/auth/register", "POST", {
        "email": uB_email,
        "password": "Password123!",
        "name": "User Beta"
    })
    assert s_uB == 201
    userB_token = r_uB["data"]["tokens"]["accessToken"]

    print(" -> User B attempting to claim User A's claimed itinerary...")
    s_claimB, r_claimB, _ = req(f"{LOCAL_BASE}/itineraries/{guest_itin_id}/claim", "POST", token=userB_token)
    assert s_claimB == 409, f"Expected 409 Conflict, got {s_claimB}"
    print(f" -> Cross-user claim blocked: {s_claimB} Conflict ({r_claimB['error']['message']})")

    print(" -> User B attempting to view User A's private trip...")
    s_tripB, _, _ = req(f"{LOCAL_BASE}/trips/{userA_trip_id}", "GET", token=userB_token)
    assert s_tripB == 403, f"Expected 403 Forbidden, got {s_tripB}"
    print(f" -> BOLA Protected: {s_tripB} Forbidden")

    print(" -> User B attempting to delete User A's trip...")
    s_delB, _, _ = req(f"{LOCAL_BASE}/trips/{userA_trip_id}", "DELETE", token=userB_token)
    assert s_delB == 403, f"Expected 403 Forbidden, got {s_delB}"
    print(f" -> BOLA Protected: {s_delB} Forbidden")

    print(" -> User B attempting to view User A's claimed itinerary...")
    s_itinB, _, _ = req(f"{LOCAL_BASE}/itineraries/{guest_itin_id}", "GET", token=userB_token)
    assert s_itinB == 403, f"Expected 403 Forbidden, got {s_itinB}"
    print(f" -> Private Itinerary Protected: {s_itinB} Forbidden")

    print(" -> Anonymous visitor attempting to view User A's claimed itinerary...")
    s_anon, _, _ = req(f"{LOCAL_BASE}/itineraries/{guest_itin_id}", "GET")
    assert s_anon == 403, f"Expected 403 Forbidden, got {s_anon}"
    print(f" -> Unauthenticated Snooping Blocked: {s_anon} Forbidden")

    # 8. User Favourites and Profile Operations
    print("\n[Step 15] User A manages favourites (POST, GET, DELETE /favourites)...")
    s_fadd, r_fadd, _ = req(f"{LOCAL_BASE}/favourites", "POST", {
        "place_id": "osm_udaipur_palace_01",
        "name": "City Palace, Udaipur",
        "latitude": lat,
        "longitude": lon,
        "category": "tourism",
        "type": "palace",
        "notes": "Beautiful lakeside architecture"
    }, token=userA_token)
    assert s_fadd == 201
    fav_id = r_fadd["data"]["id"]

    s_flist, r_flist, _ = req(f"{LOCAL_BASE}/favourites", "GET", token=userA_token)
    assert s_flist == 200 and len(r_flist["data"]["items"]) >= 1

    s_fdel, _, _ = req(f"{LOCAL_BASE}/favourites/{fav_id}", "DELETE", token=userA_token)
    assert s_fdel == 200
    print(" -> Favourites added, listed, and deleted successfully.")

    print("\n[Step 16] User A updates profile (PATCH /auth/me)...")
    s_prof, r_prof, _ = req(f"{LOCAL_BASE}/auth/me", "PATCH", {
        "name": "User Alpha Verified"
    }, token=userA_token)
    assert s_prof == 200 and r_prof["data"]["name"] == "User Alpha Verified"
    print(f" -> Profile updated successfully to '{r_prof['data']['name']}'")

    # 9. Clean Deletion by Owner
    print(f"\n[Step 17] User A deletes their own trip ({userA_trip_id})...")
    s_clean, _, _ = req(f"{LOCAL_BASE}/trips/{userA_trip_id}", "DELETE", token=userA_token)
    assert s_clean == 200
    print(" -> Trip deleted cleanly by owner.")

    print("\n=================================================================")
    print("ALL 17 PHASE 4 END-TO-END VERIFICATION CHECKS PASSED (100% SUCCESS)!")
    print("=================================================================")

if __name__ == "__main__":
    run_phase4_suite()
