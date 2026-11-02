"""Custom documentation and OpenAPI branding for ParyatakRoute.

Provides a premium developer documentation portal at /docs matching the ParyatakRoute
editorial design system (Forest Green #183D32, Terracotta #D97745, Warm Ivory #F7F5EF),
interactive API explorer, live health status, code snippet generators, and branded Swagger/ReDoc.
"""
from fastapi.responses import HTMLResponse

# Official ParyatakRoute Favicon (Forest Green background with Terracotta Compass Star)
PARYATAK_FAVICON_SVG = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0 0 32 32'%20fill='none'%3E%3Crect%20width='32'%20height='32'%20rx='8'%20fill='%23183D32'/%3E%3Cpath%20d='M16%205L19%2013L27%2016L19%2019L16%2027L13%2019L5%2016L13%2013L16%205Z'%20fill='%23D97745'/%3E%3Ccircle%20cx='16'%20cy='16'%20r='3.5'%20fill='%23F7F5EF'/%3E%3C/svg%3E"

OPENAPI_DESCRIPTION = """
### Personalized Travel Itinerary Planning Engine & Geospatial Backend

Welcome to the official **ParyatakRoute** REST API documentation. ParyatakRoute dynamically designs multi-day travel itineraries tailored to user preferences, budgets, travel styles, and geographical constraints.

---

### Key Capabilities

* 🧠 **AI-Powered Itinerary Generation** — Generates complete day-by-day travel schedules using Groq AI (`llama-3.3-70b-versatile`) with automatic multi-day chunking.
* ⚡ **Surgical Day Regeneration** — Replan an individual day in an existing itinerary without affecting preceding or following days.
* 💰 **Deterministic Budget Breakdown** — Real-time tracking of transport, accommodation, food, activities, and miscellaneous expenses.
* 🗺️ **GIS & Driving Route Calculation** — Real-time waypoint routing powered by Project OSRM with distance and travel time calculation.
* 📍 **Geocoding & Destination Discovery** — Location autocompletion and geocoding via OpenStreetMap Nominatim.
* 🌦️ **7-Day Meteorological Forecasts** — Accurate daily forecasts, weather codes, and precipitation probabilities via Open-Meteo.
* 💱 **Live Currency Conversion** — Real-time currency exchange rates for international travelers.
* 📄 **ReportLab PDF Compilation** — High-resolution, printable PDF itinerary export.
* 🛡️ **Tenant Isolation & Security** — Broken Object Level Authorization (BOLA) protection with Supabase Row Level Security (RLS).

---

### Authentication Guide

Protected endpoints require a **Supabase JWT Bearer Token** in the `Authorization` header:

```http
Authorization: Bearer <your_access_token>
```

#### How to Authenticate:
1. Register via `POST /api/v1/auth/register` or login via `POST /api/v1/auth/login`.
2. Copy the `accessToken` string from the JSON response data.
3. In this documentation, use the **⚡ Autofill Demo Token** button or enter your token in the Bearer Token input.
4. All protected endpoints (marked with padlock icons) will execute with your authenticated credentials.
"""

OPENAPI_TAGS = [
    {
        "name": "Root",
        "description": "Application index and service metadata endpoint.",
    },
    {
        "name": "Health",
        "description": "Liveness and Supabase database readiness probes for platform orchestrators and uptime checks.",
    },
    {
        "name": "Authentication",
        "description": "User account registration, session login, JWT token refresh, session revocation, and current user profile inspection.",
    },
    {
        "name": "Trips",
        "description": "Trip lifecycle management: create, inspect, update, and delete trip records with date validation and user tenant isolation (BOLA protection).",
    },
    {
        "name": "Itineraries",
        "description": "AI-powered travel itinerary generation via Groq LLM, multi-day chunking, surgical single-day regeneration, deterministic budget breakdown, and ReportLab PDF compilation.",
    },
    {
        "name": "Favourites",
        "description": "Destination bookmarks and saved places with user-specific duplicate protection and ownership enforcement.",
    },
    {
        "name": "Chat",
        "description": "Context-aware conversational travel assistant powered by Groq AI, leveraging user trip and itinerary context.",
    },
    {
        "name": "Travel Data",
        "description": "External geospatial and environmental services: OpenStreetMap Nominatim geocoding, OSRM driving route calculations, Open-Meteo weather forecasts, and currency exchange.",
    },
]

# Swagger UI custom CSS matching ParyatakRoute editorial branding
SWAGGER_CUSTOM_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
    --pr-forest: #183D32;
    --pr-forest-hover: #112B23;
    --pr-terracotta: #D97745;
    --pr-warm-ivory: #F7F5EF;
    --pr-sand: #E8E4D9;
    --pr-charcoal: #26332E;
    --pr-border: #D8D3C5;
    --pr-white: #FFFFFF;
}

body {
    background-color: var(--pr-warm-ivory) !important;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
    color: var(--pr-charcoal) !important;
    margin: 0 !important;
    padding: 0 !important;
}

