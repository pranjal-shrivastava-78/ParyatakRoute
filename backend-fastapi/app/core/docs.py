"""Custom Swagger UI branding and OpenAPI documentation configuration for ParyatakRoute.

Provides curated styling, branded topbar navigation, JWT Bearer authentication guidance,
and logical tag grouping for the interactive API documentation at /docs.
"""
from fastapi.responses import HTMLResponse

PARYATAK_FAVICON_SVG = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0 0 32 32'%20fill='none'%3E%3Crect%20width='32'%20height='32'%20rx='8'%20fill='%230F172A'/%3E%3Cpath%20d='M16%204L20%2012L28%2016L20%2020L16%2028L12%2020L4%2016L12%2012L16%204Z'%20fill='%2310B981'/%3E%3Ccircle%20cx='16'%20cy='16'%20r='3'%20fill='%236366F1'/%3E%3C/svg%3E"

OPENAPI_DESCRIPTION = """
### Personalized Travel Itinerary Planning Engine & Geospatial Backend

Welcome to the **ParyatakRoute** REST API documentation. ParyatakRoute is an intelligent travel platform that dynamically designs multi-day travel itineraries tailored to user preferences, budgets, travel styles, and geographical constraints.

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

#### How to Authenticate in Swagger UI:
1. Register via `POST /api/v1/auth/register` or login via `POST /api/v1/auth/login`.
2. Copy the `accessToken` string from the JSON response data.
3. Click the green **Authorize** button at the top right of this page.
4. Enter your token (or paste `Bearer <token>`) and click **Authorize**.
5. All protected endpoints (marked with padlock icons) will now execute with your authenticated credentials.
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

SWAGGER_CUSTOM_CSS = """
/* ParyatakRoute Modern Swagger UI Theme */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
    --pr-navy: #0f172a;
    --pr-slate: #1e293b;
    --pr-indigo: #4f46e5;
    --pr-indigo-light: #6366f1;
    --pr-emerald: #10b981;
    --pr-emerald-dark: #059669;
    --pr-bg: #f8fafc;
    --pr-card-border: #e2e8f0;
    --pr-text-main: #0f172a;
    --pr-text-muted: #64748b;
}

body {
    background-color: var(--pr-bg) !important;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
    color: var(--pr-text-main) !important;
    margin: 0 !important;
    padding: 0 !important;
}

/* Hide default swagger topbar */
.swagger-ui .topbar {
    display: none !important;
}

/* Custom ParyatakRoute Navbar */
.paryatak-topbar {
    background: #0f172a;
    border-bottom: 1px solid #1e293b;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #4f46e5 0%, #10b981 100%);
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3);
}

.paryatak-logo-icon svg {
    width: 22px;
    height: 22px;
    fill: #ffffff;
}

.paryatak-brand-text {
    display: flex;
    flex-direction: column;
}

.paryatak-brand-name {
    font-size: 1.18rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #ffffff;
    line-height: 1.2;
}

.paryatak-brand-tagline {
    font-size: 0.72rem;
    font-weight: 500;
    color: #94a3b8;
    letter-spacing: 0.02em;
}

.paryatak-badges {
    display: flex;
    align-items: center;
    gap: 8px;
}

.paryatak-pill {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 9999px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
}

.pill-version {
    background: #1e293b;
    color: #38bdf8;
    border: 1px solid #334155;
}

.pill-status {
    background: rgba(16, 185, 129, 0.12);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.25);
}

.status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background-color: #10b981;
    display: inline-block;
    box-shadow: 0 0 6px #10b981;
}

.paryatak-nav-links {
    display: flex;
    align-items: center;
    gap: 12px;
}

.paryatak-nav-link {
    font-size: 0.8rem;
    font-weight: 600;
    color: #cbd5e1;
    text-decoration: none;
    padding: 6px 12px;
    border-radius: 6px;
    transition: all 0.15s ease;
    border: 1px solid transparent;
}

.paryatak-nav-link:hover {
    color: #ffffff;
    background: #1e293b;
    border-color: #334155;
}

/* Swagger UI General Styles */
.swagger-ui {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
}

.swagger-ui .wrapper {
    max-width: 1200px !important;
    padding: 24px 20px !important;
}

