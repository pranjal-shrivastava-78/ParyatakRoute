import apiClient from './apiClient';
import {
  APIResponse,
  FavouriteCreate,
  FavouriteResponse,
  FavouriteListResponse,
} from '../types/api';

// In-memory set of cached favourite destination names/place_ids for fast UI heart icon toggling
let cachedFavouriteKeys = new Set<string>();

export const favouriteService = {
  /**
   * Bookmark a destination/place as a saved favourite.
   * Path: POST /api/v1/favourites
   */
  async addFavourite(data: FavouriteCreate): Promise<FavouriteResponse> {
    const res = await apiClient.post<APIResponse<FavouriteResponse>>('/favourites', data);
    if (!res.data || !res.data.data) {
      throw new Error(res.data?.message || 'Failed to save favourite');
    }
    const item = res.data.data;
    if (item.place_id) cachedFavouriteKeys.add(item.place_id.toLowerCase());
    if (item.name) cachedFavouriteKeys.add(item.name.toLowerCase());
    return item;
  },

  /**
   * List saved favourites for the authenticated user.
   * Path: GET /api/v1/favourites?page={page}&limit={limit}
   */
  async listFavourites(page: number = 1, limit: number = 50): Promise<FavouriteListResponse> {
    const res = await apiClient.get<APIResponse<FavouriteListResponse>>('/favourites', {
      params: { page, limit },
    });
    if (!res.data || !res.data.data) {
      throw new Error(res.data?.message || 'Failed to load favourites');
    }
    const data = res.data.data;
    const items = data.items || [];

    // Sync cache
    cachedFavouriteKeys.clear();
    items.forEach((item) => {
      if (item.place_id) cachedFavouriteKeys.add(item.place_id.toLowerCase());
      if (item.name) cachedFavouriteKeys.add(item.name.toLowerCase());
    });

    return {
      items,
      total: data.total ?? items.length,
      page: data.page ?? page,
      limit: data.limit ?? limit,
    };
  },

  /**
   * Remove a saved favourite by its UUID with ownership verification.
   * Path: DELETE /api/v1/favourites/{favourite_id}
   */
  async removeFavourite(favouriteId: string): Promise<boolean> {
    const res = await apiClient.delete<APIResponse<{ id: string; deleted: boolean }>>(
      `/favourites/${favouriteId}`
    );
    return res.data?.data?.deleted ?? true;
  },

  /**
   * Fast synchronous check if a place or destination name is in the user's bookmarks.
   */
  isFavourite(key: string): boolean {
    if (!key) return false;
    return cachedFavouriteKeys.has(key.toLowerCase());
  },
};

export default favouriteService;
