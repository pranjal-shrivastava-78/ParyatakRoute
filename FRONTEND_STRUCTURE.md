# ParyatakRoute — Frontend Structure & Technical Specification (Phase 1)

**Document:** `FRONTEND_STRUCTURE.md`  
**Version:** 1.0.0  
**Status:** Approved for Implementation (Phase 1)  

---

## 1. Directory & Folder Layout

The ParyatakRoute frontend uses a modular, domain-driven directory structure organized by clear separation of concerns:

```text
frontend/
├── index.html                  # HTML entrypoint with Nunito Sans fonts & SEO meta
├── package.json                # Dependencies and build scripts
├── tsconfig.json               # Root TypeScript configuration
├── tsconfig.app.json           # Application compiler options
├── tsconfig.node.json          # Node / Vite configuration
├── vite.config.ts              # Vite bundling, plugins, and dev server config
├── .env                        # Local runtime environment variables
├── .env.example                # Example environment template
└── src/
    ├── main.tsx                # React DOM root entrypoint
    ├── App.tsx                 # Root router, global layouts, and context wrappers
    ├── index.css               # Global resets, typography tokens, and DESIGN.md variables
    │
    ├── assets/                 # Static illustrations, brand marks, and fallback imagery
    │
    ├── types/                  # Strictly typed interfaces matching backend FastAPI schemas
    │   └── api.ts              # Auth, Trip, Itinerary, Favourites, Chat, and Travel Data types
    │
    ├── services/               # Centralized API service layer
    │   ├── apiClient.ts        # Axios instance, Bearer token injection, auto-refresh queue
    │   ├── authService.ts      # Register, Login, Logout, Refresh, GetMe
    │   ├── tripService.ts      # Trip CRUD operations with BOLA parameters
    │   ├── itineraryService.ts # AI generation, surgical regeneration, budget, and PDF download
    │   ├── favouriteService.ts # Saved destinations and POI bookmarking
    │   ├── chatService.ts      # Context-aware Groq AI chatbot conversations
    │   └── travelDataService.ts# Nominatim geocoding, OSRM routes, Open-Meteo weather, currency
    │
    ├── context/                # Global React Contexts
    │   └── AuthContext.tsx     # User authentication state, token persistence, and profile sync
    │
    ├── components/             # Reusable UI components per DESIGN.md
    │   ├── Navbar.tsx          # Standard top navigation for internal pages
    │   ├── HeroNav.tsx         # Transparent product navigation for photographic hero frame
    │   ├── Footer.tsx          # Link directory band (#ededed) and attribution footer
    │   ├── SearchPill.tsx      # 9999px horizontal search bar with live Nominatim autocomplete
    │   ├── ChatDrawer.tsx      # Floating Groq AI Travel Assistant drawer
    │   ├── AuthModal.tsx       # Sign In & Registration modal dialog
    │   ├── DayRegenerateModal.tsx # Surgical day replan prompt modal
    │   └── TripEditModal.tsx   # Trip parameters update dialog
    │
    ├── pages/                  # Page-level route views
    │   ├── HomePage.tsx        # Top-level discovery, hero window, deal cards, app showcase
    │   ├── ExplorePage.tsx     # OSM Nominatim search, Open-Meteo weather, OSRM directions
    │   ├── CreateTripPage.tsx  # Multi-preference trip builder and AI generation trigger
    │   ├── TripsListPage.tsx   # User trip vault, status badges, and edit/delete actions
    │   ├── ItineraryViewPage.tsx# Day-by-day activities, deterministic budget, PDF export
    │   ├── SavedPage.tsx       # User bookmarked destinations and POIs
    │   └── ProfileSettingsPage.tsx # Account overview, token details, backend health probe
    │
    └── styles/                 # Specialized component stylesheets
        └── components.css      # Hopper-specific visual styles (Hero, Pill, Cards, Drawer)
```

---

## 2. Routing Strategy (`react-router-dom` v7)

ParyatakRoute uses declarative client-side routing with clean separation between public discovery pages and authenticated user vaults:

