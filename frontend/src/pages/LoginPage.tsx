import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Compass, Mail, Lock, LogIn, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../services/authService';
import BrandLogo from '../components/BrandLogo';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/trips';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both your email and password');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryDemo = () => {
    setEmail('demo@paryatakroute.in');
    setPassword('Paryatak@Demo2026');
    setDemoNotice('Demo account – No registration required.');
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 80px)',
        backgroundColor: 'var(--surface-white-canvas)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(16px, 4vw, 32px) clamp(12px, 3.5vw, 16px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          border: '1px solid var(--color-divider-gray)',
          borderRadius: 'var(--radius-cards)',
          padding: 'clamp(20px, 5vw, 32px) clamp(16px, 4.5vw, 32px)',
          backgroundColor: 'var(--surface-white-canvas)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-28)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <BrandLogo variant="light" layout="vertical" emblemHeight={54} fontSize={24} withTagline={true} />
          </div>
          <h1 style={{ fontSize: 'var(--text-card-heading)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-ink)' }}>
            Welcome back, traveler
          </h1>
          <p style={{ color: 'var(--color-graphite)', fontSize: 14, marginTop: 4 }}>
            Sign in to access your saved itineraries and sync personal trip vaults.
          </p>
        </div>

        {/* Prominent & Elegant Try Demo Account Card */}
        <div
          style={{
            backgroundColor: 'var(--color-cloud, #F7F5EF)',
            border: '1.5px solid var(--color-primary, #183D32)',
            borderRadius: 'var(--radius-cards, 12px)',
            padding: '14px 16px',
            marginBottom: 'var(--spacing-20, 20px)',
            boxShadow: '0 2px 8px rgba(24, 61, 50, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={16} color="var(--color-accent, #D97745)" />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-primary, #183D32)' }}>
                Instant Preview Access
              </span>
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '2px 7px',
                borderRadius: 10,
                backgroundColor: 'rgba(217, 119, 69, 0.12)',
                color: 'var(--color-accent, #D97745)',
              }}
            >
              Demo Ready
            </span>
          </div>

          <p style={{ fontSize: 12, color: 'var(--color-graphite)', marginBottom: 12, lineHeight: 1.4 }}>
            Explore pre-loaded itineraries (Jaipur, Goa, Manali), test AI features, and review trip vaults.
          </p>

          <button
            type="button"
            onClick={handleTryDemo}
            style={{
              width: '100%',
              backgroundColor: 'var(--color-primary, #183D32)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-pills, 9999px)',
              padding: '9px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.92')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <Sparkles size={14} />
            <span>Try Demo Account</span>
          </button>
        </div>

        {demoNotice && (
          <div
            style={{
              backgroundColor: '#EBF5F0',
              border: '1px solid #183D32',
              borderRadius: 'var(--radius-compactcontrols, 8px)',
              padding: '10px 14px',
              color: '#183D32',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 'var(--spacing-16, 16px)',
            }}
          >
            <CheckCircle2 size={16} color="var(--color-success, #2E7D32)" style={{ flexShrink: 0 }} />
            <span>
              {demoNotice} Click <strong>Sign In</strong> below to continue.
            </span>
          </div>
        )}

        {error && (
          <div
            style={{
              backgroundColor: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger)',
              borderRadius: 'var(--radius-compactcontrols)',
              padding: '10px 14px',
              color: 'var(--color-danger)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 'var(--spacing-16)',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 6 }}>
              Email address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                color="var(--color-graphite)"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                required
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  borderRadius: 'var(--radius-compactcontrols)',
                  border: '1px solid var(--color-divider-gray)',
                  fontSize: 15,
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-hopper-blue)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-divider-gray)')}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                color="var(--color-graphite)"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  borderRadius: 'var(--radius-compactcontrols)',
                  border: '1px solid var(--color-divider-gray)',
                  fontSize: 15,
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-hopper-blue)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-divider-gray)')}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: 15,
              borderRadius: 'var(--radius-pills)',
              marginTop: 'var(--spacing-8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {isLoading ? (
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            ) : (
              <>
                <LogIn size={16} />
                <span>Sign In to ParyatakRoute</span>
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-24)', fontSize: 14, color: 'var(--color-graphite)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-hopper-blue)', fontWeight: 600, textDecoration: 'none' }}>
            Create one free
          </Link>
        </div>

        <div style={{ borderTop: '1px solid var(--color-divider-gray)', marginTop: 'var(--spacing-24)', paddingTop: 'var(--spacing-16)', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--color-graphite)' }}>
            Just exploring? You can{' '}
            <Link to="/create" style={{ color: 'var(--color-hopper-blue)', fontWeight: 600, textDecoration: 'none' }}>
              generate an itinerary
            </Link>{' '}
            without signing in.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
