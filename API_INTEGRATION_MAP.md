# ParyatakRoute — Backend API Integration Map

> **Authoritative References:**  
> - Live FastAPI OpenAPI Documentation: [https://paryatakrouteapi.itspranjal.in/docs](https://paryatakrouteapi.itspranjal.in/docs)  
> - Backend Repository: [https://github.com/pranjal-shrivastava-78/ParyatakRoute](https://github.com/pranjal-shrivastava-78/ParyatakRoute) (`backend-fastapi`)  
> **Base URL:** `https://paryatakrouteapi.itspranjal.in/api/v1` (Live Production) / `http://localhost:8000/api/v1` (Local Dev)  
> **Standard Response Wrapper:** All JSON endpoints return `APIResponse[T]` with `{ success: boolean, message?: string, data: T, errorCode?: string }`.

---

## 1. Endpoints & Features Integration Matrix

| Frontend Feature | Backend Route | HTTP Method | Auth Requirement | Required Request Payload / Query Params | Expected Response Data Shape | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **System Health Check** | `/health` | `GET` | **Public** | None | `{ status: "ok", timestamp: string, version: string, services: { database, groq, redis } }` | **Verified Live** |
| **User Registration** | `/auth/register` | `POST` | **Public** | `{ email: str, password: str, name: str }` | `{ user: SafeUser, tokens: { accessToken, refreshToken, expiresIn, tokenType } }` | **Verified Live** |
| **User Login** | `/auth/login` | `POST` | **Public** | `{ email: str, password: str }` | `{ user: SafeUser, tokens: { accessToken, refreshToken, expiresIn, tokenType } }` | **Verified Live** |
| **Token Refresh** | `/auth/refresh` | `POST` | **Public** | `{ refreshToken: str }` | `{ accessToken: str, refreshToken: str, expiresIn: str, tokenType: "Bearer" }` | **Verified Live** |
| **User Logout** | `/auth/logout` | `POST` | **Bearer Token** | None | `{ message: string }` | **Verified Live** |
| **Get My Profile** | `/auth/me` | `GET` | **Bearer Token** | None | `{ id: str, email: str, name: str, avatar_url?: str, role: str, status: str, created_at?: str }` | **Verified Live** |
| **Generate AI Itinerary** | `/itineraries/generate` | `POST` | **Public (Optional Auth)** | `{ destination: str, startDate: str, endDate: str, travelers: int, budget: float, currency?: str, interests?: str[], pace?: str, tripId?: str }` | `ItineraryResponse` (Full days, activities, estimated costs, coordinates, summary) | **Verified Live** |
| **Get Itinerary by ID** | `/itineraries/{id}` | `GET` | **Public (Optional Auth)** | Path: `id: str` | `ItineraryResponse` (Complete day-by-day itinerary data) | **Verified Live** |
| **Get Itinerary by Trip** | `/itineraries/trip/{trip_id}` | `GET` | **Public (Optional Auth)** | Path: `trip_id: str` | `ItineraryResponse` | **Verified Live** |
| **Patch Itinerary (Recalc)**| `/itineraries/{id}` | `PATCH` | **Public (Optional Auth)** | Path: `id: str`<br>Body: `{ days: ItineraryDay[], summary?: str }` | `ItineraryResponse` with updated activities & deterministic budget re-calculation | **Verified Live** |
| **Itinerary Budget Analytics**| `/itineraries/{id}/budget` | `GET` | **Public (Optional Auth)** | Path: `id: str` | `BudgetBreakdownAnalysis` (`{ totalCost, currency, breakdownByCategory: {...}, dailyAverage, budgetUtilizationPct }`) | **Verified Live** |
| **Surgical Day Regenerate** | `/itineraries/{id}/days/{day}/regenerate` | `POST` | **Public (Optional Auth)** | Path: `id: str`, `day: int`<br>Body: `{ instruction?: str }` | `ItineraryResponse` with regenerated day plan preserved into trip | **Verified Live** |
| **Export Itinerary PDF** | `/itineraries/{id}/export/pdf` | `GET` | **Public (Optional Auth)** | Path: `id: str` | Binary `application/pdf` stream (`Content-Disposition: attachment; filename="paryatakroute-itinerary-*.pdf"`) | **Verified Live** |
| **AI Travel Chatbot** | `/chat` | `POST` | **Public (Optional Auth)** | `{ message: str, conversationId?: str, tripId?: str }` | `ChatResponse` (`{ reply: str, conversationId: str, intent?: str, suggestedActions?: str[] }`) | **Verified Live** |
| **Create Trip** | `/trips` | `POST` | **Public (Optional Auth)** | `{ destination: str, startDate: str, endDate: str, totalBudget?: float, currency?: str, travelers?: int, preferences?: dict }` | `TripResponse` (`{ id, userId, destination, startDate, endDate, totalBudget, status }`) | **Verified Live** |
| **List User Trips** | `/trips` | `GET` | **Bearer Token** | Query: `page: int = 1`, `limit: int = 20` | `TripListResponse` (`{ items: TripResponse[], total: int, page: int, limit: int }`) | **Verified Live** |
| **Get Trip by ID** | `/trips/{id}` | `GET` | **Public (Optional Auth)** | Path: `id: str` | `TripResponse` | **Verified Live** |
| **Update Trip** | `/trips/{id}` | `PUT` | **Public (Optional Auth)** | Path: `id: str`<br>Body: `TripUpdate` | `TripResponse` | **Verified Live** |
| **Delete Trip** | `/trips/{id}` | `DELETE` | **Bearer Token** | Path: `id: str` | `{ id: str, deleted: boolean }` | **Verified Live** |
| **Bookmark Favourite** | `/favourites` | `POST` | **Bearer Token** | `{ destinationName: str, destinationData?: dict, notes?: str }` | `FavouriteResponse` (`{ id, userId, destinationName, destinationData, createdAt }`) | **Verified Live** |
| **List Favourites** | `/favourites` | `GET` | **Bearer Token** | Query: `page: int = 1`, `limit: int = 20` | `FavouriteListResponse` (`{ items: FavouriteResponse[], total: int }`) | **Verified Live** |
| **Delete Favourite** | `/favourites/{id}` | `DELETE` | **Bearer Token** | Path: `id: str` | `{ id: str, deleted: boolean }` | **Verified Live** |
| **Destination Autocomplete**| `/destinations` | `GET` | **Public** | Query: `query: str`, `limit: int = 5` | `list[NormalizedPlace]` (`[{ displayName, name, lat, lon, country, type }]`) | **Verified Live** |
| **Driving Directions** | `/directions` | `POST` | **Public** | `{ start: [lat, lon], end: [lat, lon], waypoints?: [[lat, lon]] }` | `DirectionsResponse` (`{ distanceKm, durationMinutes, geometry, steps: [] }`) | **Verified Live** |
| **Weather Forecast** | `/weather` | `GET` | **Public** | Query: `lat: float`, `lon: float` | `WeatherResponse` (`{ temperature, condition, humidity, windSpeed, dailyForecast: [] }`) | **Verified Live** |
| **Currency Rates** | `/currency/rates` | `GET` | **Public** | Query: `base: str = "USD"` | `CurrencyRatesResponse` (`{ base, rates: { INR, EUR, GBP, ... }, updatedAt }`) | **Verified Live** |
| **Currency Conversion** | `/currency/convert` | `GET` | **Public** | Query: `from: str`, `to: str`, `amount: float` | `CurrencyConvertResponse` (`{ fromCurrency, toCurrency, originalAmount, convertedAmount, rate }`) | **Verified Live** |

---

## 2. Key Unauthenticated Access Architecture

### Problem Solved
Historically, itinerary generation and chat sessions failed or forced login because Supabase PostgreSQL database schemas require a foreign key link to `auth.users(id)`. 

### The Solution: Deterministic Guest Identity
In `backend-fastapi/app/core/security.py`, `get_optional_current_user` extracts the JWT if provided. If absent, operations gracefully fall back to the pre-seeded Guest User:
- **`GUEST_USER_ID = "60ac5770-df60-402e-9374-79ba6c0c1b72"`**
- **Associated Guest Email:** `guest@paryatakroute.org` (provisioned directly in live Supabase instance)
- **Frontend Behavior:** The frontend client NEVER blocks trip planning or chat queries behind login gates. The generated `itinerary_id` is stored in `localStorage` under `paryatak_guest_itineraries`. When the visitor eventually registers or logs in, a silent claim action links their guest itineraries to their registered `user_id`.

---

## 3. Error Codes & Centralized Exception Protocol

All API errors return standard HTTP status codes along with a structured JSON body:

```json
{
  "success": false,
  "message": "Human readable explanation of the error",
  "errorCode": "ERROR_CODE_ENUM",
  "data": null
}
```

### Standard Error Codes

| HTTP Status | Error Code | Description | Frontend Handling Strategy |
| :--- | :--- | :--- | :--- |
| `400` | `VALIDATION_ERROR` | Malformed parameters, invalid dates | Highlight relevant form field with inline error message |
| `401` | `UNAUTHORIZED` | Expired or missing Bearer token on protected route | Clear token from store, open non-blocking `AuthModal` |
| `401` | `INVALID_CREDENTIALS`| Wrong password or email | Display toast: "Invalid email or password" |
| `403` | `FORBIDDEN_OPERATION`| Attempting to access another traveler's trip | Redirect to `/trips` with notification |
| `404` | `NOT_FOUND` | Itinerary or trip ID does not exist | Render 404 Empty State with "Plan New Trip" action |
| `409` | `USER_ALREADY_EXISTS`| Email registered in Supabase | Suggest user log in instead of registering |
| `429` | `RATE_LIMIT_EXCEEDED`| Rate limit reached on AI generation | Display countdown toast and disable submit button |
| `502` / `503` | `GROQ_SERVICE_UNAVAILABLE`| Upstream AI provider timeout | Retry automatically with exponential backoff |
