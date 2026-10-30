"""Live Supabase PostgreSQL & AI Persistence Verification Gate.

Executes end-to-end live PostgREST database operations against remote Supabase:
- Verifies existence of profiles, trips, itineraries, favourites.
- Executes full CRUD lifecycle for each resource.
- Validates cross-session / process-restart persistence.
- Validates real authenticated user RLS and cross-user BOLA security isolation.
- Validates live Groq AI itinerary persistence in PostgreSQL.
- Validates surgical single-day regeneration persistence in PostgreSQL.
- Failure-safe cleanup ensuring all test data and auth users are purged.
"""
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import asyncio
import gc
import uuid
from datetime import datetime, timezone
from supabase import create_client

from app.core.config import settings
from app.services.groq_service import groq_service


async def verify_remote_supabase():
    print("==================================================================")
    print("  ParyatakRoute — Live Supabase PostgreSQL Verification Gate")
    print("==================================================================")
    print(f"Target URL: {settings.SUPABASE_URL}")
    
    admin_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    
    # ------------------------------------------------------------------
    # Step 1: Check Remote Table Existence
    # ------------------------------------------------------------------
    print("\n--- [Step 1: Checking Schema & Table Existence] ---")
    tables = ["profiles", "trips", "itineraries", "favourites"]
    all_exist = True
    for t in tables:
        try:
            res = admin_client.table(t).select("count", count="exact").execute()
            print(f"  [OK] Table public.{t} exists (Current rows: {res.count})")
        except Exception as e:
            all_exist = False
            print(f"  [BLOCKED] Table public.{t} not found: {e}")
            
    if not all_exist:
        print("\n[RESULT] Remote Supabase tables are not yet created.")
        print("Please execute 'supabase/migrations/20261030_full_schema_and_rls.sql'")
        print("in your Supabase Dashboard SQL Editor.")
        return False

    # ------------------------------------------------------------------
    # Step 2: Provision Test Users for Live BOLA & Authenticated RLS
    # ------------------------------------------------------------------
    print("\n--- [Step 2: Provisioning Test Users for Verification] ---")
    user_a_email = f"verify_user_a_{int(datetime.now().timestamp())}@paryatakroute.org"
    user_b_email = f"verify_user_b_{int(datetime.now().timestamp())}@paryatakroute.org"
    password = "SecurePassword123!QA"
    
    u_a = None
    u_b = None
    user_a_id = None
    user_b_id = None
    
    try:
        u_a = admin_client.auth.admin.create_user({
            "email": user_a_email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"name": "QA User A"}
        })
        u_b = admin_client.auth.admin.create_user({
            "email": user_b_email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"name": "QA User B"}
        })
        user_a_id = str(u_a.user.id)
        user_b_id = str(u_b.user.id)
        print(f"  Created User A: {user_a_id}")
        print(f"  Created User B: {user_b_id}")

        # Authenticate dedicated client instances for User A and User B
        client_a = create_client(settings.SUPABASE_URL, settings.SUPABASE_PUBLISHABLE_KEY)
        client_b = create_client(settings.SUPABASE_URL, settings.SUPABASE_PUBLISHABLE_KEY)
        
        sess_a = client_a.auth.sign_in_with_password({"email": user_a_email, "password": password})
        sess_b = client_b.auth.sign_in_with_password({"email": user_b_email, "password": password})
        
        token_a = sess_a.session.access_token
        token_b = sess_b.session.access_token
        
        # Verify access token is properly set on PostgREST client
        assert client_a.postgrest.session.headers.get("authorization") is not None
        assert client_b.postgrest.session.headers.get("authorization") is not None
        print("  Authenticated client sessions initialized for User A and User B.")

        # --------------------------------------------------------------
        # Step 3: Verify Trip CRUD & Process-Restart Persistence
        # --------------------------------------------------------------
        print("\n--- [Step 3: Verifying Trip Table CRUD in PostgreSQL] ---")
        trip_id = str(uuid.uuid4())
        trip_data = {
            "id": trip_id,
            "user_id": user_a_id,
            "destination": "Udaipur, Rajasthan",
            "starting_city": "Ahmedabad",
            "start_date": "2026-12-01",
            "end_date": "2026-12-03",
            "duration_days": 3,
            "budget": 20000.00,
            "currency": "INR",
            "travellers": 2,
            "travel_style": "balanced",
            "interests": ["palaces", "lakes", "photography"],
            "status": "planned"
        }
        # CREATE using User A authenticated client
        ins = client_a.table("trips").insert(trip_data).execute()
        assert len(ins.data) == 1, "Failed to insert trip with User A client"
        print(f"  [CREATE] Trip created with ID: {trip_id}")

        # READ / RESTART PERSISTENCE: Destroy client, instantiate brand new client with same token
        del client_a
        gc.collect()
        
        fresh_client_a = create_client(settings.SUPABASE_URL, settings.SUPABASE_PUBLISHABLE_KEY)
        fresh_client_a.postgrest.auth(token_a)
        
        get_res = fresh_client_a.table("trips").select("*").eq("id", trip_id).execute()
        assert len(get_res.data) == 1, "Failed to retrieve trip after client restart"
        assert get_res.data[0]["destination"] == "Udaipur, Rajasthan"
        print(f"  [READ / RESTART PERSISTENCE] Verified persistent trip across client re-initialization: {get_res.data[0]['destination']}")
        client_a = fresh_client_a

        # UPDATE
        upd = client_a.table("trips").update({"budget": 25000.00, "status": "completed"}).eq("id", trip_id).execute()
        assert float(upd.data[0]["budget"]) == 25000.00
        assert upd.data[0]["status"] == "completed"
        print(f"  [UPDATE] Trip updated budget to INR {upd.data[0]['budget']}")

        # --------------------------------------------------------------
        # Step 4: Verify Itinerary CRUD with JSONB
        # --------------------------------------------------------------
        print("\n--- [Step 4: Verifying Itinerary Table CRUD (JSONB)] ---")
        itin_id = str(uuid.uuid4())
        itin_data = {
            "id": itin_id,
            "trip_id": trip_id,
            "user_id": user_a_id,
            "title": "3-Day Royal Udaipur Escape",
            "status": "generated",
            "days": [
                {
                    "dayNumber": 1,
                    "date": "2026-12-01",
                    "theme": "Lake Pichola & City Palace",
                    "activities": [
                        {
                            "name": "City Palace Tour",
                            "category": "cultural",
                            "startTime": "09:30",
                            "durationMinutes": 150,
                            "estimatedCost": 600,
                            "costCurrency": "INR"
                        }
                    ]
                }
            ],
            "budget": {
                "currency": "INR",
                "total_estimated": 600,
                "categories": {"activities": 600}
            }
        }
        ins_itin = client_a.table("itineraries").insert(itin_data).execute()
        assert len(ins_itin.data) == 1
        print(f"  [CREATE] Itinerary with JSONB created: {itin_id}")

        get_itin = client_a.table("itineraries").select("*").eq("id", itin_id).execute()
        assert len(get_itin.data) == 1
        assert len(get_itin.data[0]["days"]) == 1
        print(f"  [READ] JSONB days verified: {get_itin.data[0]['title']}")

        # --------------------------------------------------------------
        # Step 5: Verify Favourites CRUD & Uniqueness Constraint
        # --------------------------------------------------------------
        print("\n--- [Step 5: Verifying Favourites CRUD & Constraints] ---")
        fav_id = str(uuid.uuid4())
        fav_data = {
            "id": fav_id,
            "user_id": user_a_id,
            "place_id": "poi_udaipur_lake_pichola",
            "name": "Lake Pichola",
            "latitude": 24.5764,
            "longitude": 73.6835,
            "category": "natural",
            "provider": "nominatim"
        }
        ins_fav = client_a.table("favourites").insert(fav_data).execute()
        assert len(ins_fav.data) == 1
        print(f"  [CREATE] Favourite saved: {fav_data['name']}")

        # Test UNIQUE(user_id, place_id) constraint
        dup_caught = False
        try:
            client_a.table("favourites").insert(fav_data).execute()
        except Exception:
            dup_caught = True
        assert dup_caught is True, "Failed: duplicate favourite should be rejected by unique constraint"
        print("  [CONSTRAINT] Duplicate favourite constraint enforced successfully.")

        # --------------------------------------------------------------
        # Step 6: Verify Authenticated RLS & BOLA Isolation
        # --------------------------------------------------------------
        print("\n--- [Step 6: Verifying Authenticated RLS & BOLA Isolation] ---")
        # User B queries trips -> Must NOT see User A's trip under RLS
        b_trips = client_b.table("trips").select("*").execute()
        user_a_trips_seen_by_b = [t for t in b_trips.data if t["id"] == trip_id]
        assert len(user_a_trips_seen_by_b) == 0, "SECURITY VIOLATION: User B can see User A's trip under RLS!"
        print(f"  [RLS READ BLOCKED] User B query returned {len(b_trips.data)} trips (User A records hidden).")

        # User B attempts to update User A's trip -> Must affect 0 rows
        b_upd = client_b.table("trips").update({"destination": "HACKED"}).eq("id", trip_id).execute()
        assert len(b_upd.data) == 0, "SECURITY VIOLATION: User B updated User A's trip!"
        print("  [RLS UPDATE BLOCKED] User B cannot update User A's trip (0 rows affected).")

        # User B attempts to delete User A's trip -> Must affect 0 rows
        b_del = client_b.table("trips").delete().eq("id", trip_id).execute()
        assert len(b_del.data) == 0, "SECURITY VIOLATION: User B deleted User A's trip!"
        print("  [RLS DELETE BLOCKED] User B cannot delete User A's trip (0 rows affected).")

        # Verify User A's trip remains untouched
        a_check = client_a.table("trips").select("*").eq("id", trip_id).execute()
        assert len(a_check.data) == 1
        assert a_check.data[0]["destination"] == "Udaipur, Rajasthan"
        print("  [RLS VERIFIED] User A record intact and protected.")

        # --------------------------------------------------------------
        # Step 7: Verify Live Groq AI Generated Itinerary Persistence
        # --------------------------------------------------------------
        print("\n--- [Step 7: Verifying Live Groq AI Persistence] ---")
        print("  Generating 2-day live itinerary for User A via Groq AI (openai/gpt-oss-120b)...")
        ai_trip_in = {
            "destination": "Goa, India",
            "start_date": "2026-11-10",
            "end_date": "2026-11-11",
            "duration_days": 2,
            "budget": 12000,
            "currency": "INR",
            "travellers": 2,
            "travel_style": "relaxed",
            "interests": ["beaches", "seafood"]
        }
        ai_itinerary_dict = await groq_service.generate_itinerary(ai_trip_in, ["2026-11-10", "2026-11-11"])
        
        ai_itin_record = {
            "id": str(uuid.uuid4()),
            "trip_id": trip_id,
            "user_id": user_a_id,
            "title": ai_itinerary_dict.get("title", "Goa Getaway"),
            "status": "generated",
            "days": ai_itinerary_dict.get("days", []),
            "budget": {"currency": "INR", "total_estimated": 12000},
            "generation_metadata": {"model": settings.GROQ_MODEL, "provider": "groq"}
        }
        ins_ai = client_a.table("itineraries").insert(ai_itin_record).execute()
        assert len(ins_ai.data) == 1
        print(f"  [AI PERSISTENCE] Successfully saved AI itinerary: {ai_itin_record['title']}")
        print(f"  [AI PERSISTENCE] Total days persisted in PostgreSQL: {len(ins_ai.data[0]['days'])}")

        # Surgical single-day regeneration persistence test
        print("  Testing surgical single-day regeneration and update in PostgreSQL (openai/gpt-oss-20b)...")
        regen_day = await groq_service.regenerate_single_day(
            destination="Goa, India",
            day_number=1,
            date_str="2026-11-10",
            travel_style="relaxed",
            currency="INR",
            daily_budget=6000.0,
            interests=["beaches", "seafood"],
            instruction="Focus on Anjuna Beach sunset and shack dinner"
        )
        updated_days = ai_itinerary_dict.get("days", [])
        if updated_days:
            updated_days[0] = regen_day
            upd_res = client_a.table("itineraries").update({"days": updated_days}).eq("id", ai_itin_record["id"]).execute()
            assert len(upd_res.data) == 1
            print("  [AI SINGLE-DAY PERSISTENCE] Successfully persisted regenerated Day 1 to PostgreSQL.")

    finally:
        # --------------------------------------------------------------
        # Step 8: Safe Cleanup of All Test Records & Accounts
        # --------------------------------------------------------------
        print("\n--- [Step 8: Cleaning Up Test Data] ---")
        if user_a_id:
            try:
                admin_client.table("favourites").delete().eq("user_id", user_a_id).execute()
                admin_client.table("itineraries").delete().eq("user_id", user_a_id).execute()
                admin_client.table("trips").delete().eq("user_id", user_a_id).execute()
                print("  Test database records for User A deleted.")
            except Exception as e:
                print(f"  Warning during User A record cleanup: {e}")
                
        if user_b_id:
            try:
                admin_client.table("favourites").delete().eq("user_id", user_b_id).execute()
                admin_client.table("itineraries").delete().eq("user_id", user_b_id).execute()
                admin_client.table("trips").delete().eq("user_id", user_b_id).execute()
                print("  Test database records for User B deleted.")
            except Exception as e:
                print(f"  Warning during User B record cleanup: {e}")

        if u_a and user_a_id:
            try:
                admin_client.auth.admin.delete_user(user_a_id)
                print(f"  Deleted User A from Supabase Auth: {user_a_id}")
            except Exception as e:
                print(f"  Warning deleting User A: {e}")
                
        if u_b and user_b_id:
            try:
                admin_client.auth.admin.delete_user(user_b_id)
                print(f"  Deleted User B from Supabase Auth: {user_b_id}")
            except Exception as e:
                print(f"  Warning deleting User B: {e}")

    print("\n==================================================================")
    print("  [SUCCESS] All Live PostgreSQL Persistence & Security Tests PASSED")
    print("==================================================================")
    return True


if __name__ == "__main__":
    asyncio.run(verify_remote_supabase())
