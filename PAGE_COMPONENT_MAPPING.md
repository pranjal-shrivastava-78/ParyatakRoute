# ParyatakRoute — Page & Component Mapping

> **Authoritative References:** `DESIGN.md`, `PROJECT_ARCHITECTURE.md`, `FRONTEND_STRUCTURE.md`, and FastAPI live contract.  
> **Core Architecture:** Unified React 19 + TypeScript frontend with component reuse, modular routing, and dual-mode authentication (unauthenticated guest access for AI exploration and strict BOLA isolation for personal vaults).

---

## 1. Application Pages Matrix

| Page Name | Route Path | Access Level | Primary Backend Endpoints | Primary Page Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **Homepage** | `/` | **Public** | `GET /travel-data/destinations`, `GET /trips` (optional) | Atmospheric travel portal with 32px destination hero, 9999px search pill, curated deal cards, app acquisition showcase, and 4-column link directory. |
| **Explore** | `/explore` | **Public** | `GET /travel-data/destinations`, `GET /favourites`, `POST /favourites` | Visual destination discovery grid with real-time Nominatim search, category filters, and bookmarking. |
| **Create Trip** | `/trips/create` | **Public** | `POST /itineraries/generate`, `POST /trips` | Multi-step trip planner: destination selection, date range, traveler style, budget tier, and direct handoff to Groq AI itinerary generator. |
| **Generated Itinerary** | `/itineraries/:id` | **Public** | `GET /itineraries/:id`, `PATCH /itineraries/:id`, `GET /itineraries/:id/budget`, `POST /itineraries/:id/days/:day/regenerate`, `GET /itineraries/:id/export/pdf`, `GET /weather` | Complete day-by-day itinerary visualizer, surgical single-day regeneration, interactive map routes, deterministic budget charts, and PDF download. |
| **AI Travel Chatbot** | `/chat` | **Public** | `POST /chat`, `GET /trips` (optional context) | Conversational AI trip advisor powered by Groq AI (`openai/gpt-oss-120b`). Provides destination advice, packing tips, and local customs without login. |
| **My Trips** | `/trips` | **Protected** | `GET /trips`, `DELETE /trips/:id`, `PUT /trips/:id` | Authenticated traveler dashboard displaying upcoming, ongoing, and archived personal journeys with CRUD controls. |
| **Saved Destinations** | `/favourites` | **Protected** | `GET /favourites`, `DELETE /favourites/:id` | Personal travel wishlist and bookmarked destinations with quick-launch "Plan Trip" triggers. |
| **Profile & Settings** | `/profile` | **Protected** | `GET /auth/me`, `POST /auth/logout` | User profile management, session overview, theme/currency preferences, and security settings. |

---

## 2. Page Specifications & Layouts

### 2.1 Homepage (`/`)
- **Visual Design:** Implements `DESIGN.md` Section 1.
  - **Hero Destination Frame:** 32px border radius, high-res Santorini/Kerala panoramic background, transparent overlay navigation (`HeroNav`), and 9999px search pill (`SearchPill`).
  - **Curated Deals & Trending Itineraries:** White canvas (`#ffffff`), 3-column grid of flat `#f6f6f6` destination cards with 16px radius.
  - **Blue Promotional Tile:** `#1878ec` 32px rounded tile highlighting instant AI trip planning without account creation.
  - **App Acquisition Showcase:** 32px bold typography, high-contrast QR code, store rating badges, and mobile mockup preview.
  - **Destination Link Directory:** Wide `#ededed` band featuring 4 columns of `#1878ec` destination exploration links.
- **Components Used:** `HeroNav`, `SearchPill`, `DestinationCard`, `PromoTile`, `AppDownloadShowcase`, `Footer`.

### 2.2 Explore Page (`/explore`)
- **Visual Design:** Full exploration interface on clean white canvas.
  - **Sticky Search & Filter Bar:** Top search field with real-time Nominatim debounced geocoding and horizontal category filter pills (Heritage, Beaches, Mountains, Food & Culture, Wellness, Adventure).
  - **Results Grid:** Responsive 3-to-4 column grid of `DestinationCard` components with live weather badges (`/weather`).
  - **Bookmark Trigger:** Clicking heart on a card checks auth; if logged in, persists via `POST /favourites`; if guest, stores locally or opens non-blocking `AuthModal`.
- **Components Used:** `Navbar`, `SearchBar`, `FilterBar`, `DestinationCard`, `WeatherBadge`, `Footer`.

