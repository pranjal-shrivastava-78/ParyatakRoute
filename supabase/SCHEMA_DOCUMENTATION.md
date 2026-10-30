# ParyatakRoute — Supabase PostgreSQL Schema Documentation

**Project:** ParyatakRoute  
**Architecture:** Python / FastAPI / Supabase PostgreSQL / Supabase Auth  
**Schema Version:** 1.0.0  

---

## 1. Architectural Strategy & Design Principles

ParyatakRoute uses Supabase PostgreSQL as its primary database, combining relational integrity with high-performance JSONB storage and native Row Level Security (RLS).

### Relational Normalization vs. JSONB Storage
The schema balances third normal form (3NF) relational integrity with flexible JSONB data models:

1. **Relational Core (`profiles`, `trips`, `favourites`)**:
   - Normalized relational tables with strict foreign key constraints linking to `auth.users(id)`.
   - Explicit domain constraints: `duration_days` (1–60), `budget` (>= 0), `travellers` (1–50), `travel_style` enums, and date sequence checks (`end_date >= start_date`).
   - Cascading deletions: Deleting a user or trip automatically purges all related itineraries and bookmarks, eliminating orphaned rows.

2. **Semi-Structured Itinerary Payload (`itineraries.days` & `itineraries.budget`)**:
   - Storing day-by-day activities as a `JSONB` column with a **GIN index (`idx_itineraries_days_gin`)** provides optimal database efficiency:
     - **Atomic AI Writes**: Groq AI generation services write structured day schedules in a single atomic transaction without requiring dozens of multi-table row insertions.
     - **Granular Day Updates**: PostgreSQL `jsonb_set` enables surgical single-day updates without re-writing or disrupting other days in the plan.
     - **High Query Efficiency**: Complete multi-day itineraries are retrieved in a single indexed lookup (`idx_itineraries_trip_id`) with zero table join overhead.

3. **Row Level Security (RLS)**:
   - RLS is enabled on all application tables.
   - Access policies strictly verify `auth.uid() = user_id`, guaranteeing complete multi-tenant tenant isolation and Broken Object Level Authorization (BOLA) defense at the database layer.

---

## 2. Table Specifications

### 2.1 `public.profiles`
Extends Supabase `auth.users` with display metadata and authorization roles.

| Column | Type | Nullable | Constraints & Defaults | Description |
|---|---|---|---|---|
| `id` | `UUID` | No | `PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE` | Matches Supabase Auth user UUID |
| `name` | `VARCHAR(100)` | No | Min 2, max 100 characters | User's display name |
| `role` | `VARCHAR(20)` | No | `DEFAULT 'user' CHECK (role IN ('user', 'admin'))` | Authorization role |
| `status` | `VARCHAR(20)` | No | `DEFAULT 'active' CHECK (status IN ('active', 'suspended'))` | Account standing |
| `created_at` | `TIMESTAMPTZ` | No | `DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `DEFAULT NOW()` | Auto-updated via trigger |

---

### 2.2 `public.trips`
Stores traveller preferences, target destinations, dates, party size, and budgets.

| Column | Type | Nullable | Constraints & Defaults | Description |
|---|---|---|---|---|
| `id` | `UUID` | No | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique trip identifier |
| `user_id` | `UUID` | No | `REFERENCES auth.users(id) ON DELETE CASCADE` | Owner user UUID |
| `destination` | `VARCHAR(200)` | No | Min 2, max 200 characters | Destination city or region |
| `starting_city` | `VARCHAR(200)` | Yes | Max 200 characters | Origin / departure point |
| `start_date` | `DATE` | No | Valid ISO date | Trip start date |
| `end_date` | `DATE` | No | `CHECK (end_date >= start_date)` | Trip end date |
| `duration_days`| `INT` | No | `CHECK (duration_days BETWEEN 1 AND 60)` | Calculated length in days |
| `budget` | `NUMERIC(12,2)`| No | `CHECK (budget >= 0)` | Total budget limit |
| `currency` | `VARCHAR(3)` | No | `DEFAULT 'INR'` | ISO 3-letter currency code |
| `travellers` | `INT` | No | `DEFAULT 1 CHECK (travellers BETWEEN 1 AND 50)` | Number of travellers |
| `travel_style` | `VARCHAR(30)` | No | `CHECK (travel_style IN ('budget','balanced','relaxed','adventure','luxury'))` | Travel pacing preference |
| `interests` | `TEXT[]` | No | `DEFAULT '{}'` | Array of selected interest tags |
| `transport_preference` | `VARCHAR(100)` | Yes | Free text | Preferred transit mode |
| `accommodation_preference` | `VARCHAR(100)` | Yes | Free text | Hotel / hostel / villa style |
| `dietary_preferences` | `VARCHAR(200)` | Yes | Free text | Dietary requirements |
| `accessibility_preferences` | `VARCHAR(200)` | Yes | Free text | Accessibility needs |
| `additional_notes` | `TEXT` | Yes | Free text | User notes & custom requests |
| `status` | `VARCHAR(20)` | No | `DEFAULT 'planned' CHECK (status IN ('draft','planned','completed','cancelled'))` | Trip lifecycle status |
| `created_at` | `TIMESTAMPTZ` | No | `DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `DEFAULT NOW()` | Auto-updated via trigger |

---

### 2.3 `public.itineraries`
Stores generated travel plans, structured daily activities, and categorized budgets.