/* Info container / Hero header */
.swagger-ui .info {
    margin: 20px 0 32px 0 !important;
    background: #ffffff !important;
    border: 1px solid var(--pr-card-border) !important;
    border-radius: 14px !important;
    padding: 32px !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05) !important;
}

.swagger-ui .info .title {
    font-size: 2.1rem !important;
    font-weight: 800 !important;
    color: var(--pr-navy) !important;
    letter-spacing: -0.03em !important;
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
}

.swagger-ui .info .title small {
    background: #e0e7ff !important;
    color: #4338ca !important;
    font-size: 0.75rem !important;
    font-weight: 700 !important;
    padding: 4px 10px !important;
    border-radius: 9999px !important;
    vertical-align: middle !important;
}

.swagger-ui .info p, .swagger-ui .info li {
    font-size: 0.925rem !important;
    line-height: 1.6 !important;
    color: #334155 !important;
}

.swagger-ui .info h3 {
    color: var(--pr-navy) !important;
    font-weight: 700 !important;
    margin-top: 24px !important;
}

/* Filter Input */
.swagger-ui .filter-container {
    padding: 0 !important;
    margin: 16px 0 24px 0 !important;
}

.swagger-ui .filter-container input {
    width: 100% !important;
    max-width: 450px !important;
    padding: 10px 16px !important;
    font-size: 0.9rem !important;
    font-family: inherit !important;
    border: 1.5px solid #cbd5e1 !important;
    border-radius: 8px !important;
    background: #ffffff !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
    transition: all 0.2s ease !important;
}

.swagger-ui .filter-container input:focus {
    border-color: var(--pr-indigo) !important;
    outline: none !important;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15) !important;
}

/* Authorize Button Styling */
.swagger-ui .btn.authorize {
    background: linear-gradient(135deg, #059669 0%, #10b981 100%) !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 8px 18px !important;
    font-size: 0.875rem !important;
    font-weight: 700 !important;
    letter-spacing: 0.01em !important;
    box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3) !important;
    transition: all 0.2s ease !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 8px !important;
}

.swagger-ui .btn.authorize:hover {
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.45) !important;
    transform: translateY(-1px) !important;
}

.swagger-ui .btn.authorize svg {
    fill: #ffffff !important;
}

/* Section Tags */
.swagger-ui .opblock-tag-section {
    margin-bottom: 24px !important;
}

.swagger-ui .opblock-tag {
    font-size: 1.25rem !important;
    font-weight: 700 !important;
    color: var(--pr-navy) !important;
    border-bottom: 2px solid #e2e8f0 !important;
    padding: 16px 4px 12px 4px !important;
}

.swagger-ui .opblock-tag small {
    font-size: 0.85rem !important;
    font-weight: 400 !important;
    color: var(--pr-text-muted) !important;
    margin-left: 12px !important;
}

/* Operation Blocks */
.swagger-ui .opblock {
    margin-bottom: 12px !important;
    border-radius: 10px !important;
    border-width: 1px !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
    overflow: hidden !important;
    background: #ffffff !important;
    transition: all 0.15s ease !important;
}

.swagger-ui .opblock:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06) !important;
}

.swagger-ui .opblock .opblock-summary {
    padding: 12px 16px !important;
}

.swagger-ui .opblock .opblock-summary-method {
    font-family: 'Plus Jakarta Sans', sans-serif !important;
    font-size: 0.78rem !important;
    font-weight: 700 !important;
    min-width: 80px !important;
    padding: 6px 0 !important;
    text-align: center !important;
    border-radius: 6px !important;
}

.swagger-ui .opblock .opblock-summary-path {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.92rem !important;
    font-weight: 600 !important;
    color: var(--pr-navy) !important;
}

.swagger-ui .opblock .opblock-summary-description {
    font-size: 0.85rem !important;
    color: var(--pr-text-muted) !important;
}

/* Method Color Schemes */
.swagger-ui .opblock.opblock-get {
    border-color: #a7f3d0 !important;
    background: #ffffff !important;
}
.swagger-ui .opblock.opblock-get .opblock-summary-method {
    background: #ecfdf5 !important;
    color: #047857 !important;
    border: 1px solid #a7f3d0 !important;
}

.swagger-ui .opblock.opblock-post {
    border-color: #bfdbfe !important;
    background: #ffffff !important;
}
.swagger-ui .opblock.opblock-post .opblock-summary-method {
    background: #eff6ff !important;
    color: #1d4ed8 !important;
    border: 1px solid #bfdbfe !important;
}

