-- ==============================================================================
-- ParyatakRoute — Schema Rollback Script
-- Migration ID: 20261030000001_rollback.sql
-- Description: Safely drops all created triggers, functions, and tables in reverse dependency order.
-- ==============================================================================

-- 1. Drop Triggers
DROP TRIGGER IF EXISTS trigger_favourites_updated_at ON public.favourites;
DROP TRIGGER IF EXISTS trigger_itineraries_updated_at ON public.itineraries;
DROP TRIGGER IF EXISTS trigger_trips_updated_at ON public.trips;
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop Functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- 3. Drop Tables (in reverse dependency order)
DROP TABLE IF EXISTS public.favourites CASCADE;
DROP TABLE IF EXISTS public.itineraries CASCADE;
DROP TABLE IF EXISTS public.trips CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
