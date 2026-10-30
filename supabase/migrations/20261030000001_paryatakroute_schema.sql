-- ==============================================================================
-- ParyatakRoute — Initial Supabase PostgreSQL Schema Migration
-- Migration ID: 20261030000001_paryatakroute_schema.sql
-- Description: Creates core tables (profiles, trips, itineraries, favourites),
--              foreign key relationships, constraints, indexes, and triggers.
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLE: public.profiles
-- Extends Supabase auth.users with application-specific profile data.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on profiles status for administrative filtering
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Automatic profile creation on Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, role, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'user',
        'active'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 3. TABLE: public.trips
-- Core trip preferences, duration, budgets, and constraints.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    destination VARCHAR(200) NOT NULL,
    starting_city VARCHAR(200),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days INT NOT NULL CHECK (duration_days >= 1 AND duration_days <= 60),
    budget NUMERIC(12, 2) NOT NULL CHECK (budget >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    travellers INT NOT NULL DEFAULT 1 CHECK (travellers >= 1 AND travellers <= 50),
    travel_style VARCHAR(30) NOT NULL CHECK (travel_style IN ('budget', 'balanced', 'relaxed', 'adventure', 'luxury')),
    interests TEXT[] NOT NULL DEFAULT '{}',
    transport_preference VARCHAR(100),
    accommodation_preference VARCHAR(100),
    dietary_preferences VARCHAR(200),
    accessibility_preferences VARCHAR(200),
    additional_notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('draft', 'planned', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_trip_dates CHECK (end_date >= start_date)
);

-- Indexes for trips query optimization
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON public.trips(start_date);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON public.trips(destination);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);

DROP TRIGGER IF EXISTS trigger_trips_updated_at ON public.trips;
CREATE TRIGGER trigger_trips_updated_at
    BEFORE UPDATE ON public.trips
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 4. TABLE: public.itineraries
-- Day-by-day travel plans, activities, category budgets, and AI metadata.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    summary TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'generated' CHECK (status IN ('draft', 'generated', 'confirmed', 'archived')),
    days JSONB NOT NULL DEFAULT '[]'::jsonb,
    budget JSONB NOT NULL DEFAULT '{}'::jsonb,
    assumptions TEXT[] NOT NULL DEFAULT '{}',
    generation_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for itineraries
CREATE INDEX IF NOT EXISTS idx_itineraries_trip_id ON public.itineraries(trip_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON public.itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_days_gin ON public.itineraries USING GIN (days);
CREATE INDEX IF NOT EXISTS idx_itineraries_budget_gin ON public.itineraries USING GIN (budget);

DROP TRIGGER IF EXISTS trigger_itineraries_updated_at ON public.itineraries;
CREATE TRIGGER trigger_itineraries_updated_at
    BEFORE UPDATE ON public.itineraries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 5. TABLE: public.favourites
-- User bookmarked destinations and POIs from OpenStreetMap Nominatim.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.favourites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    place_id VARCHAR(150) NOT NULL,
    name VARCHAR(200) NOT NULL,
    display_name VARCHAR(500),
    address VARCHAR(500),
    latitude NUMERIC(9, 6) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude NUMERIC(9, 6) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    category VARCHAR(100),
    type VARCHAR(100),
    photo_url TEXT,
    provider VARCHAR(50) NOT NULL DEFAULT 'nominatim',
    attribution TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_favourite_place UNIQUE(user_id, place_id)
);

-- Indexes for favourites
CREATE INDEX IF NOT EXISTS idx_favourites_user_id ON public.favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_favourites_category ON public.favourites(category);

DROP TRIGGER IF EXISTS trigger_favourites_updated_at ON public.favourites;
CREATE TRIGGER trigger_favourites_updated_at
    BEFORE UPDATE ON public.favourites
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
