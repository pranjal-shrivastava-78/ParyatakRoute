import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, DollarSign, Users, Loader2 } from 'lucide-react';
import { travelDataService } from '../services/travelDataService';
import { NormalizedPlace } from '../types/api';

interface SearchPillProps {
  onSearchSubmit?: (params: {
    destination: string;
    dates?: string;
    budget?: number;
    travelers?: number;
  }) => void;
  initialDestination?: string;
}

export const SearchPill: React.FC<SearchPillProps> = ({
  onSearchSubmit,
  initialDestination = '',
}) => {
  const [destination, setDestination] = useState(initialDestination);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 19);
    return d.toISOString().split('T')[0];
  });
  const [travelers, setTravelers] = useState<number>(2);
  const [budget, setBudget] = useState<string>('35000');

  // Nominatim Autocomplete state
  const [suggestions, setSuggestions] = useState<NormalizedPlace[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLFormElement>(null);

  // Debounced geocoding search via Nominatim
  useEffect(() => {
    if (!destination || destination.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const places = await travelDataService.searchDestinations(destination, 5);
        setSuggestions(places);
        setShowDropdown(places.length > 0);
      } catch {
        // Fallback gracefully
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [destination]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPlace = (place: NormalizedPlace) => {
    setDestination(place.name || place.display_name.split(',')[0]);
    setShowDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dest = destination.trim() || 'Goa, India';

    if (onSearchSubmit) {
      onSearchSubmit({
        destination: dest,
        dates: `${startDate} to ${endDate}`,
        budget: Number(budget) || 30000,
        travelers,
      });
    } else {
      // Navigate to /create with search parameters
      const params = new URLSearchParams({
        destination: dest,
        startDate,
        endDate,
        budget: budget || '35000',
        travelers: String(travelers),
      });
      navigate(`/create?${params.toString()}`);
    }
  };

  return (
    <form className="search-pill-container" onSubmit={handleSubmit} ref={dropdownRef}>
      {/* 1. Destination Field */}
      <div className="search-field" style={{ flex: 1.4 }}>
        <span className="search-field-label">Where to?</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={16} color="var(--color-graphite)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            className="search-field-input"
            placeholder="Search destination, city, region..."
            value={destination}
            onChange={(e) => {
              setDestination(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowDropdown(true);
            }}
            autoComplete="off"
            required
          />
          {isLoadingSuggestions && <Loader2 size={14} className="spinner" style={{ flexShrink: 0 }} />}
        </div>

        {/* Live Nominatim Autocomplete Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="autocomplete-dropdown">
            {suggestions.map((p) => (
              <div
                key={p.place_id}
                className="autocomplete-item"
                onClick={() => handleSelectPlace(p)}
              >
                <MapPin size={15} color="var(--color-hopper-blue)" style={{ flexShrink: 0 }} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{p.name}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--color-graphite)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {p.display_name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="search-divider" />

      {/* 2. Dates Field */}
      <div className="search-field" style={{ flex: 1.1 }}>
        <span className="search-field-label">When?</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={16} color="var(--color-graphite)" style={{ flexShrink: 0 }} />
          <input
            type="date"
            className="search-field-input"
            value={startDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ fontSize: 13, cursor: 'pointer' }}
          />
          <span style={{ color: 'var(--color-placeholder-gray)' }}>-</span>
          <input
            type="date"
            className="search-field-input"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ fontSize: 13, cursor: 'pointer' }}
          />
        </div>
      </div>

      <div className="search-divider" />

      {/* 3. Budget Field */}
      <div className="search-field" style={{ flex: 0.9 }}>
        <span className="search-field-label">Est. Budget</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <DollarSign size={16} color="var(--color-graphite)" style={{ flexShrink: 0 }} />
          <input
            type="number"
            className="search-field-input"
            placeholder="35,000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            min="1000"
            step="1000"
          />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-graphite)' }}>INR</span>
        </div>
      </div>

      <div className="search-divider" />

      {/* 4. Travelers Count */}
      <div className="search-field" style={{ flex: 0.8 }}>
        <span className="search-field-label">Who?</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={16} color="var(--color-graphite)" style={{ flexShrink: 0 }} />
          <select
            className="search-field-input"
            value={travelers}
            onChange={(e) => setTravelers(Number(e.target.value))}
            style={{ cursor: 'pointer', background: 'transparent' }}
          >
            <option value={1}>1 Solo</option>
            <option value={2}>2 Couple</option>
            <option value={3}>3 Friends</option>
            <option value={4}>4 Group</option>
            <option value={6}>6+ Family</option>
          </select>
        </div>
      </div>

      {/* 5. Circular Blue Submit Button per DESIGN.md */}
      <button
        type="submit"
        className="search-btn-circular"
        title="Plan Itinerary with AI"
        aria-label="Search and Plan"
      >
        <Search size={20} strokeWidth={2.4} />
      </button>
    </form>
  );
};

export default SearchPill;