### 2.3 Create Trip Page (`/trips/create`)
- **Visual Design:** Focused, distraction-free planning wizard.
  - **Step 1: Destination & Dates:** Searchable destination query with interactive date picker (supports 1 to 14 days).
  - **Step 2: Traveler Profile & Style:** Group size, travel persona (Solo, Couple, Family, Friends, Backpacker), pace (Relaxed, Moderate, Fast-paced).
  - **Step 3: Budget & Preferences:** Total budget input, currency selector (USD, EUR, INR, GBP), dietary preferences, and interests.
  - **Action Bar:** "Generate Itinerary with AI" button with instant feedback, Groq streaming indicator, and fallback guest identity (`GUEST_USER_ID = "60ac5770-df60-402e-9374-79ba6c0c1b72"`).
- **Components Used:** `Navbar`, `TripFormWizard`, `DestinationAutocomplete`, `DateRangeSelector`, `BudgetInput`, `GeneratingOverlay`.

### 2.4 Generated Itinerary Page (`/itineraries/:id`)
- **Visual Design:** Comprehensive multi-column itinerary explorer.
  - **Header Banner:** Destination title, date duration, total calculated budget, traveler badges, and utility actions (`[Export PDF]`, `[Share Itinerary]`, `[Edit Trip Details]`).
  - **Day Timeline Container:** Sequential list of `DayAccordionCard` items:
    - Morning, Afternoon, Evening activity cards with timing, descriptions, estimated cost, and geocoded locations.
    - **Surgical Day Regeneration Button:** Triggers `DayRegenerateModal` to re-prompt Groq for just that single day without changing the rest of the trip.
  - **Sidebar Analytics:**
    - `BudgetBreakdownChart`: Real-time breakdown of lodging, food, transport, and attractions.
    - `WeatherForecastWidget`: 7-day forecast from Open-Meteo.
    - `RouteMapWidget`: Interactive Leaflet route map showing day stops.
- **Components Used:** `Navbar`, `ItineraryHeader`, `DayAccordionCard`, `ActivityCard`, `DayRegenerateModal`, `BudgetBreakdownChart`, `WeatherForecastWidget`, `RouteMapWidget`, `PDFExportButton`.

### 2.5 AI Travel Chatbot (`/chat`)
- **Visual Design:** Full-page and collapsible floating drawer chat experience.
  - **Zero-Auth Access:** Any visitor can type questions immediately; uses guest session memory if unauthenticated.
  - **Conversation Canvas:** Message thread with bubble styling (User in `#1878ec`, AI Assistant in `#f6f6f6` with 16px rounded corners).
  - **Quick Prompts:** Suggested travel questions ("Top 3 hidden spots in Jaipur", "Packing checklist for Himachal in December", "Local etiquette in Kyoto").
  - **Trip Attachment:** Optional trip selector to ground answers in the user's active itinerary context.
- **Components Used:** `Navbar`, `ChatThread`, `ChatMessageBubble`, `ChatInputBar`, `QuickPromptChips`, `TripContextSelector`.

### 2.6 My Trips (`/trips`)
- **Visual Design:** Personal travel management dashboard for authenticated travelers.
  - **Trip Status Tabs:** Upcoming, Past, Drafts.
  - **Trip Cards:** Displays destination, travel dates, traveler count, calculated budget, and link to `/itineraries/:id`.
  - **CRUD Controls:** Rename trip, edit dates, duplicate, or delete trip with confirmation dialog.
- **Components Used:** `Navbar`, `TripCard`, `TripEditModal`, `DeleteConfirmModal`, `EmptyState`, `Footer`.

### 2.7 Saved Destinations (`/favourites`)
- **Visual Design:** Bookmark gallery.
  - **Card Grid:** Saved cards with custom notes, rating, and creation date.
  - **Actions:** "Plan Itinerary from This" (pre-fills Create Trip wizard) or "Remove from Saved".
- **Components Used:** `Navbar`, `FavouriteCard`, `EmptyState`, `Footer`.

### 2.8 Profile & Settings (`/profile`)
- **Visual Design:** Account configuration canvas.
  - **Profile Information:** Name, email, avatar, member since.
  - **Preferences:** Default currency (INR, USD, EUR, GBP), unit system (Metric, Imperial), dietary default.
  - **Security & Session:** Logout button, token refresh status, Supabase Auth details.
- **Components Used:** `Navbar`, `ProfileForm`, `PreferencesForm`, `SessionOverview`, `Footer`.

