import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Car,
  Download,
  RefreshCw,
  Edit2,
  DollarSign,
  AlertTriangle,
  ShieldCheck,
  Check,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Loader2,
  AlertCircle,
  FileText,
  Share2,
  BookmarkPlus,
  CloudSun,
  Navigation,
  Globe,
  Compass,
  Plane,
  Train,
  Bus,
  Hotel,
  Utensils,
  Tag,
  Users,
} from 'lucide-react';
import { itineraryService } from '../services/itineraryService';
import { tripService } from '../services/tripService';
import { travelDataService } from '../services/travelDataService';
import {
  ItineraryResponse,
  TripResponse,
  BudgetBreakdownAnalysis,
  DayPlan,
  Activity,
  WeatherResponse,
  DirectionsResponse,
  CurrencyConvertResponse,
} from '../types/api';
import DayRegenerateModal from '../components/DayRegenerateModal';
import TripEditModal from '../components/TripEditModal';
import ChatDrawer from '../components/ChatDrawer';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../context/AuthContext';
/**
 * Currency Symbol helper
 */
export const getCurrencySymbol = (curr?: string): string => {
  if (!curr || curr === 'INR') return '₹';
  if (curr === 'USD') return '$';
  if (curr === 'EUR') return '€';
  if (curr === 'GBP') return '£';
  return curr;
};

/**
 * Robust cost resolver supporting camelCase, snake_case, string parsing,
 * nested transport fallbacks, and distinguishing genuine 0 from missing estimate.
 */
export const getActivityCost = (act: any): { cost: number | null; isFree: boolean; isMissing: boolean } => {
  if (!act) return { cost: null, isFree: false, isMissing: true };

  // 1. Direct activity cost checks (handles camelCase and snake_case)
  let raw = act.estimatedCost ?? act.estimated_cost ?? act.cost ?? act.price;

  // 2. If null, undefined, or empty string, check transport object
  if (raw === undefined || raw === null || raw === '') {
    if (act.transport) {
      raw = act.transport.estimatedCost ?? act.transport.estimated_cost ?? act.transport.cost ?? act.transport.price;
    }
  }

  if (raw === undefined || raw === null || raw === '') {
    return { cost: null, isFree: false, isMissing: true };
  }

  // 3. Convert numeric strings into numbers safely (stripping currency signs, commas, whitespace)
  let num: number;
  if (typeof raw === 'number') {
    num = raw;
  } else if (typeof raw === 'string') {
    const cleaned = raw.replace(/[^0-9.-]/g, '');
    num = cleaned !== '' ? parseFloat(cleaned) : NaN;
  } else {
    num = NaN;
  }

  if (isNaN(num)) {
    return { cost: null, isFree: false, isMissing: true };
  }

  // 4. If direct cost is 0, check if transport has an actual cost (e.g. flight/taxi)
  if (num === 0 && act.transport) {
    const transRaw = act.transport.estimatedCost ?? act.transport.estimated_cost ?? act.transport.cost;
    if (transRaw !== undefined && transRaw !== null && transRaw !== '') {
      const transNum = typeof transRaw === 'number' ? transRaw : parseFloat(String(transRaw).replace(/[^0-9.-]/g, ''));
      if (!isNaN(transNum) && transNum > 0) {
        return { cost: transNum, isFree: false, isMissing: false };
      }
    }
  }

  // 5. Genuinely 0 (e.g. free monument entrance, public promenade)
  if (num === 0) {
    return { cost: 0, isFree: true, isMissing: false };
  }

  return { cost: num, isFree: false, isMissing: false };
};

/**
 * Format duration in minutes to human-readable string (e.g. "2 hours 30 minutes")
 */