.swagger-ui .topbar { display: none !important; }

.paryatak-topbar {
    background: var(--pr-forest);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 12px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 4px 12px rgba(24, 61, 50, 0.15);
    position: sticky;
    top: 0;
    z-index: 1000;
}

.paryatak-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
}

.paryatak-logo-icon {
    width: 38px;
    height: 38px;
    background: #112B23;
    border: 1.5px solid var(--pr-terracotta);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.paryatak-logo-icon svg {
    width: 22px;
    height: 22px;
    fill: var(--pr-terracotta);
}

.paryatak-brand-text {
    display: flex;
    flex-direction: column;
}

.paryatak-brand-name {
    font-size: 1.25rem;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: -0.02em;
}

.paryatak-brand-name span {
    color: var(--pr-terracotta);
}

.paryatak-brand-tagline {
    font-size: 0.72rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.paryatak-badges {
    display: flex;
    align-items: center;
    gap: 8px;
}

.paryatak-pill {
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.pill-version {
    background: rgba(255, 255, 255, 0.12);
    color: #FFFFFF;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.pill-portal {
    background: var(--pr-terracotta);
    color: #FFFFFF;
    text-decoration: none;
    transition: opacity 0.15s ease;
}
.pill-portal:hover { opacity: 0.9; }

.paryatak-nav-links {
    display: flex;
    align-items: center;
    gap: 16px;
}

.paryatak-nav-link {
    color: rgba(255, 255, 255, 0.85);
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 6px;
    transition: all 0.15s ease;
}

.paryatak-nav-link:hover {
    color: #FFFFFF;
    background: rgba(255, 255, 255, 0.1);
}

.swagger-ui .info {
    margin: 28px 0 !important;
}

.swagger-ui .info .title {
    color: var(--pr-forest) !important;
    font-weight: 800 !important;
}

.swagger-ui .btn.authorize {
    background-color: var(--pr-forest) !important;
    border-color: var(--pr-forest) !important;
    color: #FFFFFF !important;
    border-radius: 9999px !important;
    font-weight: 600 !important;
}

.swagger-ui .btn.authorize svg {
    fill: #FFFFFF !important;
}

.swagger-ui .opblock.opblock-get { border-color: #1E6B4A !important; background: #E8F4EE !important; }
.swagger-ui .opblock.opblock-post { border-color: #183D32 !important; background: #E6EFEA !important; }
.swagger-ui .opblock.opblock-put, .swagger-ui .opblock.opblock-patch { border-color: #D97745 !important; background: #FBEFE9 !important; }
.swagger-ui .opblock.opblock-delete { border-color: #B9382C !important; background: #FCEBEA !important; }
"""

def get_paryatak_swagger_ui_html() -> HTMLResponse:
    """Generates the branded Swagger UI documentation page."""
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ParyatakRoute API Documentation — Swagger UI</title>
    <link rel="icon" type="image/svg+xml" href="{PARYATAK_FAVICON_SVG}">
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
    <style>
        {SWAGGER_CUSTOM_CSS}
    </style>
</head>
<body>
    <header class="paryatak-topbar">
        <a href="/docs" class="paryatak-brand">
            <div class="paryatak-logo-icon">
                <svg viewBox="0 0 24 24">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
                </svg>
            </div>
            <div class="paryatak-brand-text">
                <span class="paryatak-brand-name">Paryatak<span>Route</span></span>
                <span class="paryatak-brand-tagline">Your Journey, Intelligently Planned.</span>
            </div>
        </a>
        <div class="paryatak-badges">
            <span class="paryatak-pill pill-version">v1.0.0</span>
            <a href="/docs" class="paryatak-pill pill-portal">← Back to Modern Docs</a>
        </div>
        <nav class="paryatak-nav-links">
            <a href="/openapi.json" target="_blank" class="paryatak-nav-link">OpenAPI Spec</a>
            <a href="/health" target="_blank" class="paryatak-nav-link">Health Status</a>
            <a href="/redoc" class="paryatak-nav-link">ReDoc</a>
        </nav>
    </header>

    <div id="swagger-ui"></div>

    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
        const ui = SwaggerUIBundle({{
            url: '/openapi.json',
            dom_id: '#swagger-ui',
            layout: 'BaseLayout',
            deepLinking: true,
            filter: true,
            docExpansion: 'list',
            defaultModelsExpandDepth: 1,
            defaultModelExpandDepth: 1,
            displayRequestDuration: true,
            showCommonExtensions: true,
            tryItOutEnabled: true,
            persistAuthorization: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.SwaggerUIStandalonePreset
            ]
        }});
        window.ui = ui;
    </script>
</body>
</html>
"""
    response = HTMLResponse(content=html_content)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


# Import the primary HTML generator for the custom documentation portal
from app.core.docs_portal import get_paryatak_docs_portal_html

def get_paryatak_docs_html() -> HTMLResponse:
    """Generates the premium, customized ParyatakRoute Developer Documentation Portal."""
    return get_paryatak_docs_portal_html()
