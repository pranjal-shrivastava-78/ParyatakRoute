import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  Heart,
  TrendingUp,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  Calendar,
  Check,
  Star,
  QrCode,
  Smartphone,
} from 'lucide-react';
import HeroNav from '../components/HeroNav';
import SearchPill from '../components/SearchPill';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../context/AuthContext';
import { favouriteService } from '../services/favouriteService';

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

export const HomePage: React.FC = () => {
  const [activeService, setActiveService] = useState<'trips' | 'explore' | 'stays'>('trips');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarkFeedback, setBookmarkFeedback] = useState<string | null>(null);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
    <div className="main-content">
      {bookmarkFeedback && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 1000,
            backgroundColor: 'var(--color-ink)',
            color: 'var(--color-white)',
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
          <span>{bookmarkFeedback}</span>
        </div>
      )}

      {/* 1. Hero Destination Frame per DESIGN.md */}
      <div
        className="hero-frame"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1920&q=85')",
        }}
      >
        <div className="hero-overlay" />
        <div className="hero-content">
          {/* Top Transparent Bar */}
          <HeroNav
            onOpenAuth={() => setShowAuthModal(true)}
            activeService={activeService}
            onSelectService={setActiveService}
          />

          {/* Center Callout */}
          <div className="hero-center">
            <h1 className="hero-title">
              Personalized Travel Itineraries, Powered by Groq AI
            </h1>
            <p className="hero-subtitle">
              Turn your destination, dates, and budget into structured day-by-day schedules with verified geospatial routing, live weather, and deterministic expense tracking.
            </p>

            {/* Hopper-Style 9999px Search Pill */}
            <SearchPill />
          </div>

          {/* Hero Bottom Label per DESIGN.md: "keep the image label in white and align it toward the lower edge" */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.85)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} />
              <span>Santorini Island, Aegean Archipelago</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span>✓ OpenStreetMap Geocoding</span>
              <span>✓ Open-Meteo Forecasts</span>
              <span>✓ ReportLab PDF Export</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Destination Deals & Featured Journeys (#ffffff canvas) */}
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
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
                        <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-hopper-blue)' }}>
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

      {/* 2b. Featured Experiences Section */}
      <section className="section-white" style={{ borderTop: '1px solid var(--color-cloud)' }}>
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
                style={{ cursor: 'pointer', overflow: 'hidden' }}
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

      {/* 2c. How ParyatakRoute Works Section */}
      <section style={{ padding: 'var(--spacing-48) 0', backgroundColor: 'var(--color-cloud)' }}>
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
                backgroundColor: 'var(--surface-white-canvas)',
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
                  backgroundColor: 'var(--color-hopper-blue-subtle)',
                  color: 'var(--color-hopper-blue)',
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
                Choose your destination, travel pace (relaxed, moderate, or fast), group size, and target budget. No login or credit card required.
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--surface-white-canvas)',
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
                  backgroundColor: 'var(--color-hopper-blue-subtle)',
                  color: 'var(--color-hopper-blue)',
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
                backgroundColor: 'var(--surface-white-canvas)',
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
                  backgroundColor: 'var(--color-hopper-blue-subtle)',
                  color: 'var(--color-hopper-blue)',
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

      {/* 3. Blue Promotional Tile per DESIGN.md:
          "Role: Branded feature or offer surface. Use #1878ec as a flat full-bleed card background with a 32px radius and no shadow. Set internal copy and icons in #ffffff." */}
      <section style={{ padding: '0 0 var(--spacing-48) 0' }}>
        <div className="container">
          <div className="promo-card">
            <div style={{ maxWidth: 640 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 1000, fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
                <Sparkles size={14} />
                <span>Deterministic Budget & Surgical Regeneration</span>
              </div>
              <h3>Intelligent Itinerary Engine</h3>
              <p style={{ marginBottom: 20 }}>
                Unlike generic LLMs, ParyatakRoute validates waypoints via OpenStreetMap, calculates drive distances via OSRM, pulls live Open-Meteo forecasts, and calculates exact category budget breakdowns with overrun alerts.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link
                  to="/create"
                  style={{
                    backgroundColor: 'var(--color-white)',
                    color: 'var(--color-hopper-blue)',
                    fontWeight: 700,
                    padding: '10px 24px',
                    borderRadius: 'var(--radius-buttons)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 15,
                  }}
                >
                  <span>Build My Itinerary</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/explore"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--color-white)',
                    border: '1px solid var(--color-white)',
                    fontWeight: 600,
                    padding: '9px 22px',
                    borderRadius: 'var(--radius-buttons)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 15,
                  }}
                >
                  <span>Search POIs & Weather</span>
                </Link>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                backgroundColor: 'rgba(255,255,255,0.12)',
                padding: 24,
                borderRadius: 'var(--radius-cards)',
                minWidth: 260,
                backdropFilter: 'blur(4px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={20} color="#fff" />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Row-Level Security (RLS)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Zap size={20} color="#fff" />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Groq AI Llama-3.3 Speed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TrendingUp size={20} color="#fff" />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Live Currency Conversion</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar size={20} color="#fff" />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Day-by-Day Surgical Replan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. App Download Showcase per DESIGN.md:
          "Role: Mobile-app acquisition block. Place a 32px/40px, weight-800 #111111 heading above 16px/24px supporting copy. Pair the text column with a raw QR code, blue #1878ec download link treatment, store-rating marks, and overlapping upright phone screenshots." */}
      <section className="section-white" style={{ borderTop: '1px solid var(--color-cloud)' }}>
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
                <div className="qr-code-box">
                  <QrCode size={64} color="var(--color-ink)" />
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

            {/* Overlapping Phone Mockup Container per DESIGN.md */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: 290,
                  height: 480,
                  backgroundColor: 'var(--color-cloud)',
                  borderRadius: 36,
                  border: '8px solid var(--color-ink)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Phone Notch */}
                <div style={{ height: 24, backgroundColor: 'var(--color-ink)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ width: 60, height: 4, backgroundColor: '#333', borderRadius: 2 }} />
                </div>
                {/* Phone screen content */}
                <div style={{ padding: 16, backgroundColor: '#fff', flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <Compass size={18} color="var(--color-hopper-blue)" />
                    <span style={{ fontWeight: 800, fontSize: 13 }}>ParyatakRoute Mobile</span>
                  </div>
                  <div style={{ backgroundColor: 'var(--color-hopper-blue-subtle)', padding: 12, borderRadius: 12, marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-hopper-blue)' }}>DAY 1 • LEH LADAKH</div>
                    <div style={{ fontSize: 13, fontWeight: 800, marginTop: 2 }}>Arrival & Acclimatization</div>
                  </div>
                  <div style={{ border: '1px solid var(--color-divider-gray)', padding: 10, borderRadius: 12, marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--color-graphite)' }}>09:00 AM • Sightseeing</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>Shanti Stupa Panoramic View</div>
                    <div style={{ fontSize: 10, color: 'var(--color-success)', fontWeight: 600, marginTop: 4 }}>✓ Verified POI</div>
                  </div>
                  <div style={{ border: '1px solid var(--color-divider-gray)', padding: 10, borderRadius: 12, marginBottom: 8 }}>
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
