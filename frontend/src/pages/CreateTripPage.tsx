import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Compass,
  AlertCircle,
  Loader2,
  Check,
  Tag,
  Car,
  Hotel,
  Utensils,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { tripService } from '../services/tripService';
import { itineraryService } from '../services/itineraryService';
import { TripCreate } from '../types/api';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import DestinationAutocomplete from '../components/DestinationAutocomplete';

const INTEREST_TAGS = [
  'Historical Monuments',
  'Beaches & Coastal',
  'Foodie & Street Food',
  'Nature & Hiking',
  'Photography & Panoramas',
  'Temple & Spiritual',
  'Museums & Galleries',
  'Nightlife & Pubs',
  'Shopping & Local Bazaars',
  'Wellness & Yoga',
  'Water Sports',
  'Wildlife Safari',
];

interface FormErrors {
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: string;
  travellers?: string;
}

export const CreateTripPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // PART 2: All inputs initially EMPTY by default!
  // Only prepopulate if explicitly navigated from an Explore destination or URL search params
  const [destination, setDestination] = useState<string>(searchParams.get('destination') || '');
  const [startingCity, setStartingCity] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState<string>(searchParams.get('endDate') || '');
  const [budget, setBudget] = useState<string>(searchParams.get('budget') || '');
  const [currency, setCurrency] = useState('INR');
  const [travellers, setTravellers] = useState<string>(searchParams.get('travelers') || '');
  const [travelStyle, setTravelStyle] = useState('balanced');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Historical Monuments',
    'Foodie & Street Food',
    'Beaches & Coastal',
  ]);
  const [transportPreference, setTransportPreference] = useState('flight');
  const [accommodationPreference, setAccommodationPreference] = useState('beach resort');
  const [dietaryPreferences, setDietaryPreferences] = useState('none');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // PART 4: Inline Validation Errors
  const [errors, setErrors] = useState<FormErrors>({});

  // Submission & Generation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const toggleInterest = (tag: string) => {
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter((t) => t !== tag));
    } else {
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  // PART 4: Comprehensive Form Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 1. Destination must be selected or validly entered
    if (!destination || !destination.trim()) {
      newErrors.destination = 'Destination is required. Where would you like to go?';
    }

    // 2. Departure date must be provided
    if (!startDate) {
      newErrors.startDate = 'Please select your departure date.';
    }

    // 3. Return date must be provided
    if (!endDate) {
      newErrors.endDate = 'Please select your return date.';
    }

    // 4. Return date must be after departure date
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        newErrors.endDate = 'Return date must be strictly after the departure date.';
      } else {
        const durationDays = Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
        if (durationDays > 60) {
          newErrors.endDate = 'Trip duration cannot exceed 60 days.';
        }
      }
    }

    // 5. Budget must be a valid positive INR amount
    const parsedBudget = Number(budget);
    if (!budget || isNaN(parsedBudget) || parsedBudget <= 0) {
      newErrors.budget = 'Please enter a valid positive budget amount in INR (e.g. 25000).';
    } else if (parsedBudget < 1000) {
      newErrors.budget = 'Minimum budget should be at least ₹1,000.';
    }

    // 6. Traveller selection must be valid
    const parsedTravellers = Number(travellers);
    if (!travellers || isNaN(parsedTravellers) || parsedTravellers < 1) {
      newErrors.travellers = 'Please select at least 1 traveller.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    // Validate all required fields
    const isValid = validateForm();
    if (!isValid) {
      setError('Please resolve the required highlighted fields before generating your itinerary.');
      return;
    }

    const tripData: TripCreate = {
      destination: destination.trim(),
      starting_city: startingCity.trim() || undefined,
      start_date: startDate,
      end_date: endDate,
      budget: Number(budget),
      currency,
      travellers: Number(travellers),
      travelers_count: Number(travellers),
      travel_style: travelStyle,
      interests: selectedInterests,
      transport_preference: transportPreference,
      accommodation_preference: accommodationPreference,
      dietary_preferences: dietaryPreferences !== 'none' ? dietaryPreferences : undefined,
      additional_notes: additionalNotes.trim() || undefined,
      status: 'planned',
    };

    setIsSubmitting(true);
    setGenerationStep('Synthesizing day-by-day itinerary with Groq AI...');

    const genTimer1 = setTimeout(() => {
      setGenerationStep('Calculating deterministic category budgets & verified POIs...');
    }, 4000);

    const genTimer2 = setTimeout(() => {
      setGenerationStep('Tailoring activities to your travel style and preferences...');
    }, 9000);

    try {
      // Trigger AI Itinerary Generation via Groq
      const itinerary = await itineraryService.generateItinerary({
        regenerate: false,
        preferences: {
          destination: destination.trim(),
          starting_city: startingCity.trim() || undefined,
          start_date: startDate,
          end_date: endDate,
          budget: Number(budget),
          currency,
          travellers: Number(travellers),
          travelers_count: Number(travellers),
          travel_style: travelStyle,
          interests: selectedInterests,
          transport_preference: transportPreference,
          accommodation_preference: accommodationPreference,
          dietary_preferences: dietaryPreferences !== 'none' ? dietaryPreferences : undefined,
          additional_notes: additionalNotes.trim() || undefined,
          status: 'planned',
        },
      });

      clearTimeout(genTimer1);
      clearTimeout(genTimer2);
      setGenerationStep('Done! Loading your personalized journey...');

      // Navigate directly to the generated Itinerary View
      navigate(`/itineraries/${itinerary.id}`);
    } catch (err: any) {
      clearTimeout(genTimer1);
      clearTimeout(genTimer2);
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'Itinerary generation failed. Please check your network and retry.';
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-main, #F7F5EF)',
        minHeight: '100vh',
        padding: '48px 24px 80px 24px',
      }}
    >
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{ marginBottom: 32 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--color-terracotta, #D97745)',
              display: 'inline-block',
              marginBottom: 6,
            }}
          >
            Personalized Journey Studio
          </span>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2.2rem, 4vw, 3rem)',
              fontWeight: 800,
              color: 'var(--color-primary, #183D32)',
              margin: '0 0 10px 0',
              lineHeight: 1.2,
            }}
          >
            Plan Your Next Trip with AI
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 15,
              color: 'var(--color-graphite, #53635B)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Provide your preferred destination, travel pacing, dates, and budget. Our Groq AI engine
            generates a structured, day-wise schedule with approximate costs and verified waypoints.
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '14px 18px',
              borderRadius: 14,
              backgroundColor: 'rgba(217, 56, 58, 0.08)',
              border: '1.5px solid var(--color-error, #D9383A)',
              color: 'var(--color-error, #D9383A)',
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => handleFormSubmit()}
              style={{
                fontSize: 13,
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid var(--color-error, #D9383A)',
                backgroundColor: '#ffffff',
                color: 'var(--color-error, #D9383A)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading / Generation Progress Modal */}
        {isSubmitting && (
          <div
            className="modal-backdrop"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(24, 61, 50, 0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 1200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <div
              className="modal-surface"
              style={{
                maxWidth: 480,
                width: '100%',
                padding: 36,
                textAlign: 'center',
                backgroundColor: '#ffffff',
                borderRadius: 24,
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(24, 61, 50, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px auto',
                  color: 'var(--color-primary, #183D32)',
                }}
              >
                <Sparkles size={28} />
              </div>
              <h2
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 22,
                  fontWeight: 800,
                  marginBottom: 8,
                  color: 'var(--color-primary, #183D32)',
                }}
              >
                Crafting Your Itinerary
              </h2>
              <p style={{ fontSize: 14, color: 'var(--color-graphite, #53635B)', marginBottom: 24 }}>
                {generationStep}
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <Loader2
                  size={36}
                  style={{
                    color: 'var(--color-primary, #183D32)',
                    animation: 'spin 1s linear infinite',
                  }}
                />
              </div>

              <div
                style={{
                  backgroundColor: 'var(--color-bg-main, #F7F5EF)',
                  padding: 14,
                  borderRadius: 14,
                  fontSize: 12,
                  color: 'var(--color-graphite, #53635B)',
                  textAlign: 'left',
                  lineHeight: 1.6,
                }}
              >
                <div>✓ Resolving destination coordinates & geography</div>
                <div>✓ Generating realistic daily timeline & activities</div>
                <div>✓ Computing category expenses: transport, stays, food</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Trip Planning Form */}
        <form
          onSubmit={handleFormSubmit}
          noValidate
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--color-divider-gray, #D8D4C7)',
            borderRadius: 24,
            padding: '36px 32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}
        >
          {/* SECTION 1: DESTINATION & DATES */}
          <div style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--color-primary, #183D32)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 18,
              }}
            >
              <MapPin size={20} color="var(--color-terracotta, #D97745)" />
              <span>1. Destination & Duration</span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {/* Intelligent Destination Autocomplete */}
              <div className="form-group">
                <label
                  htmlFor="plan-trip-destination"
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--color-text-primary, #26332E)',
                    marginBottom: 6,
                  }}
                >
                  Destination City or Region *
                </label>
                <DestinationAutocomplete
                  id="plan-trip-destination"
                  value={destination}
                  onChange={(val) => {
                    setDestination(val);
                    if (errors.destination) {
                      setErrors((prev) => ({ ...prev, destination: undefined }));
                    }
                  }}
                  placeholder="Where would you like to go?"
                  error={errors.destination}
                />
              </div>

              {/* Optional Origin City */}
              <div className="form-group">
                <label
                  htmlFor="starting-city"
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--color-text-primary, #26332E)',
                    marginBottom: 6,
                  }}
                >
                  Origin City (Optional)
                </label>
                <input
                  id="starting-city"
                  type="text"
                  placeholder="e.g. Mumbai, Delhi, London"
                  value={startingCity}
                  onChange={(e) => setStartingCity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid var(--color-divider-gray, #D8D4C7)',
                    backgroundColor: '#ffffff',
                    fontSize: 15,
                    color: 'var(--color-text-primary, #26332E)',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Departure and Return Dates */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                marginTop: 16,
              }}
            >
              {/* Departure Date */}
              <div className="form-group">
                <label
                  htmlFor="departure-date"
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--color-text-primary, #26332E)',
                    marginBottom: 6,
                  }}
                >
                  Departure Date *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="departure-date"
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().split('T')[0]}
                    placeholder="Select departure date"
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (errors.startDate) {
                        setErrors((prev) => ({ ...prev, startDate: undefined }));
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: errors.startDate
                        ? '1.5px solid var(--color-error, #D9383A)'
                        : '1px solid var(--color-divider-gray, #D8D4C7)',
                      backgroundColor: '#ffffff',
                      fontSize: 15,
                      color: 'var(--color-text-primary, #26332E)',
                      outline: 'none',
                    }}
                  />
                </div>
                {errors.startDate && (
                  <p style={{ color: 'var(--color-error, #D9383A)', fontSize: 12, marginTop: 4, fontWeight: 500 }}>
                    {errors.startDate}
                  </p>
                )}
              </div>

              {/* Return Date */}
              <div className="form-group">
                <label
                  htmlFor="return-date"
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--color-text-primary, #26332E)',
                    marginBottom: 6,
                  }}
                >
                  Return Date *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="return-date"
                    type="date"
                    value={endDate}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    placeholder="Select return date"
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      if (errors.endDate) {
                        setErrors((prev) => ({ ...prev, endDate: undefined }));
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: errors.endDate
                        ? '1.5px solid var(--color-error, #D9383A)'
                        : '1px solid var(--color-divider-gray, #D8D4C7)',
                      backgroundColor: '#ffffff',
                      fontSize: 15,
                      color: 'var(--color-text-primary, #26332E)',
                      outline: 'none',
                    }}
                  />
                </div>
                {errors.endDate && (
                  <p style={{ color: 'var(--color-error, #D9383A)', fontSize: 12, marginTop: 4, fontWeight: 500 }}>
                    {errors.endDate}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--color-divider-gray, #D8D4C7)', marginBottom: 28 }} />

          {/* SECTION 2: BUDGET & TRAVELLERS */}
          <div style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--color-primary, #183D32)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 18,
              }}
            >
              <DollarSign size={20} color="var(--color-terracotta, #D97745)" />
              <span>2. Budget & Party Size</span>
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
              }}
            >
              {/* Budget Input */}
              <div className="form-group">
                <label
                  htmlFor="budget-input"
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--color-text-primary, #26332E)',
                    marginBottom: 6,
                  }}
                >
                  Target Total Budget *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="budget-input"
                    type="number"
                    value={budget}
                    placeholder="Enter your budget (INR)"
                    min="1000"
                    step="500"
                    onChange={(e) => {
                      setBudget(e.target.value);
                      if (errors.budget) {
                        setErrors((prev) => ({ ...prev, budget: undefined }));
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: errors.budget
                        ? '1.5px solid var(--color-error, #D9383A)'
                        : '1px solid var(--color-divider-gray, #D8D4C7)',
                      backgroundColor: '#ffffff',
                      fontSize: 15,
                      color: 'var(--color-text-primary, #26332E)',
                      outline: 'none',
                    }}
                  />
                </div>
                {errors.budget && (
                  <p style={{ color: 'var(--color-error, #D9383A)', fontSize: 12, marginTop: 4, fontWeight: 500 }}>
                    {errors.budget}
                  </p>
                )}
              </div>

              {/* Currency Selector */}
              <div className="form-group">
                <label
                  htmlFor="currency-select"
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--color-text-primary, #26332E)',
                    marginBottom: 6,
                  }}
                >
                  Currency
                </label>
                <select
                  id="currency-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  style={{
                    width: '100%',
                    height: 48,
                    padding: '0 14px',
                    borderRadius: 12,
                    border: '1px solid var(--color-divider-gray, #D8D4C7)',
                    backgroundColor: '#ffffff',
                    fontSize: 15,
                    color: 'var(--color-text-primary, #26332E)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              {/* Travellers Selector with placeholder Select travellers */}
              <div className="form-group">
                <label
                  htmlFor="travellers-select"
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--color-text-primary, #26332E)',
                    marginBottom: 6,
                  }}
                >
                  Travellers *
                </label>
                <select
                  id="travellers-select"
                  value={travellers}
                  onChange={(e) => {
                    setTravellers(e.target.value);
                    if (errors.travellers) {
                      setErrors((prev) => ({ ...prev, travellers: undefined }));
                    }
                  }}
                  style={{
                    width: '100%',
                    height: 48,
                    padding: '0 14px',
                    borderRadius: 12,
                    border: errors.travellers
                      ? '1.5px solid var(--color-error, #D9383A)'
                      : '1px solid var(--color-divider-gray, #D8D4C7)',
                    backgroundColor: '#ffffff',
                    fontSize: 15,
                    color: travellers ? 'var(--color-text-primary, #26332E)' : 'var(--color-graphite, #53635B)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Select travellers</option>
                  <option value="1">1 Traveller (Solo)</option>
                  <option value="2">2 Travellers (Couple / Duo)</option>
                  <option value="3">3 Travellers (Small Group)</option>
                  <option value="4">4 Travellers (Family / Group)</option>
                  <option value="5">5 Travellers</option>
                  <option value="6">6+ Travellers</option>
                </select>
                {errors.travellers && (
                  <p style={{ color: 'var(--color-error, #D9383A)', fontSize: 12, marginTop: 4, fontWeight: 500 }}>
                    {errors.travellers}
                  </p>
                )}
              </div>
            </div>

            {/* Travel Style Buttons */}
            <div style={{ marginTop: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--color-text-primary, #26332E)',
                  marginBottom: 8,
                }}
              >
                Pacing & Travel Style
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: 10,
                }}
              >
                {[
                  { id: 'balanced', label: 'Balanced' },
                  { id: 'adventure', label: 'Adventure' },
                  { id: 'cultural', label: 'Cultural' },
                  { id: 'luxury', label: 'Luxury' },
                  { id: 'budget', label: 'Backpacker' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setTravelStyle(s.id)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      border:
                        travelStyle === s.id
                          ? '1.5px solid var(--color-primary, #183D32)'
                          : '1px solid var(--color-divider-gray, #D8D4C7)',
                      backgroundColor:
                        travelStyle === s.id
                          ? 'var(--color-primary, #183D32)'
                          : '#ffffff',
                      color:
                        travelStyle === s.id ? '#ffffff' : 'var(--color-text-primary, #26332E)',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--color-divider-gray, #D8D4C7)', marginBottom: 28 }} />

          {/* SECTION 3: INTERESTS & PREFERENCES */}
          <div style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--color-primary, #183D32)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <Tag size={20} color="var(--color-terracotta, #D97745)" />
              <span>3. Experiences & Trip Highlights</span>
            </h2>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {INTEREST_TAGS.map((tag) => {
                const isSelected = selectedInterests.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleInterest(tag)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 20,
                      border: isSelected
                        ? '1.5px solid var(--color-terracotta, #D97745)'
                        : '1px solid var(--color-divider-gray, #D8D4C7)',
                      backgroundColor: isSelected
                        ? 'rgba(217, 119, 69, 0.12)'
                        : '#ffffff',
                      color: isSelected
                        ? 'var(--color-terracotta, #D97745)'
                        : 'var(--color-text-primary, #26332E)',
                      fontSize: 13,
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isSelected && <Check size={14} />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div style={{ paddingTop: 12 }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '16px 28px',
                borderRadius: 14,
                border: 'none',
                backgroundColor: 'var(--color-primary, #183D32)',
                color: '#ffffff',
                fontSize: 16,
                fontWeight: 800,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 8px 24px rgba(24, 61, 50, 0.25)',
                transition: 'opacity 0.2s',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              <Sparkles size={20} />
              <span>{isSubmitting ? 'Synthesizing Itinerary...' : 'Generate AI Travel Itinerary'}</span>
            </button>
          </div>
        </form>
      </div>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          defaultMode="login"
        />
      )}
    </div>
  );
};

export default CreateTripPage;
