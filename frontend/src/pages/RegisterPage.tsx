import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Compass, Mail, Lock, User, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../services/authService';
import BrandLogo from '../components/BrandLogo';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/trips';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to terms and conditions');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await register(name.trim(), email.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
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
          maxWidth: 480,
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
            Start your travel journey
          </h1>
          <p style={{ color: 'var(--color-graphite)', fontSize: 14, marginTop: 4 }}>
            Create an account to save custom itineraries, sync bookmarks, and track your travel memories.
          </p>
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
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={16}
                color="var(--color-graphite)"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rohan Verma"
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
                placeholder="rohan@example.com"
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
              Create Password
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
                placeholder="At least 8 characters"
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
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                color="var(--color-graphite)"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              style={{ accentColor: 'var(--color-hopper-blue)', width: 16, height: 16 }}
            />
            <label htmlFor="terms" style={{ fontSize: 13, color: 'var(--color-graphite)', cursor: 'pointer' }}>
              I agree to ParyatakRoute's Terms of Service and Privacy Policy
            </label>
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
                <UserPlus size={16} />
                <span>Create Free Account</span>
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-24)', fontSize: 14, color: 'var(--color-graphite)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-hopper-blue)', fontWeight: 600, textDecoration: 'none' }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