export const formatJourneyDuration = (minutes?: number | null): string => {
  if (!minutes || minutes <= 0) return 'Estimated on departure';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) {
    return `${hrs} hour${hrs > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
  } else if (hrs > 0) {
    return `${hrs} hour${hrs > 1 ? 's' : ''}`;
  }
  return `${mins} minute${mins > 1 ? 's' : ''}`;
};

/**
 * Extract rich transportation details for relevant itinerary activities
 */
export const getTransportDetails = (act: any, startingCity?: string, destinationCity?: string) => {
  if (!act) return null;
  const trans = act.transport || {};
  const cat = (act.category || '').toLowerCase();
  const name = (act.name || '').toLowerCase();
  const desc = (act.description || '').toLowerCase();

  const isTransport =
    cat === 'transport' ||
    cat === 'transit' ||
    Boolean(trans.mode) ||
    name.includes('flight') ||
    name.includes('train') ||
    name.includes('bus') ||
    desc.includes('flight') ||
    desc.includes('train') ||
    desc.includes('bus');

  if (!isTransport && !trans.mode) return null;

  // Determine mode
  let mode = (trans.mode || '').toLowerCase();
  if (!mode) {
    if (name.includes('flight') || desc.includes('flight')) mode = 'flight';
    else if (name.includes('train') || desc.includes('train') || name.includes('rail')) mode = 'train';
    else if (name.includes('bus') || desc.includes('bus')) mode = 'bus';
    else if (name.includes('cab') || name.includes('taxi')) mode = 'taxi';
    else mode = 'transit';
  }

  // Duration
  const durationMinutes =
    trans.durationMinutes ?? trans.duration_minutes ?? act.durationMinutes ?? act.duration_minutes ?? null;

  // Fare
  let fare: number | null = null;
  const rawFare = trans.estimatedCost ?? trans.estimated_cost ?? trans.cost ?? act.estimatedCost ?? act.estimated_cost;
  if (rawFare !== undefined && rawFare !== null && rawFare !== '') {
    const num = typeof rawFare === 'number' ? rawFare : parseFloat(String(rawFare).replace(/[^0-9.-]/g, ''));
    if (!isNaN(num) && num > 0) fare = num;
  }

  // Start & Destination points
  let startPoint = trans.startPoint || trans.start_point;
  let endPoint = trans.destination || trans.end_point;

  if (!startPoint || !endPoint) {
    const arrowMatch = act.name.match(/(.+?)\s*(?:→|->|to)\s*(.+)/i);
    if (arrowMatch) {
      if (!startPoint) startPoint = arrowMatch[1].replace(/flight|train|bus|transit|express/gi, '').trim();
      if (!endPoint) endPoint = arrowMatch[2].trim();
    }
  }

  if (mode === 'flight' || mode === 'train' || mode === 'bus') {
    if (!startPoint && startingCity) startPoint = startingCity;
    if (!endPoint && destinationCity) endPoint = destinationCity;
  }

  const distanceMeters = trans.distanceMeters ?? trans.distance_meters;
  const distanceKm = distanceMeters ? Math.round(distanceMeters / 1000) : null;

  return {
    mode,
    durationMinutes,
    fare,
    startPoint,
    endPoint,
    distanceKm,
    details: trans.details,
  };
};

export const ItineraryViewPage: React.FC = () => {
  const { itineraryId } = useParams<{ itineraryId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [trip, setTrip] = useState<TripResponse | null>(null);
  const [budgetAnalysis, setBudgetAnalysis] = useState<BudgetBreakdownAnalysis | null>(null);

  // External travel data states (Open-Meteo, OSRM, ExchangeRate-API)
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [targetCurrency, setTargetCurrency] = useState<string>('USD');
  const [convertedBudget, setConvertedBudget] = useState<CurrencyConvertResponse | null>(null);
  const [isLoadingConversion, setIsLoadingConversion] = useState<boolean>(false);
  const [dayDirections, setDayDirections] = useState<DirectionsResponse | null>(null);
  const [isLoadingDirections, setIsLoadingDirections] = useState<boolean>(false);

  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Actions
  const [regenerateDayModal, setRegenerateDayModal] = useState<number | null>(null);
  const [showTripEditModal, setShowTripEditModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isRegeneratingFull, setIsRegeneratingFull] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Title edit inline
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  const loadData = async () => {
    if (!itineraryId) return;
    setIsLoading(true);
    setError(null);
    try {
      const itData = await itineraryService.getItinerary(itineraryId);
      setItinerary(itData);
      setEditedTitle(itData.title);

      // Load associated trip
      if (itData.trip_id) {
        try {
          const trData = await tripService.getTrip(itData.trip_id);
          setTrip(trData);
        } catch {
          // Trip might be accessible through itData directly
        }
      }

      // Load deterministic budget analysis
      try {
        const bAnalysis = await itineraryService.getBudgetAnalysis(itineraryId);
        setBudgetAnalysis(bAnalysis);
      } catch {
        // Fallback gracefully
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.detail ||
        'Could not load itinerary. Please verify you own this plan or are signed in.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [itineraryId]);

  // 1. Fetch live weather forecast for the destination (Open-Meteo)
  useEffect(() => {
    const destName = trip?.destination || (itinerary?.title ? itinerary.title.split(' ')[0] : '');
    if (!destName) return;

    let isMounted = true;
    const fetchWeather = async () => {
      setIsLoadingWeather(true);
      try {
        const places = await travelDataService.searchDestinations(destName, 1);
        if (places.length > 0 && isMounted) {
          const w = await travelDataService.getWeather(places[0].latitude, places[0].longitude);
          if (isMounted) setWeather(w);
        }
      } catch (e) {
        console.warn('Weather fetch failed:', e);
      } finally {
        if (isMounted) setIsLoadingWeather(false);
      }
    };
    fetchWeather();
    return () => {
      isMounted = false;
    };
  }, [trip?.destination, itinerary?.title]);

  // 2. Fetch live currency conversion for the budget (ExchangeRate-API)
  useEffect(() => {
    if (!budgetAnalysis?.total_estimated || !targetCurrency) return;
    if (targetCurrency === budgetAnalysis.currency) {
      setConvertedBudget(null);
      return;
    }

    let isMounted = true;
    const convert = async () => {
      setIsLoadingConversion(true);
      try {
        const res = await travelDataService.convertCurrency(
          budgetAnalysis.currency,
          targetCurrency,
          budgetAnalysis.total_estimated
        );
        if (isMounted) setConvertedBudget(res);
      } catch (e) {
        console.warn('Currency conversion failed:', e);
      } finally {
        if (isMounted) setIsLoadingConversion(false);
      }
    };
    convert();
    return () => {
      isMounted = false;
    };
  }, [budgetAnalysis?.total_estimated, budgetAnalysis?.currency, targetCurrency]);

  // 3. Calculate OSRM driving route for the active day's activities (Project OSRM)
  useEffect(() => {
    const activeDay = itinerary?.days?.find((d) => d.day_number === selectedDayNumber);
    if (!activeDay?.activities || activeDay.activities.length < 2) {
      setDayDirections(null);
      return;
    }

    let isMounted = true;
    const calcRoute = async () => {
      setIsLoadingDirections(true);
      try {
        const coords: number[][] = [];
        for (const act of activeDay.activities) {
          if (act.location?.latitude && act.location?.longitude) {
            coords.push([act.location.longitude, act.location.latitude]);
          }
        }

        if (coords.length >= 2) {
          const dir = await travelDataService.getDirections({ coordinates: coords });
          if (isMounted) setDayDirections(dir);
        } else {
          if (isMounted) setDayDirections(null);
        }
      } catch (e) {
        console.warn('Route calculation failed:', e);
        if (isMounted) setDayDirections(null);
      } finally {
        if (isMounted) setIsLoadingDirections(false);
      }
    };
    calcRoute();
    return () => {
      isMounted = false;
    };
  }, [selectedDayNumber, itinerary?.days]);

  const handleExportPdf = async () => {
    if (!itinerary) return;
    setIsExportingPdf(true);
    try {
      await itineraryService.exportPdf(
        itinerary.id,
        `${itinerary.title.replace(/[^a-zA-Z0-9]/g, '_')}_Itinerary.pdf`
      );
      setActionSuccess('PDF itinerary downloaded successfully!');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch {
      setError('PDF export failed. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!itinerary || !editedTitle.trim()) return;
    try {
      const updated = await itineraryService.patchItinerary(itinerary.id, {
        title: editedTitle.trim(),
      });
      setItinerary(updated);
      setIsEditingTitle(false);
      setActionSuccess('Itinerary title updated.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch {
      setError('Failed to update title.');
    }
  };

  const handleRegenerateEntireItinerary = async () => {
    if (!itinerary?.trip_id) return;
    const confirmed = window.confirm(
      'Are you sure you want to regenerate all days? This will rewrite the entire schedule with Groq AI.'
    );
    if (!confirmed) return;

    setIsRegeneratingFull(true);
    try {
      const regenerated = await itineraryService.generateItinerary({
        trip_id: itinerary.trip_id,
        regenerate: true,
      });
      setItinerary(regenerated);
      // Reload budget
      const bAnalysis = await itineraryService.getBudgetAnalysis(regenerated.id);
      setBudgetAnalysis(bAnalysis);
      setActionSuccess('Entire itinerary regenerated successfully!');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch {
      setError('Full regeneration failed.');
    } finally {
      setIsRegeneratingFull(false);
    }
  };

  const handleSaveToAccount = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    await claimItinerary();
  };

  const claimItinerary = async () => {
    if (!itinerary) return;
    setIsClaiming(true);
    try {
      const saved = await itineraryService.claimGuestItinerary(itinerary.id);
      setItinerary(saved);
      // Refresh associated trip
      if (saved.trip_id) {
        try {
          const trData = await tripService.getTrip(saved.trip_id);
          setTrip(trData);
        } catch {}
      }
      setActionSuccess('Itinerary saved to your account and added to My Trips!');
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Could not save itinerary to account. Please try again.';
      setError(msg);
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={36} className="spinner" style={{ margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-ink)' }}>Loading Journey Schedule...</h2>
          <p style={{ color: 'var(--color-graphite)', fontSize: 14 }}>Synchronizing with Supabase & Groq AI engine</p>
        </div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="main-content" style={{ padding: '60px 0' }}>
        <div className="container" style={{ maxWidth: 600 }}>
          <div className="state-empty" style={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-divider-gray)' }}>
            <AlertCircle size={40} color="var(--color-danger)" style={{ margin: '0 auto 12px auto' }} />
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Unable to Access Itinerary</h2>
            <p style={{ fontSize: 14, color: 'var(--color-graphite)', marginBottom: 20 }}>
              {error || 'This itinerary was not found or authorization was denied.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <Link to="/trips" className="btn-secondary">
                View My Trips
              </Link>
              <Link to="/create" className="btn-primary">
                Plan a New Trip
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Comprehensive Trip-Level Budget Calculation (strictly sum of activities across all days without double-counting)
  const tripBudgetSummary = useMemo(() => {
    if (!itinerary?.days) return null;

    const categories = {
      flights: 0,
      trainBus: 0,
      accommodation: 0,
      food: 0,
      localTransport: 0,
      activities: 0,
      miscellaneous: 0,
    };

    const hasItems = {
      flights: false,
      trainBus: false,
      accommodation: false,
      food: false,
      localTransport: false,
      activities: false,
      miscellaneous: false,
    };

    let totalTripCost = 0;
    let hasAnyCost = false;

    itinerary.days.forEach((day: any) => {
      (day.activities || []).forEach((act: any) => {
        const costInfo = getActivityCost(act);
        const cost = costInfo.cost ?? 0;
        if (costInfo.cost !== null) hasAnyCost = true;

        const cat = (act.category || '').toLowerCase();
        const name = (act.name || '').toLowerCase();
        const transMode = (act.transport?.mode || '').toLowerCase();

        // 1. Flights
        if (
          transMode === 'flight' ||
          transMode === 'plane' ||
          name.includes('flight') ||
          cat.includes('flight')
        ) {
          categories.flights += cost;
          hasItems.flights = true;
          totalTripCost += cost;
        }
        // 2. Train / Bus
        else if (
          transMode === 'train' ||
          transMode === 'bus' ||
          transMode === 'rail' ||
          name.includes('train') ||
          name.includes('bus') ||
          cat.includes('train') ||
          cat.includes('bus')
        ) {
          categories.trainBus += cost;
          hasItems.trainBus = true;
          totalTripCost += cost;
        }
        // 3. Accommodation
        else if (
          cat.includes('hotel') ||
          cat.includes('accommodation') ||
          cat.includes('stay') ||
          cat.includes('lodging') ||
          cat.includes('resort') ||
          name.includes('hotel') ||
          name.includes('resort') ||
          name.includes('check-in')
        ) {
          categories.accommodation += cost;
          hasItems.accommodation = true;
          totalTripCost += cost;
        }
        // 4. Food & Dining
        else if (
          cat.includes('food') ||
          cat.includes('dining') ||
          cat.includes('meal') ||
          cat.includes('restaurant') ||
          name.includes('dinner') ||
          name.includes('lunch') ||
          name.includes('breakfast') ||
          name.includes('cafe') ||
          name.includes('tasting')
        ) {
          categories.food += cost;
          hasItems.food = true;
          totalTripCost += cost;
        }
        // 5. Local Transportation
        else if (
          cat.includes('transport') ||
          cat.includes('transit') ||
          transMode === 'taxi' ||
          transMode === 'cab' ||
          transMode === 'auto' ||
          transMode === 'metro' ||
          name.includes('taxi') ||
          name.includes('cab') ||
          name.includes('transit')
        ) {
          categories.localTransport += cost;
          hasItems.localTransport = true;
          totalTripCost += cost;
        }
        // 6. Activities & Attractions
        else if (
          cat.includes('sightseeing') ||
          cat.includes('activity') ||
          cat.includes('cultural') ||
          cat.includes('adventure') ||
          name.includes('visit') ||
          name.includes('explore') ||
          name.includes('temple') ||
          name.includes('fort') ||
          name.includes('palace') ||
          name.includes('museum')
        ) {
          categories.activities += cost;
          hasItems.activities = true;
          totalTripCost += cost;

          // Non-duplication rule: only add transport leg if activity itself wasn't already transport!
          if (act.transport) {
            const transRaw = act.transport.estimatedCost ?? act.transport.estimated_cost;
            if (transRaw) {
              const transCost = typeof transRaw === 'number' ? transRaw : parseFloat(String(transRaw).replace(/[^0-9.-]/g, ''));
              if (!isNaN(transCost) && transCost > 0) {
                categories.localTransport += transCost;
                hasItems.localTransport = true;
                totalTripCost += transCost;
              }
            }
          }
        }
        // 7. Miscellaneous
        else {
          categories.miscellaneous += cost;
          hasItems.miscellaneous = true;
          totalTripCost += cost;
        }
      });
    });

    const travellersCount = Math.max(1, trip?.travellers || (trip as any)?.travelers_count || 1);
    const perPersonCost = Math.round(totalTripCost / travellersCount);
    const userBudget = trip?.budget ? Number(trip.budget) : null;
    const budgetRemaining = userBudget !== null ? userBudget - totalTripCost : null;
    const currency = itinerary.budget?.currency || trip?.currency || 'INR';

    return {
      totalTripCost,
      hasAnyCost,
      perPersonCost,
      travellersCount,
      userBudget,
      budgetRemaining,
      currency,
      categories,
      hasItems,
    };
  }, [itinerary, trip]);

  const selectedDay =
    itinerary.days?.find((d: any) => (d.day_number ?? d.dayNumber) === selectedDayNumber) ||
    itinerary.days?.[0] || { day_number: 1, date: '', activities: [] };

  const isGuestItinerary =
    itinerary.user_id === '00000000-0000-0000-0000-000000000000' ||
    !user ||
    itinerary.user_id !== user.id;

  return (
    <div className="main-content" style={{ padding: 'var(--spacing-32) 0' }}>
      <div className="container">
        {actionSuccess && (
          <div
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 1000,
              backgroundColor: 'var(--color-ink)',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: 'var(--radius-pills)',
              fontSize: 14,
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Check size={16} color="var(--color-success)" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-graphite)', marginBottom: 16 }}>
          <Link to="/" style={{ color: 'var(--color-graphite)' }}>Home</Link>
          <ChevronRight size={14} />
          <Link to="/trips" style={{ color: 'var(--color-graphite)' }}>My Trips</Link>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--color-ink)', fontWeight: 600 }}>{itinerary.title}</span>
        </div>

        {/* Guest Session Itinerary Banner */}
        {isGuestItinerary && (
          <div
            style={{
              backgroundColor: 'var(--surface-cloud-surface)',
              border: '1px solid var(--color-divider-gray)',
              borderRadius: 'var(--radius-cards)',
              padding: '16px 20px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-hopper-blue-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-hopper-blue)',
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-ink)' }}>
                  Guest Travel Plan (Temporary Browser Session)
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-graphite)' }}>
                  Save this itinerary to your personal account to permanently store it in My Trips.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveToAccount}
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: 13, gap: 6 }}
              disabled={isClaiming}
            >
              {isClaiming ? <Loader2 size={14} className="spinner" /> : <BookmarkPlus size={15} />}
              <span>{isClaiming ? 'Saving to Vault...' : 'Save to My Trips'}</span>
            </button>
          </div>
        )}

        {/* Top Header Card */}
        <div
          style={{
            backgroundColor: 'var(--surface-white-canvas)',
            border: '1px solid var(--color-divider-gray)',
            borderRadius: 'var(--radius-cards)',
            padding: 28,
            marginBottom: 28,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ maxWidth: 740 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className="badge badge-blue">
                  <Sparkles size={13} />
                  <span>Groq AI Generated</span>
                </span>
                <span className="badge badge-verified">
                  <ShieldCheck size={13} />
                  <span>Supabase Verified</span>
                </span>
              </div>

              {isEditingTitle ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    style={{ fontSize: 20, fontWeight: 700 }}
                  />
                  <button onClick={handleSaveTitle} className="btn-primary" style={{ padding: '8px 16px', fontSize: 14 }}>
                    Save
                  </button>
                  <button onClick={() => setIsEditingTitle(false)} className="btn-secondary" style={{ padding: '8px 14px', fontSize: 14 }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <h1
                  className="heading-app"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 28,
                    marginBottom: 8,
                  }}
                >
                  <span>{itinerary.title}</span>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    title="Edit title"
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-graphite)' }}
                  >
                    <Edit2 size={16} />
                  </button>
                </h1>
              )}

              {itinerary.summary && (
                <p style={{ fontSize: 15, color: 'var(--color-graphite)', lineHeight: 1.5 }}>
                  {itinerary.summary}
                </p>
              )}

              {/* Trip Metadata chips */}
              {trip && (
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14, fontSize: 13, color: 'var(--color-graphite)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={15} color="var(--color-hopper-blue)" />
                    <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{trip.destination}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={15} color="var(--color-hopper-blue)" />
                    <span>{trip.start_date} to {trip.end_date} ({trip.duration_days} days)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <DollarSign size={15} color="var(--color-hopper-blue)" />
                    <span>Budget Target: {trip.currency} {trip.budget.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Header Action Buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleExportPdf}
                className="btn-primary"
                style={{ padding: '9px 18px', fontSize: 14 }}
                disabled={isExportingPdf}
              >
                {isExportingPdf ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Export PDF</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRegenerateEntireItinerary}
                className="btn-secondary"
                style={{ padding: '9px 16px', fontSize: 14 }}
                disabled={isRegeneratingFull}
              >
                {isRegeneratingFull ? <Loader2 size={15} className="spinner" /> : <RefreshCw size={15} />}
                <span>Regenerate All</span>
              </button>

              {trip && (
                <button
                  type="button"
                  onClick={() => setShowTripEditModal(true)}
                  className="btn-secondary"
                  style={{ padding: '9px 14px', fontSize: 14 }}
                >
                  <Edit2 size={15} />
                  <span>Edit Trip</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Destination Weather Forecast Card (Open-Meteo) */}
        {weather && weather.forecast_days && weather.forecast_days.length > 0 && (
          <div
            style={{
              backgroundColor: 'var(--surface-cloud-surface)',
              border: '1px solid var(--color-divider-gray)',
              borderRadius: 'var(--radius-cards)',
              padding: '16px 20px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  color: 'var(--color-hopper-blue)',
                }}
              >
                <CloudSun size={24} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-graphite)', textTransform: 'uppercase' }}>
                  Live Weather Forecast • {trip?.destination || 'Destination'}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-ink)' }}>
                  {weather.forecast_days[0].condition} • High {Math.round(weather.forecast_days[0].max_temp_c)}°C / Low {Math.round(weather.forecast_days[0].min_temp_c)}°C
                </div>
              </div>
            </div>

            {/* 4-Day Mini Forecast */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {weather.forecast_days.slice(0, 4).map((f, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid var(--color-divider-gray)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    textAlign: 'center',
                    minWidth: 78,
                  }}
                >
                  <div style={{ fontSize: 11, color: 'var(--color-graphite)', fontWeight: 600 }}>
                    {idx === 0 ? 'Today' : f.date.slice(5)}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>
                    {Math.round(f.max_temp_c)}° / {Math.round(f.min_temp_c)}°
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-graphite)', textTransform: 'capitalize' }}>
                    {f.condition.split(' ')[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trip-Level Budget Summary & Category Breakdown */}
        {tripBudgetSummary && (
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--color-divider-gray, #D8D4C7)',
              borderRadius: 20,
              padding: 24,
              marginBottom: 28,
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            }}
          >
            {/* Header with Title and Target Status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
              <div>
                <h2
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 22,
                    fontWeight: 800,
                    color: 'var(--color-primary, #183D32)',
                    margin: '0 0 4px 0',
                  }}
                >
                  Trip Budget Summary & Expense Breakdown
                </h2>
                <p style={{ fontSize: 13, color: 'var(--color-graphite, #53635B)', margin: 0 }}>
                  Sum of verified activity costs across all itinerary days with zero duplicate transit fees.
                </p>
              </div>

              {tripBudgetSummary.userBudget !== null && (
                tripBudgetSummary.budgetRemaining !== null && tripBudgetSummary.budgetRemaining >= 0 ? (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: 20,
                      backgroundColor: 'rgba(24, 61, 50, 0.08)',
                      border: '1px solid var(--color-primary, #183D32)',
                      color: 'var(--color-primary, #183D32)',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    <ShieldCheck size={16} />
                    <span>
                      Within Budget • {getCurrencySymbol(tripBudgetSummary.currency)}{' '}
                      {Math.round(tripBudgetSummary.budgetRemaining).toLocaleString()} remaining
                    </span>
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: 20,
                      backgroundColor: 'rgba(217, 56, 58, 0.08)',
                      border: '1px solid var(--color-error, #D9383A)',
                      color: 'var(--color-error, #D9383A)',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    <AlertTriangle size={16} />
                    <span>
                      Exceeds Target by {getCurrencySymbol(tripBudgetSummary.currency)}{' '}
                      {Math.round(Math.abs(tripBudgetSummary.budgetRemaining || 0)).toLocaleString()}
                    </span>
                  </span>
                )
              )}
            </div>

            {/* Top Stat Highlights: Total Trip Budget & Per-Person Budget */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: 14,
                marginBottom: 20,
              }}
            >
              {/* Total Estimated Trip Cost */}
              <div
                style={{
                  backgroundColor: 'var(--color-bg-main, #F7F5EF)',
                  border: '1.5px solid var(--color-divider-gray, #D8D4C7)',
                  borderRadius: 14,
                  padding: '16px 18px',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--color-graphite, #53635B)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Trip Cost
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary, #183D32)', marginTop: 4 }}>
                  {tripBudgetSummary.hasAnyCost
                    ? `${getCurrencySymbol(tripBudgetSummary.currency)} ${tripBudgetSummary.totalTripCost.toLocaleString()}`
                    : 'Not estimated'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-graphite, #53635B)', marginTop: 2 }}>
                  Sum of all activities & transit
                </div>
              </div>

              {/* Per-Person Cost */}
              <div
                style={{
                  backgroundColor: 'var(--color-bg-main, #F7F5EF)',
                  border: '1.5px solid var(--color-divider-gray, #D8D4C7)',
                  borderRadius: 14,
                  padding: '16px 18px',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--color-graphite, #53635B)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Per-Person Estimated Budget
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-terracotta, #D97745)', marginTop: 4 }}>
                  {tripBudgetSummary.hasAnyCost
                    ? `${getCurrencySymbol(tripBudgetSummary.currency)} ${tripBudgetSummary.perPersonCost.toLocaleString()}`
                    : 'Not estimated'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-graphite, #53635B)', marginTop: 2 }}>
                  For {tripBudgetSummary.travellersCount} {tripBudgetSummary.travellersCount === 1 ? 'traveller' : 'travellers in party'}
                </div>
              </div>

              {/* Target Budget & Remaining */}
              {tripBudgetSummary.userBudget !== null && (
                <div
                  style={{
                    backgroundColor: 'var(--color-bg-main, #F7F5EF)',
                    border: '1.5px solid var(--color-divider-gray, #D8D4C7)',
                    borderRadius: 14,
                    padding: '16px 18px',
                  }}
                >
                  <div style={{ fontSize: 12, color: 'var(--color-graphite, #53635B)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Supplied Trip Budget
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text-primary, #26332E)', marginTop: 4 }}>
                    {getCurrencySymbol(tripBudgetSummary.currency)} {tripBudgetSummary.userBudget.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-graphite, #53635B)', marginTop: 2 }}>
                    {tripBudgetSummary.budgetRemaining !== null && tripBudgetSummary.budgetRemaining >= 0
                      ? `${getCurrencySymbol(tripBudgetSummary.currency)} ${Math.round(tripBudgetSummary.budgetRemaining).toLocaleString()} remaining`
                      : 'Target exceeded'}
                  </div>
                </div>
              )}
            </div>

            {/* 7 Separate Expense Categories */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary, #26332E)', marginBottom: 10 }}>
                Category-Wise Expense Breakdown
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 12,
                }}
              >
                {/* 1. Flights */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-divider-gray, #E8E4D9)', borderRadius: 12, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-graphite, #53635B)', fontWeight: 600 }}>
                    <Plane size={15} color="var(--color-primary, #183D32)" />
                    <span>Flights</span>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-primary, #183D32)', marginTop: 4 }}>
                    {tripBudgetSummary.hasItems.flights
                      ? `${getCurrencySymbol(tripBudgetSummary.currency)} ${tripBudgetSummary.categories.flights.toLocaleString()}`
                      : 'Not estimated'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-graphite, #53635B)', marginTop: 2 }}>Airfare</div>
                </div>

                {/* 2. Train / Bus */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-divider-gray, #E8E4D9)', borderRadius: 12, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-graphite, #53635B)', fontWeight: 600 }}>
                    <Train size={15} color="var(--color-primary, #183D32)" />
                    <span>Train / Bus</span>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-primary, #183D32)', marginTop: 4 }}>
                    {tripBudgetSummary.hasItems.trainBus
                      ? `${getCurrencySymbol(tripBudgetSummary.currency)} ${tripBudgetSummary.categories.trainBus.toLocaleString()}`
                      : 'Not estimated'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-graphite, #53635B)', marginTop: 2 }}>Intercity transit</div>
                </div>

                {/* 3. Accommodation */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-divider-gray, #E8E4D9)', borderRadius: 12, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-graphite, #53635B)', fontWeight: 600 }}>
                    <Hotel size={15} color="var(--color-primary, #183D32)" />
                    <span>Accommodation</span>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-primary, #183D32)', marginTop: 4 }}>
                    {tripBudgetSummary.hasItems.accommodation
                      ? `${getCurrencySymbol(tripBudgetSummary.currency)} ${tripBudgetSummary.categories.accommodation.toLocaleString()}`
                      : 'Not estimated'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-graphite, #53635B)', marginTop: 2 }}>Hotel & resorts</div>
                </div>

                {/* 4. Food */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-divider-gray, #E8E4D9)', borderRadius: 12, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-graphite, #53635B)', fontWeight: 600 }}>
                    <Utensils size={15} color="var(--color-primary, #183D32)" />
                    <span>Food & Dining</span>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-primary, #183D32)', marginTop: 4 }}>
                    {tripBudgetSummary.hasItems.food
                      ? `${getCurrencySymbol(tripBudgetSummary.currency)} ${tripBudgetSummary.categories.food.toLocaleString()}`
                      : 'Not estimated'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-graphite, #53635B)', marginTop: 2 }}>Meals & tastings</div>
                </div>

                {/* 5. Local Transportation */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-divider-gray, #E8E4D9)', borderRadius: 12, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-graphite, #53635B)', fontWeight: 600 }}>
                    <Car size={15} color="var(--color-primary, #183D32)" />
                    <span>Local Transport</span>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-primary, #183D32)', marginTop: 4 }}>
                    {tripBudgetSummary.hasItems.localTransport
                      ? `${getCurrencySymbol(tripBudgetSummary.currency)} ${tripBudgetSummary.categories.localTransport.toLocaleString()}`
                      : 'Not estimated'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-graphite, #53635B)', marginTop: 2 }}>Taxis, cabs & auto</div>
                </div>

                {/* 6. Activities & Attractions */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-divider-gray, #E8E4D9)', borderRadius: 12, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-graphite, #53635B)', fontWeight: 600 }}>
                    <Sparkles size={15} color="var(--color-primary, #183D32)" />
                    <span>Activities</span>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-primary, #183D32)', marginTop: 4 }}>
                    {tripBudgetSummary.hasItems.activities
                      ? `${getCurrencySymbol(tripBudgetSummary.currency)} ${tripBudgetSummary.categories.activities.toLocaleString()}`
                      : 'Not estimated'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-graphite, #53635B)', marginTop: 2 }}>Entry & sightseeing</div>
                </div>

                {/* 7. Miscellaneous */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-divider-gray, #E8E4D9)', borderRadius: 12, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-graphite, #53635B)', fontWeight: 600 }}>
                    <Tag size={15} color="var(--color-primary, #183D32)" />
                    <span>Miscellaneous</span>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-primary, #183D32)', marginTop: 4 }}>
                    {tripBudgetSummary.hasItems.miscellaneous
                      ? `${getCurrencySymbol(tripBudgetSummary.currency)} ${tripBudgetSummary.categories.miscellaneous.toLocaleString()}`
                      : 'Not estimated'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-graphite, #53635B)', marginTop: 2 }}>Buffer allowance</div>
                </div>
              </div>
            </div>

            {/* Live Currency Converter Bar */}
            <div
              style={{
                marginTop: 18,
                paddingTop: 16,
                borderTop: '1px solid var(--color-divider-gray)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={16} color="var(--color-hopper-blue)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>
                  Currency Conversion:
                </span>
                <select
                  className="form-select"
                  value={targetCurrency}
                  onChange={(e) => setTargetCurrency(e.target.value)}
                  style={{ padding: '4px 10px', fontSize: 12, height: 'auto', width: 'auto' }}
                >
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                  <option value="AED">AED (UAE Dirham)</option>
                  <option value="SGD">SGD (S$ - Singapore Dollar)</option>
                  <option value="CAD">CAD (C$ - Canadian Dollar)</option>
                  <option value="AUD">AUD (A$ - Australian Dollar)</option>
                  <option value="JPY">JPY (¥ - Japanese Yen)</option>
                  <option value="INR">INR (₹ - Indian Rupee)</option>
                </select>
              </div>

              {convertedBudget ? (
                <div style={{ fontSize: 13, color: 'var(--color-ink)', fontWeight: 700 }}>
                  ≈ {convertedBudget.to_currency} {Math.round(convertedBudget.converted_amount).toLocaleString()}{' '}
                  <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-graphite)' }}>
                    (Rate: 1 {convertedBudget.from_currency} = {convertedBudget.rate} {convertedBudget.to_currency} via {convertedBudget.provider || 'ExchangeRate-API'})
                  </span>
                </div>
              ) : isLoadingConversion ? (
                <div style={{ fontSize: 12, color: 'var(--color-graphite)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Loader2 size={12} className="spinner" />
                  <span>Calculating live exchange rate...</span>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Day Selector Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 8,
            marginBottom: 24,
            borderBottom: '1px solid var(--color-divider-gray, #D8D4C7)',
          }}
        >
          {itinerary.days?.map((d: any) => {
            const dayNum = d.day_number ?? d.dayNumber;
            const isSelected = selectedDayNumber === dayNum;
            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => setSelectedDayNumber(dayNum)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-pills, 9999px)',
                  border: isSelected
                    ? '1.5px solid var(--color-primary, #183D32)'
                    : '1px solid var(--color-divider-gray, #D8D4C7)',
                  backgroundColor: isSelected ? 'var(--color-primary, #183D32)' : '#ffffff',
                  color: isSelected ? '#fff' : 'var(--color-text-primary, #26332E)',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Day {dayNum}</span>
                <span
                  style={{
                    fontSize: 12,
                    opacity: isSelected ? 0.9 : 0.6,
                    fontWeight: 400,
                  }}
                >
                  {d.date ? d.date.slice(5) : ''}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Day Plan Header & Surgical Replan Trigger */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div>
            <h2 className="heading-card" style={{ color: 'var(--color-primary, #183D32)', margin: '0 0 4px 0' }}>
              Day {selectedDay.day_number ?? (selectedDay as any).dayNumber}: {selectedDay.theme || 'Exploration & Sightseeing'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-graphite, #53635B)', margin: 0 }}>
              Date: {selectedDay.date} • {selectedDay.activities?.length || 0} Scheduled Activities
            </p>
          </div>

          <button
            type="button"
            onClick={() => setRegenerateDayModal(selectedDay.day_number ?? (selectedDay as any).dayNumber)}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: 13 }}
            title="Surgically replan this day with custom AI prompt"
          >
            <RefreshCw size={14} color="var(--color-primary, #183D32)" />
            <span>Regenerate Day {selectedDay.day_number ?? (selectedDay as any).dayNumber} Plan</span>
          </button>
        </div>

        {/* OSRM Route Directions Banner */}
        {dayDirections && (
          <div
            style={{
              backgroundColor: '#ebf3fd',
              border: '1px solid #c7e0fa',
              borderRadius: 'var(--radius-cards)',
              padding: '12px 18px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Navigation size={18} color="var(--color-hopper-blue)" />
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-hopper-blue)' }}>
                  OSRM Route Navigation Calculated:
                </span>{' '}
                <span style={{ fontSize: 13, color: 'var(--color-ink)' }}>
                  {dayDirections.distance_km} km total driving distance • ~{Math.round(dayDirections.duration_minutes)} mins transit across Day {selectedDay.day_number ?? (selectedDay as any).dayNumber} destinations
                </span>
              </div>
            </div>
            <span style={{ fontSize: 11, color: 'var(--color-graphite)', fontWeight: 600 }}>
              Powered by {dayDirections.provider}
            </span>
          </div>
        )}

        {/* Activities Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selectedDay.activities && selectedDay.activities.length > 0 ? (
            selectedDay.activities.map((act: any, index: number) => {
              const costInfo = getActivityCost(act);
              const transInfo = getTransportDetails(act, trip?.starting_city || undefined, trip?.destination || undefined);
              const currencySym = getCurrencySymbol(act.cost_currency || act.costCurrency || itinerary.budget?.currency);
              const startTime = act.startTime || act.start_time || '09:00';
              const durationMinutes = act.durationMinutes ?? act.duration_minutes ?? 60;

              return (
                <div
                  key={act.id || index}
                  style={{
                    backgroundColor: 'var(--surface-white-canvas, #ffffff)',
                    border: '1px solid var(--color-divider-gray, #D8D4C7)',
                    borderRadius: 'var(--radius-cards, 16px)',
                    padding: 20,
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr auto',
                    gap: 20,
                    alignItems: 'start',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  {/* Time & Duration Column */}
                  <div style={{ borderRight: '1px solid var(--color-cloud, #E8E4D9)', paddingRight: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 15, color: 'var(--color-text-primary, #26332E)' }}>
                      <Clock size={16} color="var(--color-primary, #183D32)" />
                      <span>{startTime}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-graphite, #53635B)', marginTop: 4 }}>
                      {durationMinutes} minutes
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: 8,
                        padding: '3px 8px',
                        borderRadius: 6,
                        backgroundColor: 'var(--color-bg-main, #F7F5EF)',
                        color: 'var(--color-primary, #183D32)',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'capitalize',
                      }}
                    >
                      {act.category}
                    </span>
                  </div>

                  {/* Main Content Column */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary, #26332E)', margin: 0 }}>
                        {act.name}
                      </h3>
                      {(act.source_status === 'verified' || act.sourceStatus === 'verified') ? (
                        <span className="badge badge-verified" title="Verified against live OpenStreetMap database">
                          <Check size={12} />
                          <span>Verified POI</span>
                        </span>
                      ) : (
                        <span className="badge badge-unverified" title="AI Estimated activity">
                          <span>AI Estimate</span>
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: 14, color: 'var(--color-graphite, #53635B)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                      {act.description}
                    </p>

                    {/* Rich Transportation Card (Requirement 5) */}
                    {transInfo && (
                      <div
                        style={{
                          marginTop: 10,
                          marginBottom: 10,
                          padding: '12px 14px',
                          borderRadius: 12,
                          backgroundColor: 'var(--color-bg-main, #F7F5EF)',
                          border: '1.5px solid var(--color-divider-gray, #D8D4C7)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--color-primary, #183D32)', fontSize: 14 }}>
                            {transInfo.mode === 'flight' ? <Plane size={18} color="var(--color-terracotta, #D97745)" /> :
                             transInfo.mode === 'train' ? <Train size={18} color="var(--color-terracotta, #D97745)" /> :
                             transInfo.mode === 'bus' ? <Bus size={18} color="var(--color-terracotta, #D97745)" /> :
                             <Car size={18} color="var(--color-terracotta, #D97745)" />}
                            <span style={{ textTransform: 'capitalize' }}>
                              {transInfo.mode}: {transInfo.startPoint && transInfo.endPoint ? `${transInfo.startPoint} → ${transInfo.endPoint}` : act.name}
                            </span>
                          </div>

                          {transInfo.fare !== null && (
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary, #183D32)' }}>
                              Estimated fare: {currencySym} {transInfo.fare.toLocaleString()}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--color-graphite, #53635B)' }}>
                          {transInfo.durationMinutes && (
                            <div>
                              <strong>Estimated duration:</strong> {formatJourneyDuration(transInfo.durationMinutes)}
                            </div>
                          )}
                          {transInfo.startPoint && transInfo.endPoint && (
                            <div>
                              <strong>Route:</strong> {transInfo.startPoint} to {transInfo.endPoint}
                            </div>
                          )}
                          {transInfo.distanceKm && (
                            <div>
                              <strong>Distance:</strong> {transInfo.distanceKm} km
                            </div>
                          )}
                          {transInfo.details && (
                            <div>
                              <strong>Details:</strong> {transInfo.details}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Location address if present */}
                    {act.location?.address && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-graphite, #53635B)', marginTop: 4 }}>
                        <MapPin size={13} color="var(--color-graphite, #53635B)" />
                        <span>{act.location.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Activity Estimated Cost Pill (Requirement 1) */}
                  <div style={{ textAlign: 'right', minWidth: 120 }}>
                    <div style={{ fontSize: 11, color: 'var(--color-graphite, #53635B)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Est. Cost
                    </div>
                    <div style={{ marginTop: 2 }}>
                      {costInfo.isMissing ? (
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-graphite, #53635B)', fontStyle: 'italic' }}>
                          Not estimated
                        </span>
                      ) : costInfo.isFree ? (
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary, #183D32)' }}>
                          {currencySym} 0 (Free)
                        </span>
                      ) : (
                        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary, #183D32)' }}>
                          {currencySym} {costInfo.cost!.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="state-empty">
              <Calendar size={32} color="var(--color-placeholder-gray)" style={{ margin: '0 auto 8px auto' }} />
              <p style={{ color: 'var(--color-graphite)' }}>No activities listed for this day yet.</p>
              <button
                onClick={() => setRegenerateDayModal(selectedDay.day_number)}
                className="btn-primary"
                style={{ marginTop: 12 }}
              >
                Plan Activities for Day {selectedDay.day_number}
              </button>
            </div>
          )}
        </div>

        {/* Travel Assumptions / Context Notes from Groq AI */}
        {itinerary.assumptions && itinerary.assumptions.length > 0 && (
          <div
            style={{
              backgroundColor: 'var(--surface-cloud-surface)',
              border: '1px solid var(--color-divider-gray)',
              borderRadius: 'var(--radius-cards)',
              padding: 20,
              marginTop: 32,
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 8 }}>
              Travel Constraints & Model Assumptions
            </h3>
            <ul style={{ paddingLeft: 20, fontSize: 13, color: 'var(--color-graphite)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {itinerary.assumptions.map((asm, i) => (
                <li key={i}>{asm}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Day Regenerate Modal */}
      {regenerateDayModal !== null && (
        <DayRegenerateModal
          itineraryId={itinerary.id}
          dayNumber={regenerateDayModal}
          currentTheme={selectedDay.theme}
          onClose={() => setRegenerateDayModal(null)}
          onSuccess={(updated) => {
            setItinerary(updated);
            // Refresh deterministic budget
            itineraryService.getBudgetAnalysis(updated.id).then(setBudgetAnalysis).catch(() => {});
            setActionSuccess(`Day ${regenerateDayModal} regenerated successfully!`);
            setTimeout(() => setActionSuccess(null), 3000);
          }}
        />
      )}

      {/* Trip Edit Modal */}
      {showTripEditModal && trip && (
        <TripEditModal
          trip={trip}
          onClose={() => setShowTripEditModal(false)}
          onSuccess={(updatedTrip) => {
            setTrip(updatedTrip);
            setActionSuccess('Trip preferences updated.');
            setTimeout(() => setActionSuccess(null), 3000);
          }}
        />
      )}

      {/* Floating Context-Aware Chat Companion */}
      <ChatDrawer
        currentTripId={itinerary.trip_id}
        currentItineraryId={itinerary.id}
        tripDestination={trip?.destination}
      />

      {/* Guest Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            claimItinerary();
          }}
        />
      )}
    </div>
  );
};

export default ItineraryViewPage;
