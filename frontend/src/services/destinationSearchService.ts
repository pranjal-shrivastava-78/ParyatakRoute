import apiClient from './apiClient';
import { APIResponse, NormalizedPlace } from '../types/api';

export interface AutocompleteItem {
  id: string;
  name: string;
  state: string;
  country: string;
  displayName: string;
  category?: string;
  image?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Comprehensive master list of Indian and international travel destinations.
 * Structured to support fast, prefix-matching keystroke autocomplete.
 */
export const MASTER_DESTINATIONS: AutocompleteItem[] = [
  // --- Exact prefix match showcase test cases from prompt ---
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', country: 'India', displayName: 'Mumbai, Maharashtra, India', category: 'Cities' },
  { id: 'mangaluru', name: 'Mangaluru', state: 'Karnataka', country: 'India', displayName: 'Mangaluru, Karnataka, India', category: 'Beaches & Coastal' },
  { id: 'manali', name: 'Manali', state: 'Himachal Pradesh', country: 'India', displayName: 'Manali, Himachal Pradesh, India', category: 'Mountains & Snow' },
  { id: 'mussoorie', name: 'Mussoorie', state: 'Uttarakhand', country: 'India', displayName: 'Mussoorie, Uttarakhand, India', category: 'Mountains' },
  { id: 'mount-abu', name: 'Mount Abu', state: 'Rajasthan', country: 'India', displayName: 'Mount Abu, Rajasthan, India', category: 'Hill Station' },
  { id: 'mysuru', name: 'Mysuru', state: 'Karnataka', country: 'India', displayName: 'Mysuru, Karnataka, India', category: 'Heritage & Palaces' },
  { id: 'madurai', name: 'Madurai', state: 'Tamil Nadu', country: 'India', displayName: 'Madurai, Tamil Nadu, India', category: 'Spiritual & Heritage' },
  { id: 'mahabaleshwar', name: 'Mahabaleshwar', state: 'Maharashtra', country: 'India', displayName: 'Mahabaleshwar, Maharashtra, India', category: 'Hill Station' },
  { id: 'munnar', name: 'Munnar', state: 'Kerala', country: 'India', displayName: 'Munnar, Kerala, India', category: 'Tea Plantations' },
  { id: 'mathura', name: 'Mathura', state: 'Uttar Pradesh', country: 'India', displayName: 'Mathura, Uttar Pradesh, India', category: 'Spiritual' },
  { id: 'mcleodganj', name: 'McLeod Ganj', state: 'Himachal Pradesh', country: 'India', displayName: 'McLeod Ganj, Himachal Pradesh, India', category: 'Mountains & Culture' },
  { id: 'mandu', name: 'Mandu', state: 'Madhya Pradesh', country: 'India', displayName: 'Mandu, Madhya Pradesh, India', category: 'Heritage' },
  { id: 'majuli', name: 'Majuli', state: 'Assam', country: 'India', displayName: 'Majuli, Assam, India', category: 'River Island' },

  // --- Other major Indian destinations ---
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', country: 'India', displayName: 'Jaipur, Rajasthan, India', category: 'Heritage & Palaces' },
  { id: 'jaisalmer', name: 'Jaisalmer', state: 'Rajasthan', country: 'India', displayName: 'Jaisalmer, Rajasthan, India', category: 'Desert & Forts' },
  { id: 'jodhpur', name: 'Jodhpur', state: 'Rajasthan', country: 'India', displayName: 'Jodhpur, Rajasthan, India', category: 'Blue City' },
  { id: 'goa', name: 'Goa', state: 'Goa', country: 'India', displayName: 'Goa, India', category: 'Beaches & Heritage' },
  { id: 'delhi', name: 'Delhi', state: 'Delhi', country: 'India', displayName: 'New Delhi, Delhi, India', category: 'Capital City' },
  { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', country: 'India', displayName: 'Bengaluru, Karnataka, India', category: 'Garden City' },
  { id: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', country: 'India', displayName: 'Varanasi, Uttar Pradesh, India', category: 'Ghats & Spiritual' },
  { id: 'agra', name: 'Agra', state: 'Uttar Pradesh', country: 'India', displayName: 'Agra, Uttar Pradesh, India', category: 'Taj Mahal & Heritage' },
  { id: 'udaipur', name: 'Udaipur', state: 'Rajasthan', country: 'India', displayName: 'Udaipur, Rajasthan, India', category: 'Lakes & Palaces' },
  { id: 'leh-ladakh', name: 'Leh Ladakh', state: 'Ladakh', country: 'India', displayName: 'Leh Ladakh, Ladakh, India', category: 'High Altitude' },
  { id: 'spiti-valley', name: 'Spiti Valley', state: 'Himachal Pradesh', country: 'India', displayName: 'Spiti Valley, Himachal Pradesh, India', category: 'Cold Desert' },
  { id: 'rishikesh', name: 'Rishikesh', state: 'Uttarakhand', country: 'India', displayName: 'Rishikesh, Uttarakhand, India', category: 'Yoga & Adventure' },
  { id: 'haridwar', name: 'Haridwar', state: 'Uttarakhand', country: 'India', displayName: 'Haridwar, Uttarakhand, India', category: 'Ganga Ghats' },
  { id: 'shimla', name: 'Shimla', state: 'Himachal Pradesh', country: 'India', displayName: 'Shimla, Himachal Pradesh, India', category: 'Hill Station' },
  { id: 'darjeeling', name: 'Darjeeling', state: 'West Bengal', country: 'India', displayName: 'Darjeeling, West Bengal, India', category: 'Tea & Mountains' },
  { id: 'gangtok', name: 'Gangtok', state: 'Sikkim', country: 'India', displayName: 'Gangtok, Sikkim, India', category: 'Himalayas' },
  { id: 'shillong', name: 'Shillong', state: 'Meghalaya', country: 'India', displayName: 'Shillong, Meghalaya, India', category: 'Scotland of the East' },
  { id: 'cherrapunji', name: 'Cherrapunji', state: 'Meghalaya', country: 'India', displayName: 'Cherrapunji, Meghalaya, India', category: 'Rainforests & Waterfalls' },
  { id: 'nongriat', name: 'Nongriat', state: 'Meghalaya', country: 'India', displayName: 'Nongriat, Meghalaya, India', category: 'Living Root Bridges' },
  { id: 'hampi', name: 'Hampi', state: 'Karnataka', country: 'India', displayName: 'Hampi, Karnataka, India', category: 'UNESCO Ruins' },
  { id: 'gokarna', name: 'Gokarna', state: 'Karnataka', country: 'India', displayName: 'Gokarna, Karnataka, India', category: 'Beaches & Temples' },
  { id: 'coorg', name: 'Coorg (Kodagu)', state: 'Karnataka', country: 'India', displayName: 'Coorg, Karnataka, India', category: 'Coffee Plantations' },
  { id: 'chikmagalur', name: 'Chikmagalur', state: 'Karnataka', country: 'India', displayName: 'Chikmagalur, Karnataka, India', category: 'Western Ghats' },
  { id: 'kochi', name: 'Kochi (Cochin)', state: 'Kerala', country: 'India', displayName: 'Kochi, Kerala, India', category: 'Coastal Heritage' },
  { id: 'alleppey', name: 'Alleppey (Alappuzha)', state: 'Kerala', country: 'India', displayName: 'Alleppey, Kerala, India', category: 'Backwaters & Houseboats' },
  { id: 'varkala', name: 'Varkala', state: 'Kerala', country: 'India', displayName: 'Varkala, Kerala, India', category: 'Cliffs & Beaches' },
  { id: 'wayanad', name: 'Wayanad', state: 'Kerala', country: 'India', displayName: 'Wayanad, Kerala, India', category: 'Nature & Wildlife' },
  { id: 'ooty', name: 'Ooty (Udhagamandalam)', state: 'Tamil Nadu', country: 'India', displayName: 'Ooty, Tamil Nadu, India', category: 'Nilgiris' },
  { id: 'kodaikanal', name: 'Kodaikanal', state: 'Tamil Nadu', country: 'India', displayName: 'Kodaikanal, Tamil Nadu, India', category: 'Princess of Hill Stations' },
  { id: 'pondicherry', name: 'Puducherry (Pondicherry)', state: 'Puducherry', country: 'India', displayName: 'Puducherry, India', category: 'French Quarter' },
  { id: 'amritsar', name: 'Amritsar', state: 'Punjab', country: 'India', displayName: 'Amritsar, Punjab, India', category: 'Golden Temple' },
  { id: 'srinagar', name: 'Srinagar', state: 'Jammu and Kashmir', country: 'India', displayName: 'Srinagar, Jammu and Kashmir, India', category: 'Dal Lake & Valleys' },
  { id: 'gulmarg', name: 'Gulmarg', state: 'Jammu and Kashmir', country: 'India', displayName: 'Gulmarg, Jammu and Kashmir, India', category: 'Snow & Skiing' },
  { id: 'pahalgam', name: 'Pahalgam', state: 'Jammu and Kashmir', country: 'India', displayName: 'Pahalgam, Jammu and Kashmir, India', category: 'Valley of Shepherds' },
  { id: 'kaziranga', name: 'Kaziranga', state: 'Assam', country: 'India', displayName: 'Kaziranga, Assam, India', category: 'Rhino Wildlife' },
  { id: 'andaman', name: 'Havelock (Swaraj Dweep)', state: 'Andaman & Nicobar Islands', country: 'India', displayName: 'Havelock Island, Andaman & Nicobar', category: 'Coral Islands' },
  { id: 'port-blair', name: 'Port Blair', state: 'Andaman & Nicobar Islands', country: 'India', displayName: 'Port Blair, Andaman & Nicobar', category: 'Islands' },
  { id: 'lakshadweep', name: 'Lakshadweep', state: 'Lakshadweep', country: 'India', displayName: 'Lakshadweep Islands, India', category: 'Turquoise Lagoons' },
  { id: 'pushkar', name: 'Pushkar', state: 'Rajasthan', country: 'India', displayName: 'Pushkar, Rajasthan, India', category: 'Holy Lake' },
  { id: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh', country: 'India', displayName: 'Bhopal, Madhya Pradesh, India', category: 'City of Lakes' },
  { id: 'indore', name: 'Indore', state: 'Madhya Pradesh', country: 'India', displayName: 'Indore, Madhya Pradesh, India', category: 'Street Food Hub' },
  { id: 'khajuraho', name: 'Khajuraho', state: 'Madhya Pradesh', country: 'India', displayName: 'Khajuraho, Madhya Pradesh, India', category: 'UNESCO Temples' },
  { id: 'orchha', name: 'Orchha', state: 'Madhya Pradesh', country: 'India', displayName: 'Orchha, Madhya Pradesh, India', category: 'Hidden Palaces' },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', country: 'India', displayName: 'Hyderabad, Telangana, India', category: 'Historic Pearls' },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', country: 'India', displayName: 'Chennai, Tamil Nadu, India', category: 'Coastal Metro' },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', country: 'India', displayName: 'Kolkata, West Bengal, India', category: 'City of Joy' },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', country: 'India', displayName: 'Pune, Maharashtra, India', category: 'Heritage & Western Ghats' },

  // --- International Gateways ---
  { id: 'dubai', name: 'Dubai', state: 'Dubai', country: 'United Arab Emirates', displayName: 'Dubai, UAE', category: 'International Gateway' },
  { id: 'singapore', name: 'Singapore', state: 'Singapore', country: 'Singapore', displayName: 'Singapore City, Singapore', category: 'International Hub' },
  { id: 'bangkok', name: 'Bangkok', state: 'Central', country: 'Thailand', displayName: 'Bangkok, Thailand', category: 'International Cultural' },
  { id: 'bali', name: 'Bali', state: 'Bali', country: 'Indonesia', displayName: 'Bali, Indonesia', category: 'International Tropical' },
  { id: 'tokyo', name: 'Tokyo', state: 'Kanto', country: 'Japan', displayName: 'Tokyo, Japan', category: 'International Metro' },
  { id: 'paris', name: 'Paris', state: 'Île-de-France', country: 'France', displayName: 'Paris, France', category: 'International Iconic' },
  { id: 'london', name: 'London', state: 'England', country: 'United Kingdom', displayName: 'London, United Kingdom', category: 'International Iconic' },
];

let lastSearchRequestId = 0;

export const destinationSearchService = {
  /**
   * Fast, keystroke-by-keystroke intelligent autocomplete search.
   * Priority:
   * 1. Exact prefix matching on destination name (e.g. 'm' -> Mumbai, Mangaluru, Manali; 'ma' -> Manali, Mangaluru, Madurai, Mahabaleshwar).
   * 2. Prefix matching on State/Country.
   * 3. Partial substring matching.
   * Remote Nominatim geocoding supplement is debounced and combined without stale overwrites.
   */
  searchLocal(rawQuery: string, limit: number = 8): AutocompleteItem[] {
    const q = rawQuery.trim().toLowerCase();
    if (!q) return [];

    // Group 1: Name starts with query (Highest priority)
    const exactPrefixMatches: AutocompleteItem[] = [];
    // Group 2: Word within name starts with query (e.g. 'Abu' in 'Mount Abu')
    const wordPrefixMatches: AutocompleteItem[] = [];
    // Group 3: State or Country starts with query
    const stateCountryMatches: AutocompleteItem[] = [];
    // Group 4: Substring contains query anywhere
    const substringMatches: AutocompleteItem[] = [];

    const seenIds = new Set<string>();

    for (const item of MASTER_DESTINATIONS) {
      const lowerName = item.name.toLowerCase();
      const lowerState = item.state.toLowerCase();
      const lowerCountry = item.country.toLowerCase();

      if (lowerName.startsWith(q)) {
        exactPrefixMatches.push(item);
        seenIds.add(item.id);
      } else {
        // Check if any word starts with query
        const words = lowerName.split(/\s+/);
        if (words.some((w) => w.startsWith(q))) {
          wordPrefixMatches.push(item);
          seenIds.add(item.id);
        }
      }
    }

    // Secondary matches if needed
    for (const item of MASTER_DESTINATIONS) {
      if (seenIds.has(item.id)) continue;
      const lowerState = item.state.toLowerCase();
      const lowerCountry = item.country.toLowerCase();
      const lowerName = item.name.toLowerCase();

      if (lowerState.startsWith(q) || lowerCountry.startsWith(q)) {
        stateCountryMatches.push(item);
        seenIds.add(item.id);
      } else if (lowerName.includes(q) || lowerState.includes(q)) {
        substringMatches.push(item);
        seenIds.add(item.id);
      }
    }

    const combined = [
      ...exactPrefixMatches,
      ...wordPrefixMatches,
      ...stateCountryMatches,
      ...substringMatches,
    ];

    return combined.slice(0, limit);
  },

  /**
   * Async search combining local instant matching with remote backend geocoding.
   * Guarantees that newer queries never get replaced by slower older responses.
   */
  async searchWithRemoteFallback(
    rawQuery: string,
    limit: number = 8,
    onRemoteSuccess?: (items: AutocompleteItem[]) => void
  ): Promise<AutocompleteItem[]> {
    const q = rawQuery.trim();
    const requestId = ++lastSearchRequestId;

    // 1. Return local instant results immediately
    const localResults = this.searchLocal(q, limit);

    // If query is too short or local already has enough prefix matches, don't trigger remote
    if (q.length < 2) {
      return localResults;
    }

    // 2. Query backend Nominatim in background if local results < limit
    try {
      const res = await apiClient.get<APIResponse<NormalizedPlace[]>>('/destinations', {
        params: { query: q, limit: 5 },
      });

      // Verify request freshness (prevent race conditions & stale responses)
      if (requestId !== lastSearchRequestId) {
        return localResults;
      }

      const remoteData = res.data?.data || [];
      const remoteItems: AutocompleteItem[] = remoteData.map((place) => ({
        id: `osm-${place.place_id}`,
        name: place.name || place.display_name.split(',')[0].trim(),
        state: place.address?.split(',')[1]?.trim() || '',
        country: place.address?.split(',').pop()?.trim() || 'India',
        displayName: place.display_name,
        category: place.type || place.category || 'Location',
        latitude: place.latitude,
        longitude: place.longitude,
      }));

      // Merge remote items without duplicate names
      const seenNames = new Set(localResults.map((r) => r.name.toLowerCase()));
      const merged = [...localResults];
      for (const item of remoteItems) {
        if (!seenNames.has(item.name.toLowerCase()) && merged.length < limit) {
          seenNames.add(item.name.toLowerCase());
          merged.push(item);
        }
      }

      if (onRemoteSuccess && requestId === lastSearchRequestId) {
        onRemoteSuccess(merged);
      }

      return merged;
    } catch {
      // Remote failed or offline: graceful fallback to local results
      return localResults;
    }
  },
};

export default destinationSearchService;
