import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { tripService } from '../services/tripService';
import { itineraryService } from '../services/itineraryService';
import { travelDataService } from '../services/travelDataService';
import { TripCreate, NormalizedPlace } from '../types/api';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

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

export const CreateTripPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Form Fields matching TripCreate schema
  const [destination, setDestination] = useState(searchParams.get('destination') || 'Goa, India');
  const [startingCity, setStartingCity] = useState('Mumbai');
  const [startDate, setStartDate] = useState(
    searchParams.get('startDate') ||
      (() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().split('T')[0];
      })()
  );
  const [endDate, setEndDate] = useState(
    searchParams.get('endDate') ||
      (() => {
        const d = new Date();
        d.setDate(d.getDate() + 19);
        return d.toISOString().split('T')[0];
      })()
  );
  const [budget, setBudget] = useState(searchParams.get('budget') || '35000');
  const [currency, setCurrency] = useState('INR');
  const [travellers, setTravellers] = useState(Number(searchParams.get('travelers')) || 2);
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

  // Autocomplete state for destination
  const [suggestions, setSuggestions] = useState<NormalizedPlace[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Submission & Generation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Autocomplete lookup
  useEffect(() => {
    if (!destination || destination.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await travelDataService.searchDestinations(destination, 4);
        setSuggestions(res);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [destination]);

  const toggleInterest = (tag: string) => {
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter((t) => t !== tag));
    } else {
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!destination.trim()) {
      setError('Destination is required.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be on or after start date.');
      return;
    }

    const durationDays = Math.round(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24)
    ) + 1;

    if (durationDays < 1 || durationDays > 60) {
      setError('Trip duration must be between 1 and 60 days.');
      return;
    }

    const tripData: TripCreate = {
      destination: destination.trim(),
      starting_city: startingCity.trim() || undefined,
      start_date: startDate,
      end_date: endDate,
      budget: Number(budget) || 30000,
      currency,
      travellers,
      travelers_count: travellers,
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
          budget: Number(budget) || 30000,
          currency,
          travellers,
          travelers_count: travellers,
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

      // 3. Navigate directly to the generated Itinerary View
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
    <div className="main-content" style={{ padding: 'var(--spacing-32) 0' }}>
      <div className="container" style={{ maxWidth: 840 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <span className="text-link-blue" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Personalized Journey Studio
          </span>
          <h1 className="heading-app" style={{ marginTop: 4, marginBottom: 8 }}>
            Plan Your Next Trip with AI
          </h1>
          <p className="text-body">
            Provide your preferred destination, travel pacing, dates, and budget. Our Groq AI engine generates a structured, day-wise schedule with approximate costs and verified waypoints.
          </p>
        </div>

        {error && (
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
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => handleFormSubmit()}
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

        {/* Loading / Generation Progress Modal */}
        {isSubmitting && (
          <div className="modal-backdrop">
            <div
              className="modal-surface"
              style={{
                maxWidth: 480,
                padding: 36,
                textAlign: 'center',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-hopper-blue-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px auto',
                  color: 'var(--color-hopper-blue)',
                }}
              >
                <Sparkles size={28} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--color-ink)' }}>
                Crafting Your Itinerary
              </h2>
              <p style={{ fontSize: 14, color: 'var(--color-graphite)', marginBottom: 24 }}>
                {generationStep}
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <Loader2 size={36} className="spinner" />
              </div>

              <div
                style={{
                  backgroundColor: 'var(--color-cloud)',
                  padding: 12,
                  borderRadius: 10,
                  fontSize: 12,
                  color: 'var(--color-graphite)',
                  textAlign: 'left',
                }}
              >
                <div>✓ Resolving OpenStreetMap coordinates</div>
                <div>✓ Generating realistic daily timeline & activities</div>
                <div>✓ Computing category expenses: transport, food, stays</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Form */}
        <form
          onSubmit={handleFormSubmit}
          style={{
            backgroundColor: 'var(--surface-white-canvas)',
            border: '1px solid var(--color-divider-gray)',
            borderRadius: 'var(--radius-cards)',
            padding: 32,
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
          }}
        >
          {/* Section 1: Where & When */}
          <div style={{ marginBottom: 28 }}>
            <h2 className="heading-section" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <MapPin size={20} color="var(--color-hopper-blue)" />
              <span>1. Destination & Duration</span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Destination City or Region *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Goa, India or Kyoto, Japan"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowDropdown(true);
                  }}
                  required
                />
                {showDropdown && suggestions.length > 0 && (
                  <div className="autocomplete-dropdown">
                    {suggestions.map((p) => (
                      <div
                        key={p.place_id}
                        className="autocomplete-item"
                        onClick={() => {
                          setDestination(p.name);
                          setShowDropdown(false);
                        }}
                      >
                        <MapPin size={14} color="var(--color-hopper-blue)" />
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--color-graphite)' }}>({p.display_name.split(',').slice(-2).join(',')})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Origin City (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Mumbai, Delhi, London"
                  value={startingCity}
                  onChange={(e) => setStartingCity(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--color-cloud)', marginBottom: 28 }} />

          {/* Section 2: Budget & Travelers */}
          <div style={{ marginBottom: 28 }}>
            <h2 className="heading-section" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <DollarSign size={20} color="var(--color-hopper-blue)" />
              <span>2. Budget & Party Size</span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Target Total Budget *</label>
                <input
                  type="number"
                  className="form-input"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  min="1000"
                  step="500"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select
                  className="form-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Travelers</label>
                <input
                  type="number"
                  className="form-input"
                  value={travellers}
                  onChange={(e) => setTravellers(Number(e.target.value))}
                  min="1"
                  max="50"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Pacing & Travel Style</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
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
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-compactcontrols)',
                      border: travelStyle === s.id
                        ? '1.5px solid var(--color-hopper-blue)'
                        : '1px solid var(--color-divider-gray)',
                      backgroundColor: travelStyle === s.id ? 'var(--color-hopper-blue-subtle)' : 'var(--color-white)',
                      color: travelStyle === s.id ? 'var(--color-hopper-blue)' : 'var(--color-ink)',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--color-cloud)', marginBottom: 28 }} />

          {/* Section 3: Interests Tags */}
          <div style={{ marginBottom: 28 }}>
            <h2 className="heading-section" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Tag size={20} color="var(--color-hopper-blue)" />
              <span>3. Interests & Activities</span>
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
                      borderRadius: 'var(--radius-pills)',
                      border: isSelected
                        ? '1px solid var(--color-hopper-blue)'
                        : '1px solid var(--color-divider-gray)',
                      backgroundColor: isSelected ? 'var(--color-hopper-blue)' : 'var(--color-cloud)',
                      color: isSelected ? '#fff' : 'var(--color-ink)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {isSelected && <Check size={13} />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--color-cloud)', marginBottom: 28 }} />

          {/* Section 4: Preferences & Notes */}
          <div style={{ marginBottom: 28 }}>
            <h2 className="heading-section" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <FileText size={20} color="var(--color-hopper-blue)" />
              <span>4. Logistics & Custom Requests</span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Transport Preference</label>
                <select
                  className="form-select"
                  value={transportPreference}
                  onChange={(e) => setTransportPreference(e.target.value)}
                >
                  <option value="flight">Flight</option>
                  <option value="train">Train</option>
                  <option value="driving">Self Drive / Rental Car</option>
                  <option value="public transit">Public Transit / Bus</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Accommodation Category</label>
                <select
                  className="form-select"
                  value={accommodationPreference}
                  onChange={(e) => setAccommodationPreference(e.target.value)}
                >
                  <option value="beach resort">Beach Resort / Luxury Hotel</option>
                  <option value="boutique hotel">Boutique Hotel</option>
                  <option value="heritage haveli">Heritage Haveli / Homestay</option>
                  <option value="hostel">Hostel / Guesthouse</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Dietary Preferences</label>
              <select
                className="form-select"
                value={dietaryPreferences}
                onChange={(e) => setDietaryPreferences(e.target.value)}
              >
                <option value="none">No Restrictions</option>
                <option value="vegetarian">Pure Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="pescatarian">Pescatarian (Seafood)</option>
                <option value="halal">Halal</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Additional Requests or Notes</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="e.g. Planning a romantic sunset dinner at Mandovi river, prefer ground floor stays, want to visit Old Goa churches on Sunday morning..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '12px 32px', fontSize: 16 }}
              disabled={isSubmitting}
            >
              <Sparkles size={18} />
              <span>Generate My Itinerary</span>
            </button>
          </div>
        </form>
      </div>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
          }}
        />
      )}
    </div>
  );
};

export default CreateTripPage;
