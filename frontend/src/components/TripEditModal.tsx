import React, { useState } from 'react';
import { X, Calendar, DollarSign, Users, AlertCircle, Loader2, Save } from 'lucide-react';
import { tripService } from '../services/tripService';
import { TripResponse, TripUpdate } from '../types/api';

interface TripEditModalProps {
  trip: TripResponse;
  onClose: () => void;
  onSuccess: (updated: TripResponse) => void;
}

export const TripEditModal: React.FC<TripEditModalProps> = ({
  trip,
  onClose,
  onSuccess,
}) => {
  const [destination, setDestination] = useState(trip.destination);
  const [startDate, setStartDate] = useState(trip.start_date);
  const [endDate, setEndDate] = useState(trip.end_date);
  const [budget, setBudget] = useState(String(trip.budget));
  const [currency, setCurrency] = useState(trip.currency || 'INR');
  const [travellers, setTravellers] = useState(trip.travellers || 1);
  const [travelStyle, setTravelStyle] = useState(trip.travel_style || 'balanced');
  const [notes, setNotes] = useState(trip.additional_notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const updates: TripUpdate = {
      destination: destination.trim(),
      start_date: startDate,
      end_date: endDate,
      budget: Number(budget) || trip.budget,
      currency,
      travellers,
      travel_style: travelStyle,
      additional_notes: notes.trim() || undefined,
    };

    try {
      const updated = await tripService.updateTrip(trip.id, updates);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.detail ||
        'Failed to update trip. Please verify dates and budget.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-surface" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540, padding: 28 }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: 'var(--color-graphite)',
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-ink)', marginBottom: 8 }}>
          Edit Trip Preferences
        </h2>
        <p style={{ fontSize: 14, color: 'var(--color-graphite)', marginBottom: 20 }}>
          Adjust your journey parameters. You can regenerate itineraries afterwards to match updated constraints.
        </p>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 8,
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Destination</label>
            <input
              type="text"
              className="form-input"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
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

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Estimated Budget</label>
              <input
                type="number"
                className="form-input"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                min="0"
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
            <label className="form-label">Travel Style</label>
            <select
              className="form-select"
              value={travelStyle}
              onChange={(e) => setTravelStyle(e.target.value)}
            >
              <option value="balanced">Balanced & Classic</option>
              <option value="adventure">Adventure & Outdoor</option>
              <option value="cultural">Heritage & Cultural</option>
              <option value="luxury">Luxury & Wellness</option>
              <option value="budget">Backpacker & Budget</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Notes & Requests</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Prefer sea-facing accommodations, vegetarian dining..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Update Preferences</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TripEditModal;
