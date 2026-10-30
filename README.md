# ParyatakRoute — Intelligent Travel Itinerary Planner

ParyatakRoute is a modern, high-performance web platform designed to generate customized, structured travel itineraries based on traveller preferences—including destination, dates, budget, travel style, interests, and party size. The platform transforms high-level user parameters into an organized, day-by-day itinerary complete with categorized activities, approximate costs, live weather forecasts, geographic routing, currency conversions, and a transparent budget breakdown.

---

## 1. System Architecture

ParyatakRoute is architected as a Python-first, cloud-native application:

- **Backend**: Python 3.13 + [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous ASGI framework with Pydantic v2 schemas and validation).
- **Database**: [Supabase PostgreSQL](https://supabase.com/) with Row Level Security (RLS) policies, JSONB day-by-day storage, automated updated timestamps, and relational foreign keys.
- **Authentication**: [Supabase Auth](https://supabase.com/auth) issuing cryptographic RS256/HS256 JWTs with native role verification and Broken Object Level Authorization (BOLA) enforcement.
- **AI Engine**: [Groq Cloud](https://groq.com/) using ultra-fast LLM inference (`openai/gpt-oss-120b` for full itinerary generation, `openai/gpt-oss-20b` for single-day regeneration and contextual chat) with native JSON mode and token optimization.
- **External Data Integrations**:
  - OpenStreetMap Nominatim (geocoding and destination search)
  - OSRM (Open Source Routing Machine for distance & travel duration)
  - Open-Meteo (real-time and multi-day weather forecasts)
  - ExchangeRate-API (live currency conversion against INR base)
- **Document Export**: PDF generation powered by ReportLab.
- **Hosting & Deployment**: Render Web Service configured via [`render.yaml`](render.yaml) targeting Uvicorn ASGI on Python 3.13.

```
                         +-----------------------+
                         |  Frontend Application |
                         |   (React + Vite UI)   |
                         +-----------+-----------+
                                     |
                                     | HTTPS / REST
                                     v
                 +---------------------------------------+
                 |       ParyatakRoute API Backend       |
                 |               (FastAPI)               |
                 +----+--------------+--------------+----+
                      |              |              |
                      v              v              v
            +------------------+ +---------+ +------------------+
            |  Supabase Auth   | | Groq AI | | External APIs    |
            | & PostgreSQL RLS | |  Engine | | (Maps/Weather/FX)|
            +------------------+ +---------+ +------------------+
```

---

## 2. Backend Directory Structure

The active backend implementation resides in `backend-fastapi/`:

```
backend-fastapi/
├── app/
│   ├── api/v1/                   # REST API routes
│   │   ├── endpoints/
│   │   │   ├── auth.py           # User authentication & profile routes
│   │   │   ├── chat.py           # Context-aware travel assistant chat
│   │   │   ├── favourites.py     # User favourite itineraries CRUD
│   │   │   ├── health.py         # System health check & readiness probe
│   │   │   ├── itineraries.py    # Generation, regeneration, and export
│   │   │   ├── travel_data.py    # Places, routes, weather, currency
│   │   │   └── trips.py          # User trip CRUD operations
│   │   └── router.py             # Root v1 router aggregating all endpoints
│   ├── core/
│   │   ├── config.py             # Pydantic Settings & environment config
│   │   ├── logging.py            # Structured application logging
│   │   └── security.py           # Supabase JWT decoding & auth dependency
│   ├── repositories/             # Supabase PostgreSQL persistence layer
│   │   ├── favourite_repository.py
│   │   ├── itinerary_repository.py
│   │   ├── profile_repository.py
│   │   ├── supabase_client.py    # Supabase PostgREST client factory
│   │   └── trip_repository.py
│   ├── schemas/                  # Pydantic models for request/response validation
│   │   ├── auth.py
│   │   ├── chat.py
│   │   ├── common.py
│   │   ├── favourite.py
│   │   ├── itinerary.py
│   │   ├── travel_data.py
│   │   └── trip.py
│   ├── services/                 # Business logic and external integrations
│   │   ├── chat_service.py
│   │   ├── favourite_service.py
│   │   ├── groq_service.py       # Groq API client with retry and JSON fallback
│   │   ├── itinerary_service.py  # Budget calculation & day regeneration
│   │   ├── pdf_service.py        # ReportLab PDF itinerary generator
│   │   ├── travel_data_service.py# Nominatim, OSRM, Open-Meteo, FX
│   │   └── trip_service.py
│   └── main.py                   # FastAPI ASGI entrypoint & middleware stack
├── tests/                        # Automated Pytest suite
│   ├── conftest.py               # Shared test fixtures & in-memory mocks
│   ├── test_auth_security.py     # Authentication, JWT, and BOLA tests
│   ├── test_chat.py              # Contextual chatbot tests
│   ├── test_favourites.py        # Favourites CRUD tests
│   ├── test_groq_resilience.py   # AI retry logic & fallback resilience
│   ├── test_health_and_config.py # Health check & config loading
│   ├── test_itineraries.py       # Generation, editing, and single-day refresh
│   ├── test_travel_data.py       # External travel APIs
│   └── test_trips.py             # Trip persistence & date validation
├── .env.example                  # Environment configuration template
├── pytest.ini                    # Test runner configuration
├── requirements.txt              # Production and test Python dependencies
└── verify_live_supabase_persistence.py # Remote Supabase integration verifier
```

---

## 3. Prerequisites

- **Python**: Version 3.11 or higher (Python 3.13 recommended)
- **Pip**: Latest version
- **Supabase Account**: An active Supabase project with PostgreSQL and Auth enabled
- **Groq API Key**: An active API key from [Groq Cloud Console](https://console.groq.com)

---

## 4. Local Environment Setup & Installation

### Step 1: Clone the Repository and Navigate to the Backend

```bash
cd backend-fastapi
```

### Step 2: Create and Activate a Virtual Environment

On Windows (PowerShell):
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

On macOS / Linux:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 5. Environment Configuration

Create a `.env` file inside `backend-fastapi/` by copying the template:

```bash
cp .env.example .env
```

Configure the environment variables in `.env`:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `APP_ENV` | Application environment (`development` / `production`) | `development` |
| `PORT` | Local server port | `8000` |
| `LOG_LEVEL` | Logging verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`) | `INFO` |
| `FRONTEND_URL` | Allowed client URL for CORS | `http://localhost:5173` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed CORS origins | `http://localhost:5173,http://localhost:3000` |
| `SUPABASE_URL` | Supabase Project URL | `https://<your-project-id>.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase Publishable / Anon Key | `sb_publishable_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (Server-only) | `eyJhbGciOi...` |
| `SUPABASE_JWT_SECRET` | Supabase JWT Secret for token verification | Minimum 32-character secret |
| `GROQ_API_KEY` | Groq Cloud API Key | `gsk_...` |
| `GROQ_MODEL` | Primary LLM model for itinerary generation | `openai/gpt-oss-120b` |
| `GROQ_CHAT_MODEL` | Fast LLM model for chat and day regeneration | `openai/gpt-oss-20b` |
| `GROQ_TIMEOUT_SECONDS` | Timeout for AI inference requests | `30` |
| `GROQ_MAX_RETRIES` | Maximum retry attempts for transient API errors | `3` |

> [!CAUTION]
> Never commit `.env` or expose the `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, or `GROQ_API_KEY` in version control or client bundles.

---

## 6. Supabase Database Setup & Migrations

All database tables, constraints, indexes, triggers, and Row Level Security (RLS) policies are defined in [`supabase/migrations/`](supabase/migrations/):

- [`supabase/migrations/20261030_full_schema_and_rls.sql`](supabase/migrations/20261030_full_schema_and_rls.sql): Complete consolidated migration establishing:
  - `trips` table with user ownership foreign keys and date constraints.
  - `itineraries` table with `trip_id` unique constraint, budget summary, and JSONB `days`.
  - `favourites` table with unique compound index `(user_id, itinerary_id)`.
  - `profiles` table linked to `auth.users`.
  - Row Level Security (RLS) enforcing that users can only view, edit, or delete their own records.
  - Automatic `updated_at` triggers for all tables.

To apply migrations to your remote Supabase instance:
1. Open the **SQL Editor** in your [Supabase Dashboard](https://supabase.com/dashboard).
2. Execute the contents of [`supabase/migrations/20261030_full_schema_and_rls.sql`](supabase/migrations/20261030_full_schema_and_rls.sql).
3. Verify table creation and RLS status in the Supabase Table Editor.

---

## 7. Running the FastAPI Application Locally

Start the development server with live reload enabled:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Once running:
- **API Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Documentation**: `http://127.0.0.1:8000/docs`
- **ReDoc API Documentation**: `http://127.0.0.1:8000/redoc`
- **Health Check Endpoint**: `http://127.0.0.1:8000/health`

---

## 8. Automated Testing

### Running the Unit and Integration Test Suite

From the `backend-fastapi/` directory:

```bash
pytest -v
```

All 36 automated tests run against isolated mock repositories to verify:
- Complete Trip CRUD workflows and validation.
- Full itinerary generation, partial updates, and single-day regeneration.
- Contextual chat processing with conversation history.
- Saved favourites toggle and duplicate prevention.
- External travel data integration fallbacks (Nominatim, OSRM, Open-Meteo, ExchangeRate-API).
- Supabase JWT authentication, invalid token rejection, and BOLA isolation.
- Groq AI retry and error resilience.

### Running Live Remote Supabase Persistence Verification

To verify live remote Supabase PostgreSQL persistence, authentication, and RLS against your hosted Supabase instance:

```bash
python verify_live_supabase_persistence.py
```

This script exercises:
- Live database connectivity and schema presence across all tables.
- Authenticated user creation and session token generation via Supabase Auth.
- Real CRUD round-trip persistence surviving client re-initialization.
- Remote RLS policies preventing unauthorized cross-user access (BOLA protection).
- Real-time Groq AI generation and persistence in PostgreSQL.

---

## 9. Production Deployment Overview

ParyatakRoute is architected for zero-downtime deployment on Render as a Python Web Service.

### Option A: Automated Blueprint Deployment (Recommended)
1. Commit and push the repository to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/paryatakroute.git
   git branch -M main
   git push -u origin main
   ```
2. In the [Render Dashboard](https://dashboard.render.com/), click **New** -> **Blueprint**.
3. Connect your GitHub repository. Render automatically detects [`render.yaml`](render.yaml) and configures:
   - Service Name: `paryatakroute-backend`
   - Runtime: `Python` (pinned to 3.13.0)
   - Root Directory: `backend-fastapi`
   - Build Command: `pip install --upgrade pip && pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Health Check Path: `/health`
4. Provide the secret environment variables (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `GROQ_API_KEY`, etc.) when prompted.
5. Click **Apply**.

### Option B: Manual Web Service Creation
If setting up manually without a blueprint:
1. In the Render Dashboard, click **New** -> **Web Service** and select your repository.
2. Configure settings:
   - **Name**: `paryatakroute-backend`
   - **Region**: Oregon (or closest to your Supabase region)
   - **Branch**: `main` (or `master`)
   - **Root Directory**: `backend-fastapi`
   - **Runtime**: `Python`
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
3. Add Environment Variables:
   - `APP_ENV`: `production`
   - `PYTHON_VERSION`: `3.13.0`
   - `PORT`: `10000`
   - `SUPABASE_URL`: `https://<your-project-id>.supabase.co`
   - `SUPABASE_PUBLISHABLE_KEY`: `sb_publishable_...`
   - `SUPABASE_SERVICE_ROLE_KEY`: `eyJhbGciOi...`
   - `SUPABASE_JWT_SECRET`: `your_supabase_jwt_secret`
   - `GROQ_API_KEY`: `gsk_...`
   - `GROQ_MODEL`: `openai/gpt-oss-120b`
   - `GROQ_CHAT_MODEL`: `openai/gpt-oss-20b`
   - `GROQ_TIMEOUT_SECONDS`: `30`
   - `GROQ_MAX_RETRIES`: `3`
   - `FRONTEND_URL`: Allowed client domain (e.g., `https://paryatakroute.vercel.app`)
   - `CORS_ALLOWED_ORIGINS`: Comma-separated allowed origins
4. Click **Create Web Service**.

Once deployed, the live service URL will be available on the Render service dashboard (e.g. `https://paryatakroute-backend.onrender.com`). Verify deployment health via `GET /health` and `GET /health/ready`.
