# Personalized Travel Itinerary Planner --- Features Specification

**Project name:** ParyatakRoute\
**Document:** `features.md`\
**Version:** 1.0\
**Purpose:** Define the product scope, features, technical expectations,
and acceptance criteria for building the Personalized Travel Itinerary
Planner with an AI coding agent.

------------------------------------------------------------------------

## 1. Project Overview

ParyatakRoute is a responsive web application that creates personalized
travel itineraries from a traveller's destination, dates, budget,
interests, and preferences.

The application must turn user inputs into a structured day-by-day
travel plan with activity suggestions, approximate costs, and a budget
breakdown. It must clearly distinguish AI-generated suggestions and
estimates from facts verified through external data sources.

### Primary goals

-   Generate useful itineraries personalized to the submitted
    preferences.
-   Make trip duration, schedule, and budget easy to understand.
-   Provide a responsive and accessible interface.
-   Keep AI credentials secure on the backend.
-   Handle invalid inputs and service failures gracefully.
-   Allow users to save, reopen, edit, and export plans in later phases.

### Out of scope for the initial MVP

-   Booking flights, hotels, activities, or transport.
-   Processing payments.
-   Guaranteeing live availability, exact prices, or attraction opening
    hours without a verified data source.
-   Complex group collaboration or social networking.
-   Native iOS or Android applications.

------------------------------------------------------------------------

## 2. Recommended Technology Stack

### Frontend

-   React
-   Vite
-   TypeScript
-   Tailwind CSS
-   React Router for page navigation
-   Zod for client-side form validation
-   Recharts for budget charts, if useful
-   Leaflet for maps in a later phase

### Backend

-   Python 3.13
-   FastAPI
-   Pydantic v2 for server-side request/response validation
-   Official Groq SDK for AI generation and chat
-   Supabase PostgreSQL and PostgREST for persistence with Row Level Security (RLS)
-   Supabase Auth for cryptographic JWT session management
-   ReportLab for PDF export generation

### Deployment

-   Frontend: Vercel or another static frontend host
-   Backend: Render Web Service (Python 3.13 / Uvicorn ASGI)
-   Database: Supabase PostgreSQL with automated migrations and RLS
-   Source control: Git and GitHub

Use compatible, maintained package versions. Avoid adding dependencies
unless they provide a clear benefit.

------------------------------------------------------------------------

## 3. Feature Priorities

-   **P0 --- MVP required:** Needed for the first working demonstration.
-   **P1 --- Important:** Add after the main generation workflow is
    stable.
-   **P2 --- Optional enhancement:** Add only when time permits.

  ID      Feature                                Priority   Phase
  ------- -------------------------------------- ---------- ----------------
  F-001   Responsive landing page                P0         1
  F-002   Trip preferences form                  P0         1
  F-003   Form validation                        P0         1
  F-004   AI itinerary generation                P0         2
  F-005   Structured itinerary rendering         P0         2
  F-006   Budget estimation and calculations     P0         2
  F-007   Loading, empty, and error states       P0         1--2
  F-008   Regenerate itinerary                   P0         2
  F-009   Edit trip preferences and regenerate   P1         2
  F-010   Save and retrieve trips                P1         4
  F-011   PDF export                             P1         4
  F-012   Interactive map                        P1         5
  F-013   Weather information                    P2         5
  F-014   User authentication                    P2         4, if required
  F-015   Shareable itinerary                    P2         Later
  F-016   Multilingual interface                 P2         Later
  F-017   Expense tracking                       P2         Later
  F-018   Flight/hotel booking integration       P2         Out of MVP

------------------------------------------------------------------------

## 4. Functional Requirements

### F-001 --- Landing Page (P0)

The landing page must include:

-   Product name and navigation.
-   A clear hero section describing AI-powered trip planning.
-   A prominent **Plan My Trip** call to action.
-   A short explanation of how the planner works.
-   Feature highlights and optional example destinations.
-   Footer with relevant navigation and a note that itinerary costs are
    estimates.

**Acceptance criteria**

-   The call to action opens the trip creation page.
-   Navigation links work.
-   The page is usable at mobile, tablet, and desktop widths.
-   Any sample itinerary is clearly labelled as an example.

