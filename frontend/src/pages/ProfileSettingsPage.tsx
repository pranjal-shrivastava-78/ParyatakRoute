import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Edit2,
  Check,
  CheckCircle2,
  AlertCircle,
  LogOut,
  MapPin,
  Calendar,
  Loader2,
  Activity,
  Globe,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../services/apiClient';
import { tripService } from '../services/tripService';
import { favouriteService } from '../services/favouriteService';
import AuthModal from '../components/AuthModal';

export const ProfileSettingsPage: React.FC = () => {
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Real account metrics
  const [tripsCount, setTripsCount] = useState<number | null>(null);
  const [favouritesCount, setFavouritesCount] = useState<number | null>(null);

  useEffect(() => {
    if (user?.name) {
      setNameInput(user.name);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      tripService
        .listTrips(1, 1)
        .then((res) => setTripsCount(res.total))
        .catch(() => setTripsCount(0));

      favouriteService
        .listFavourites(1, 1)
        .then((res) => setFavouritesCount(res.total))
        .catch(() => setFavouritesCount(0));
    }
  }, [isAuthenticated]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || nameInput.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await updateProfile({ name: nameInput.trim() });
      setIsEditing(false);
      setFeedback('Profile name updated successfully.');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to update profile';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="main-content" style={{ padding: '60px 0' }}>
        <div className="container" style={{ maxWidth: 540 }}>
          <div className="state-empty" style={{ backgroundColor: '#fff', padding: 48 }}>
            <User size={48} color="var(--color-placeholder-gray)" style={{ margin: '0 auto 16px auto' }} />
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Sign In to View Profile</h2>
            <p style={{ fontSize: 14, color: 'var(--color-graphite)', marginBottom: 20 }}>
              Access your saved journeys, token sessions, and travel preferences.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="btn-primary"
              style={{ padding: '10px 24px' }}
            >
              Sign In / Register
            </button>
          </div>
        </div>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </div>
    );
  }

  return (
    <div className="main-content" style={{ padding: 'var(--spacing-32) 0' }}>
      <div className="container" style={{ maxWidth: 780 }}>
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
        <div style={{ marginBottom: 32 }}>
          <span className="text-link-blue" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Account & Security
          </span>
          <h1 className="heading-app" style={{ marginTop: 4, marginBottom: 6 }}>
            Profile Settings
          </h1>
          <p className="text-body">
            Manage your authenticated traveller identity, credentials, and synchronized travel vault.
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger)',
              borderRadius: 'var(--radius-compactcontrols)',
              padding: '12px 16px',
              color: 'var(--color-danger)',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 20,
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Card */}
        <div
          style={{
            backgroundColor: 'var(--surface-white-canvas)',
            border: '1px solid var(--color-divider-gray)',
            borderRadius: 'var(--radius-cards)',
            padding: 28,
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                backgroundColor: 'var(--color-hopper-blue-subtle)',
                color: 'var(--color-hopper-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                fontWeight: 800,
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div style={{ flex: 1, minWidth: 240 }}>
              {isEditing ? (
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="form-input"
                    style={{ fontSize: 18, fontWeight: 700, padding: '6px 12px' }}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ padding: '7px 16px', fontSize: 13 }}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 size={14} className="spinner" /> : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setNameInput(user.name);
                    }}
                    className="btn-secondary"
                    style={{ padding: '7px 12px', fontSize: 13 }}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-ink)' }}>
                    {user.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    title="Edit Name"
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-graphite)' }}
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              )}

              <p style={{ fontSize: 14, color: 'var(--color-graphite)' }}>
                {user.email}
              </p>

              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {user.email === 'demo@paryatakroute.in' && (
                  <span
                    className="badge"
                    style={{
                      backgroundColor: 'rgba(24, 61, 50, 0.1)',
                      color: 'var(--color-primary, #183D32)',
                      border: '1px solid var(--color-primary, #183D32)',
                      fontWeight: 700,
                    }}
                  >
                    Protected Demo Account
                  </span>
                )}
                <span className="badge badge-verified">
                  <CheckCircle2 size={12} />
                  <span>Role: {user.role}</span>
                </span>
                <span className="badge badge-blue">
                  <span>Status: {user.status}</span>
                </span>
              </div>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--color-cloud)', marginBottom: 20 }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, fontSize: 14 }}>
            <div>
              <div style={{ color: 'var(--color-graphite)', fontSize: 12 }}>User ID (UUID)</div>
              <div style={{ fontWeight: 600, color: 'var(--color-ink)', wordBreak: 'break-all', marginTop: 2 }}>
                {user.id}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--color-graphite)', fontSize: 12 }}>Authentication Protocol</div>
              <div style={{ fontWeight: 600, color: 'var(--color-ink)', marginTop: 2 }}>
                JWT Bearer (FastAPI & Supabase RLS)
              </div>
            </div>
          </div>
        </div>

        {/* Real Account Vault Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-white-canvas)',
              border: '1px solid var(--color-divider-gray)',
              borderRadius: 'var(--radius-cards)',
              padding: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: 'var(--color-hopper-blue-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-hopper-blue)',
              }}
            >
              <Calendar size={22} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-ink)' }}>
                {tripsCount !== null ? tripsCount : '...'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-graphite)' }}>Personal Trips in Vault</div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface-white-canvas)',
              border: '1px solid var(--color-divider-gray)',
              borderRadius: 'var(--radius-cards)',
              padding: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: 'var(--color-danger-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-danger)',
              }}
            >
              <MapPin size={22} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-ink)' }}>
                {favouritesCount !== null ? favouritesCount : '...'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-graphite)' }}>Bookmarked Destinations</div>
            </div>
          </div>
        </div>

        {/* Backend Connectivity Info */}
        <div
          style={{
            backgroundColor: 'var(--surface-cloud-surface)',
            border: '1px solid var(--color-divider-gray)',
            borderRadius: 'var(--radius-cards)',
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 12 }}>
            Connected API Services
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, border: '1px solid var(--color-divider-gray)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={16} color="var(--color-success)" />
                <span style={{ fontWeight: 600 }}>Backend Base URL</span>
              </div>
              <code style={{ fontSize: 12, color: 'var(--color-graphite)' }}>{API_BASE_URL}</code>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, border: '1px solid var(--color-divider-gray)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={16} color="var(--color-hopper-blue)" />
                <span style={{ fontWeight: 600 }}>Database Security</span>
              </div>
              <span className="badge badge-verified">Supabase PostgreSQL + RLS</span>
            </div>
          </div>
        </div>

        {/* Logout Control */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleLogout}
            className="btn-secondary"
            style={{ color: 'var(--color-danger)', borderColor: 'var(--color-divider-gray)' }}
          >
            <LogOut size={16} />
            <span>Sign Out from Device</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
