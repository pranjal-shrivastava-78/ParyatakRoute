-- ==============================================================================
-- ParyatakRoute — Schema Verification & Health Check Script
-- Usage: Run this script in the Supabase SQL Editor to verify complete and correct setup.
-- ==============================================================================

DO $$
DECLARE
    tbl RECORD;
    missing_tables INT := 0;
    expected_tables TEXT[] := ARRAY['profiles', 'trips', 'itineraries', 'favourites'];
    t TEXT;
BEGIN
    RAISE NOTICE '--- Starting ParyatakRoute Schema Verification ---';

    -- 1. Verify Table Existence
    FOREACH t IN ARRAY expected_tables LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = t
        ) THEN
            RAISE WARNING 'MISSING TABLE: public.%', t;
            missing_tables := missing_tables + 1;
        ELSE
            RAISE NOTICE 'OK: Table public.% exists', t;
        END IF;
    END LOOP;

    -- 2. Verify Row Level Security (RLS) Status
    FOR tbl IN 
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = ANY(expected_tables)
    LOOP
        IF tbl.rowsecurity THEN
            RAISE NOTICE 'OK: Table public.% has RLS ENABLED', tbl.tablename;
        ELSE
            RAISE WARNING 'SECURITY RISK: Table public.% does NOT have RLS enabled!', tbl.tablename;
        END IF;
    END LOOP;

    -- 3. Verify Foreign Keys
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' AND table_name = 'trips'
    ) THEN
        RAISE NOTICE 'OK: Trips foreign key constraint verified';
    ELSE
        RAISE WARNING 'MISSING: Trips foreign key constraint to auth.users';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' AND table_name = 'itineraries'
    ) THEN
        RAISE NOTICE 'OK: Itineraries foreign key constraints verified';
    ELSE
        RAISE WARNING 'MISSING: Itineraries foreign key constraints';
    END IF;

    -- 4. Verify GIN Indexes on Itinerary JSONB
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'itineraries' AND indexname = 'idx_itineraries_days_gin'
    ) THEN
        RAISE NOTICE 'OK: GIN index on itineraries(days) exists';
    ELSE
        RAISE WARNING 'PERFORMANCE RISK: Missing GIN index on itineraries(days)';
    END IF;

    RAISE NOTICE '--- Verification Complete. Total Missing Tables: % ---', missing_tables;
END $$;