### F-002 --- Trip Preferences Form (P0)

Collect the following fields:

  ------------------------------------------------------------------------
  Field                    Required                Validation / behaviour
  ------------------------ ----------------------- -----------------------
  Destination or preferred Yes                     Non-empty string
  region                                           

  Starting city            Recommended             Non-empty if supplied

  Start date               Yes                     Valid date

  End date                 Yes                     Same as or after start
                                                   date, subject to
                                                   supported trip rules

  Total budget             Yes                     Positive finite number

  Currency                 Yes                     Supported currency
                                                   code, default INR

  Number of travellers     Yes                     Positive integer with a
                                                   sensible maximum

  Travel style             Yes                     Budget, balanced,
                                                   relaxed, adventure, or
                                                   luxury

  Interests                Yes                     Select one or more
                                                   options

  Transport preference     No                      User preference

  Accommodation preference No                      User preference

  Dietary preferences      No                      Free text or predefined
                                                   options

  Mobility/accessibility   No                      Optional text or
  preferences                                      selectable requirements

  Additional notes         No                      Length-limited text
  ------------------------------------------------------------------------

Suggested interests include nature, beaches, history, culture, food,
adventure, shopping, nightlife, family activities, and photography.

The interface may calculate trip duration from the dates. Do not ask the
user to enter duration separately if it can be calculated reliably.

**Acceptance criteria**

-   Required fields are clearly marked.
-   Invalid inputs show actionable inline messages.
-   The user can correct validation errors without losing valid inputs.
-   The form prevents duplicate submissions while a request is in
    progress.
-   The server repeats all important validation independently.

### F-003 --- Date and Trip Validation (P0)

-   Use a single documented convention for counting trip days.
-   Validate date format and chronological order.
-   Apply a configurable maximum trip length.
-   Reject unsupported or unreasonable date ranges with a clear message.
-   Generate one itinerary day for each date in the accepted trip range.
-   Treat dates consistently across frontend, backend, and AI output.

**Acceptance criteria**

-   An invalid date range is rejected.
-   Generated day count matches the accepted date range.
-   Each itinerary day has a valid date and sequential day number.

### F-004 --- AI Itinerary Generation (P0)

The backend must send validated preferences to the AI provider and
request structured JSON.

The generated plan should include:

-   Trip title and concise summary.
-   Destination and dates.
-   A theme or focus for each day.
-   Ordered activities for each day.
-   Activity name, description, category, suggested start time, and
    duration.
-   Estimated activity cost and currency where appropriate.
-   Meal, rest, and flexible time where relevant.
-   Budget category estimates.
-   Assumptions and limitations.
-   Optional alternatives where practical.

The model must take into account the submitted budget, interests, travel
style, party size, and transport preferences.

**Acceptance criteria**

-   The application uses the real AI API when configured.
-   Different valid inputs influence the generated plan.
-   The backend validates the AI response before returning it.
-   Missing credentials, rate limits, timeouts, and invalid model output
    produce controlled errors.
-   The interface does not present a fabricated success response when
    generation fails.

### F-005 --- Itinerary Results (P0)

Display the generated plan in a readable, structured format:

-   Trip summary.
-   Day selector or day sections.
-   Timeline of activities.
-   Activity descriptions, durations, categories, and cost estimates.
-   Budget overview.
-   Explicit assumptions and warnings where details are not verified.
-   Controls to regenerate and return to edit preferences.

**Acceptance criteria**

-   Long descriptions do not break the layout.
-   Missing optional fields are handled gracefully.
-   Dates and times are formatted consistently.
-   The results are accessible on narrow screens.

### F-006 --- Budget Estimation (P0)

Estimate expenses for applicable categories:

-   Travel to and from the destination.
-   Local transport.
-   Accommodation.
-   Food.
-   Activities and entry fees.
-   Miscellaneous expenses.

Requirements:

-   Store a currency code with monetary amounts.
-   Calculate totals in application code.
-   Show estimated total, budget, difference, and estimated per-person
    cost.
-   Display a warning when the estimated total exceeds the user's
    budget.
