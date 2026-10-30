import apiClient from './apiClient';
import {
  APIResponse,
  ItineraryResponse,
  GenerateItineraryRequest,
  ItineraryPatchRequest,
  RegenerateDayRequest,
  BudgetBreakdownAnalysis,
} from '../types/api';

const ITINERARIES_CACHE_KEY = 'paryatak_cached_itineraries';

function getCachedItineraryMap(): Record<string, ItineraryResponse> {
  try {
    const raw = localStorage.getItem(ITINERARIES_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function cacheItinerary(itinerary: ItineraryResponse): void {
  try {
    const map = getCachedItineraryMap();
    map[itinerary.id] = itinerary;
    localStorage.setItem(ITINERARIES_CACHE_KEY, JSON.stringify(map));
  } catch {
    // Non-fatal if localStorage quota exceeded
  }
}

export const itineraryService = {
  /**
   * Generate a complete personalized travel itinerary using Groq AI.
   * Path: POST /api/v1/itineraries/generate (Public & Authenticated)
   */
  async generateItinerary(request: GenerateItineraryRequest): Promise<ItineraryResponse> {
    const payload: Record<string, any> = {
      regenerate: !!request.regenerate,
    };

    if (request.trip_id || request.tripId) {
      payload.trip_id = request.trip_id || request.tripId;
    }

    if (request.preferences) {
      payload.preferences = request.preferences;
    }

    const res = await apiClient.post<APIResponse<ItineraryResponse>>(
      '/itineraries/generate',
      payload
    );

    if (!res.data || !res.data.data) {
      throw new Error(res.data?.message || 'Failed to generate itinerary with AI');
    }

    const itinerary = res.data.data;
    cacheItinerary(itinerary);
    return itinerary;
  },

  /**
   * Retrieve itinerary details by ID without requiring authentication.
   * Path: GET /api/v1/itineraries/{itinerary_id} (Public & Authenticated)
   */
  async getItinerary(itineraryId: string): Promise<ItineraryResponse> {
    try {
      const res = await apiClient.get<APIResponse<ItineraryResponse>>(
        `/itineraries/${itineraryId}`
      );

      if (res.data && res.data.data) {
        const itinerary = res.data.data;
        cacheItinerary(itinerary);
        return itinerary;
      }
    } catch (err: any) {
      // If network fails, check cache as fallback
      const cached = getCachedItineraryMap()[itineraryId];
      if (cached) {
        return cached;
      }
      throw err;
    }

    const cached = getCachedItineraryMap()[itineraryId];
    if (cached) return cached;
    throw new Error('Itinerary not found');
  },

  /**
   * Retrieve itinerary associated with a specific trip.
   * Path: GET /api/v1/itineraries/trip/{trip_id}
   */
  async getItineraryByTrip(tripId: string): Promise<ItineraryResponse> {
    const res = await apiClient.get<APIResponse<ItineraryResponse>>(
      `/itineraries/trip/${tripId}`
    );

    if (!res.data || !res.data.data) {
      throw new Error(res.data?.message || 'Itinerary not found for this trip');
    }

    const itinerary = res.data.data;
    cacheItinerary(itinerary);
    return itinerary;
  },

  /**
   * Update itinerary title, summary, or days with deterministic budget recalculation.
   * Path: PATCH /api/v1/itineraries/{itinerary_id}
   */
  async patchItinerary(
    itineraryId: string,
    patchData: ItineraryPatchRequest
  ): Promise<ItineraryResponse> {
    const res = await apiClient.patch<APIResponse<ItineraryResponse>>(
      `/itineraries/${itineraryId}`,
      patchData
    );

    if (!res.data || !res.data.data) {
      throw new Error(res.data?.message || 'Failed to update itinerary');
    }

    const itinerary = res.data.data;
    cacheItinerary(itinerary);
    return itinerary;
  },

  /**
   * Surgically regenerate a single day's plan via Groq AI without modifying other days.
   * Path: POST /api/v1/itineraries/{itinerary_id}/days/{day_number}/regenerate
   */
  async regenerateDay(
    itineraryId: string,
    dayNumber: number,
    request?: RegenerateDayRequest
  ): Promise<ItineraryResponse> {
    const res = await apiClient.post<APIResponse<ItineraryResponse>>(
      `/itineraries/${itineraryId}/days/${dayNumber}/regenerate`,
      request || {}
    );

    if (!res.data || !res.data.data) {
      throw new Error(res.data?.message || `Failed to regenerate Day ${dayNumber}`);
    }

    const itinerary = res.data.data;
    cacheItinerary(itinerary);
    return itinerary;
  },

  /**
   * Get deterministic budget analysis and category breakdown.
   * Path: GET /api/v1/itineraries/{itinerary_id}/budget
   */
  async getBudgetAnalysis(itineraryId: string): Promise<BudgetBreakdownAnalysis> {
    const res = await apiClient.get<APIResponse<BudgetBreakdownAnalysis>>(
      `/itineraries/${itineraryId}/budget`
    );

    if (!res.data || !res.data.data) {
      throw new Error(res.data?.message || 'Failed to calculate budget analytics');
    }

    return res.data.data;
  },

  /**
   * Export itinerary as a PDF document.
   * Path: GET /api/v1/itineraries/{itinerary_id}/export/pdf
   */
  async exportPdf(
    itineraryId: string,
    filename: string = 'ParyatakRoute-Itinerary.pdf'
  ): Promise<void> {
    try {
      const res = await apiClient.get(`/itineraries/${itineraryId}/export/pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      // Client-side printable document fallback if server PDF generation is unavailable
      const itinerary = await this.getItinerary(itineraryId);
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${filename}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; line-height: 1.5; }
              h1 { color: #1878ec; font-size: 24px; border-bottom: 2px solid #ededed; padding-bottom: 12px; }
              .badge { display: inline-block; padding: 4px 10px; background: #ebf3fd; color: #1878ec; border-radius: 9999px; font-weight: bold; margin-right: 8px; font-size: 12px; }
              .day-card { border: 1px solid #d9d9d9; border-radius: 8px; padding: 16px; margin: 20px 0; background: #fafafa; }
              .act { margin: 12px 0; padding-left: 12px; border-left: 3px solid #1878ec; }
              .act-time { font-weight: bold; color: #1878ec; font-size: 13px; }
              .act-name { font-weight: bold; font-size: 15px; margin: 2px 0; }
              .act-desc { color: #555; font-size: 13px; }
            </style>
          </head>
          <body>
            <h1>${itinerary.title}</h1>
            <p>${itinerary.summary || 'Custom Travel Itinerary generated by ParyatakRoute.'}</p>
            <div>
              <span class="badge">Status: ${itinerary.status}</span>
              <span class="badge">Budget: ₹${itinerary.budget?.total_estimated?.toLocaleString('en-IN') || 'N/A'}</span>
            </div>
            ${(itinerary.days || [])
              .map(
                (day) => `
              <div class="day-card">
                <h3>Day ${day.day_number} (${day.date}): ${day.theme || 'Exploration'}</h3>
                ${(day.activities || [])
                  .map(
                    (act) => `
                  <div class="act">
                    <div class="act-time">${act.start_time || 'Morning'} (${act.duration_minutes} min)</div>
                    <div class="act-name">${act.name}</div>
                    <div class="act-desc">${act.description || ''}</div>
                  </div>
                `
                  )
                  .join('')}
              </div>
            `
              )
              .join('')}
            <script>window.onload = function() { window.print(); };</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  },

  /**
   * Claim and associate a guest itinerary into the authenticated user's account.
   * Path: POST /api/v1/itineraries/{itinerary_id}/claim
   */
  async claimGuestItinerary(itineraryId: string): Promise<ItineraryResponse> {
    const res = await apiClient.post<APIResponse<ItineraryResponse>>(
      `/itineraries/${itineraryId}/claim`,
      {}
    );

    if (!res.data || !res.data.data) {
      throw new Error(res.data?.message || 'Failed to save itinerary to account');
    }

    const saved = res.data.data;
    cacheItinerary(saved);
    return saved;
  },
};

export default itineraryService;
