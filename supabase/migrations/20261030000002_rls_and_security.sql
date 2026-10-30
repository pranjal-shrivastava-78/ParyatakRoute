-- ==============================================================================
-- ParyatakRoute — Row Level Security (RLS) & Database Access Controls
-- Migration ID: 20261030000002_rls_and_security.sql
-- Description: Enables RLS across all application tables, configures ownership
--              policies for authenticated users, and restricts public access.
--              Fully idempotent and safely re-executable.
-- ==============================================================================

-- 1. Enable Row Level Security (RLS) on all exposed public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners/creators to prevent accidental bypass
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.trips FORCE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries FORCE ROW LEVEL SECURITY;
ALTER TABLE public.favourites FORCE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. POLICIES: public.profiles
-- ==============================================================================
-- Users can read their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Users can update their own profile (name only)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Service role bypass for backend administration
DROP POLICY IF EXISTS "profiles_service_role_all" ON public.profiles;
CREATE POLICY "profiles_service_role_all"
    ON public.profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 3. POLICIES: public.trips
-- BOLA Protection: Users can only create, view, modify, and delete their own trips.
-- ==============================================================================
DROP POLICY IF EXISTS "trips_select_own" ON public.trips;
CREATE POLICY "trips_select_own"
    ON public.trips
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "trips_insert_own" ON public.trips;
CREATE POLICY "trips_insert_own"
    ON public.trips
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "trips_update_own" ON public.trips;
CREATE POLICY "trips_update_own"
    ON public.trips
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "trips_delete_own" ON public.trips;
CREATE POLICY "trips_delete_own"
    ON public.trips
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "trips_service_role_all" ON public.trips;
CREATE POLICY "trips_service_role_all"
    ON public.trips
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 4. POLICIES: public.itineraries
-- Users can only access itineraries linked to their user_id.
-- ==============================================================================
DROP POLICY IF EXISTS "itineraries_select_own" ON public.itineraries;
CREATE POLICY "itineraries_select_own"
    ON public.itineraries
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "itineraries_insert_own" ON public.itineraries;
CREATE POLICY "itineraries_insert_own"
    ON public.itineraries
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "itineraries_update_own" ON public.itineraries;
CREATE POLICY "itineraries_update_own"
    ON public.itineraries
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "itineraries_delete_own" ON public.itineraries;
CREATE POLICY "itineraries_delete_own"
    ON public.itineraries
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "itineraries_service_role_all" ON public.itineraries;
CREATE POLICY "itineraries_service_role_all"
    ON public.itineraries
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 5. POLICIES: public.favourites
-- Bookmarked places can only be managed by the owner.
-- ==============================================================================
DROP POLICY IF EXISTS "favourites_select_own" ON public.favourites;
CREATE POLICY "favourites_select_own"
    ON public.favourites
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "favourites_insert_own" ON public.favourites;
CREATE POLICY "favourites_insert_own"
    ON public.favourites
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "favourites_delete_own" ON public.favourites;
CREATE POLICY "favourites_delete_own"
    ON public.favourites
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "favourites_service_role_all" ON public.favourites;
CREATE POLICY "favourites_service_role_all"
    ON public.favourites
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 6. PERMISSIONS & GRANTS
-- Restrict public (anon) access completely from private application tables.
-- ==============================================================================
REVOKE ALL ON public.profiles FROM anon, public;
REVOKE ALL ON public.trips FROM anon, public;
REVOKE ALL ON public.itineraries FROM anon, public;
REVOKE ALL ON public.favourites FROM anon, public;

-- Grant standard CRUD access to authenticated users (governed strictly by RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itineraries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favourites TO authenticated;

-- Grant full administrative access to service_role (used by FastAPI backend)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;