-   Avoid double-counting category totals and activity costs.
-   Make clear whether estimates cover the entire group or one person.
-   Do not claim that estimates are current market prices unless
    supported by a data source.

**Acceptance criteria**

-   All displayed totals are calculated from a documented source of
    values.
-   Currency labels are visible.
-   The total and per-person figures use consistent rounding.
-   Budget overruns are visible and do not silently alter the user's
    budget.

### F-007 --- Loading, Empty, and Error States (P0)

Provide clear UI states for:

-   Initial form.
-   Generation in progress.
-   Successful generation.
-   Validation errors.
-   Network failures.
-   AI provider failures.
-   Rate limiting.
-   Empty saved-trip list.
-   Missing or deleted itinerary.

**Acceptance criteria**

-   The user can tell when a request is in progress.
-   The user receives a helpful message when a request fails.
-   Retrying a failed request is possible.
-   Raw stack traces, API keys, and internal secrets are never
    displayed.

### F-008 --- Regenerate Itinerary (P0)

Allow the user to request a new itinerary using the current preferences.

Optional later enhancements may let users regenerate a single day or
replace one activity.

**Acceptance criteria**

-   The regenerate control triggers a real request.
-   The loading state is visible.
-   The previous result is not silently overwritten by a failed request.
-   The new result is validated before being displayed.

### F-009 --- Edit Preferences (P1)

Allow users to return to their trip form with existing inputs populated,
make changes, and generate a revised itinerary.

**Acceptance criteria**

-   Existing form values are preserved when returning from results.
-   Changes are included in the next API request.
-   The results clearly reflect the updated request.

### F-010 --- Saved Trips (P1)

Use Supabase PostgreSQL to persist trips after the core workflow is working.

Suggested trip table columns:

-   `id` (UUID)
-   `user_id` (UUID)
-   `destination`
-   `start_date`
-   `end_date`
-   `budget`
-   `currency`
-   `travellers`
-   `travel_style`
-   `interests`
-   `status`
-   `created_at`
-   `updated_at`

Required operations:

-   List saved trips.
-   Retrieve one trip.
-   Update a trip.
-   Delete a trip.

**Acceptance criteria**

-   Saved trips survive a page refresh and a new session.
-   Database errors are handled gracefully.
-   If authentication is enabled, users can access only their own trips.
-   Destructive actions require clear user intent.

### F-011 --- PDF Export (P1)

Allow users to download a readable itinerary as a PDF.

The PDF should include:

-   Trip title, destination, and dates.
-   Day-wise activities.
-   Budget breakdown and currency.
-   Relevant assumptions and estimate disclaimers.

**Acceptance criteria**

-   Export produces a valid, readable PDF.
-   Long itineraries flow across pages correctly.
-   Missing optional information does not break export.

### F-012 --- Map View (P1)

Use a map library and an appropriate map data provider to show
attraction locations when coordinates are available.

Requirements:

-   Display location markers and labels.
-   Allow a user to inspect activity details.
-   Provide external directions links where practical.
-   Clearly indicate when a location has not been geocoded.
-   Respect the map tile provider's usage policy and attribution
    requirements.

**Acceptance criteria**

-   The map does not invent coordinates.
-   Activities without valid coordinates remain available in the
    itinerary.
-   Map failures do not prevent the rest of the itinerary from working.

### F-013 --- Weather Information (P2)

If implemented, retrieve weather information from a suitable weather
provider.

-   Identify the forecast location and date.
-   Display source and retrieval time when useful.
-   Distinguish forecasts from general seasonal guidance.
-   Provide a fallback if forecast data is unavailable.

Do not invent live weather results.

### F-014 --- Authentication (P2, if required)

Authentication is optional for the first MVP unless explicitly required
by the project evaluation.

If implemented:

-   Use a maintained authentication solution or secure session/token
    design.
-   Hash passwords with an appropriate password-hashing algorithm if
    handling passwords directly.
-   Protect saved-trip routes.
-   Enforce authorization on the server.
-   Never store plaintext passwords or expose authentication secrets.

### F-015 --- Sharing (P2)

Optionally allow users to create a shareable itinerary link.

