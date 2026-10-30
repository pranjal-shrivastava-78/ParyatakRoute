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
  Star,
  QrCode,
  ShieldCheck,
  Zap,
  TrendingUp,
  Compass,
  Loader2,
  Camera,
} from 'lucide-react';
import AuthModal from '../components/AuthModal';
import BrandLogo from '../components/BrandLogo';
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

const HERO_BACKGROUNDS = [
  {
    name: 'Leh Ladakh Valley & Monasteries',
    url: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1920&q=85',
  },
  {
    name: 'Amber Fort & Royal Jaipur',
    url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1920&q=85',
  },
  {
    name: 'Munnar Tea Plantations, Kerala',
    url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1920&q=85',
  },
  {
    name: 'Goa Coastal Serenity',
    url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1920&q=85',
  },
];

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
  // Card 1: Trip Planning States
  const [destination, setDestination] = useState('');
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
  const [budget, setBudget] = useState('35000');
  const [travelers, setTravelers] = useState('2');
  const [bgIndex, setBgIndex] = useState(0);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<NormalizedPlace[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchDropdownRef = useRef<HTMLFormElement>(null);

  // Card 2: AI Travel Assistant Prompt State
  const [aiPrompt, setAiPrompt] = useState('');

  // Favorites & Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarkFeedback, setBookmarkFeedback] = useState<string | null>(null);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
        setShowSuggestions(places.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [destination]);

  // Click outside to close dropdown
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

  // Card 1: Submit to Create Trip Planner
  const handlePlanTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dest = destination.trim() || 'Goa, India';
    const params = new URLSearchParams({
      destination: dest,
      startDate,
      endDate,
      budget: budget || '35000',
      travelers: travelers || '2',
    });
    navigate(`/create?${params.toString()}`);
  };

  // Card 2: Submit to AI Assistant Page
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
            CARD 1: PLAN YOUR TRIP (Large, visually immersive travel search card)
            ========================================================================== */}
        <section
          className="travel-search-card"
          style={{
            backgroundImage: `url('${HERO_BACKGROUNDS[bgIndex].url}')`,
          }}
        >
          <div className="travel-card-overlay" />

          <div className="travel-card-content">
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
            <form className="horizontal-search-panel" onSubmit={handlePlanTripSubmit} ref={searchDropdownRef}>
              {/* 1. Destination Field */}
              <div className="h-search-field h-search-field-destination">
                <label className="h-search-label">
                  <MapPin size={13} color="var(--color-accent)" />
                  Destination
                </label>
                <div className="h-search-input-wrap">
                  <input
                    type="text"
                    className="h-search-input"
                    placeholder="Where to? (e.g. Goa, Jaipur, Ladakh)"
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    autoComplete="off"
                    required
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
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-graphite)', textTransform: 'uppercase', marginBottom: 6 }}>
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

              {/* 2. Departure Date */}
              <div className="h-search-field">
                <label className="h-search-label">
                  <Calendar size={13} color="var(--color-primary)" />
                  Departure
                </label>
                <div className="h-search-input-wrap">
                  <input
                    type="date"
                    className="h-search-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="h-search-divider" />

              {/* 3. Return Date */}
              <div className="h-search-field">
                <label className="h-search-label">
                  <Calendar size={13} color="var(--color-primary)" />
                  Return
                </label>
                <div className="h-search-input-wrap">
                  <input
                    type="date"
                    className="h-search-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="h-search-divider" />

              {/* 4. Budget (INR) */}
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
                    min="5000"
                    className="h-search-input"
                    placeholder="35000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="h-search-divider" />

              {/* 5. Travellers */}
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
                  >
                    <option value="1">1 Solo</option>
                    <option value="2">2 Pair / Couple</option>
                    <option value="3">3 Small Group</option>
                    <option value="4">4+ Friends / Family</option>
                  </select>
                </div>
              </div>

              {/* Search/Generate Button */}
              <button type="submit" className="h-search-btn">
                <span>Plan Trip</span>
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Bottom Photo Attribution & Quick Switcher */}
            <div
              style={{
                marginTop: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                fontSize: 13,
                color: 'rgba(255, 255, 255, 0.88)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} color="var(--color-secondary-accent)" />
                <span>{HERO_BACKGROUNDS[bgIndex].name}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, opacity: 0.85, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Camera size={13} /> Change background:
                </span>
                {HERO_BACKGROUNDS.map((bg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBgIndex(idx)}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: idx === bgIndex ? 'var(--color-accent)' : 'rgba(255,255,255,0.45)',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.15s ease',
                      transform: idx === bgIndex ? 'scale(1.3)' : 'scale(1)',
                    }}
                    title={bg.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            CARD 2: AI TRAVEL ASSISTANT (Directly below Card 1)
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

      {/* ==========================================================================
          SECTION 5: How ParyatakRoute Works
          ========================================================================== */}
      <section style={{ padding: 'var(--spacing-48) 0', backgroundColor: 'var(--color-bg-main)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto var(--spacing-40) auto' }}>
            <span className="text-link-blue" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Simple 3-Step Journey
            </span>
            <h2 className="section-title" style={{ marginTop: 4 }}>
              How ParyatakRoute Works
            </h2>
            <p className="section-subtitle">
              From wanderlust dream to verified hour-by-hour itinerary with zero registration obstacles.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-24)' }}>
            <div
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-divider-gray)',
                borderRadius: 'var(--radius-cards)',
                padding: 'var(--spacing-32) var(--spacing-24)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-pills)',
                  backgroundColor: 'var(--color-primary-subtle)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 18,
                  marginBottom: 16,
                }}
              >
                1
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 8 }}>
                Set Your Travel Style & Dates
              </h3>
              <p style={{ fontSize: 14, color: 'var(--color-graphite)', lineHeight: 1.5 }}>
                Choose your destination, travel pace, group size, and target INR budget. No login or credit card required to begin.
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-divider-gray)',
                borderRadius: 'var(--radius-cards)',
                padding: 'var(--spacing-32) var(--spacing-24)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-pills)',
                  backgroundColor: 'var(--color-primary-subtle)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 18,
                  marginBottom: 16,
                }}
              >
                2
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 8 }}>
                Groq AI Synthesizes Routes
              </h3>
              <p style={{ fontSize: 14, color: 'var(--color-graphite)', lineHeight: 1.5 }}>
                Our engine cross-checks regional waypoints with OpenStreetMap, models driving legs with OSRM, and pulls live forecasts from Open-Meteo.
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-divider-gray)',
                borderRadius: 'var(--radius-cards)',
                padding: 'var(--spacing-32) var(--spacing-24)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-pills)',
                  backgroundColor: 'var(--color-primary-subtle)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 18,
                  marginBottom: 16,
                }}
              >
                3
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 8 }}>
                Surgically Replan & Export PDF
              </h3>
              <p style={{ fontSize: 14, color: 'var(--color-graphite)', lineHeight: 1.5 }}>
                Regenerate single days with custom AI instructions, review deterministic itemized expenses, and download a high-res PDF offline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          SECTION 6: Editorial Forest Green Feature Banner
          ========================================================================== */}
      <section style={{ padding: '0 0 var(--spacing-48) 0' }}>
        <div className="container">
          <div
            style={{
              backgroundColor: 'var(--color-primary)',
              borderRadius: 'var(--radius-images)',
              color: '#ffffff',
              padding: 'var(--spacing-40)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--spacing-32)',
              flexWrap: 'wrap',
              boxShadow: '0 16px 40px rgba(24, 61, 50, 0.16)',
            }}
          >
            <div style={{ maxWidth: 640 }}>
              <div style={{ marginBottom: 18 }}>
                <BrandLogo
                  variant="dark"
                  layout="horizontal"
                  emblemHeight={48}
                  fontSize={26}
                  withTagline={true}
                  clickable={false}
                />
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  padding: '4px 12px',
                  borderRadius: 1000,
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 14,
                  color: 'var(--color-secondary-accent)',
                }}
              >
                <Sparkles size={14} />
                <span>Deterministic Budget & Surgical Regeneration</span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>
                Intelligent Route Engineering
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, lineHeight: 1.55, marginBottom: 24 }}>
                Unlike generic chatbots, ParyatakRoute validates waypoints via OpenStreetMap, calculates drive distances via OSRM, pulls live Open-Meteo forecasts, and calculates exact category budget breakdowns with overrun alerts.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link
                  to="/create"
                  className="btn-accent"
                  style={{ textDecoration: 'none' }}
                >
                  <span>Build My Itinerary</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/explore"
                  className="btn-secondary"
                  style={{
                    backgroundColor: 'transparent',
                    color: '#ffffff',
                    borderColor: 'rgba(255,255,255,0.5)',
                    textDecoration: 'none',
                  }}
                >
                  <span>Explore POIs & Forecasts</span>
                </Link>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                backgroundColor: 'rgba(255,255,255,0.08)',
                padding: 24,
                borderRadius: 'var(--radius-cards)',
                minWidth: 260,
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={20} color="var(--color-secondary-accent)" />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Row-Level Security (RLS)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Zap size={20} color="var(--color-secondary-accent)" />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Groq AI Llama-3.3 Speed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TrendingUp size={20} color="var(--color-secondary-accent)" />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Live Currency Conversion</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar size={20} color="var(--color-secondary-accent)" />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Day-by-Day Surgical Replan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          SECTION 7: App Showcase & Swagger Contract
          ========================================================================== */}
      <section className="section-cloud" style={{ borderTop: '1px solid var(--color-divider-gray)' }}>
        <div className="container">
          <div className="app-showcase-section">
            <div>
              <h2 className="app-showcase-title">
                Travel Smarter Everywhere You Go
              </h2>
              <p className="app-showcase-text">
                ParyatakRoute turns complex travel logistics into effortless, beautiful daily itineraries. Access your day plans offline, view turn-by-turn driving durations, and chat directly with your AI journey companion.
              </p>

              {/* QR and Ratings */}
              <div className="qr-box-row">
                <div className="qr-code-box" style={{ backgroundColor: 'var(--color-bg-main)' }}>
                  <QrCode size={64} color="var(--color-primary)" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <Star size={16} fill="#f59e0b" color="#f59e0b" />
                    <Star size={16} fill="#f59e0b" color="#f59e0b" />
                    <Star size={16} fill="#f59e0b" color="#f59e0b" />
                    <Star size={16} fill="#f59e0b" color="#f59e0b" />
                    <Star size={16} fill="#f59e0b" color="#f59e0b" />
                    <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-ink)', marginLeft: 4 }}>
                      4.9 / 5.0
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-graphite)' }}>
                    Based on 28,400+ traveller itineraries generated
                  </div>
                </div>
              </div>

              <div>
                <a
                  href="https://paryatakrouteapi.itspranjal.in/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link-blue"
                  style={{ fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <span>Explore ParyatakRoute Live API Contract & Swagger</span>
                  <ArrowRight size={15} />
                </a>
              </div>
            </div>

            {/* Overlapping Phone Mockup */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: 290,
                  height: 480,
                  backgroundColor: 'var(--color-bg-main)',
                  borderRadius: 36,
                  border: '8px solid var(--color-primary)',
                  boxShadow: '0 20px 40px rgba(24, 61, 50, 0.15)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Phone Notch */}
                <div style={{ height: 24, backgroundColor: 'var(--color-primary)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ width: 60, height: 4, backgroundColor: '#333', borderRadius: 2 }} />
                </div>
                {/* Phone screen content */}
                <div style={{ padding: 16, backgroundColor: 'var(--color-bg-main)', flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    <BrandLogo variant="light" height={28} clickable={false} />
                  </div>
                  <div style={{ backgroundColor: 'var(--color-primary-subtle)', padding: 12, borderRadius: 12, marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)' }}>DAY 1 • LEH LADAKH</div>
                    <div style={{ fontSize: 13, fontWeight: 800, marginTop: 2, color: 'var(--color-text-primary)' }}>Arrival & Acclimatization</div>
                  </div>
                  <div style={{ border: '1px solid var(--color-divider-gray)', padding: 10, borderRadius: 12, marginBottom: 8, backgroundColor: '#ffffff' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-graphite)' }}>09:00 AM • Sightseeing</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>Shanti Stupa Panoramic View</div>
                    <div style={{ fontSize: 10, color: 'var(--color-success)', fontWeight: 600, marginTop: 4 }}>✓ Verified POI</div>
                  </div>
                  <div style={{ border: '1px solid var(--color-divider-gray)', padding: 10, borderRadius: 12, marginBottom: 8, backgroundColor: '#ffffff' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-graphite)' }}>02:30 PM • Culture</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>Leh Main Bazaar & Tibetan Kitchen</div>
                    <div style={{ fontSize: 10, color: 'var(--color-graphite)', marginTop: 4 }}>Est. ₹650 / person</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};

export default HomePage;
