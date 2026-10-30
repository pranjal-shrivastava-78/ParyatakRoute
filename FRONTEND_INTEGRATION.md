# ParyatakRoute — Frontend Integration Contract & API Specification

Complete reference for integrating any frontend client (Vite, Next.js, React, Vue, mobile) with the ParyatakRoute Backend service (FastAPI + Supabase PostgreSQL/Auth + Groq AI).

---

## 1. Environment Configuration

### Frontend Environment Variables
Set the backend API base URL in your frontend `.env` configuration:

- **For Vite applications (Development):**
  ```env
  VITE_API_BASE_URL=http://localhost:8000/api/v1
  ```
- **For Next.js applications (Development):**
  ```env
  NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
  ```
- **For Production (e.g. deployed on Render):**
  ```env
  VITE_API_BASE_URL=https://paryatakroute-backend.onrender.com/api/v1
  ```

---

## 2. Authentication & Session Architecture

ParyatakRoute uses stateless **Supabase Auth JSON Web Tokens (JWT)** for access authentication and row-level authorization.

### Token Flow
1. **Login / Register:** Client authenticates with Supabase Auth or backend `/auth/login` and receives an `accessToken` (JWT) and `refreshToken`.
2. **Authenticated Requests:** Include the access token in every private API request header:
   ```http
   Authorization: Bearer <accessToken>
   ```
3. **Token Expiry (401 `TOKEN_EXPIRED` or `UNAUTHORIZED`):** Call `/auth/refresh` or refresh via the Supabase client to obtain a fresh token pair.
4. **Logout:** Call `/auth/logout` to revoke active refresh sessions.

---

## 3. Standard Response Formats

### Standard Success Envelope
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Standard Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Destination is required and cannot be empty"
  }
}
```

### Common Error Codes
| HTTP Status | Error Code | Description |
| :--- | :--- | :--- |
| `400` | `VALIDATION_ERROR` | Request body or query parameters failed Pydantic schema validation |
| `400` | `INVALID_ID` | Path parameter is not a valid UUID string |
| `400` | `INVALID_JSON` | Request body contains malformed JSON |
| `401` | `UNAUTHORIZED` | Missing or invalid Bearer authorization header |
| `401` | `TOKEN_EXPIRED` | Access token has expired; refresh session |
| `401` | `INVALID_CREDENTIALS` | Incorrect email or password during login |
| `403` | `FORBIDDEN` | Caller does not own the requested trip or itinerary (BOLA enforcement) |
| `404` | `NOT_FOUND` | Route or resource does not exist |
| `404` | `TRIP_NOT_FOUND` | Referenced trip record was not found |
| `404` | `ITINERARY_NOT_FOUND` | Referenced itinerary record was not found |
| `409` | `EMAIL_ALREADY_EXISTS` | Registration email is already registered |
| `409` | `DUPLICATE_FAVOURITE` | Place is already saved in user favourites |
| `413` | `PAYLOAD_TOO_LARGE` | Request payload exceeds size limit |
| `429` | `RATE_LIMIT_EXCEEDED` | Request rate limit exceeded |
| `502` | `AI_GATEWAY_ERROR` | Upstream Groq AI service error |
| `503` | `DATABASE_UNAVAILABLE` | Database is disconnected during readiness check |
| `504` | `AI_TIMEOUT` | AI itinerary generation or chat request timed out |

---

## 4. Complete Endpoints Matrix

### A. Health & Readiness Probes (Public)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Liveness probe (returns `{ "success": true, "status": "ok" }`) |
| `GET` | `/health/ready` | Readiness probe verifying active Supabase database connection |

### B. Authentication (`/api/v1/auth`)
| Method | Endpoint | Access | Body Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | `{ "name", "email", "password" }` | Registers user account and returns tokens |
| `POST` | `/auth/login` | Public | `{ "email", "password" }` | Authenticates credentials and returns tokens |
| `POST` | `/auth/refresh` | Public | `{ "refreshToken" }` | Issues fresh token pair |
| `POST` | `/auth/logout` | Protected | `{ "refreshToken"? }` | Revokes refresh token sessions |
| `GET` | `/auth/me` | Protected | None | Returns authenticated user profile |

### C. Trips (`/api/v1/trips`)
| Method | Endpoint | Access | Query / Body Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/trips` | Protected | `{ "destination", "startDate", "endDate", "budget", "currency", "travellers", "travelStyle", "interests": [...] }` | Creates a new trip |
| `GET` | `/trips` | Protected | `?page=1&limit=10` | Lists paginated trips owned by caller |
| `GET` | `/trips/:id` | Protected | None | Retrieves a single trip by UUID |
| `PUT` | `/trips/:id` | Protected | Partial trip fields | Updates trip preferences and duration |
| `DELETE` | `/trips/:id` | Protected | None | Deletes trip and cascades all its itineraries |

### D. Itineraries (`/api/v1/itineraries`)
| Method | Endpoint | Access | Query / Body Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/itineraries/generate` | Protected | `{ "tripId", "regenerate"?: boolean }` | Groq AI-powered generation and Supabase persistence |
| `GET` | `/itineraries/:id` | Protected | None | Retrieves saved itinerary |
| `GET` | `/itineraries/trip/:tripId`| Protected | None | Lists all itineraries for a trip |
| `PATCH` | `/itineraries/:id` | Protected | `{ "title"?, "summary"?, "days"? }` | Updates fields & recalculates budget |
| `POST` | `/itineraries/:id/days/:dayNumber/regenerate` | Protected | `{ "instructions"? }` | Regenerates single day via Groq without wiping others |
| `GET` | `/itineraries/:id/budget`| Protected | None | Deterministic category breakdown & overrun |
| `GET` | `/itineraries/:id/export/pdf` | Protected | None | Downloads binary multi-page PDF document |

### E. Saved Destinations & Favourites (`/api/v1/favourites`)
| Method | Endpoint | Access | Body Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/favourites` | Protected | `{ "placeId", "name", "category", "destination", "latitude"?, "longitude"?, "address"?, "notes"? }` | Saves a favorite destination/place |
| `GET` | `/favourites` | Protected | None | Lists caller's saved favourites |
| `DELETE` | `/favourites/:id` | Protected | None | Removes favourite |

### F. Context-Aware AI Travel Chatbot (`/api/v1/chat`)
| Method | Endpoint | Access | Body Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/chat` | Protected | `{ "message": string, "tripId"?: string, "itineraryId"?: string, "history"?: [] }` | Groq AI travel assistant response |

### G. External Travel Data (`/api/v1/*`) (Public)
| Method | Endpoint | Query / Body Payload | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/destinations` | `?query=Kyoto&category=attraction` | OpenStreetMap place and POI search |
| `POST` | `/directions` | `{ "coordinates": [[lon1, lat1], [lon2, lat2]] }` | OSRM route distance & duration |
| `GET` | `/weather` | `?latitude=35.0116&longitude=135.7681` | Open-Meteo multi-day weather forecast |
| `GET` | `/currency/rates` | `?base=USD` | Exchange rates matrix |
| `GET` | `/currency/convert`| `?amount=100&from=USD&to=EUR` | Real-time currency conversion |

---

## 5. Frontend Client Implementation Example (Axios with Auto-Refresh)

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle Token Refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = res.data.data;
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);
```