-   Use an unguessable identifier.
-   Let the owner revoke sharing.
-   Avoid exposing private traveller information.
-   Do not make all saved trips public by default.

------------------------------------------------------------------------

## 5. API Contract

### GET `/api/health`

Returns the service health status.

Example response:

``` json
{
  "success": true,
  "status": "ok"
}
```

### POST `/api/itinerary/generate`

Accepts validated trip preferences.

Example request:

``` json
{
  "destination": "Goa, India",
  "startingCity": "Bhopal, India",
  "startDate": "2026-12-10",
  "endDate": "2026-12-13",
  "budget": 15000,
  "currency": "INR",
  "travellers": 2,
  "travelStyle": "balanced",
  "interests": ["beaches", "history", "local food"],
  "transportPreference": "public transport",
  "accommodationPreference": "budget hotel"
}
```

The dates and preferences above are sample values only.

Example response envelope:

``` json
{
  "success": true,
  "data": {
    "tripTitle": "Example Trip",
    "destination": "Goa, India",
    "summary": "A sample trip summary.",
    "days": [],
    "budget": {
      "currency": "INR",
      "totalEstimated": 12000,
      "categories": {
        "transport": 3000,
        "accommodation": 4000,
        "food": 2500,
        "activities": 1500,
        "miscellaneous": 1000
      }
    },
    "assumptions": [
      "Prices are estimates and have not been independently verified."
    ]
  }
}
```

The empty `days` array is illustrative only. A successful real response
must include the complete validated itinerary for the requested date
range.

Use a consistent error envelope, for example:

``` json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the submitted trip details."
  }
}
```

Suggested additional endpoints for later phases:

-   `GET /api/itinerary` --- list saved trips
-   `GET /api/itinerary/:id` --- retrieve a saved trip
-   `PUT /api/itinerary/:id` --- update a saved trip
-   `DELETE /api/itinerary/:id` --- delete a saved trip

Document authentication requirements for protected endpoints before
implementing them.

------------------------------------------------------------------------

## 6. Suggested Itinerary Data Shape

Each generated activity should support fields such as:

-   `name`: string
-   `description`: string
-   `category`: string
-   `startTime`: local time string
-   `durationMinutes`: positive integer
-   `estimatedCost`: non-negative number when known
-   `costCurrency`: currency code
-   `location.name`: string
-   `location.latitude`: number or null
-   `location.longitude`: number or null
-   `sourceStatus`: verified, unverified, or not applicable, according
    to the application's source policy

Each day should include:

-   `dayNumber`
-   `date`
-   `theme`
-   `activities`

The top-level itinerary should include:

-   `tripTitle`
-   `destination`
-   `summary`
-   `days`
-   `budget`
-   `assumptions`

Finalize one shared TypeScript/Zod schema and use it consistently across
the backend and frontend. Avoid maintaining contradictory schemas in
multiple locations.

------------------------------------------------------------------------

## 7. UI and Accessibility Requirements

-   Use a consistent design system for typography, spacing, buttons,
    cards, and forms.
-   Use destination imagery only where it improves the experience.
-   Maintain readable contrast and visible keyboard focus.
-   Give inputs programmatic labels.
-   Do not rely on colour alone to communicate errors or status.
-   Support mobile, tablet, and desktop layouts.
-   Avoid horizontal overflow.
-   Ensure loading and disabled states are communicated.
-   Add meaningful alternative text to informative images.
-   Use appropriate image sizing and lazy loading.
-   Do not use decorative UI elements that imply functionality when no
    action exists.

------------------------------------------------------------------------

## 8. Security and Reliability

-   Keep the AI API key and database credentials on the backend.
-   Read secrets from environment variables.
-   Keep `.env` out of Git.
-   Include `.env.example` with placeholders only.
-   Validate and limit request bodies.
-   Set CORS to approved frontend origins.
-   Apply rate limiting to AI generation.
-   Set reasonable timeouts.
-   Avoid logging secrets or unnecessary personal data.
-   Validate AI output before rendering or persisting it.
-   Sanitize or safely render user- and model-generated text.
-   Handle provider errors without exposing internal details.
-   If authentication is implemented, enforce authorization on every
    protected operation.

