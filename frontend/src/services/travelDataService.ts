import apiClient from './apiClient';
import {
  APIResponse,
  NormalizedPlace,
  DirectionsRequest,
  DirectionsResponse,
  WeatherResponse,
  CurrencyRatesResponse,
  CurrencyConvertResponse,
} from '../types/api';

export const travelDataService = {
  /**
   * Search destinations using real OpenStreetMap Nominatim geocoding via backend gateway.
   * Path: GET /api/v1/destinations?query={query}&limit={limit}
   */
  async searchDestinations(query: string, limit: number = 8): Promise<NormalizedPlace[]> {
    if (!query || query.trim().length < 2) return [];

    const res = await apiClient.get<APIResponse<NormalizedPlace[]>>('/destinations', {
      params: { query: query.trim(), limit },
    });
    return res.data?.data || [];
  },

  /**
   * Calculate driving route between coordinates using Project OSRM via backend gateway.
   * Path: POST /api/v1/directions
   */
  async getDirections(request: DirectionsRequest): Promise<DirectionsResponse> {
    const res = await apiClient.post<APIResponse<DirectionsResponse>>('/directions', request);
    if (!res.data || !res.data.data) {
      throw new Error(res.data?.message || 'Failed to calculate driving route');
    }
    return res.data.data;
  },

  /**
   * Fetch live weather conditions and 7-day forecast via Open-Meteo via backend gateway.
   * Path: GET /api/v1/weather?lat={latitude}&lon={longitude}
   */
  async getWeather(latitude: number, longitude: number): Promise<WeatherResponse> {
    const res = await apiClient.get<APIResponse<WeatherResponse>>('/weather', {
      params: { lat: latitude, lon: longitude },
    });
    if (!res.data || !res.data.data) {
      throw new Error(res.data?.message || 'Failed to fetch weather forecast');
    }
    return res.data.data;
  },

  /**
   * Fetch live currency exchange rates for a base currency via ExchangeRate-API via backend gateway.
   * Path: GET /api/v1/currency/rates?base={base}
   */
  async getCurrencyRates(base: string = 'USD'): Promise<CurrencyRatesResponse> {
    const res = await apiClient.get<APIResponse<CurrencyRatesResponse>>('/currency/rates', {
      params: { base: base.toUpperCase() },
    });
    if (!res.data || !res.data.data) {
      throw new Error(res.data?.message || 'Failed to fetch currency exchange rates');
    }
    return res.data.data;
  },

  /**
   * Convert an amount between two currencies via real exchange rates via backend gateway.
   * Path: GET /api/v1/currency/convert?from={from}&to={to}&amount={amount}
   */
  async convertCurrency(
    from: string,
    to: string,
    amount: number
  ): Promise<CurrencyConvertResponse> {
    const res = await apiClient.get<APIResponse<CurrencyConvertResponse>>('/currency/convert', {
      params: {
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        amount,
      },
    });
    if (!res.data || !res.data.data) {
      throw new Error(res.data?.message || 'Currency conversion failed');
    }
    return res.data.data;
  },
};

export default travelDataService;
