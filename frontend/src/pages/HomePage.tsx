import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  Calendar,
  IndianRupee,
  Users,
  ArrowRight,
  Send,
  Heart,
  Check,
  Loader2,
  Camera,
} from 'lucide-react';
import AuthModal from '../components/AuthModal';
import BrandLogo from '../components/BrandLogo';
import { DatePickerField } from '../components/DatePickerField';
import { useAuth } from '../context/AuthContext';
import { favouriteService } from '../services/favouriteService';
import { travelDataService } from '../services/travelDataService';
import { NormalizedPlace } from '../types/api';

interface DestinationDeal {
  id: string;
  name: string;
  region: string;
  image: string;
  budgetEst: string;
  duration: string;
  tag: string;
  lat: number;
  lon: number;
}

const FEATURED_DESTINATIONS: DestinationDeal[] = [
  {
    id: 'osm_leh_ladakh',
    name: 'Leh Ladakh',
    region: 'Jammu & Kashmir, India',
    image: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80',
    budgetEst: '₹35,000',
    duration: '6 Days',
    tag: 'High Altitude & Culture',
    lat: 34.1526,
    lon: 77.5771,
  },
  {
    id: 'osm_jaipur_pink_city',
    name: 'Jaipur & Amber',
    region: 'Rajasthan, India',
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80',
    budgetEst: '₹22,000',
    duration: '4 Days',
    tag: 'Royal Palaces & Forts',
    lat: 26.9124,
    lon: 75.7873,
  },
  {
    id: 'osm_goa_coastline',
    name: 'Goa Coastal Trail',
    region: 'Western Ghats, India',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    budgetEst: '₹28,000',
    duration: '5 Days',
    tag: 'Beaches & Heritage',
    lat: 15.2993,
    lon: 74.124,
  },
  {
    id: 'osm_munnar_kerala',
    name: 'Munnar & Tea Hills',
    region: 'Kerala, India',
    image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
    budgetEst: '₹24,000',
    duration: '4 Days',
    tag: 'Mist & Plantations',
    lat: 10.0889,
    lon: 77.0595,
  },
];

interface FeaturedExperience {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  idealFor: string;
  recommendedDays: string;
}

const FEATURED_EXPERIENCES: FeaturedExperience[] = [
  {
    id: 'exp_heritage',
    title: 'Fortresses, Havelis & Desert Living',
    category: 'Heritage & Palaces',
    description: 'Immerse in medieval courtyards, mirror halls, and desert stargazing across Rajasthan’s princely strongholds.',
    image: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80',
    idealFor: 'Culture Seekers & Photographers',
    recommendedDays: '4 - 6 Days',
  },
  {
    id: 'exp_himalayas',
    title: 'High Altitude Passes & Monastery Peace',
    category: 'Himalayan Exploration',
    description: 'Traverse 17,000-foot mountain passes, azure glacial lakes, and cliffside Tibetan gompas.',
    image: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80',
    idealFor: 'Adventure & Solo Explorers',
    recommendedDays: '6 - 8 Days',
  },
  {
    id: 'exp_backwaters',
    title: 'Emerald Lagoons & Spice Trails',
    category: 'Coastal & Nature',
    description: 'Drift across palm-shaded canals on private wooden houseboats paired with herbal rejuvenation therapies.',
    image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
    idealFor: 'Couples & Family Retreats',
    recommendedDays: '3 - 5 Days',
  },
];

interface HeroBackground {
  id: string;
  name: string;
  url: string;
}

const MASTER_HERO_BACKGROUNDS: HeroBackground[] = [
  {
    id: 'leh_ladakh',
    name: 'Leh Ladakh – Himalayan mountains & valleys',
    url: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'jaipur',
    name: 'Jaipur – Heritage architecture & Pink City',
    url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'goa',
    name: 'Goa – Tropical beaches & palm trees',
    url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'kerala',
    name: 'Kerala – Backwaters & lush emerald landscapes',
    url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'manali',
    name: 'Manali – Snow-covered mountains & valleys',
    url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'varanasi',
    name: 'Varanasi – Ganga ghats & evening atmosphere',
    url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1920&q=85',
  },
];