------------------------------------------------------------------------

## 9. Testing Requirements

### Functional tests

-   Valid trip request generates a structured itinerary.
-   Different preferences affect the result.
-   Invalid dates and budgets are rejected.
-   The itinerary has the expected number of days.
-   Budget arithmetic is consistent.
-   Regeneration works.
-   Saved trips can be reopened, updated, and deleted when implemented.
-   PDF export produces a valid document when implemented.

### Failure tests

-   Missing AI API key.
-   AI provider timeout.
-   Rate limit response.
-   Invalid JSON from the model.
-   Database unavailable.
-   Network disconnection.
-   Missing optional activity fields.
-   Invalid or missing coordinates.

### UI tests

-   Responsive layout.
-   Keyboard navigation.
-   Form error visibility.
-   Loading and retry states.
-   No dead buttons or broken navigation.
-   No browser console errors during the main workflow.

------------------------------------------------------------------------

## 10. Implementation Plan

### Phase 1 --- Frontend foundation

-   Initialize React, Vite, TypeScript, and Tailwind CSS.
-   Build the landing page and trip preferences form.
-   Add validation, responsive layouts, and reusable components.
-   Use clearly labelled sample data only for UI development.

**Exit criteria:** The frontend runs locally and the form behaves
correctly.

### Phase 2 --- AI generation MVP

-   Initialize the FastAPI backend.
-   Add `/health` and `/api/v1/itineraries/generate`.
-   Connect the real Groq API on the server.
-   Validate input and model output.
-   Render the real generated itinerary and calculated budget.
-   Add loading and error states.

**Exit criteria:** A valid user submission produces a personalized,
validated itinerary through the real backend and AI provider.

### Phase 3 --- Hardening

-   Improve prompts and output validation.
-   Check dates, duration, schedule consistency, and budget
    calculations.
-   Add timeouts, rate limiting, and error handling.
-   Test failure cases.

**Exit criteria:** Common failures are handled safely and do not crash
the application.

### Phase 4 --- Persistence and export

-   Integrate Supabase PostgreSQL.
-   Add saved-trip operations.
-   Add PDF export.
-   Add authentication only if required.

**Exit criteria:** Saved trips persist and exports work.

### Phase 5 --- Optional integrations

-   Add map view.
-   Add weather information.
-   Add sharing or other enhancements only if time permits.

**Exit criteria:** Optional services fail gracefully without breaking
itinerary generation.

### Phase 6 --- Production deployment

-   Deploy frontend and backend.
-   Configure environment variables and production CORS.
-   Test the deployed health endpoint and complete generation workflow.
-   Document setup and deployment in README.md.

**Exit criteria:** The deployed application works without relying on a
local development server.

------------------------------------------------------------------------

## 11. Definition of Done

The MVP is complete when:

-   [ ] The landing page and trip form are responsive.
-   [ ] Form validation works on client and server.
-   [ ] The backend securely calls the real AI provider.
-   [ ] AI output is validated before being displayed.
-   [ ] The itinerary covers the requested date range.
-   [ ] Budget calculations are performed by application code.
-   [ ] Loading, error, and retry states work.
-   [ ] No real API key is exposed in frontend code or source control.
-   [ ] The main workflow has been tested.
-   [ ] Setup and deployment instructions are documented.

Database persistence, PDF export, maps, weather, authentication, and
sharing are not MVP blockers unless the project requirements explicitly
demand them.

------------------------------------------------------------------------

## 12. Instructions for the Coding Agent

1.  Inspect the current repository before making changes.
2.  If code already exists, preserve working behaviour and avoid
    destructive rewrites.
3.  Implement the project in phases and verify each phase before moving
    forward.
4.  Do not fabricate API responses or silently replace failed
    integrations with mock data.
5.  Clearly distinguish implemented, partially implemented, and
    unimplemented features.
6.  Run relevant build, lint, type-check, and test commands where
    available.
7.  Fix errors introduced by each change before proceeding.
8.  Do not claim a feature works unless it has been tested.
9.  Ask before introducing costly services or expanding the agreed
    scope.
10. Keep the implementation focused on a reliable MVP before adding
    advanced features.

**End of specification.**
