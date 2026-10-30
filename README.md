# ParyatakRoute

## Project Overview

ParyatakRoute is an intelligent travel itinerary planning backend that generates structured, personalized day-by-day travel schedules from user preferences including destination, dates, budget, travel style, and interests. The platform calculates deterministic budget breakdowns, coordinates external travel data, and ensures multi-tenant security through PostgreSQL Row Level Security.

## Tech Stack

- **Language & Framework:** Python 3.13, FastAPI (ASGI)
- **Database & Auth:** Supabase PostgreSQL with Row Level Security (RLS), Supabase Auth (ES256 JWKS & HS256 JWT validation)
- **AI Engine:** Groq Cloud API (`openai/gpt-oss-120b` for structured generation, `openai/gpt-oss-20b` for chat and day regeneration)
- **Document Export:** ReportLab (PDF itinerary generation)
- **External APIs:** OpenStreetMap Nominatim (geocoding), Project OSRM (routing), Open-Meteo (weather forecasts), ExchangeRate-API (currency conversion)

## Key Features

- **Trip Management:** Full CRUD operations for trips with date validation and duration constraints.
- **AI Itinerary Generation:** Structured JSON day plans with categorized activities, timings, and cost estimates.
- **Chunked Multi-Day Generation:** Automatic batching for multi-day trips to stay within model token limits while preserving timeline cohesion.
- **Single-Day Regeneration:** Surgical regeneration of specific itinerary days without re-running full trip prompts.
- **Context-Aware Travel Chat:** Real-time conversational travel assistance aware of trip details and itinerary context.
- **Deterministic Budget Engine:** Real-time calculation and category breakdowns performed in Python application code.
- **PDF Export:** Generation of downloadable, formatted itinerary documents via ReportLab.
- **Favourites:** Bookmark management with duplicate constraint enforcement.
- **External Travel Integrations:** Cached geocoding, driving directions, weather forecasts, and currency exchange rates.
- **Security & Authorization:** Token-based authentication, Broken Object Level Authorization (BOLA) protection, and PostgreSQL RLS tenant isolation.

## Project Structure

```text
paryatakroute/
├── backend-fastapi/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/          # API route handlers (auth, trips, itineraries, chat, etc.)
│   │   │   └── router.py        # Central /api/v1 router aggregation
│   │   ├── core/                # Configuration, security, logging, exceptions
│   │   ├── repositories/        # Database access layer and Supabase clients
│   │   ├── schemas/             # Pydantic v2 validation models
│   │   ├── services/            # Business logic (Groq AI, PDF, travel data, trips)
│   │   └── main.py              # Application entrypoint & middleware configuration
│   ├── tests/                   # Pytest automated test suite (51 tests)
│   ├── .env.example             # Environment variable template
│   ├── pytest.ini               # Pytest configuration
│   ├── requirements.txt         # Core dependencies
│   └── requirements-lock.txt    # Pinned deployment dependencies
├── supabase/
│   └── migrations/              # PostgreSQL schema and RLS SQL migrations
├── render.yaml                  # Render deployment blueprint
├── FRONTEND_INTEGRATION.md      # Frontend API integration contract
└── features.md                  # Product feature specification
```

## Testing

Run the automated test suite from `backend-fastapi/`:

```bash
pytest -v
```

Verified test suite result: **51 passed** (100% pass rate) covering authentication, security, trip CRUD, AI generation, chunking resilience, PDF export, error handling, and external travel integrations.

## Deployment

The backend is configured for deployment on Render using the included [`render.yaml`](render.yaml) blueprint:

- **Service Type:** Web Service (Python 3.13)
- **Root Directory:** `backend-fastapi`
- **Build Command:** `pip install --upgrade pip && pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path:** `/health`