.swagger-ui .opblock.opblock-put {
    border-color: #fde68a !important;
    background: #ffffff !important;
}
.swagger-ui .opblock.opblock-put .opblock-summary-method {
    background: #fffbeb !important;
    color: #b45309 !important;
    border: 1px solid #fde68a !important;
}

.swagger-ui .opblock.opblock-patch {
    border-color: #ddd6fe !important;
    background: #ffffff !important;
}
.swagger-ui .opblock.opblock-patch .opblock-summary-method {
    background: #faf5ff !important;
    color: #6d28d9 !important;
    border: 1px solid #ddd6fe !important;
}

.swagger-ui .opblock.opblock-delete {
    border-color: #fecdd3 !important;
    background: #ffffff !important;
}
.swagger-ui .opblock.opblock-delete .opblock-summary-method {
    background: #fff1f2 !important;
    color: #be123c !important;
    border: 1px solid #fecdd3 !important;
}

/* Lock Padlock Icons */
.swagger-ui .authorization__btn svg {
    fill: #10b981 !important;
    width: 18px !important;
    height: 18px !important;
}

.swagger-ui .authorization__btn.locked svg {
    fill: #059669 !important;
}

/* Execute Button */
.swagger-ui .btn.execute {
    background: #4f46e5 !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 6px !important;
    font-weight: 600 !important;
    box-shadow: 0 2px 4px rgba(79, 70, 229, 0.25) !important;
    transition: all 0.2s ease !important;
}

.swagger-ui .btn.execute:hover {
    background: #4338ca !important;
}

/* Models / Schemas Accordion */
.swagger-ui section.models {
    border: 1px solid var(--pr-card-border) !important;
    border-radius: 12px !important;
    background: #ffffff !important;
    margin-top: 32px !important;
}

.swagger-ui section.models h4 {
    font-size: 1.15rem !important;
    font-weight: 700 !important;
    color: var(--pr-navy) !important;
}

/* Authorization Modal */
.swagger-ui .dialog-ux .modal-ux {
    border-radius: 14px !important;
    border: 1px solid #cbd5e1 !important;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
    overflow: hidden !important;
}

.swagger-ui .dialog-ux .modal-ux-header {
    background: #0f172a !important;
    padding: 16px 20px !important;
}

.swagger-ui .dialog-ux .modal-ux-header h3 {
    color: #ffffff !important;
    font-weight: 700 !important;
    font-size: 1.1rem !important;
}

.swagger-ui .dialog-ux .modal-ux-content {
    padding: 24px !important;
}

.swagger-ui .dialog-ux .modal-ux-content input[type="text"],
.swagger-ui .dialog-ux .modal-ux-content input[type="password"] {
    border: 1.5px solid #cbd5e1 !important;
    border-radius: 6px !important;
    padding: 8px 12px !important;
}

.swagger-ui .dialog-ux .modal-ux-content input:focus {
    border-color: var(--pr-indigo) !important;
    outline: none !important;
}
"""


def get_paryatak_swagger_ui_html() -> HTMLResponse:
    """Generates the customized ParyatakRoute Swagger UI documentation page.

    Features custom branding, typography (Plus Jakarta Sans & JetBrains Mono),
    responsive topbar, emerald Authorize button, and deep linking configuration.
    """
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ParyatakRoute API Documentation</title>
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
                <span class="paryatak-brand-name">ParyatakRoute</span>
                <span class="paryatak-brand-tagline">Intelligent Travel Engine & API</span>
            </div>
        </a>
        <div class="paryatak-badges">
            <span class="paryatak-pill pill-version">v1.0.0</span>
            <span class="paryatak-pill pill-status">
                <span class="status-dot"></span>
                <span>Active</span>
            </span>
        </div>
        <nav class="paryatak-nav-links">
            <a href="/openapi.json" target="_blank" class="paryatak-nav-link">OpenAPI Spec</a>
            <a href="/health" target="_blank" class="paryatak-nav-link">Health Status</a>
            <a href="/redoc" target="_blank" class="paryatak-nav-link">ReDoc</a>
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
            syntaxHighlight: {{
                theme: 'monokai'
            }},
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
