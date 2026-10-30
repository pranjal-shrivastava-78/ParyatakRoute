import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  MapPin,
  Trash2,
  Sparkles,
  Search,
  Loader2,
  AlertCircle,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { favouriteService } from '../services/favouriteService';
import { FavouriteResponse } from '../types/api';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

export const SavedPage: React.FC = () => {
  const [favourites, setFavourites] = useState<FavouriteResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const loadFavourites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await favouriteService.listFavourites(1, 50);
      setFavourites(res.items || []);
    } catch (err: any) {
      if (!isAuthenticated) {
        setShowAuthModal(true);
      } else {
        const msg =
          err?.response?.data?.error?.message ||
          err?.response?.data?.detail ||
          'Failed to load bookmarks.';
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFavourites();
  }, [isAuthenticated]);

  const handleRemove = async (favId: string, name: string) => {
    try {
      await favouriteService.removeFavourite(favId);
      setFavourites((prev) => prev.filter((f) => f.id !== favId));
      setFeedback(`Removed "${name}" from saved bookmarks.`);
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setError('Could not remove bookmark.');
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

        <div style={{ marginBottom: 32 }}>
          <span className="text-link-blue" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Personal Bookmarks
          </span>
          <h1 className="heading-app" style={{ marginTop: 4, marginBottom: 6 }}>
            Saved Destinations & Attractions
          </h1>
          <p className="text-body">
            Places bookmarked during exploration. Convert any saved destination into a complete AI itinerary in one click.
          </p>
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

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Loader2 size={36} className="spinner" style={{ margin: '0 auto 16px auto' }} />
            <p style={{ color: 'var(--color-graphite)', fontSize: 15 }}>Loading saved places...</p>
          </div>
        ) : favourites.length === 0 ? (
          <div className="state-empty" style={{ backgroundColor: '#fff', padding: 60 }}>
            <Heart size={48} color="var(--color-placeholder-gray)" style={{ margin: '0 auto 16px auto' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>No saved destinations yet</h2>
            <p style={{ fontSize: 14, color: 'var(--color-graphite)', maxWidth: 420, margin: '0 auto 20px auto' }}>
              Explore cities and attractions or browse trending destinations to bookmark your dream travel spots.
            </p>
            <Link to="/explore" className="btn-primary" style={{ padding: '10px 22px' }}>
              <Search size={16} />
              <span>Explore Destinations</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 20 }}>
            {favourites.map((fav) => (
              <div
                key={fav.id}
                style={{
                  backgroundColor: 'var(--surface-cloud-surface)',
                  border: '1px solid var(--color-divider-gray)',
                  borderRadius: 'var(--radius-cards)',
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <span className="badge badge-blue">
                      {fav.type || fav.category || 'Destination'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(fav.id, fav.name)}
                      title="Remove bookmark"
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-placeholder-gray)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 6 }}>
                    {fav.name}
                  </h3>

                  {fav.display_name && (
                    <p style={{ fontSize: 13, color: 'var(--color-graphite)', marginBottom: 12, lineHeight: 1.4 }}>
                      {fav.display_name}
                    </p>
                  )}

                  {fav.notes && (
                    <div
                      style={{
                        backgroundColor: '#fff',
                        border: '1px solid var(--color-divider-gray)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 12,
                        color: 'var(--color-graphite)',
                        marginBottom: 14,
                      }}
                    >
                      💡 {fav.notes}
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: 'var(--color-graphite)', marginBottom: 16 }}>
                    Coordinates: {fav.latitude.toFixed(4)}° N, {fav.longitude.toFixed(4)}° E
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/create?destination=${encodeURIComponent(fav.name)}`)}
                    className="btn-primary"
                    style={{ flex: 1, height: 40, fontSize: 13 }}
                  >
                    <Sparkles size={14} />
                    <span>Plan Trip Here</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/explore?query=${encodeURIComponent(fav.name)}`)}
                    className="btn-secondary"
                    style={{ padding: '8px 12px', fontSize: 13 }}
                    title="View Weather & Route"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            loadFavourites();
          }}
        />
      )}
    </div>
  );
};

export default SavedPage;
