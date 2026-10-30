import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Sparkles,
  Trash2,
  Edit2,
  Plus,
  Loader2,
  AlertCircle,
  Check,
  ChevronRight,
  Copy,
} from 'lucide-react';
import { tripService } from '../services/tripService';
import { itineraryService } from '../services/itineraryService';
import { TripResponse } from '../types/api';
import { useAuth } from '../context/AuthContext';
import TripEditModal from '../components/TripEditModal';
import AuthModal from '../components/AuthModal';

export const TripsListPage: React.FC = () => {
  const [trips, setTrips] = useState<TripResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Edit Trip Modal state
  const [editingTrip, setEditingTrip] = useState<TripResponse | null>(null);
  const [generatingTripId, setGeneratingTripId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const loadTrips = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await tripService.listTrips(1, 50);
      setTrips(res.trips || res.items || []);
    } catch (err: any) {
      if (!isAuthenticated) {
        setShowAuthModal(true);
      } else {
        const msg =
          err?.response?.data?.error?.message ||
          err?.response?.data?.detail ||
          'Failed to load trips. Please sign in or refresh.';
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, [isAuthenticated]);

  const handleDeleteTrip = async (tripId: string, destination: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Delete trip to "${destination}" and its generated itineraries?`);
    if (!confirmed) return;

    try {
      await tripService.deleteTrip(tripId);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
      setFeedback(`Deleted trip to ${destination}`);
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setError('Could not delete trip.');
    }
  };

  const handleDuplicateTrip = async (tripId: string, destination: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const copy = await tripService.duplicateTrip(tripId);
      setTrips((prev) => [copy, ...prev]);
      setFeedback(`Duplicated trip "${destination}"`);
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setError('Could not duplicate trip.');
    }
  };

  const handleOpenItinerary = async (tripId: string) => {
    setGeneratingTripId(tripId);
    try {
      // Check if itinerary already exists for this trip
      try {
        const existing = await itineraryService.getItineraryByTrip(tripId);
        if (existing?.id) {
          navigate(`/itineraries/${existing.id}`);
          return;
        }
      } catch {
        // Not yet generated, generate now
      }

      // Generate if not present
      const generated = await itineraryService.generateItinerary({
        trip_id: tripId,
        regenerate: false,
      });
      navigate(`/itineraries/${generated.id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Failed to open or generate itinerary.';
      setError(msg);
      setGeneratingTripId(null);
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

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span className="text-link-blue" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Travel Vault
            </span>
            <h1 className="heading-app" style={{ marginTop: 4, marginBottom: 6 }}>
              My Saved Journeys
            </h1>
            <p className="text-body">
              All your planned journeys stored securely in Supabase PostgreSQL with BOLA ownership verification.
            </p>
          </div>

          <Link to="/create" className="btn-primary" style={{ padding: '10px 22px' }}>
            <Plus size={18} />
            <span>Create New Trip</span>
          </Link>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: 'var(--radius-compactcontrols)',
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              fontSize: 14,
              marginBottom: 24,
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Content State */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Loader2 size={36} className="spinner" style={{ margin: '0 auto 16px auto' }} />
            <p style={{ color: 'var(--color-graphite)', fontSize: 15 }}>Loading your saved trips...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="state-empty" style={{ backgroundColor: '#fff', padding: 60 }}>
            <Calendar size={48} color="var(--color-placeholder-gray)" style={{ margin: '0 auto 16px auto' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>No trips planned yet</h2>
            <p style={{ fontSize: 14, color: 'var(--color-graphite)', maxWidth: 440, margin: '0 auto 24px auto' }}>
              Create your first personalized travel itinerary. Pick your destination, dates, and budget, and let Groq AI build your day plan.
            </p>
            <Link to="/create" className="btn-primary" style={{ padding: '10px 24px' }}>
              <Sparkles size={16} />
              <span>Plan My First Trip</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 20 }}>
            {trips.map((trip) => {
              const isOpening = generatingTripId === trip.id;
              return (
                <div
                  key={trip.id}
                  style={{
                    backgroundColor: 'var(--surface-cloud-surface)',
                    border: '1px solid var(--color-divider-gray)',
                    borderRadius: 'var(--radius-cards)',
                    padding: 22,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>
                        {trip.travel_style || 'Balanced'}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setEditingTrip(trip)}
                          title="Edit Trip Details"
                          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-graphite)' }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDuplicateTrip(trip.id, trip.destination, e)}
                          title="Duplicate Trip"
                          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-graphite)' }}
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTrip(trip.id, trip.destination, e)}
                          title="Delete Trip"
                          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-placeholder-gray)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-ink)', marginBottom: 6 }}>
                      {trip.destination}
                    </h3>

                    {trip.starting_city && (
                      <p style={{ fontSize: 13, color: 'var(--color-graphite)', marginBottom: 14 }}>
                        From {trip.starting_city}
                      </p>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--color-graphite)', marginBottom: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={15} color="var(--color-hopper-blue)" />
                        <span>
                          {trip.start_date} to {trip.end_date} ({trip.duration_days} days)
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <DollarSign size={15} color="var(--color-hopper-blue)" />
                        <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>
                          {trip.currency} {trip.budget.toLocaleString()} target budget
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Users size={15} color="var(--color-hopper-blue)" />
                        <span>{trip.travellers} {trip.travellers === 1 ? 'traveler' : 'travelers'}</span>
                      </div>
                    </div>

                    {trip.interests && trip.interests.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                        {trip.interests.slice(0, 3).map((int, i) => (
                          <span key={i} className="badge badge-cloud" style={{ backgroundColor: '#fff', fontSize: 11 }}>
                            {int}
                          </span>
                        ))}
                        {trip.interests.length > 3 && (
                          <span className="badge badge-cloud" style={{ backgroundColor: '#fff', fontSize: 11 }}>
                            +{trip.interests.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenItinerary(trip.id)}
                    className="btn-primary"
                    style={{ width: '100%', height: 42, fontSize: 14 }}
                    disabled={isOpening}
                  >
                    {isOpening ? (
                      <>
                        <Loader2 size={16} className="spinner" />
                        <span>Loading AI Plan...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>View AI Itinerary</span>
                        <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editingTrip && (
        <TripEditModal
          trip={editingTrip}
          onClose={() => setEditingTrip(null)}
          onSuccess={(updated) => {
            setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            setFeedback('Trip updated successfully.');
            setTimeout(() => setFeedback(null), 3000);
          }}
        />
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            loadTrips();
          }}
        />
      )}
    </div>
  );
};

export default TripsListPage;
