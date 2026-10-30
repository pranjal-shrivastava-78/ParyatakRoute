import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  CloudSun,
  Navigation,
  DollarSign,
  Heart,
  Sparkles,
  Loader2,
  Calendar,
  AlertCircle,
  Check,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { travelDataService } from '../services/travelDataService';
import { favouriteService } from '../services/favouriteService';
import { NormalizedPlace, WeatherResponse, DirectionsResponse } from '../types/api';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || 'Jaipur';
  const [query, setQuery] = useState(initialQuery);
  const [places, setPlaces] = useState<NormalizedPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<NormalizedPlace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Weather state
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Directions state
  const [originQuery, setOriginQuery] = useState('Delhi');
  const [directions, setDirections] = useState<DirectionsResponse | null>(null);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);

  // Currency Converter state
  const [currAmount, setCurrAmount] = useState('100');
  const [currFrom, setCurrFrom] = useState('USD');
  const [currTo, setCurrTo] = useState('INR');
  const [convertedResult, setConvertedResult] = useState<number | null>(null);
  const [isLoadingCurr, setIsLoadingCurr] = useState(false);

  // Bookmark feedback
  const [bookmarkedPlaces, setBookmarkedPlaces] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim().length < 2) return;
    setIsLoading(true);
    setSearchError(null);
    try {
      const results = await travelDataService.searchDestinations(searchTerm, 8);
      setPlaces(results);
      if (results.length > 0) {
        setSelectedPlace(results[0]);
      } else {
        setSelectedPlace(null);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to fetch destination data. Please verify connection and retry.';
      setSearchError(msg);
      setPlaces([]);
      setSelectedPlace(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, []);

  // Fetch Weather whenever selectedPlace changes
  useEffect(() => {
    if (!selectedPlace) {
      setWeather(null);
      return;
    }
    const fetchWeather = async () => {
      setIsLoadingWeather(true);
      try {
        const w = await travelDataService.getWeather(selectedPlace.latitude, selectedPlace.longitude);
        setWeather(w);
      } catch {
        setWeather(null);
      } finally {
        setIsLoadingWeather(false);
      }
    };
    fetchWeather();
  }, [selectedPlace]);

  // Handle Driving Directions calculation via OSRM
  const handleCalculateRoute = async () => {
    if (!selectedPlace || !originQuery) return;
    setIsLoadingDirections(true);
    try {
      const originPlaces = await travelDataService.searchDestinations(originQuery, 1);
      if (originPlaces.length === 0) {
        setFeedback(`Could not locate origin: "${originQuery}"`);
        setTimeout(() => setFeedback(null), 3000);
        return;
      }
      const origin = originPlaces[0];
      const dir = await travelDataService.getDirections({
        coordinates: [
          [origin.longitude, origin.latitude],
          [selectedPlace.longitude, selectedPlace.latitude],
        ],
      });
      setDirections(dir);
    } catch {
      setFeedback('Route calculation between these coordinates was unavailable.');
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsLoadingDirections(false);
    }
  };

  // Handle Currency Conversion
  const handleConvertCurrency = async () => {
    const amt = parseFloat(currAmount);
    if (isNaN(amt) || amt <= 0) return;
    setIsLoadingCurr(true);
    try {
      const res = await travelDataService.convertCurrency(currFrom, currTo, amt);
      setConvertedResult(res.converted_amount ?? res.result ?? null);
    } catch {
      setFeedback('Currency conversion rate unavailable.');
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsLoadingCurr(false);
    }
  };

  // Handle Save to Favourites
  const handleSaveFavourite = async (place: NormalizedPlace) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      await favouriteService.addFavourite({
        place_id: place.place_id,
        name: place.name,
        display_name: place.display_name,
        latitude: place.latitude,
        longitude: place.longitude,
        category: place.category || 'destination',
        type: place.type,
        address: place.address,
        attribution: place.attribution,
      });
      setBookmarkedPlaces((prev) => new Set(prev).add(place.place_id));
      setFeedback(`Saved ${place.name} to your bookmarks!`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setFeedback(`${place.name} is already bookmarked.`);
      } else {
        setFeedback('Unable to bookmark destination.');
      }
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="main-content" style={{ padding: 'var(--spacing-32) 0' }}>
      <div className="container">
        {feedback && (
          <div
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 1000,
              backgroundColor: 'var(--color-ink)',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: 'var(--radius-pills)',
              fontSize: 14,
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Check size={16} color="var(--color-success)" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Page Header */}
        <div style={{ marginBottom: varSpacing(32) }}>
          <span className="text-link-blue" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Geospatial Discovery
          </span>
          <h1 className="heading-app" style={{ marginTop: 4, marginBottom: 8 }}>
            Explore Verified Places & Routes
          </h1>
          <p className="text-body" style={{ maxWidth: 700 }}>
            Query OpenStreetMap Nominatim geocoding, inspect Open-Meteo 7-day weather forecasts, and compute real-world OSRM driving durations.
          </p>
        </div>

        {/* Search Input Bar */}
        <div style={{ maxWidth: 680, marginBottom: 32 }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearchParams({ query });
              handleSearch(query);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-divider-gray)',
              borderRadius: 'var(--radius-pills)',
              padding: '6px 8px 6px 18px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <Search size={18} color="var(--color-graphite)" style={{ marginRight: 8 }} />
            <input
              type="text"
              placeholder="Search any destination (e.g. Udaipur, Kyoto, Goa, Manali, Paris)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--color-ink)',
              }}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '8px 20px', borderRadius: 'var(--radius-pills)', height: 40 }}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 size={16} className="spinner" /> : 'Search'}
            </button>
          </form>
        </div>

        {searchError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 'var(--radius-compactcontrols)',
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              fontSize: 14,
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{searchError}</span>
            </div>
            <button
              type="button"
              onClick={() => handleSearch(query)}
              className="btn-secondary"
              style={{
                fontSize: 13,
                padding: '6px 14px',
                height: 'auto',
                color: 'var(--color-danger)',
                borderColor: 'var(--color-danger)',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Grid: Places List on Left, Place Inspector & Weather on Right */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 24, alignItems: 'start' }}>
          {/* Left Column: Places Found */}
          <div>
            <h2 className="heading-section" style={{ marginBottom: 14 }}>
              Results for "{query}" ({places.length})
            </h2>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Loader2 size={32} className="spinner" style={{ margin: '0 auto 12px auto' }} />
                <p style={{ color: 'var(--color-graphite)', fontSize: 14 }}>Searching OpenStreetMap Nominatim...</p>
              </div>
            ) : searchError ? (
              <div className="state-empty" style={{ borderColor: 'var(--color-danger-bg)' }}>
                <AlertCircle size={32} color="var(--color-danger)" style={{ margin: '0 auto 8px auto' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: 'var(--color-danger)' }}>
                  Destination Search Unavailable
                </h3>
                <p style={{ fontSize: 13, color: 'var(--color-graphite)', marginBottom: 12 }}>
                  {searchError}
                </p>
                <button
                  type="button"
                  onClick={() => handleSearch(query)}
                  className="btn-primary"
                  style={{ fontSize: 13, padding: '8px 18px', margin: '0 auto' }}
                >
                  Retry Search
                </button>
              </div>
            ) : places.length === 0 ? (
              <div className="state-empty">
                <MapPin size={32} color="var(--color-placeholder-gray)" style={{ margin: '0 auto 8px auto' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>No destinations found</h3>
                <p style={{ fontSize: 13, color: 'var(--color-graphite)' }}>Try searching for a different city, region, or landmark.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {places.map((place) => {
                  const isSelected = selectedPlace?.place_id === place.place_id;
                  const isSaved = bookmarkedPlaces.has(place.place_id);
                  return (
                    <div
                      key={place.place_id}
                      onClick={() => setSelectedPlace(place)}
                      style={{
                        padding: 16,
                        backgroundColor: isSelected ? 'var(--color-hopper-blue-subtle)' : 'var(--color-cloud)',
                        borderRadius: 'var(--radius-cards)',
                        border: isSelected
                          ? '1.5px solid var(--color-hopper-blue)'
                          : '1px solid var(--color-divider-gray)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <MapPin size={16} color="var(--color-hopper-blue)" />
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)' }}>
                              {place.name}
                            </h3>
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--color-graphite)', marginBottom: 8 }}>
                            {place.display_name}
                          </p>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {place.type && <span className="badge badge-cloud">{place.type}</span>}
                            {place.category && <span className="badge badge-cloud">{place.category}</span>}
                            <span className="badge badge-verified">✓ OpenStreetMap</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveFavourite(place);
                          }}
                          title="Bookmark"
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: isSaved ? '#dc2626' : 'var(--color-placeholder-gray)',
                            padding: 4,
                          }}
                        >
                          <Heart size={18} fill={isSaved ? '#dc2626' : 'none'} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Selected Destination Details, Weather, Routing, and Actions */}
          <div>
            {selectedPlace ? (
              <div
                style={{
                  backgroundColor: 'var(--color-white)',
                  border: '1px solid var(--color-divider-gray)',
                  borderRadius: 'var(--radius-cards)',
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 24,
                }}
              >
                {/* Header card with Plan CTA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <span className="badge badge-blue" style={{ marginBottom: 8 }}>
                      Selected Waypoint
                    </span>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-ink)' }}>
                      {selectedPlace.name}
                    </h2>
                    <p style={{ fontSize: 14, color: 'var(--color-graphite)', marginTop: 4 }}>
                      {selectedPlace.display_name}
                    </p>
                    <div style={{ fontSize: 12, color: 'var(--color-graphite)', marginTop: 6 }}>
                      Coordinates: {selectedPlace.latitude.toFixed(4)}° N, {selectedPlace.longitude.toFixed(4)}° E
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => handleSaveFavourite(selectedPlace)}
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: 13 }}
                    >
                      <Heart size={15} fill={bookmarkedPlaces.has(selectedPlace.place_id) ? '#dc2626' : 'none'} />
                      <span>Bookmark</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/create?destination=${encodeURIComponent(
                            selectedPlace.name || selectedPlace.display_name.split(',')[0]
                          )}`
                        )
                      }
                      className="btn-primary"
                      style={{ padding: '8px 18px', fontSize: 14 }}
                    >
                      <Sparkles size={15} />
                      <span>Plan Trip Here</span>
                    </button>
                  </div>
                </div>

                {/* Real-Time Weather Forecast (Open-Meteo) */}
                <div
                  style={{
                    backgroundColor: 'var(--color-cloud)',
                    border: '1px solid var(--color-divider-gray)',
                    borderRadius: 'var(--radius-cards)',
                    padding: 18,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CloudSun size={20} color="var(--color-hopper-blue)" />
                      <h3 style={{ fontSize: 16, fontWeight: 700 }}>
                        Live Weather & 7-Day Forecast (Open-Meteo)
                      </h3>
                    </div>
                    {weather?.current && (
                      <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-ink)' }}>
                        {weather.current.temperature}°C • {weather.current.condition}
                      </span>
                    )}
                  </div>

                  {isLoadingWeather ? (
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <Loader2 size={24} className="spinner" style={{ margin: '0 auto' }} />
                    </div>
                  ) : weather && weather.forecast_days ? (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
                        gap: 8,
                      }}
                    >
                      {weather.forecast_days.map((f, i) => (
                        <div
                          key={i}
                          style={{
                            backgroundColor: '#fff',
                            border: '1px solid var(--color-divider-gray)',
                            borderRadius: 10,
                            padding: '10px 8px',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-graphite)' }}>
                            {f.date.slice(5)}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 800, margin: '4px 0', color: 'var(--color-ink)' }}>
                            {f.max_temp_c}° / {f.min_temp_c}°
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-hopper-blue)', fontWeight: 600 }}>
                            {f.condition}
                          </div>
                          {f.precipitation_prob !== undefined && f.precipitation_prob > 0 && (
                            <div style={{ fontSize: 10, color: 'var(--color-graphite)', marginTop: 2 }}>
                              ☔ {f.precipitation_prob}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--color-graphite)' }}>
                      Weather data currently unavailable for these coordinates.
                    </p>
                  )}
                </div>

                {/* Real-time OSRM Driving Distance Estimator */}
                <div
                  style={{
                    backgroundColor: 'var(--color-cloud)',
                    border: '1px solid var(--color-divider-gray)',
                    borderRadius: 'var(--radius-cards)',
                    padding: 18,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Navigation size={18} color="var(--color-hopper-blue)" />
                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>
                      Driving Route Calculation (Project OSRM)
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Origin city (e.g. Mumbai, Delhi, Bangalore)..."
                      value={originQuery}
                      onChange={(e) => setOriginQuery(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: 13 }}
                    />
                    <button
                      type="button"
                      onClick={handleCalculateRoute}
                      className="btn-secondary"
                      style={{ padding: '8px 16px', fontSize: 13, flexShrink: 0 }}
                      disabled={isLoadingDirections}
                    >
                      {isLoadingDirections ? <Loader2 size={14} className="spinner" /> : 'Compute Route'}
                    </button>
                  </div>

                  {directions && (
                    <div
                      style={{
                        backgroundColor: '#fff',
                        border: '1px solid var(--color-divider-gray)',
                        borderRadius: 10,
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--color-graphite)' }}>Estimated Driving Distance</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-ink)' }}>
                          {directions.distance_km} km
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--color-graphite)' }}>Typical Duration</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-hopper-blue)' }}>
                          {Math.floor(directions.duration_minutes / 60)}h {Math.round(directions.duration_minutes % 60)}m
                        </div>
                      </div>
                      <span className="badge badge-verified">OSRM Routing</span>
                    </div>
                  )}
                </div>

                {/* Currency Conversion Tool */}
                <div
                  style={{
                    backgroundColor: 'var(--color-cloud)',
                    border: '1px solid var(--color-divider-gray)',
                    borderRadius: 'var(--radius-cards)',
                    padding: 18,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <DollarSign size={18} color="var(--color-hopper-blue)" />
                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>Travel Currency Converter</h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                    <input
                      type="number"
                      className="form-input"
                      value={currAmount}
                      onChange={(e) => setCurrAmount(e.target.value)}
                      style={{ padding: '8px 10px', fontSize: 13 }}
                    />
                    <select
                      className="form-select"
                      value={currFrom}
                      onChange={(e) => setCurrFrom(e.target.value)}
                      style={{ padding: '8px 6px', fontSize: 13 }}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="AED">AED</option>
                    </select>
                    <select
                      className="form-select"
                      value={currTo}
                      onChange={(e) => setCurrTo(e.target.value)}
                      style={{ padding: '8px 6px', fontSize: 13 }}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleConvertCurrency}
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: 13 }}
                      disabled={isLoadingCurr}
                    >
                      {isLoadingCurr ? <Loader2 size={14} className="spinner" /> : 'Convert'}
                    </button>
                  </div>

                  {convertedResult !== null && (
                    <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: 'var(--color-hopper-blue)' }}>
                      {currAmount} {currFrom} ≈ {convertedResult.toLocaleString()} {currTo}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="state-empty" style={{ padding: 60 }}>
                <Compass size={40} color="var(--color-placeholder-gray)" style={{ margin: '0 auto 12px auto' }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Select a Destination</h3>
                <p style={{ fontSize: 14, color: 'var(--color-graphite)' }}>
                  Click any search result on the left to inspect its live Open-Meteo weather, route coordinates, and convert currency.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};

// Helper for spacing token
function varSpacing(px: number) {
  return `${px}px`;
}

export default ExplorePage;
