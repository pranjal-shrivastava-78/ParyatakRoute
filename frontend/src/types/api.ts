/**
 * ParyatakRoute TypeScript API Contracts & Type Definitions
 * Exact mapping to FastAPI backend schemas and Live OpenAPI specs.
 */

export interface APIResponse<T> {
  success: boolean;
  message?: string | null;
  data: T;
  meta?: Record<string, any> | null;
  error?: {
    code: string;
    message: string;
  };
}

// ==================== AUTH TYPES ====================
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar_url?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: string;
  tokenType?: string;
}

export interface AuthResponseData {
  user: SafeUser;
  tokens: AuthTokens;
}

export interface UserProfileResponse {
  id: string;
  email?: string | null;
  name: string;
  role: string;
  status: string;
  avatar_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ==================== TRIP TYPES ====================
export type TripStatus = 'draft' | 'planned' | 'completed' | 'cancelled';
export type TravelStyle = 'balanced' | 'adventure' | 'cultural' | 'luxury' | 'budget' | 'nature' | 'foodie';

export interface TripCreate {
  destination: string;
  starting_city?: string | null;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  budget: number;
  currency: string;
  travelers_count?: number; // alias for travellers
  travellers?: number;
  travel_style?: string;
  interests?: string[];
  transport_preference?: string | null;
  accommodation_preference?: string | null;
  dietary_preferences?: string | null;
  accessibility_preferences?: string | null;
  additional_notes?: string | null;
  status?: TripStatus;
}

export interface TripUpdate {
  destination?: string;
  starting_city?: string | null;
  start_date?: string;
  end_date?: string;
  budget?: number;
  currency?: string;
  travellers?: number;
  travel_style?: string;
  interests?: string[];
  transport_preference?: string | null;
  accommodation_preference?: string | null;
  dietary_preferences?: string | null;
  accessibility_preferences?: string | null;
  additional_notes?: string | null;
  status?: TripStatus;
}

export interface TripResponse {
  id: string;
  user_id: string;
  destination: string;
  starting_city?: string | null;
  start_date: string;
  end_date: string;
  budget: number;
  currency: string;
  travellers: number;
  travel_style: string;
  interests: string[];
  transport_preference?: string | null;
  accommodation_preference?: string | null;
  dietary_preferences?: string | null;
  accessibility_preferences?: string | null;
  additional_notes?: string | null;
  status: TripStatus;
  duration_days: number;
  created_at: string;
  updated_at: string;
}

export interface TripListResponse {
  trips: TripResponse[];
  items?: TripResponse[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ==================== ITINERARY TYPES ====================
export type ItineraryStatus = 'draft' | 'generated' | 'confirmed' | 'archived';
export type SourceStatus = 'verified' | 'unverified' | 'not_applicable';

export interface ActivityLocation {
  name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  place_id?: string | null;
}

export interface ActivityTransport {
  mode?: string | null;
  details?: string | null;
  duration_minutes?: number | null;
  estimated_cost?: number | null;
  distance_meters?: number | null;
}

export interface Activity {
  id?: string | null;
  name: string;
  description: string;
  category: string;
  start_time?: string;
  duration_minutes: number;
  estimated_cost: number;
  cost_currency: string;
  location?: ActivityLocation | null;
  transport?: ActivityTransport | null;
  source_status?: SourceStatus;
}

export interface DayPlan {
  day_number: number;
  date: string;
  theme?: string | null;
  activities: Activity[];
}

export interface BudgetCategoryBreakdown {
  transport: number;
  accommodation: number;
  food: number;
  activities: number;
  miscellaneous: number;
}

export interface ItineraryBudget {
  currency: string;
  total_estimated: number;
  categories: BudgetCategoryBreakdown;
}

export interface ItineraryResponse {
  id: string;
  trip_id: string;
  user_id: string;
  title: string;
  summary?: string | null;
  status: ItineraryStatus;
  days: DayPlan[];
  budget: ItineraryBudget;
  assumptions: string[];
  generation_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BudgetBreakdownAnalysis {
  itinerary_id: string;
  trip_budget: number;
  total_estimated: number;
  currency: string;
  is_over_budget: boolean;
  difference: number;
  categories: BudgetCategoryBreakdown;
}

export interface GenerateItineraryRequest {
  trip_id?: string | null;
  tripId?: string | null;
  regenerate?: boolean;
  preferences?: Record<string, any>;
}

export interface RegenerateDayRequest {
  instruction?: string | null;
  preferences?: Record<string, any>;
}

export interface ItineraryPatchRequest {
  title?: string | null;
  summary?: string | null;
  status?: ItineraryStatus | null;
  days?: DayPlan[] | null;
}

// ==================== FAVOURITES TYPES ====================
export interface FavouriteCreate {
  place_id: string;
  name: string;
  display_name?: string | null;
  address?: string | null;
  latitude: number;
  longitude: number;
  category?: string | null;
  type?: string | null;
  photo_url?: string | null;
  provider?: string;
  attribution?: string | null;
  notes?: string | null;
}

export interface FavouriteResponse extends FavouriteCreate {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface FavouriteListResponse {
  items: FavouriteResponse[];
  total: number;
  page: number;
  limit: number;
}

// ==================== CHAT TYPES ====================
export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  message: string;
  trip_id?: string | null;
  tripId?: string | null;
  itinerary_id?: string | null;
  itineraryId?: string | null;
  conversation_id?: string | null;
  conversationId?: string | null;
  history?: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
  trip_context_applied?: boolean;
  tripContextApplied?: boolean;
  itinerary_context_applied?: boolean;
  itineraryContextApplied?: boolean;
  timestamp?: string;
  conversationId?: string;
  intent?: string;
  suggestedActions?: string[];
}

// ==================== TRAVEL DATA TYPES ====================
export interface NormalizedPlace {
  place_id: string;
  name: string;
  display_name: string;
  latitude: number;
  longitude: number;
  category?: string | null;
  type?: string | null;
  address?: string | null;
  attribution?: string | null;
}

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface DirectionsRequest {
  coordinates?: number[][]; // [[lon, lat], ...]
  start?: Coordinate;
  destination?: Coordinate;
  mode?: string;
}

export interface DirectionsResponse {
  distance_meters: number;
  duration_seconds: number;
  distance_km: number;
  duration_minutes: number;
  geometry?: string | null;
  provider: string;
}

export interface WeatherDailyForecast {
  date: string;
  max_temp_c: number;
  min_temp_c: number;
  weather_code: number;
  condition: string;
  precipitation_prob?: number;
}

export interface WeatherResponse {
  latitude: number;
  longitude: number;
  forecast_days: WeatherDailyForecast[];
  current?: {
    temperature: number;
    condition: string;
    precipitation_prob?: number;
  } | null;
  provider: string;
}

export interface CurrencyRatesResponse {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
  provider: string;
}

export interface CurrencyConvertResponse {
  from_currency: string;
  to_currency: string;
  amount: number;
  converted_amount: number;
  rate: number;
  result?: number;
  provider?: string;
}
