import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Compass, Mail, Lock, LogIn, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../services/authService';
import BrandLogo from '../components/BrandLogo';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
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

  const handleFillDemo = () => {
    setEmail('traveler@paryatakroute.org');
    setPassword('Paryatak@2026');
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
        padding: 'var(--spacing-32) var(--spacing-16)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          border: '1px solid var(--color-divider-gray)',
          borderRadius: 'var(--radius-cards)',
          padding: 'var(--spacing-32)',
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

        {/* Demo Fast Track Pill */}
        <div
          style={{
            backgroundColor: 'var(--color-cloud)',
            border: '1px solid var(--color-divider-gray)',
            borderRadius: 'var(--radius-compactcontrols)',
            padding: '10px 14px',
            marginBottom: 'var(--spacing-20)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--color-graphite)' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>Testing?</span> Auto-fill sample credentials
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            style={{
              background: 'none',
              border: '1px solid var(--color-hopper-blue)',
              color: 'var(--color-hopper-blue)',
              borderRadius: 'var(--radius-pills)',
              padding: '3px 10px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Fill Demo
          </button>
        </div>

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