| Route Path | View Component | Access Policy | Description & Route Behavior |
| :--- | :--- | :--- | :--- |
| `/` | `HomePage` | **Public** | Photographic hero window with integrated `HeroNav`, 9999px search pill, featured deals, and blue promo tile. |
| `/explore` | `ExplorePage` | **Public** | Place search via OpenStreetMap, 7-day Open-Meteo weather, driving routes, and currency tool. Accepts `?query=`. |
| `/create` | `CreateTripPage` | **Public** | Multi-preference trip builder matching `TripCreate`. Directly triggers Groq AI generation without requiring login. |
| `/itineraries/:itineraryId` | `ItineraryViewPage` | **Public** | Detailed day-by-day plan, timeline, deterministic budget metrics, PDF export, and surgical replan. |
| `/trips` | `TripsListPage` | **Protected** | User's private travel vault. Unauthenticated visitors are prompted to sign in to access saved records. |
| `/saved` | `SavedPage` | **Protected** | Bookmarked destinations from `/api/v1/favourites`. Unauthenticated visitors are prompted to sign in. |
| `/profile` | `ProfileSettingsPage` | **Protected** | Authenticated user profile, active session metadata, and live API status. |
| `*` | Fallback | **Public** | Catch-all redirect to `/`. |

### Header Rendering Logic
Per **`DESIGN.md`**, navigation is a single top bar embedded directly into the photographic hero frame rather than a separate opaque header:
- When `location.pathname === '/'`, the standard `<Navbar />` is suppressed, and `<HeroNav />` is rendered inside `.hero-frame`.
- When navigating to internal pages (`/explore`, `/create`, `/trips`, `/itineraries/*`, `/saved`, `/profile`), `<Navbar />` is sticky-mounted with clean white canvas styling and 1px divider gray border.

---

## 3. State Management & Data-Flow Strategy

### Strategy Principles
1. **No Redux / Heavy Overhead:** Avoid bloated external state management libraries (e.g. Redux Toolkit, MobX). The application state consists of:
   - Global Authentication Identity (`AuthContext`)
   - URL Route Parameters (`react-router-dom` search params)
   - Local View & Form State (`useState`, `useReducer`)
2. **Server-State Synchronization:**
   - Server-state responses (Trips, Itineraries, Favourites, Weather) are fetched on component mount and cached in local component state.
   - Mutations (e.g. `PATCH /itineraries/{id}`, `POST /itineraries/{id}/days/{day}/regenerate`, `DELETE /trips/{id}`) optimistically update or immediately refetch deterministic analytics.

### Authentication Context (`AuthContext.tsx`)
```typescript
interface AuthContextType {
  user: SafeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```
- Listens for global `auth:expired` events dispatched by `apiClient.ts` if a refresh token is revoked.
- Persists user profile in `localStorage` (`paryatak_user`) for instant non-flickering UI initialization.

---

## 4. API Client & Service Architecture

All backend communication is centralized in `src/services/` using an enhanced Axios client:

### Interceptor Architecture
1. **Request Interceptor:**
   - Reads `localStorage.getItem('accessToken')`.
   - Injects `Authorization: Bearer <token>` into outgoing private requests.
2. **Response 401 Queue Interceptor:**
   - Detects `401 TOKEN_EXPIRED` or `UNAUTHORIZED`.
   - If an existing refresh is underway, queues failed requests in a promise buffer.
   - Calls `POST /api/v1/auth/refresh` with `{ refreshToken }`.
   - On success: updates `accessToken` & `refreshToken` in storage, flushes the queued requests, and retries the original request.
   - On failure: purges tokens, dispatches `auth:expired`, and safely resets state.

---

## 5. Type Definitions Strategy

All types in `src/types/api.ts` correspond **1:1 to FastAPI Pydantic schemas**:
- **Envelope Contracts:** `APIResponse<T>` (`{ success, message, data, meta, error }`)
- **Auth:** `SafeUser`, `AuthTokens`, `AuthResponseData`, `UserProfileResponse`, `LoginRequest`, `RegisterRequest`
- **Trips:** `TripCreate`, `TripUpdate`, `TripResponse`, `TripListResponse`, `TravelStyle`, `TripStatus`
- **Itineraries:** `Activity`, `DayPlan`, `ItineraryBudget`, `BudgetCategoryBreakdown`, `ItineraryResponse`, `BudgetBreakdownAnalysis`, `GenerateItineraryRequest`, `RegenerateDayRequest`
- **Favourites:** `FavouriteCreate`, `FavouriteResponse`, `FavouriteListResponse`
- **Chat:** `ChatMessage`, `ChatRequest`, `ChatResponse`
- **Travel Data:** `NormalizedPlace`, `DirectionsRequest`, `DirectionsResponse`, `WeatherResponse`, `CurrencyConvertResponse`