| Column | Type | Nullable | Constraints & Defaults | Description |
|---|---|---|---|---|
| `id` | `UUID` | No | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique itinerary identifier |
| `trip_id` | `UUID` | No | `REFERENCES public.trips(id) ON DELETE CASCADE` | Foreign key to parent trip |
| `user_id` | `UUID` | No | `REFERENCES auth.users(id) ON DELETE CASCADE` | Foreign key to owner |
| `title` | `VARCHAR(200)` | No | Max 200 characters | Itinerary title |
| `summary` | `TEXT` | Yes | Free text overview | Executive summary |
| `status` | `VARCHAR(20)` | No | `DEFAULT 'generated' CHECK (status IN ('draft','generated','confirmed','archived'))` | Version status |
| `days` | `JSONB` | No | `DEFAULT '[]'::jsonb` | Nested day & activity array |
| `budget` | `JSONB` | No | `DEFAULT '{}'::jsonb` | Categorized budget summary |
| `assumptions` | `TEXT[]` | No | `DEFAULT '{}'` | Array of AI assumptions |
| `generation_metadata` | `JSONB` | No | `DEFAULT '{}'::jsonb` | Model name, provider, latency |
| `created_at` | `TIMESTAMPTZ` | No | `DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `DEFAULT NOW()` | Auto-updated via trigger |

---

### 2.4 `public.favourites`
Stores bookmarked destinations, attractions, and places of interest.

| Column | Type | Nullable | Constraints & Defaults | Description |
|---|---|---|---|---|
| `id` | `UUID` | No | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique favourite identifier |
| `user_id` | `UUID` | No | `REFERENCES auth.users(id) ON DELETE CASCADE` | Owner user UUID |
| `place_id` | `VARCHAR(150)`| No | External place identifier | OpenStreetMap reference ID |
| `name` | `VARCHAR(200)`| No | Place name | Common title |
| `display_name`| `VARCHAR(500)`| Yes | Formatted address | Full address string |
| `address` | `VARCHAR(500)`| Yes | Street address | Location street / city |
| `latitude` | `NUMERIC(9,6)`| No | `CHECK (latitude BETWEEN -90 AND 90)` | WGS84 coordinate |
| `longitude`| `NUMERIC(9,6)`| No | `CHECK (longitude BETWEEN -180 AND 180)` | WGS84 coordinate |
| `category` | `VARCHAR(100)`| Yes | Category label | Attraction, hotel, dining |
| `type` | `VARCHAR(100)`| Yes | OSM tag type | Sub-classification |
| `photo_url`| `TEXT` | Yes | URL string | Photo link |
| `provider` | `VARCHAR(50)` | No | `DEFAULT 'nominatim'` | Data provider source |
| `attribution`| `TEXT` | Yes | Legal attribution | Attribution notice |
| `notes` | `TEXT` | Yes | User private notes | Personal notes |
| `created_at`| `TIMESTAMPTZ` | No | `DEFAULT NOW()` | Saved timestamp |
| `updated_at`| `TIMESTAMPTZ` | No | `DEFAULT NOW()` | Auto-updated via trigger |

**Unique Constraint**: `CONSTRAINT unique_user_favourite_place UNIQUE(user_id, place_id)` ensures a user cannot duplicate a saved place.

---

## 3. Indexes & Performance Optimization

| Table | Index Name | Type | Target Column(s) | Purpose |
|---|---|---|---|---|
| `trips` | `idx_trips_user_id` | B-tree | `(user_id)` | Fast lookup of user trips |
| `trips` | `idx_trips_status` | B-tree | `(status)` | Filtering by trip status |
| `itineraries` | `idx_itineraries_trip_id` | B-tree | `(trip_id)` | Fast itinerary retrieval by trip |
| `itineraries` | `idx_itineraries_user_id` | B-tree | `(user_id)` | RLS policy validation |
| `itineraries` | `idx_itineraries_days_gin` | GIN | `(days)` | Fast JSONB activity search |
| `favourites` | `idx_favourites_user_id` | B-tree | `(user_id)` | Fast retrieval of user bookmarks |
| `profiles` | `profiles_pkey` | B-tree | `(id)` | Primary key lookup |

---

## 4. Row Level Security (RLS) Policy Reference

All application tables have RLS enabled with strict tenant isolation:

| Table | Operation | Policy Name | Using / With Check Expression |
|---|---|---|---|
| `profiles` | SELECT | `Users can view own profile` | `auth.uid() = id` |
| `profiles` | UPDATE | `Users can update own profile` | `auth.uid() = id` |
| `trips` | SELECT | `Users can view own trips` | `auth.uid() = user_id` |
| `trips` | INSERT | `Users can insert own trips` | `auth.uid() = user_id` |
| `trips` | UPDATE | `Users can update own trips` | `auth.uid() = user_id` |
| `trips` | DELETE | `Users can delete own trips` | `auth.uid() = user_id` |
| `itineraries`| SELECT | `Users can view own itineraries` | `auth.uid() = user_id` |
| `itineraries`| INSERT | `Users can insert own itineraries` | `auth.uid() = user_id` |
| `itineraries`| UPDATE | `Users can update own itineraries` | `auth.uid() = user_id` |
| `itineraries`| DELETE | `Users can delete own itineraries` | `auth.uid() = user_id` |
| `favourites` | SELECT | `Users can view own favourites` | `auth.uid() = user_id` |
| `favourites` | INSERT | `Users can insert own favourites` | `auth.uid() = user_id` |
| `favourites` | DELETE | `Users can delete own favourites` | `auth.uid() = user_id` |
