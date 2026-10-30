import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Star,
  Users,
  Wallet,
  Calendar,
  Clock,
  Heart,
  Sparkles,
  ChevronRight,
  X,
  Compass,
  ArrowRight,
  CloudSun,
  Navigation,
  DollarSign,
  AlertCircle,
  Check,
  Share2,
} from 'lucide-react';
import { DESTINATIONS_DATA, DestinationItem } from '../data/destinationsData';
import { travelDataService } from '../services/travelDataService';
import { favouriteService } from '../services/favouriteService';
import { WeatherResponse, DirectionsResponse } from '../types/api';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Search & Filter State
  const initialQuery = searchParams.get('query') || searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'all';
  const initialPlaceSlug = searchParams.get('place') || searchParams.get('destination') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedBudget, setSelectedBudget] = useState<string>('any');
  const [selectedCrowd, setSelectedCrowd] = useState<string>('all');
  const [selectedTravelStyle, setSelectedTravelStyle] = useState<string>('all');
  const [selectedMinRating, setSelectedMinRating] = useState<string>('0');
  const [sortBy, setSortBy] = useState<string>('recommended');

  // Mobile filters drawer toggle
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  // Detail Modal State
  const [activeModalDest, setActiveModalDest] = useState<DestinationItem | null>(null);
  const [modalWeather, setModalWeather] = useState<WeatherResponse | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Favourites state
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Travel Utility Tools Drawer/Section
  const [showUtilityTools, setShowUtilityTools] = useState(false);
  const [originQuery, setOriginQuery] = useState('Delhi');
  const [directions, setDirections] = useState<DirectionsResponse | null>(null);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);
  const [currAmount, setCurrAmount] = useState('100');
  const [currFrom, setCurrFrom] = useState('USD');
  const [currTo, setCurrTo] = useState('INR');
  const [convertedResult, setConvertedResult] = useState<number | null>(null);
  const [isLoadingCurr, setIsLoadingCurr] = useState(false);

  // Load user favourites on mount
  useEffect(() => {
    if (isAuthenticated) {
      favouriteService
        .listFavourites()
        .then((res) => {
          const ids = new Set<string>();
          res.items.forEach((item) => {
            if (item.place_id) ids.add(item.place_id);
            if (item.name) ids.add(item.name.toLowerCase());
          });
          setFavouriteIds(ids);
        })
        .catch(() => {});
    } else {
      // Local storage guest favourites
      try {
        const stored = localStorage.getItem('paryatak_guest_favourites');
        if (stored) {
          setFavouriteIds(new Set(JSON.parse(stored)));
        }
      } catch {}
    }
  }, [isAuthenticated]);

  // Open initial destination modal if slug in URL
  useEffect(() => {
    if (initialPlaceSlug) {
      const match = DESTINATIONS_DATA.find(
        (d) => d.slug === initialPlaceSlug || d.id === initialPlaceSlug
      );
      if (match) {
        setActiveModalDest(match);
      }
    }
  }, [initialPlaceSlug]);

  // Fetch live weather when modal opens
  useEffect(() => {
    if (!activeModalDest) {
      setModalWeather(null);
      return;
    }
    let cancelled = false;
    setIsLoadingWeather(true);
    travelDataService
      .getWeather(activeModalDest.latitude, activeModalDest.longitude)
      .then((w) => {
        if (!cancelled) setModalWeather(w);
      })
      .catch(() => {
        if (!cancelled) setModalWeather(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingWeather(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeModalDest]);

  // Unique States list for filter dropdown
  const uniqueStates = useMemo(() => {
    const states = Array.from(new Set(DESTINATIONS_DATA.map((d) => d.state))).filter(Boolean);
    return states.sort((a, b) => a.localeCompare(b));
  }, []);

  // Filter & Sort Destination Items dynamically
  const filteredDestinations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const matches = DESTINATIONS_DATA.filter((dest) => {
      // 1. Text Search across name, state, country, summary, categories, and highlights
      if (q) {
        const inName = dest.name.toLowerCase().includes(q);
        const inState = dest.state.toLowerCase().includes(q);
        const inCountry = dest.country.toLowerCase().includes(q);
        const inSummary = dest.summary.toLowerCase().includes(q);
        const inCategories = dest.categories.some((c) => c.toLowerCase().includes(q));
        const inHighlights = dest.highlights.some((h) => h.toLowerCase().includes(q));
        if (!inName && !inState && !inCountry && !inSummary && !inCategories && !inHighlights) {
          return false;
        }
      }

      // 2. State filter
      if (selectedState !== 'all' && dest.state !== selectedState) {
        return false;
      }

      // 3. Category filter
      if (selectedCategory !== 'all') {
        if (!dest.categories.includes(selectedCategory as any)) {
          return false;
        }
      }

      // 4. Budget filter
      if (selectedBudget !== 'any') {
        if (selectedBudget === '5000' && dest.estimated_cost > 5000) return false;
        if (selectedBudget === '12000' && (dest.estimated_cost <= 5000 || dest.estimated_cost > 12000))
          return false;
        if (selectedBudget === '25000' && (dest.estimated_cost <= 12000 || dest.estimated_cost > 25000))
          return false;
        if (selectedBudget === 'luxury' && dest.estimated_cost <= 25000) return false;
      }

      // 5. Crowd level filter
      if (selectedCrowd !== 'all' && dest.crowd_level !== selectedCrowd) {
        return false;
      }

      // 6. Travel style filter
      if (selectedTravelStyle !== 'all') {
        if (!dest.travel_styles.includes(selectedTravelStyle as any)) {
          return false;
        }
      }

      // 7. Minimum rating filter
      const minRating = parseFloat(selectedMinRating);
      if (minRating > 0 && dest.rating < minRating) {
        return false;
      }

      return true;
    });

    // Sort Results
    const sorted = [...matches];
    switch (sortBy) {
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'cost_asc':
        sorted.sort((a, b) => a.estimated_cost - b.estimated_cost);
        break;
      case 'cost_desc':
        sorted.sort((a, b) => b.estimated_cost - a.estimated_cost);
        break;
      case 'popular':
        sorted.sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0));
        break;
      case 'recommended':
      default:
        sorted.sort((a, b) => {
          const scoreA = a.rating * 20 - (a.crowd_level === 'High' ? 10 : 0);
          const scoreB = b.rating * 20 - (b.crowd_level === 'High' ? 10 : 0);
          return scoreB - scoreA;
        });
        break;
    }

    return sorted;
  }, [
    searchQuery,
    selectedState,
    selectedCategory,
    selectedBudget,
    selectedCrowd,
    selectedTravelStyle,
    selectedMinRating,
    sortBy,
  ]);

  // Count active filters for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedState !== 'all') count++;
    if (selectedCategory !== 'all') count++;
    if (selectedBudget !== 'any') count++;
    if (selectedCrowd !== 'all') count++;
    if (selectedTravelStyle !== 'all') count++;
    if (selectedMinRating !== '0') count++;
    return count;
  }, [
    selectedState,
    selectedCategory,
    selectedBudget,
    selectedCrowd,
    selectedTravelStyle,
    selectedMinRating,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedState('all');
    setSelectedCategory('all');
    setSelectedBudget('any');
    setSelectedCrowd('all');
    setSelectedTravelStyle('all');
    setSelectedMinRating('0');
    setSortBy('recommended');
    setSearchParams({});
  };

  // Toggle Favourite
  const handleToggleFavourite = async (e: React.MouseEvent, dest: DestinationItem) => {
    e.stopPropagation();
    const isFav = favouriteIds.has(dest.id) || favouriteIds.has(dest.name.toLowerCase());

    if (!isAuthenticated) {
      // Guest local storage fallback
      const updated = new Set(favouriteIds);
      if (isFav) {
        updated.delete(dest.id);
        updated.delete(dest.name.toLowerCase());
        setFeedbackMessage(`Removed ${dest.name} from saved.`);
      } else {
        updated.add(dest.id);
        setFeedbackMessage(`Saved ${dest.name} to your wishlist.`);
      }
      setFavouriteIds(updated);
      localStorage.setItem('paryatak_guest_favourites', JSON.stringify(Array.from(updated)));
      setTimeout(() => setFeedbackMessage(null), 3000);
      return;
    }

    try {
      if (isFav) {
        const updated = new Set(favouriteIds);
        updated.delete(dest.id);
        updated.delete(dest.name.toLowerCase());
        setFavouriteIds(updated);
        setFeedbackMessage(`Removed ${dest.name} from saved.`);
      } else {
        await favouriteService.addFavourite({
          name: dest.name,
          category: 'destination',
          place_id: dest.id,
          latitude: dest.latitude,
          longitude: dest.longitude,
          address: `${dest.state}, India`,
          photo_url: dest.image,
          notes: `${dest.state}, India • ${dest.summary}`,
        });
        const updated = new Set(favouriteIds);
        updated.add(dest.id);
        setFavouriteIds(updated);
        setFeedbackMessage(`Saved ${dest.name} to your favourites.`);
      }
    } catch {
      setFeedbackMessage('Failed to update favourite.');
    }
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Navigate to /plan-trip with selected destination
  const handlePlanTrip = (dest: DestinationItem) => {
    const fullDest = `${dest.name}, ${dest.state}, ${dest.country}`;
    navigate(`/plan-trip?destination=${encodeURIComponent(fullDest)}`);
  };

  // Calculate driving directions (Utility Tool)
  const handleCalculateDirections = async () => {
    if (!activeModalDest || !originQuery.trim()) return;
    setIsLoadingDirections(true);
    setDirections(null);
    try {
      const originPlaces = await travelDataService.searchDestinations(originQuery, 1);
      if (!originPlaces || originPlaces.length === 0) {
        throw new Error(`Could not find coordinates for origin: "${originQuery}"`);
      }
      const origin = originPlaces[0];
      const res = await travelDataService.getDirections({
        coordinates: [
          [origin.longitude, origin.latitude],
          [activeModalDest.longitude, activeModalDest.latitude],
        ],
      });
      setDirections(res);
    } catch (err: any) {
      setFeedbackMessage(err?.message || 'Could not calculate driving directions.');
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setIsLoadingDirections(false);
    }
  };

  // Currency Converter (Utility Tool)
  const handleConvertCurrency = async () => {
    const val = parseFloat(currAmount);
    if (isNaN(val) || val <= 0) return;
    setIsLoadingCurr(true);
    try {
      const res = await travelDataService.convertCurrency(currFrom, currTo, val);
      setConvertedResult(res.converted_amount);
    } catch {
      setFeedbackMessage('Exchange rate service temporarily unavailable.');
      setTimeout(() => setFeedbackMessage(null), 3000);
    } finally {
      setIsLoadingCurr(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-main, #F7F5EF)',
        minHeight: '100vh',
        paddingBottom: 80,
      }}
    >
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--color-primary, #183D32)',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: 30,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(24, 61, 50, 0.25)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Check size={16} />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* PART 1.1: PAGE HEADER */}
      <section
        style={{
          padding: '60px 24px 36px 24px',
          maxWidth: 1240,
          margin: '0 auto',
        }}
      >
        <div style={{ maxWidth: 760 }}>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2.4rem, 5vw, 3.4rem)',
              fontWeight: 800,
              color: 'var(--color-primary, #183D32)',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              marginBottom: 12,
            }}
          >
            Explore Destinations
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(1rem, 2vw, 1.15rem)',
              color: 'var(--color-graphite, #53635B)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Discover extraordinary places, hidden gems and experiences waiting to be explored.
          </p>
        </div>

        {/* PART 1.2: PROMINENT SEARCH BAR & FILTER TOGGLE */}
        <div
          style={{
            marginTop: 32,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
          }}
        >
          {/* Main Search Input */}
          <div
            style={{
              flex: '1 1 320px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={19}
              style={{
                position: 'absolute',
                left: 16,
                color: 'var(--color-primary, #183D32)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destinations, states or experiences..."
              style={{
                width: '100%',
                padding: '13px 40px 13px 48px',
                borderRadius: 14,
                border: '1.5px solid var(--color-divider-gray, #D8D4C7)',
                backgroundColor: '#ffffff',
                fontSize: 15,
                color: 'var(--color-text-primary, #26332E)',
                outline: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              className="explore-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 14,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-graphite, #53635B)',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Toggle Button (For mobile/responsive drawers) */}
          <button
            type="button"
            onClick={() => setShowFiltersDrawer((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              borderRadius: 14,
              border: '1.5px solid var(--color-primary, #183D32)',
              backgroundColor: showFiltersDrawer
                ? 'var(--color-primary, #183D32)'
                : 'transparent',
              color: showFiltersDrawer ? '#ffffff' : 'var(--color-primary, #183D32)',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <SlidersHorizontal size={16} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span
                style={{
                  backgroundColor: showFiltersDrawer
                    ? '#ffffff'
                    : 'var(--color-terracotta, #D97745)',
                  color: showFiltersDrawer ? 'var(--color-primary, #183D32)' : '#ffffff',
                  fontSize: 11,
                  fontWeight: 800,
                  borderRadius: 10,
                  padding: '2px 7px',
                  marginLeft: 2,
                }}
              >
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sort By Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort destinations"
              style={{
                height: 48,
                padding: '0 36px 0 16px',
                borderRadius: 14,
                border: '1.5px solid var(--color-divider-gray, #D8D4C7)',
                backgroundColor: '#ffffff',
                color: 'var(--color-text-primary, #26332E)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                backgroundImage:
                  'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23183D32%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '16px',
              }}
            >
              <option value="recommended">Recommended</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rating</option>
              <option value="cost_asc">Lowest Budget</option>
              <option value="cost_desc">Highest Budget</option>
            </select>
          </div>
        </div>

        {/* PART 1.3: ADVANCED FILTERS PANEL */}
        <div
          style={{
            marginTop: 18,
            backgroundColor: '#ffffff',
            borderRadius: 18,
            border: '1px solid var(--color-divider-gray, #D8D4C7)',
            padding: 20,
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            display: showFiltersDrawer ? 'grid' : 'none',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
            gap: 16,
          }}
          className={`advanced-filters-panel ${showFiltersDrawer ? 'is-open' : ''}`}
        >
          {/* Filter 1: State */}
          <div>
            <label
              htmlFor="filter-state"
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--color-graphite, #53635B)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              State
            </label>
            <select
              id="filter-state"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                padding: '0 12px',
                borderRadius: 10,
                border: '1px solid var(--color-divider-gray, #D8D4C7)',
                backgroundColor: 'var(--color-bg-main, #F7F5EF)',
                fontSize: 14,
                color: 'var(--color-text-primary, #26332E)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All States</option>
              {uniqueStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: Category */}
          <div>
            <label
              htmlFor="filter-category"
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--color-graphite, #53635B)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Category
            </label>
            <select
              id="filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                padding: '0 12px',
                borderRadius: 10,
                border: '1px solid var(--color-divider-gray, #D8D4C7)',
                backgroundColor: 'var(--color-bg-main, #F7F5EF)',
                fontSize: 14,
                color: 'var(--color-text-primary, #26332E)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Categories</option>
              <option value="Mountains">Mountains</option>
              <option value="Beaches">Beaches</option>
              <option value="Heritage">Heritage</option>
              <option value="Religious">Religious</option>
              <option value="Nature">Nature</option>
              <option value="Adventure">Adventure</option>
              <option value="Wildlife">Wildlife</option>
              <option value="Cities">Cities</option>
            </select>
          </div>

          {/* Filter 3: Budget */}
          <div>
            <label
              htmlFor="filter-budget"
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--color-graphite, #53635B)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Budget
            </label>
            <select
              id="filter-budget"
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                padding: '0 12px',
                borderRadius: 10,
                border: '1px solid var(--color-divider-gray, #D8D4C7)',
                backgroundColor: 'var(--color-bg-main, #F7F5EF)',
                fontSize: 14,
                color: 'var(--color-text-primary, #26332E)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="any">Any Budget</option>
              <option value="5000">Budget (Under ₹5,000)</option>
              <option value="12000">Moderate (₹5,000 – ₹12,000)</option>
              <option value="25000">Premium (₹12,000 – ₹25,000)</option>
              <option value="luxury">Luxury (₹25,000+)</option>
            </select>
          </div>

          {/* Filter 4: Crowd Level */}
          <div>
            <label
              htmlFor="filter-crowd"
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--color-graphite, #53635B)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Crowd Level
            </label>
            <select
              id="filter-crowd"
              value={selectedCrowd}
              onChange={(e) => setSelectedCrowd(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                padding: '0 12px',
                borderRadius: 10,
                border: '1px solid var(--color-divider-gray, #D8D4C7)',
                backgroundColor: 'var(--color-bg-main, #F7F5EF)',
                fontSize: 14,
                color: 'var(--color-text-primary, #26332E)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">Any Crowd</option>
              <option value="Low">Low Crowd</option>
              <option value="Moderate">Moderate Crowd</option>
              <option value="High">Popular / High Crowd</option>
            </select>
          </div>

          {/* Filter 5: Travel Style */}
          <div>
            <label
              htmlFor="filter-style"
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--color-graphite, #53635B)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Travel Style
            </label>
            <select
              id="filter-style"
              value={selectedTravelStyle}
              onChange={(e) => setSelectedTravelStyle(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                padding: '0 12px',
                borderRadius: 10,
                border: '1px solid var(--color-divider-gray, #D8D4C7)',
                backgroundColor: 'var(--color-bg-main, #F7F5EF)',
                fontSize: 14,
                color: 'var(--color-text-primary, #26332E)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">Any Style</option>
              <option value="Solo">Solo Traveler</option>
              <option value="Couple">Couple / Romantic</option>
              <option value="Family">Family Friendly</option>
              <option value="Friends">Friends & Group</option>
              <option value="Adventure">Adventure Enthusiast</option>
            </select>
          </div>

          {/* Filter 6: Minimum Rating */}
          <div>
            <label
              htmlFor="filter-rating"
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--color-graphite, #53635B)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Minimum Rating
            </label>
            <select
              id="filter-rating"
              value={selectedMinRating}
              onChange={(e) => setSelectedMinRating(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                padding: '0 12px',
                borderRadius: 10,
                border: '1px solid var(--color-divider-gray, #D8D4C7)',
                backgroundColor: 'var(--color-bg-main, #F7F5EF)',
                fontSize: 14,
                color: 'var(--color-text-primary, #26332E)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="0">Any Rating</option>
              <option value="3.0">3.0+ Stars</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.8">4.8+ Stars</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips & Counter */}
        <div
          style={{
            marginTop: 18,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--color-text-primary, #26332E)',
              }}
            >
              {filteredDestinations.length}{' '}
              {filteredDestinations.length === 1 ? 'destination' : 'destinations'} match
              {filteredDestinations.length > 0 &&
                ` · starting from ₹${Math.min(...filteredDestinations.map((d) => d.estimated_cost)).toLocaleString('en-IN')}`}
            </span>

            {/* Render active chips */}
            {selectedState !== 'all' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 10px',
                  borderRadius: 20,
                  backgroundColor: 'var(--color-primary-subtle, rgba(24, 61, 50, 0.08))',
                  color: 'var(--color-primary, #183D32)',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                State: {selectedState}
                <button
                  type="button"
                  onClick={() => setSelectedState('all')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <X size={13} />
                </button>
              </span>
            )}

            {selectedCategory !== 'all' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 10px',
                  borderRadius: 20,
                  backgroundColor: 'var(--color-primary-subtle, rgba(24, 61, 50, 0.08))',
                  color: 'var(--color-primary, #183D32)',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Category: {selectedCategory}
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <X size={13} />
                </button>
              </span>
            )}

            {selectedBudget !== 'any' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 10px',
                  borderRadius: 20,
                  backgroundColor: 'var(--color-primary-subtle, rgba(24, 61, 50, 0.08))',
                  color: 'var(--color-primary, #183D32)',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Budget:{' '}
                {selectedBudget === '5000'
                  ? 'Under ₹5k'
                  : selectedBudget === '12000'
                    ? '₹5k–₹12k'
                    : selectedBudget === '25000'
                      ? '₹12k–₹25k'
                      : 'Luxury'}
                <button
                  type="button"
                  onClick={() => setSelectedBudget('any')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <X size={13} />
                </button>
              </span>
            )}

            {selectedCrowd !== 'all' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 10px',
                  borderRadius: 20,
                  backgroundColor: 'var(--color-primary-subtle, rgba(24, 61, 50, 0.08))',
                  color: 'var(--color-primary, #183D32)',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Crowd: {selectedCrowd}
                <button
                  type="button"
                  onClick={() => setSelectedCrowd('all')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <X size={13} />
                </button>
              </span>
            )}

            {selectedTravelStyle !== 'all' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 10px',
                  borderRadius: 20,
                  backgroundColor: 'var(--color-primary-subtle, rgba(24, 61, 50, 0.08))',
                  color: 'var(--color-primary, #183D32)',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Style: {selectedTravelStyle}
                <button
                  type="button"
                  onClick={() => setSelectedTravelStyle('all')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <X size={13} />
                </button>
              </span>
            )}
          </div>

          {(activeFiltersCount > 0 || searchQuery) && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-terracotta, #D97745)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Reset all filters
            </button>
          )}
        </div>
      </section>

      {/* PART 1.4: DESTINATION CARDS RESPONSIVE GRID */}
      <main
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '0 clamp(12px, 3.5vw, 24px)',
        }}
      >
        {filteredDestinations.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 270px), 1fr))',
              gap: 24,
            }}
          >
            {filteredDestinations.map((dest) => {
              const isFav =
                favouriteIds.has(dest.id) || favouriteIds.has(dest.name.toLowerCase());
              const crowdBadgeColor =
                dest.crowd_level === 'Low'
                  ? '#2E7D32'
                  : dest.crowd_level === 'Moderate'
                    ? '#D97745'
                    : '#C62828';
              const crowdBadgeBg =
                dest.crowd_level === 'Low'
                  ? 'rgba(46, 125, 50, 0.12)'
                  : dest.crowd_level === 'Moderate'
                    ? 'rgba(217, 119, 69, 0.12)'
                    : 'rgba(198, 40, 40, 0.12)';

              return (
                <article
                  key={dest.id}
                  onClick={() => setActiveModalDest(dest)}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 20,
                    border: '1px solid var(--color-divider-gray, #D8D4C7)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  }}
                  className="destination-card-item"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow =
                      '0 14px 28px rgba(24, 61, 50, 0.1), 0 4px 10px rgba(0,0,0,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)';
                  }}
                >
                  {/* Card Image Container */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '16/10',
                      overflow: 'hidden',
                      backgroundColor: '#e6e4dc',
                    }}
                  >
                    <img
                      src={dest.image}
                      alt={`${dest.name}, ${dest.state}`}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease',
                      }}
                      className="destination-card-img"
                    />

                    {/* Top Badges */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        right: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        zIndex: 2,
                      }}
                    >
                      {/* Crowd Badge */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          borderRadius: 20,
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          color: crowdBadgeColor,
                          fontSize: 11,
                          fontWeight: 700,
                          backdropFilter: 'blur(4px)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        }}
                      >
                        <Users size={12} />
                        {dest.crowd_level} crowd
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {/* Rating Badge */}
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            padding: '4px 8px',
                            borderRadius: 20,
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            color: 'var(--color-text-primary, #26332E)',
                            fontSize: 12,
                            fontWeight: 800,
                            backdropFilter: 'blur(4px)',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          }}
                        >
                          <Star size={12} fill="#D97745" color="#D97745" />
                          {dest.rating.toFixed(1)}
                        </span>

                        {/* Favourite Bookmark Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavourite(e, dest)}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isFav ? '#D9383A' : 'var(--color-graphite, #53635B)',
                            backdropFilter: 'blur(4px)',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                            transition: 'transform 0.2s, color 0.2s',
                          }}
                          aria-label={isFav ? 'Remove from saved' : 'Save to favourites'}
                        >
                          <Heart size={15} fill={isFav ? '#D9383A' : 'none'} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div
                    style={{
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      {/* Name & Location */}
                      <h3
                        style={{
                          fontSize: 19,
                          fontWeight: 800,
                          color: 'var(--color-text-primary, #26332E)',
                          margin: '0 0 4px 0',
                          lineHeight: 1.25,
                        }}
                      >
                        {dest.name}
                      </h3>

                      <p
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 13,
                          color: 'var(--color-graphite, #53635B)',
                          margin: '0 0 10px 0',
                          fontWeight: 500,
                        }}
                      >
                        <MapPin size={13} color="var(--color-primary, #183D32)" />
                        {dest.state}, {dest.country}
                      </p>

                      {/* Summary */}
                      <p
                        style={{
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: 'var(--color-graphite, #53635B)',
                          margin: '0 0 14px 0',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {dest.summary}
                      </p>

                      {/* Category Tags */}
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 6,
                          marginBottom: 16,
                        }}
                      >
                        {dest.categories.slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 6,
                              backgroundColor: 'var(--color-bg-alt, #E8E4D9)',
                              color: 'var(--color-primary, #183D32)',
                            }}
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Bar: Price & Explore CTA */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 14,
                        borderTop: '1px solid var(--color-divider-gray, #D8D4C7)',
                        marginTop: 'auto',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Wallet size={16} color="var(--color-primary, #183D32)" />
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: 'var(--color-text-primary, #26332E)',
                          }}
                        >
                          ₹{dest.estimated_cost.toLocaleString('en-IN')}{' '}
                          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-graphite)' }}>
                            approx
                          </span>
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--color-primary, #183D32)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        Details <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Empty Search / Filters State */
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              backgroundColor: '#ffffff',
              borderRadius: 20,
              border: '1.5px dashed var(--color-divider-gray, #D8D4C7)',
              maxWidth: 540,
              margin: '20px auto',
            }}
          >
            <Compass
              size={48}
              style={{
                color: 'var(--color-terracotta, #D97745)',
                margin: '0 auto 16px auto',
              }}
            />
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--color-primary, #183D32)',
                marginBottom: 8,
              }}
            >
              No destinations found
            </h2>
            <p
              style={{
                fontSize: 14,
                color: 'var(--color-graphite, #53635B)',
                lineHeight: 1.6,
                marginBottom: 20,
              }}
            >
              No places currently match your specific filters. Try searching a different state (e.g.
              Himachal, Rajasthan or Kerala) or clearing active filters.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                padding: '10px 22px',
                borderRadius: 12,
                border: '1.5px solid var(--color-primary, #183D32)',
                backgroundColor: 'var(--color-primary, #183D32)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Reset All Filters
            </button>
          </div>
        )}
      </main>

      {/* PART 1.5: DESTINATION DETAILS MODAL VIEW */}
      {activeModalDest && (
        <div
          className="modal-backdrop"
          onClick={() => setActiveModalDest(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(24, 61, 50, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            overflowY: 'auto',
          }}
        >
          <div
            className="modal-surface"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              maxWidth: 860,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Hero Image */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 320,
                backgroundColor: '#183D32',
                overflow: 'hidden',
                borderRadius: '24px 24px 0 0',
              }}
            >
              <img
                src={activeModalDest.image}
                alt={activeModalDest.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.7) 100%)',
                }}
              />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveModalDest(null)}
                style={{
                  position: 'absolute',
                  top: 18,
                  right: 18,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                  transition: 'background-color 0.2s',
                }}
                aria-label="Close details"
              >
                <X size={18} />
              </button>

              {/* Title & Location inside Hero */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 20,
                  left: 'clamp(16px, 3.5vw, 28px)',
                  right: 'clamp(16px, 3.5vw, 28px)',
                  color: '#ffffff',
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    backgroundColor: 'var(--color-terracotta, #D97745)',
                    padding: '3px 10px',
                    borderRadius: 20,
                  }}
                >
                  {activeModalDest.categories[0]}
                </span>
                <h2
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                    fontWeight: 800,
                    margin: '8px 0 4px 0',
                    lineHeight: 1.2,
                  }}
                >
                  {activeModalDest.name}
                </h2>
                <p style={{ margin: 0, fontSize: 15, opacity: 0.9, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={16} />
                  {activeModalDest.state}, {activeModalDest.country}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 'clamp(18px, 3.5vw, 28px) clamp(16px, 3.5vw, 32px)' }}>
              {/* Snapshot Quick Badges */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 110px), 1fr))',
                  gap: 12,
                  marginBottom: 24,
                  padding: 16,
                  backgroundColor: 'var(--color-bg-main, #F7F5EF)',
                  borderRadius: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-graphite)' }}>RATING</div>
                  <div style={{ fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Star size={15} fill="#D97745" color="#D97745" />
                    {activeModalDest.rating} / 5
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-graphite)' }}>BUDGET</div>
                  <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>
                    ₹{activeModalDest.estimated_cost.toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-graphite)' }}>DURATION</div>
                  <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>
                    {activeModalDest.recommended_days} Days
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-graphite)' }}>BEST TIME</div>
                  <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2 }}>
                    {activeModalDest.best_time}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-graphite)' }}>CROWD</div>
                  <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2, color: 'var(--color-primary)' }}>
                    {activeModalDest.crowd_level}
                  </div>
                </div>
              </div>

              {/* Overview & Description */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 8 }}>
                  About {activeModalDest.name}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--color-text-primary, #26332E)', margin: 0 }}>
                  {activeModalDest.description}
                </p>
              </div>

              {/* Photo Gallery */}
              {activeModalDest.gallery && activeModalDest.gallery.length > 1 && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                    Destination Gallery
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 10 }}>
                    {activeModalDest.gallery.map((imgUrl, i) => (
                      <img
                        key={i}
                        src={imgUrl}
                        alt={`${activeModalDest.name} gallery ${i + 1}`}
                        style={{
                          width: '100%',
                          height: 120,
                          objectFit: 'cover',
                          borderRadius: 12,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Top Attractions & Highlights */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 20, marginBottom: 24 }}>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 10 }}>
                    Top Attractions & Things to Do
                  </h4>
                  <ul style={{ paddingLeft: 18, margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--color-graphite)' }}>
                    {activeModalDest.highlights.map((h, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 10 }}>
                    Local Experiences & Food
                  </h4>
                  <ul style={{ paddingLeft: 18, margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--color-graphite)' }}>
                    {activeModalDest.local_experiences.map((exp, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>
                        {exp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Travel Tips */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  backgroundColor: 'rgba(217, 119, 69, 0.08)',
                  border: '1px solid rgba(217, 119, 69, 0.25)',
                  marginBottom: 24,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-terracotta, #D97745)', marginBottom: 6 }}>
                  LOCAL TRAVEL TIPS
                </div>
                <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: 'var(--color-text-primary)' }}>
                  {activeModalDest.travel_tips.map((tip, i) => (
                    <li key={i} style={{ marginBottom: 3 }}>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Live Weather Forecast Integration */}
              <div
                style={{
                  padding: 18,
                  borderRadius: 16,
                  backgroundColor: 'var(--color-bg-main, #F7F5EF)',
                  border: '1px solid var(--color-divider-gray, #D8D4C7)',
                  marginBottom: 28,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CloudSun size={20} color="var(--color-primary, #183D32)" />
                    <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-primary, #183D32)' }}>
                      Live Weather Forecast
                    </span>
                  </div>
                  {modalWeather && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {modalWeather.current?.temperature ?? modalWeather.forecast_days?.[0]?.max_temp_c ?? 24}°C •{' '}
                      {modalWeather.current?.condition ?? modalWeather.forecast_days?.[0]?.condition ?? 'Clear'}
                    </span>
                  )}
                </div>

                {isLoadingWeather ? (
                  <p style={{ fontSize: 13, color: 'var(--color-graphite)', margin: 0 }}>
                    Fetching 7-day weather from Open-Meteo gateway...
                  </p>
                ) : modalWeather && modalWeather.forecast_days ? (
                  <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
                    {modalWeather.forecast_days.slice(0, 5).map((f) => (
                      <div
                        key={f.date}
                        style={{
                          flex: '0 0 100px',
                          padding: '10px 8px',
                          borderRadius: 10,
                          backgroundColor: '#ffffff',
                          textAlign: 'center',
                          border: '1px solid var(--color-divider-gray, #D8D4C7)',
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-graphite)' }}>
                          {new Date(f.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, margin: '4px 0', color: 'var(--color-primary)' }}>
                          {f.max_temp_c}° / {f.min_temp_c}°
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-graphite)' }}>{f.condition}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--color-graphite)', margin: 0 }}>
                    Live weather available via Open-Meteo satellite feed.
                  </p>
                )}
              </div>

              {/* Nearby Destinations */}
              {activeModalDest.nearby_destinations && (
                <div style={{ marginBottom: 28 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-graphite)', display: 'block', marginBottom: 8 }}>
                    NEARBY DESTINATIONS & CIRCUITS
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {activeModalDest.nearby_destinations.map((nb) => (
                      <button
                        key={nb}
                        type="button"
                        onClick={() => {
                          const match = DESTINATIONS_DATA.find((d) => d.name.toLowerCase() === nb.toLowerCase());
                          if (match) {
                            setActiveModalDest(match);
                          } else {
                            setSearchQuery(nb);
                            setActiveModalDest(null);
                          }
                        }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          border: '1px solid var(--color-divider-gray, #D8D4C7)',
                          backgroundColor: '#ffffff',
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--color-primary, #183D32)',
                          cursor: 'pointer',
                        }}
                      >
                        {nb} →
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PRIMARY ACTION BUTTON: PLAN A TRIP TO THIS DESTINATION */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  alignItems: 'center',
                  paddingTop: 16,
                  borderTop: '1px solid var(--color-divider-gray, #D8D4C7)',
                }}
              >
                <button
                  type="button"
                  onClick={() => handlePlanTrip(activeModalDest)}
                  style={{
                    flex: '1 1 240px',
                    padding: '14px 28px',
                    borderRadius: 14,
                    border: 'none',
                    backgroundColor: 'var(--color-primary, #183D32)',
                    color: '#ffffff',
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    boxShadow: '0 6px 18px rgba(24, 61, 50, 0.25)',
                    transition: 'background-color 0.2s',
                  }}
                  className="btn-plan-trip-cta"
                >
                  <Sparkles size={18} />
                  <span>Plan a Trip to {activeModalDest.name}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleToggleFavourite(e, activeModalDest)}
                  style={{
                    padding: '14px 20px',
                    borderRadius: 14,
                    border: '1.5px solid var(--color-divider-gray, #D8D4C7)',
                    backgroundColor: '#ffffff',
                    color: 'var(--color-text-primary, #26332E)',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Heart
                    size={16}
                    fill={
                      favouriteIds.has(activeModalDest.id) ||
                      favouriteIds.has(activeModalDest.name.toLowerCase())
                        ? '#D9383A'
                        : 'none'
                    }
                    color={
                      favouriteIds.has(activeModalDest.id) ||
                      favouriteIds.has(activeModalDest.name.toLowerCase())
                        ? '#D9383A'
                        : 'currentColor'
                    }
                  />
                  <span>Save Destination</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal for Guests */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          defaultMode="login"
        />
      )}
    </div>
  );
};

export default ExplorePage;