/**
 * Fisher-Yates algorithm for unbiased array shuffling
 */
function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const QUICK_PROMPTS = [
  '7-day serene Kerala backwaters & tea plantations for couples under ₹45,000',
  'Adventurous Ladakh road trip from Manali with acclimatization stops',
  '4-day heritage & food trail across Jaipur and Udaipur palaces',
  'Peaceful beach workcation in South Goa with quiet cafes & high-speed wifi',
];

const POPULAR_DESTINATIONS = [
  'Goa, India',
  'Jaipur, Rajasthan',
  'Udaipur, Rajasthan',
  'Leh Ladakh, India',
  'Munnar, Kerala',
  'Manali, Himachal Pradesh',
  'Varanasi, Uttar Pradesh',
  'Rishikesh, Uttarakhand',
];

export const HomePage: React.FC = () => {
  // Hero Backgrounds: Randomize order on initial page load / fresh session using Fisher-Yates
  const [heroBackgrounds] = useState<HeroBackground[]>(() => fisherYatesShuffle(MASTER_HERO_BACKGROUNDS));
  const [bgIndex, setBgIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Form Search States (Clean & Empty by default per requirements)
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [travelers, setTravelers] = useState('');

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<NormalizedPlace[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchDropdownRef = useRef<HTMLFormElement>(null);

  // AI Assistant Prompt State
  const [aiPrompt, setAiPrompt] = useState('');

  // Favorites & Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarkFeedback, setBookmarkFeedback] = useState<string | null>(null);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const todayIso = new Date().toISOString().split('T')[0];

  // Automatic background rotation every 8 seconds with pause and reduced-motion handling
  useEffect(() => {
    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || isPaused) return;

    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % heroBackgrounds.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [isPaused, heroBackgrounds.length]);

  // Debounced geocoding search via Nominatim for destination autocomplete
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
        setShowSuggestions(places.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [destination]);

  // Click outside to close destination suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPlace = (placeName: string) => {
    setDestination(placeName);
    setShowSuggestions(false);
  };

  // Submit to Create Trip Planner
  const handlePlanTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dest = destination.trim();
    const params = new URLSearchParams();
    if (dest) params.set('destination', dest);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (budget) params.set('budget', budget);
    if (travelers) params.set('travelers', travelers);
    navigate(`/create${params.toString() ? `?${params.toString()}` : ''}`);
  };

  // Submit to AI Assistant Page
  const handleAskAISubmit = (promptText?: string) => {
    const textToSend = (promptText || aiPrompt).trim();
    if (!textToSend) return;
    navigate('/chat', { state: { initialPrompt: textToSend } });
  };

  // Bookmark / Favourite interaction
  const handleBookmark = async (dest: DestinationDeal, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      await favouriteService.addFavourite({
        place_id: dest.id,
        name: dest.name,
        display_name: `${dest.name}, ${dest.region}`,
        latitude: dest.lat,
        longitude: dest.lon,
        photo_url: dest.image,
        category: 'tourism',
        type: 'destination',
        notes: `Estimated budget: ${dest.budgetEst} for ${dest.duration}`,
      });
      setBookmarkedIds((prev) => new Set(prev).add(dest.id));
      setBookmarkFeedback(`Saved ${dest.name} to your bookmarks!`);
      setTimeout(() => setBookmarkFeedback(null), 3000);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setBookmarkFeedback(`${dest.name} is already in your saved places.`);
      } else {
        setBookmarkFeedback('Could not save destination right now.');
      }
      setTimeout(() => setBookmarkFeedback(null), 3000);
    }
  };

  const handleCardClick = (destName: string) => {
    navigate(`/create?destination=${encodeURIComponent(destName)}`);
  };

  const currentBg = heroBackgrounds[bgIndex] || heroBackgrounds[0];

  return (
    <div className="main-content" style={{ backgroundColor: 'var(--color-bg-main)' }}>
      {/* Toast Notification */}
      {bookmarkFeedback && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 1000,
            backgroundColor: 'var(--color-primary)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 'var(--radius-pills)',
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(24, 61, 50, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Check size={16} color="var(--color-secondary-accent)" />
          <span>{bookmarkFeedback}</span>
        </div>
      )}

      <div className="container">
        {/* ==========================================================================
            CARD 1: PLAN YOUR EXTRAORDINARY JOURNEY (Automatic Background Slideshow)
            ========================================================================== */}
        <section
          className="travel-search-card"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          {/* Layered Crossfade Background Photographs */}
          {heroBackgrounds.map((bg, idx) => (
            <div
              key={bg.id}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url('${bg.url}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: idx === bgIndex ? 1 : 0,
                transition: 'opacity 1200ms cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
          ))}

          {/* Dark Overlay for Readability */}
          <div className="travel-card-overlay" style={{ zIndex: 1 }} />

          {/* Foreground Text & Search Form */}
          <div className="travel-card-content" style={{ position: 'relative', zIndex: 2 }}>
            <div className="travel-card-eyebrow">
              <BrandLogo variant="dark" layout="emblem-only" emblemHeight={18} clickable={false} />
              <span>Curated Journeys • Geospatial Intelligence</span>
            </div>

            <h1 className="travel-card-heading">
              Plan Your Extraordinary Journey
            </h1>

            <p className="travel-card-subheading">
              Discover tailor-made routes with real-time INR budget intelligence, live weather forecasts, and verified local stops.
            </p>

            {/* Centered Horizontal White Search Panel */}
            <form
              className="horizontal-search-panel"
              onSubmit={handlePlanTripSubmit}
              ref={searchDropdownRef}
              onFocus={() => setIsPaused(true)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsPaused(false);
                }
              }}
            >
              {/* 1. Destination Field (Empty by default) */}
              <div className="h-search-field h-search-field-destination">
                <label className="h-search-label">
                  <MapPin size={13} color="var(--color-accent)" />
                  Destination
                </label>
                <div className="h-search-input-wrap">
                  <input
                    type="text"
                    className="h-search-input"
                    placeholder="Where to? (e.g. Goa, Jaipur)"
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => {
                      setShowSuggestions(true);
                      setIsPaused(true);
                    }}
                    autoComplete="off"
                  />
                  {isLoadingSuggestions && <Loader2 size={14} className="spinner" />}
                </div>

                {/* Autocomplete / Suggested Destinations Dropdown */}
                {showSuggestions && (
                  <div className="autocomplete-dropdown">
                    {suggestions.length > 0 ? (
                      suggestions.map((p) => (
                        <div
                          key={p.place_id}
                          className="autocomplete-item"
                          onClick={() => handleSelectPlace(p.name || p.display_name.split(',')[0])}
                        >
                          <MapPin size={14} color="var(--color-primary)" />
                          <div>
                            <div style={{ fontWeight: 600 }}>{p.name || p.display_name.split(',')[0]}</div>
                            <div style={{ fontSize: 12, color: 'var(--color-graphite)' }}>{p.display_name}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '8px 12px' }}>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'var(--color-graphite)',
                            textTransform: 'uppercase',
                            marginBottom: 6,
                          }}
                        >
                          Popular Destinations
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {POPULAR_DESTINATIONS.map((pop, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectPlace(pop)}
                              style={{
                                border: '1px solid var(--color-divider-gray)',
                                background: 'var(--color-bg-main)',
                                borderRadius: 'var(--radius-pills)',
                                padding: '4px 10px',
                                fontSize: 12,
                                cursor: 'pointer',
                                color: 'var(--color-ink)',
                              }}
                            >
                              {pop}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="h-search-divider" />

              {/* 2. Departure Date (Empty by default, fully clickable popover) */}
              <div className="h-search-field">
                <label className="h-search-label">
                  <Calendar size={13} color="var(--color-primary)" />
                  Departure
                </label>
                <div className="h-search-input-wrap">
                  <DatePickerField
                    id="hero-departure-date"
                    value={startDate}
                    onChange={setStartDate}
                    placeholder="Select departure date"
                    variant="minimal"
                    minDate={todayIso}
                  />
                </div>
              </div>

              <div className="h-search-divider" />

              {/* 3. Return Date (Empty by default, minDate strictly after departure) */}
              <div className="h-search-field">
                <label className="h-search-label">
                  <Calendar size={13} color="var(--color-primary)" />
                  Return
                </label>
                <div className="h-search-input-wrap">
                  <DatePickerField
                    id="hero-return-date"
                    value={endDate}
                    onChange={setEndDate}
                    placeholder="Select return date"
                    variant="minimal"
                    minDate={startDate || todayIso}
                  />
                </div>
              </div>

              <div className="h-search-divider" />

              {/* 4. Budget (INR) (Empty by default) */}
              <div className="h-search-field">
                <label className="h-search-label">
                  <IndianRupee size={13} color="var(--color-accent)" />
                  Budget (INR)
                </label>
                <div className="h-search-input-wrap">
                  <span style={{ fontWeight: 700, color: 'var(--color-graphite)', fontSize: 14 }}>₹</span>
                  <input
                    type="number"
                    step="1000"
                    min="1000"
                    className="h-search-input"
                    placeholder="Enter your budget"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
              </div>

              <div className="h-search-divider" />

              {/* 5. Travellers (Empty by default) */}
              <div className="h-search-field">
                <label className="h-search-label">
                  <Users size={13} color="var(--color-primary)" />
                  Travellers
                </label>
                <div className="h-search-input-wrap">
                  <select
                    className="h-search-input"
                    value={travelers}
                    onChange={(e) => setTravelers(e.target.value)}
                    style={{
                      color: travelers ? 'var(--color-text-primary)' : 'var(--color-graphite)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="" disabled>Select travellers</option>
                    <option value="1">1 Solo</option>
                    <option value="2">2 Pair / Couple</option>
                    <option value="3">3 Small Group</option>
                    <option value="4">4+ Friends / Family</option>
                  </select>
                </div>
              </div>

              {/* Search / Plan Trip Action */}
              <button type="submit" className="h-search-btn">
                <span>Plan Trip</span>
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Bottom Hero Controls: Current Destination Name & Manual Indicator Dots */}
            <div
              style={{
                marginTop: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                fontSize: 13,
                color: 'rgba(255, 255, 255, 0.92)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} color="var(--color-secondary-accent)" />
                <span style={{ fontWeight: 500 }}>{currentBg.name}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, opacity: 0.85, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Camera size={13} /> Change background:
                </span>
                {heroBackgrounds.map((bg, idx) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => {
                      setBgIndex(idx);
                      setIsPaused(false);
                    }}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: idx === bgIndex ? 'var(--color-accent)' : 'rgba(255,255,255,0.45)',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.2s ease',
                      transform: idx === bgIndex ? 'scale(1.35)' : 'scale(1)',
                    }}
                    aria-label={`Select background ${bg.name}`}
                    title={bg.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            CARD 2: AI TRAVEL ASSISTANT (Directly below Hero Card)
            ========================================================================== */}
        <section
          className="ai-assistant-card"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1920&q=85')",
          }}
        >
          <div className="ai-card-overlay" />

          <div className="ai-card-content">
            <div className="ai-badge-indicator">
              <BrandLogo variant="dark" layout="emblem-only" emblemHeight={18} clickable={false} />
              <span>AI-Powered Travel Discovery</span>
            </div>

            <h2 className="ai-card-heading">
              Where would you like to go?
            </h2>

            <p className="ai-card-subheading">
              Tell us your travel dreams. Let AI turn them into a personalized journey.
            </p>

            {/* Prompt Input Box */}
            <form
              className="ai-prompt-box"
              onSubmit={(e) => {
                e.preventDefault();
                handleAskAISubmit();
              }}
            >
              <input
                type="text"
                className="ai-prompt-input"
                placeholder="Describe your ideal trip, destinations, budget or travel preferences..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />

              <button type="submit" className="ai-submit-btn">
                <span>Ask AI</span>
                <Send size={15} />
              </button>
            </form>

            {/* Curated Prompt Chips */}
            <div className="ai-chips-container">
              {QUICK_PROMPTS.map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="ai-chip"
                  onClick={() => handleAskAISubmit(promptText)}
                >
                  <Sparkles size={12} color="var(--color-accent)" />
                  <span>{promptText}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ==========================================================================
          SECTION 3: Handpicked Destinations & Editorial Journeys
          ========================================================================== */}
      <section className="section-white">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="text-link-blue" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Handpicked Destinations
              </span>
              <h2 className="section-title" style={{ marginTop: 4 }}>
                Trending Journeys with Verified Routes
              </h2>
              <p className="section-subtitle">
                Explore curated itineraries ready for instant AI customization and budget breakdown.
              </p>
            </div>
            <Link to="/explore" className="btn-secondary" style={{ padding: '8px 18px', fontSize: 14 }}>
              <span>Explore All</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="cards-grid">
            {FEATURED_DESTINATIONS.map((dest) => {
              const isSaved = bookmarkedIds.has(dest.id);
              return (
                <div
                  key={dest.id}
                  className="card-destination"
                  onClick={() => handleCardClick(dest.name)}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <div style={{ position: 'relative' }}>
                    <img src={dest.image} alt={dest.name} loading="lazy" />
                    <button
                      type="button"
                      onClick={(e) => handleBookmark(dest, e)}
                      title={isSaved ? 'Saved in Favourites' : 'Save to Favourites'}
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.92)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: isSaved ? '#dc2626' : 'var(--color-graphite)',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <Heart size={18} fill={isSaved ? '#dc2626' : 'none'} />
                    </button>
                    <div style={{ position: 'absolute', bottom: 10, left: 12 }}>
                      <span className="badge badge-cloud" style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}>
                        {dest.tag}
                      </span>
                    </div>
                  </div>

                  <div className="card-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-ink)' }}>
                        {dest.name}
                      </h3>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-graphite)' }}>
                        {dest.duration}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--color-graphite)', marginBottom: 14 }}>
                      {dest.region}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 12,
                        borderTop: '1px solid var(--color-divider-gray)',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--color-graphite)', display: 'block' }}>From</span>
                        <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-primary)' }}>
                          {dest.budgetEst}
                        </span>
                      </div>
                      <span className="text-link-blue" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        Plan Trip <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==========================================================================
          SECTION 4: Featured Thematic Experiences
          ========================================================================== */}
      <section className="section-cloud" style={{ borderTop: '1px solid var(--color-divider-gray)' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <span className="text-link-blue" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Curated Travel Styles
              </span>
              <h2 className="section-title" style={{ marginTop: 4 }}>
                Featured Experiences & Adventures
              </h2>
              <p className="section-subtitle">
                Thematic journeys engineered around natural wonders, culinary secrets, and deep heritage.
              </p>
            </div>
            <Link to="/explore" className="btn-secondary" style={{ padding: '8px 18px', fontSize: 14 }}>
              <span>View All Categories</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-24)' }}>
            {FEATURED_EXPERIENCES.map((exp) => (
              <div
                key={exp.id}
                className="card-destination"
                onClick={() => navigate(`/create?interests=${encodeURIComponent(exp.category)}`)}
                style={{ cursor: 'pointer', overflow: 'hidden', backgroundColor: 'var(--color-bg-main)' }}
              >
                <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={exp.image}
                    alt={exp.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                  <div style={{ position: 'absolute', top: 12, left: 12 }}>
                    <span className="badge badge-cloud" style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}>
                      {exp.category}
                    </span>
                  </div>
                </div>
                <div className="card-content">
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 6 }}>
                    {exp.title}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--color-graphite)', lineHeight: 1.5, marginBottom: 14 }}>
                    {exp.description}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 12,
                      borderTop: '1px solid var(--color-divider-gray)',
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: 'var(--color-graphite)', fontWeight: 600 }}>{exp.recommendedDays}</span>
                    <span className="text-link-blue" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      Plan This Style <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};

export default HomePage;
