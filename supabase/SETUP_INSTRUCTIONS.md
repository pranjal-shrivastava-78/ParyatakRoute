# ParyatakRoute — Supabase Database Setup & Execution Instructions

**Project:** ParyatakRoute  
**Database:** Supabase PostgreSQL  
**Directory:** `supabase/`  

---

## Method 1: Apply via Supabase Dashboard SQL Editor (Quickest & Recommended)

1. Log into your [Supabase Dashboard](https://supabase.com/dashboard) and select your ParyatakRoute project (`https://ygfksgxttlcwaruzwoch.supabase.co`).
2. In the left navigation menu, click **SQL Editor**.
3. Click **New query** (or press `Ctrl + Enter`).
4. **Step 1 — Core Schema**:
   - Open [supabase/migrations/20261030000001_paryatakroute_schema.sql](file:///c:/Users/Pranjal/Documents/smartbridge%20project/supabase/migrations/20261030000001_paryatakroute_schema.sql).
   - Copy the entire SQL content, paste it into the SQL Editor, and click **Run**.
   - Verify output: `Success. No rows returned`.
5. **Step 2 — Row Level Security (RLS) & Access Policies**:
   - Open [supabase/migrations/20261030000002_rls_and_security.sql](file:///c:/Users/Pranjal/Documents/smartbridge%20project/supabase/migrations/20261030000002_rls_and_security.sql).
   - Copy the entire SQL content, paste it into the SQL Editor, and click **Run**.
   - Verify output: `Success. No rows returned`.
6. **Step 3 — Run Health & Reconciliation Verification**:
   - Open [supabase/verify_schema.sql](file:///c:/Users/Pranjal/Documents/smartbridge%20project/supabase/verify_schema.sql).
   - Copy and run the verification script.
   - Inspect the messages tab. You should see:
     ```text
     NOTICE:  --- Starting ParyatakRoute Schema Verification ---
     NOTICE:  OK: Table public.profiles exists
     NOTICE:  OK: Table public.trips exists
     NOTICE:  OK: Table public.itineraries exists
     NOTICE:  OK: Table public.favourites exists
     NOTICE:  OK: Table public.profiles has RLS ENABLED
     NOTICE:  OK: Table public.trips has RLS ENABLED
     NOTICE:  OK: Table public.itineraries has RLS ENABLED
     NOTICE:  OK: Table public.favourites has RLS ENABLED
     NOTICE:  OK: Trips foreign key constraint verified
     NOTICE:  OK: Itineraries foreign key constraints verified
     NOTICE:  OK: GIN index on itineraries(days) exists
     NOTICE:  --- Verification Complete. Total Missing Tables: 0 ---
     ```

---

## Method 2: Apply via Supabase CLI (Automated Local Workflow)

If you have the Supabase CLI installed:

```bash
# Link local project to remote Supabase project
supabase link --project-ref ygfksgxttlcwaruzwoch

# Push migrations to remote database
supabase db push
```

---

## Method 3: Emergency Rollback

If you ever need to completely tear down and reset the ParyatakRoute schema:
1. Open the Supabase SQL Editor.
2. Run [supabase/rollback/20261030000001_rollback.sql](file:///c:/Users/Pranjal/Documents/smartbridge%20project/supabase/rollback/20261030000001_rollback.sql).
3. All triggers, functions, and application tables (`favourites`, `itineraries`, `trips`, `profiles`) will be cleanly removed in reverse dependency order.
