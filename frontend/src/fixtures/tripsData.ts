import { TripResponse, TripCreate, TripUpdate, TripStatus } from '../types/api';

const DEFAULT_SAMPLE_TRIPS: TripResponse[] = [
  {
    id: 'trip_kerala_001',
    user_id: 'user_sample_01',
    destination: 'Munnar & Alleppey, Kerala',
    starting_city: 'Cochin',
    start_date: '2026-11-10',
    end_date: '2026-11-14',
    budget: 26500,
    currency: 'INR',
    travellers: 2,
    travel_style: 'balanced',
    interests: ['tea plantations', 'backwaters', 'ayurveda'],
    status: 'planned' as TripStatus,
    duration_days: 5,
    created_at: '2026-10-15T10:00:00Z',
    updated_at: '2026-10-15T10:00:00Z',
  },
  {
    id: 'trip_jaipur_002',
    user_id: 'user_sample_01',
    destination: 'Jaipur, Rajasthan',
    starting_city: 'Delhi',
    start_date: '2026-09-04',
    end_date: '2026-09-07',
    budget: 21800,
    currency: 'INR',
    travellers: 4,
    travel_style: 'cultural',
    interests: ['heritage', 'forts', 'culinary'],
    status: 'completed' as TripStatus,
    duration_days: 4,
    created_at: '2026-08-20T12:00:00Z',
    updated_at: '2026-09-08T18:00:00Z',
  },
  {
    id: 'trip_ladakh_003',
    user_id: 'user_sample_01',
    destination: 'Leh & Pangong Lake, Ladakh',
    starting_city: 'Manali',
    start_date: '2027-06-12',
    end_date: '2027-06-18',
    budget: 42000,
    currency: 'INR',
    travellers: 1,
    travel_style: 'adventure',
    interests: ['motorbiking', 'monasteries', 'trekking'],
    status: 'draft' as TripStatus,
    duration_days: 7,
    created_at: '2026-10-22T08:30:00Z',
    updated_at: '2026-10-22T08:30:00Z',
  },
];

const TRIPS_STORAGE_KEY = 'paryatak_sample_trips';

export function getStoredTrips(): TripResponse[] {
  try {
    const raw = localStorage.getItem(TRIPS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(DEFAULT_SAMPLE_TRIPS));
      return DEFAULT_SAMPLE_TRIPS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SAMPLE_TRIPS;
  }
}

export function saveStoredTrips(trips: TripResponse[]): void {
  localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
}

export function addStoredTrip(tripInput: TripCreate): TripResponse {
  const trips = getStoredTrips();
  const start = new Date(tripInput.start_date);
  const end = new Date(tripInput.end_date);
  const duration = Math.max(Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1, 1);

  const newTrip: TripResponse = {
    id: `trip_${Date.now()}`,
    user_id: 'user_sample_01',
    destination: tripInput.destination,
    starting_city: tripInput.starting_city || null,
    start_date: tripInput.start_date,
    end_date: tripInput.end_date,
    budget: tripInput.budget || 25000,
    currency: tripInput.currency || 'INR',
    travellers: tripInput.travellers || tripInput.travelers_count || 2,
    travel_style: tripInput.travel_style || 'balanced',
    interests: tripInput.interests || ['General'],
    status: tripInput.status || 'planned',
    duration_days: duration,
    transport_preference: tripInput.transport_preference || null,
    accommodation_preference: tripInput.accommodation_preference || null,
    dietary_preferences: tripInput.dietary_preferences || null,
    additional_notes: tripInput.additional_notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const updated = [newTrip, ...trips];
  saveStoredTrips(updated);
  return newTrip;
}

export function updateStoredTrip(tripId: string, updates: TripUpdate): TripResponse {
  const trips = getStoredTrips();
  const index = trips.findIndex((t) => t.id === tripId);
  if (index === -1) {
    throw new Error('Trip not found');
  }

  const existing = trips[index];
  const start = new Date(updates.start_date || existing.start_date);
  const end = new Date(updates.end_date || existing.end_date);
  const duration = Math.max(Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1, 1);

  const updatedTrip: TripResponse = {
    ...existing,
    destination: updates.destination || existing.destination,
    starting_city: updates.starting_city !== undefined ? updates.starting_city : existing.starting_city,
    start_date: updates.start_date || existing.start_date,
    end_date: updates.end_date || existing.end_date,
    budget: updates.budget !== undefined ? updates.budget : existing.budget,
    currency: updates.currency || existing.currency,
    travellers: updates.travellers !== undefined ? updates.travellers : existing.travellers,
    travel_style: updates.travel_style || existing.travel_style,
    interests: updates.interests || existing.interests,
    status: updates.status || existing.status,
    duration_days: duration,
    updated_at: new Date().toISOString(),
  };

  trips[index] = updatedTrip;
  saveStoredTrips(trips);
  return updatedTrip;
}

export function deleteStoredTrip(tripId: string): void {
  const trips = getStoredTrips();
  const filtered = trips.filter((t) => t.id !== tripId);
  saveStoredTrips(filtered);
}