---

## 3. Reusable Component Catalog

### 3.1 Navigation & Header Group
| Component | File Path | Props | Purpose |
| :--- | :--- | :--- | :--- |
| `HeroNav` | `src/components/navigation/HeroNav.tsx` | `activeTab: string, onSelectTab: (tab: string) => void` | Transparent overlay navigation seated directly inside photographic hero frames. Features logo, service tabs, and outline sign-in button. |
| `Navbar` | `src/components/navigation/Navbar.tsx` | `transparent?: boolean` | Standard sticky navbar for internal pages on `#ffffff` canvas with 1px border. |
| `Footer` | `src/components/navigation/Footer.tsx` | None | Full-width footer featuring the `#ededed` 4-column destination link directory and legal links. |

### 3.2 Search & Input Group
| Component | File Path | Props | Purpose |
| :--- | :--- | :--- | :--- |
| `SearchPill` | `src/components/search/SearchPill.tsx` | `onSearch: (params: SearchParams) => void` | 9999px unified white search bar with 1px gray dividers, 0px input radii, Nominatim autocomplete, date popover, and `#1878ec` circular button. |
| `DestinationAutocomplete` | `src/components/search/DestinationAutocomplete.tsx` | `value: string, onChange: (val: string) => void` | Debounced search dropdown calling `GET /travel-data/destinations`. |
| `DateRangePicker` | `src/components/search/DateRangePicker.tsx` | `startDate: string, endDate: string, onChange: (s: string, e: string) => void` | Custom compact date picker formatted with 12px border radius. |

### 3.3 Cards & Content Group
| Component | File Path | Props | Purpose |
| :--- | :--- | :--- | :--- |
| `DestinationCard` | `src/components/cards/DestinationCard.tsx` | `destination: Destination, onBookmark?: () => void` | Flat `#f6f6f6` card with 16px radius, no shadow, image header, price badge, and bookmark trigger. |
| `PromoTile` | `src/components/cards/PromoTile.tsx` | `title: string, subtitle: string, ctaText: string, onCta: () => void` | Saturated `#1878ec` banner with 32px radius and high-conversion pill action button. |
| `DayAccordionCard`| `src/components/itinerary/DayAccordionCard.tsx`| `day: ItineraryDay, itineraryId: string, onRegenerate: () => void` | Expandable day card displaying activities with surgical single-day regeneration trigger. |
| `ActivityCard` | `src/components/itinerary/ActivityCard.tsx` | `activity: ActivityItem` | Timeline card for morning/afternoon/evening events with duration, cost, and location tags. |

### 3.4 Modals & Floating Drawers
| Component | File Path | Props | Purpose |
| :--- | :--- | :--- | :--- |
| `AuthModal` | `src/components/modals/AuthModal.tsx` | `isOpen: boolean, onClose: () => void, initialMode: 'login' \| 'register'` | Non-blocking login/register modal using Supabase Auth. Does not lock out unauthenticated exploration. |
| `ChatDrawer` | `src/components/chat/ChatDrawer.tsx` | None (controlled via Zustand store) | Floating expandable chat assistant available across all pages for instant travel guidance. |
| `DayRegenerateModal`| `src/components/modals/DayRegenerateModal.tsx`| `isOpen: boolean, dayNumber: number, onConfirm: (instruction: string) => void` | Dialog allowing user to pass instructions (e.g. "Focus on vegetarian cafes") for Groq day regeneration. |
| `TripEditModal` | `src/components/modals/TripEditModal.tsx` | `isOpen: boolean, trip: Trip, onSave: (data: TripUpdate) => void` | Modal for updating trip metadata, budget, or dates. |

### 3.5 Analytics & Data Visualizers
| Component | File Path | Props | Purpose |
| :--- | :--- | :--- | :--- |
| `BudgetBreakdownChart` | `src/components/itinerary/BudgetBreakdownChart.tsx` | `budgetData: BudgetBreakdownAnalysis` | Visual category progress and percentage share (Transport, Lodging, Meals, Activities, Misc). |
| `WeatherWidget` | `src/components/widgets/WeatherWidget.tsx` | `lat: number, lon: number` | Real-time temperature, condition icon, and 7-day forecast from Open-Meteo. |
| `RouteMapWidget` | `src/components/widgets/RouteMapWidget.tsx` | `activities: ActivityItem[]` | Interactive Leaflet map visualizing stops and OSRM driving routes. |
