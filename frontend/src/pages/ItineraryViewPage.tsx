import React, { useState, useEffect } from 'react';
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

  const selectedDay =
    itinerary.days?.find((d) => d.day_number === selectedDayNumber) ||
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

        {/* Deterministic Budget Breakdown Card */}
        {budgetAnalysis && (
          <div
            style={{
              backgroundColor: 'var(--surface-cloud-surface)',
              border: '1px solid var(--color-divider-gray)',
              borderRadius: 'var(--radius-cards)',
              padding: 24,
              marginBottom: 28,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-ink)' }}>
                  Deterministic Budget Analysis
                </h2>
                <p style={{ fontSize: 13, color: 'var(--color-graphite)' }}>
                  Calculated across activities, scheduled transport legs, and daily allowances.
                </p>
              </div>

              {budgetAnalysis.is_over_budget ? (
                <span className="badge badge-unverified" style={{ padding: '6px 12px', fontSize: 13 }}>
                  <AlertTriangle size={15} />
                  <span>Over Target by {budgetAnalysis.currency} {Math.round(budgetAnalysis.difference).toLocaleString()}</span>
                </span>
              ) : (
                <span className="badge badge-verified" style={{ padding: '6px 12px', fontSize: 13 }}>
                  <ShieldCheck size={15} />
                  <span>Within Budget Target (Variance: {budgetAnalysis.currency} {Math.round(budgetAnalysis.difference).toLocaleString()})</span>
                </span>
              )}
            </div>

            {/* Budget Categories Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
              <div style={{ backgroundColor: '#fff', border: '1px solid var(--color-divider-gray)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--color-graphite)', fontWeight: 600 }}>Total Estimated</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-ink)', marginTop: 4 }}>
                  {budgetAnalysis.currency} {Math.round(budgetAnalysis.total_estimated).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-graphite)', marginTop: 2 }}>
                  Target: {budgetAnalysis.currency} {Math.round(budgetAnalysis.trip_budget).toLocaleString()}
                </div>
              </div>

              <div style={{ backgroundColor: '#fff', border: '1px solid var(--color-divider-gray)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--color-graphite)', fontWeight: 600 }}>Transport</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-hopper-blue)', marginTop: 4 }}>
                  {budgetAnalysis.currency} {Math.round(budgetAnalysis.categories.transport).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-graphite)', marginTop: 2 }}>Flights, Cabs & Transit</div>
              </div>

              <div style={{ backgroundColor: '#fff', border: '1px solid var(--color-divider-gray)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--color-graphite)', fontWeight: 600 }}>Accommodation</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-hopper-blue)', marginTop: 4 }}>
                  {budgetAnalysis.currency} {Math.round(budgetAnalysis.categories.accommodation).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-graphite)', marginTop: 2 }}>Hotel & Resort stays</div>
              </div>

              <div style={{ backgroundColor: '#fff', border: '1px solid var(--color-divider-gray)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--color-graphite)', fontWeight: 600 }}>Food & Dining</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-hopper-blue)', marginTop: 4 }}>
                  {budgetAnalysis.currency} {Math.round(budgetAnalysis.categories.food).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-graphite)', marginTop: 2 }}>Meals & local tasting</div>
              </div>

              <div style={{ backgroundColor: '#fff', border: '1px solid var(--color-divider-gray)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--color-graphite)', fontWeight: 600 }}>Activities & Entry</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-hopper-blue)', marginTop: 4 }}>
                  {budgetAnalysis.currency} {Math.round(budgetAnalysis.categories.activities).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-graphite)', marginTop: 2 }}>Monuments & Tickets</div>
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
            borderBottom: '1px solid var(--color-divider-gray)',
          }}
        >
          {itinerary.days?.map((d) => {
            const isSelected = selectedDayNumber === d.day_number;
            return (
              <button
                key={d.day_number}
                type="button"
                onClick={() => setSelectedDayNumber(d.day_number)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-pills)',
                  border: isSelected
                    ? '1.5px solid var(--color-hopper-blue)'
                    : '1px solid var(--color-divider-gray)',
                  backgroundColor: isSelected ? 'var(--color-hopper-blue)' : 'var(--color-white)',
                  color: isSelected ? '#fff' : 'var(--color-ink)',
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
                <span>Day {d.day_number}</span>
                <span
                  style={{
                    fontSize: 12,
                    opacity: isSelected ? 0.9 : 0.6,
                    fontWeight: 400,
                  }}
                >
                  {d.date.slice(5)}
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
            <h2 className="heading-card" style={{ color: 'var(--color-ink)' }}>
              Day {selectedDay.day_number}: {selectedDay.theme || 'Exploration & Sightseeing'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-graphite)', marginTop: 2 }}>
              Date: {selectedDay.date} • {selectedDay.activities?.length || 0} Scheduled Activities
            </p>
          </div>

          <button
            type="button"
            onClick={() => setRegenerateDayModal(selectedDay.day_number)}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: 13 }}
            title="Surgically replan this day with custom AI prompt"
          >
            <RefreshCw size={14} color="var(--color-hopper-blue)" />
            <span>Regenerate Day {selectedDay.day_number} Plan</span>
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
                  {dayDirections.distance_km} km total driving distance • ~{Math.round(dayDirections.duration_minutes)} mins transit across Day {selectedDay.day_number} destinations
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
            selectedDay.activities.map((act, index) => (
              <div
                key={act.id || index}
                style={{
                  backgroundColor: 'var(--surface-white-canvas)',
                  border: '1px solid var(--color-divider-gray)',
                  borderRadius: 'var(--radius-cards)',
                  padding: 20,
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr auto',
                  gap: 20,
                  alignItems: 'start',
                  transition: 'border-color 0.15s ease',
                }}
              >
                {/* Time & Duration Column */}
                <div style={{ borderRight: '1px solid var(--color-cloud)', paddingRight: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 15, color: 'var(--color-ink)' }}>
                    <Clock size={16} color="var(--color-hopper-blue)" />
                    <span>{act.start_time || '09:00'}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-graphite)', marginTop: 4 }}>
                    {act.duration_minutes} minutes
                  </div>
                  <span className="badge badge-cloud" style={{ marginTop: 8, textTransform: 'capitalize' }}>
                    {act.category}
                  </span>
                </div>

                {/* Main Content Column */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-ink)' }}>
                      {act.name}
                    </h3>
                    {act.source_status === 'verified' ? (
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

                  <p style={{ fontSize: 14, color: 'var(--color-graphite)', lineHeight: 1.5, marginBottom: 12 }}>
                    {act.description}
                  </p>

                  {/* Location & Transport if present */}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--color-graphite)' }}>
                    {act.location?.address && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} color="var(--color-graphite)" />
                        <span>{act.location.address}</span>
                      </div>
                    )}
                    {act.transport?.mode && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Car size={13} color="var(--color-hopper-blue)" />
                        <span>
                          Transit: {act.transport.mode} ({act.transport.duration_minutes || 15} mins)
                          {act.transport.estimated_cost ? ` • ₹${act.transport.estimated_cost}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cost Estimate Pill */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-graphite)', textTransform: 'uppercase' }}>
                    Est. Cost
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-hopper-blue)', marginTop: 2 }}>
                    {act.cost_currency || 'INR'} {act.estimated_cost?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>
            ))
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
