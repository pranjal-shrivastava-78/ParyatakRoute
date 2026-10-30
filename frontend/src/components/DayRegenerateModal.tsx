import React, { useState } from 'react';
import { X, Sparkles, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { itineraryService } from '../services/itineraryService';
import { ItineraryResponse } from '../types/api';

interface DayRegenerateModalProps {
  itineraryId: string;
  dayNumber: number;
  currentTheme?: string | null;
  onClose: () => void;
  onSuccess: (updatedItinerary: ItineraryResponse) => void;
}

export const DayRegenerateModal: React.FC<DayRegenerateModalProps> = ({
  itineraryId,
  dayNumber,
  currentTheme,
  onClose,
  onSuccess,
}) => {
  const [instruction, setInstruction] = useState('');
  const [pacing, setPacing] = useState('moderate');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleInstructions = [
    'Focus on relaxed cafes, handicraft bazaars, and photography.',
    'Swap heavy outdoor hikes for indoor cultural museums and art galleries.',
    'Include authentic street food crawl and sunset viewpoint.',
    'Adjust for rainy or cold weather with indoor cultural experiences.',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const updated = await itineraryService.regenerateDay(itineraryId, dayNumber, {
        instruction: instruction.trim() || undefined,
        preferences: { pacing },
      });
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.detail ||
        'Failed to regenerate day. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-surface" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, padding: 'clamp(18px, 4.5vw, 28px)' }}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
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
            <Sparkles size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-ink)' }}>
              Regenerate Day {dayNumber} Plan
            </h2>
            {currentTheme && (
              <p style={{ fontSize: 13, color: 'var(--color-graphite)' }}>Current theme: {currentTheme}</p>
            )}
          </div>
        </div>

        <p style={{ fontSize: 14, color: 'var(--color-graphite)', marginBottom: 20 }}>
          Surgically rewrite this single day using Groq AI without touching the rest of your itinerary schedule or bookings.
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
            <label className="form-label">Custom Instruction for Groq AI</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="e.g. Swap high-altitude hiking for monastery tours and local tea houses..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-graphite)', display: 'block', marginBottom: 6 }}>
              Quick Suggestions:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sampleInstructions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInstruction(s)}
                  style={{
                    fontSize: 12,
                    textAlign: 'left',
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--color-divider-gray)',
                    backgroundColor: 'var(--color-cloud)',
                    color: 'var(--color-ink)',
                    cursor: 'pointer',
                  }}
                >
                  "{s}"
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Day Pacing</label>
            <select
              className="form-select"
              value={pacing}
              onChange={(e) => setPacing(e.target.value)}
            >
              <option value="relaxed">Relaxed & Leisurely (1-2 places)</option>
              <option value="moderate">Moderate & Balanced (3-4 places)</option>
              <option value="packed">Packed & Energetic (5+ places)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  <span>Re-planning Day {dayNumber}...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  <span>Regenerate Day</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DayRegenerateModal;
