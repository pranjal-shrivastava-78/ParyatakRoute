import { FavouriteResponse } from '../types/api';

const DEFAULT_SAMPLE_FAVOURITES: FavouriteResponse[] = [
  {
    id: 'fav_001',
    user_id: 'user_sample_01',
    place_id: 'dest_udaipur_lakes',
    name: 'Udaipur — City of Lakes',
    display_name: 'Udaipur, Rajasthan, India',
    address: 'Udaipur, Rajasthan, India',
    latitude: 24.5854,
    longitude: 73.7125,
    category: 'Heritage',
    type: 'destination',
    photo_url: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=900&q=80',
    notes: 'Dream romantic lake palace boat journey',
    created_at: '2026-10-18T14:20:00Z',
    updated_at: '2026-10-18T14:20:00Z',
  },
  {
    id: 'fav_002',
    user_id: 'user_sample_01',
    place_id: 'dest_leh_ladakh',
    name: 'Leh & Ladakh Valley',
    display_name: 'Leh, Jammu & Kashmir, India',
    address: 'Leh, Ladakh, India',
    latitude: 34.1526,
    longitude: 77.5771,
    category: 'Mountain',
    type: 'destination',
    photo_url: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=900&q=80',
    notes: 'Motorcycle route to Pangong Lake in July',
    created_at: '2026-10-19T09:15:00Z',
    updated_at: '2026-10-19T09:15:00Z',
  },
  {
    id: 'fav_003',
    user_id: 'user_sample_01',
    place_id: 'dest_munnar_kerala',
    name: 'Munnar & Alleppey Trails',
    display_name: 'Munnar, Kerala, India',
    address: 'Munnar & Alappuzha, Kerala',
    latitude: 10.0889,
    longitude: 77.0595,
    category: 'Nature',
    type: 'destination',
    photo_url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=900&q=80',
    notes: 'Tea estate homestay and spice gardens',
    created_at: '2026-10-21T11:45:00Z',
    updated_at: '2026-10-21T11:45:00Z',
  },
];

const FAVOURITES_STORAGE_KEY = 'paryatak_sample_favourites';

export function getStoredFavourites(): FavouriteResponse[] {
  try {
    const raw = localStorage.getItem(FAVOURITES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify(DEFAULT_SAMPLE_FAVOURITES));
      return DEFAULT_SAMPLE_FAVOURITES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SAMPLE_FAVOURITES;
  }
}

export function saveStoredFavourites(favs: FavouriteResponse[]): void {
  localStorage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify(favs));
}

export function addStoredFavourite(item: Partial<FavouriteResponse> & { name: string }): FavouriteResponse {
  const favs = getStoredFavourites();
  const existing = favs.find((f) => f.name.toLowerCase() === item.name.toLowerCase());
  if (existing) {
    return existing;
  }

  const newFav: FavouriteResponse = {
    id: `fav_${Date.now()}`,
    user_id: 'user_sample_01',
    place_id: item.place_id || `place_${Date.now()}`,
    name: item.name,
    display_name: item.display_name || item.name,
    address: item.address || item.display_name || item.name,
    latitude: item.latitude || 20.5937,
    longitude: item.longitude || 78.9629,
    category: item.category || 'destination',
    type: item.type || 'destination',
    photo_url: item.photo_url || null,
    notes: item.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const updated = [newFav, ...favs];
  saveStoredFavourites(updated);
  return newFav;
}

export function removeStoredFavourite(idOrName: string): boolean {
  const favs = getStoredFavourites();
  const filtered = favs.filter((f) => f.id !== idOrName && f.name.toLowerCase() !== idOrName.toLowerCase());
  saveStoredFavourites(filtered);
  return filtered.length < favs.length;
}

export function isStoredFavourite(name: string): boolean {
  const favs = getStoredFavourites();
  return favs.some((f) => f.name.toLowerCase() === name.toLowerCase());
}
