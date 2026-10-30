import apiClient from './apiClient';
import {
  APIResponse,
  TripCreate,
  TripUpdate,
  TripResponse,
  TripListResponse,
} from '../types/api';

export const tripService = {
  /**
   * Create a new trip in backend database.
   * Path: POST /api/v1/trips
   */
  async createTrip(data: TripCreate): Promise<TripResponse> {
    const res = await apiClient.post<APIResponse<TripResponse>>('/trips', data);
    if (!res.data || !res.data.data) {
      throw new Error(res.data?.message || 'Failed to create trip');
    }
    return res.data.data;
  },

  /**
   * List paginated trips owned by the authenticated user.
   * Path: GET /api/v1/trips?page={page}&limit={limit}
   */
  async listTrips(page: number = 1, limit: number = 20): Promise<TripListResponse> {
    const res = await apiClient.get<APIResponse<TripListResponse>>('/trips', {
      params: { page, limit },
    });
    if (!res.data || !res.data.data) {
      throw new Error(res.data?.message || 'Failed to load trips');
    }
    const data = res.data.data;
    const items = data.trips || data.items || [];
    return {
      trips: items,
      items,
      total: data.total ?? items.length,
      page: data.page ?? page,
      limit: data.limit ?? limit,
      total_pages: data.total_pages ?? Math.max(Math.ceil((data.total ?? items.length) / limit), 1),
    };
  },

  /**
   * Retrieve trip details by ID with ownership verification.
   * Path: GET /api/v1/trips/{trip_id}
   */
  async getTrip(tripId: string): Promise<TripResponse> {
    const res = await apiClient.get<APIResponse<TripResponse>>(`/trips/${tripId}`);
    if (!res.data || !res.data.data) {
      throw new Error(res.data?.message || 'Trip not found');
    }
    return res.data.data;
  },

  /**
   * Update trip details with ownership verification.
   * Path: PUT /api/v1/trips/{trip_id}
   */
  async updateTrip(tripId: string, updates: TripUpdate): Promise<TripResponse> {
    const res = await apiClient.put<APIResponse<TripResponse>>(`/trips/${tripId}`, updates);
    if (!res.data || !res.data.data) {
      throw new Error(res.data?.message || 'Failed to update trip');
    }
    return res.data.data;
  },

  /**
   * Delete trip and cascade-delete child itineraries.
   * Path: DELETE /api/v1/trips/{trip_id}
   */
  async deleteTrip(tripId: string): Promise<boolean> {
    const res = await apiClient.delete<APIResponse<{ id: string; deleted: boolean }>>(
      `/trips/${tripId}`
    );
    return res.data?.data?.deleted ?? true;
  },

  /**
   * Duplicate a trip by creating a copy with identical travel parameters.
   */
  async duplicateTrip(tripId: string): Promise<TripResponse> {
    const original = await this.getTrip(tripId);
    const copyData: TripCreate = {
      destination: `${original.destination} (Copy)`,
      starting_city: original.starting_city,
      start_date: original.start_date,
      end_date: original.end_date,
      budget: original.budget,
      currency: original.currency,
      travellers: original.travellers,
      travelers_count: original.travellers,
      travel_style: original.travel_style,
      interests: original.interests,
      transport_preference: original.transport_preference,
      accommodation_preference: original.accommodation_preference,
      dietary_preferences: original.dietary_preferences,
      accessibility_preferences: original.accessibility_preferences,
      additional_notes: original.additional_notes,
      status: 'planned',
    };
    return await this.createTrip(copyData);
  },
};

export default tripService;
