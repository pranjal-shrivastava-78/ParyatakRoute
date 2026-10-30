import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Compass,
  MapPin,
  Calendar,
  Heart,
  User,
  LogIn,
  LogOut,
  Sparkles,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import BrandLogo from './BrandLogo';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="app-header">
        <div className="container app-header-inner">
          <BrandLogo variant="light" layout="horizontal" emblemHeight={42} fontSize={22} />

          {/* Desktop Navigation Links: Home, Explore, Plan Trip, AI Assistant, My Trips, Saved */}
          <nav className="nav-links-standard">
            <Link
              to="/"
              className={`nav-link-standard ${location.pathname === '/' ? 'active' : ''}`}
            >
              <Home size={16} style={{ display: 'inline', marginRight: 4 }} />
              Home
            </Link>
            <Link
              to="/explore"
              className={`nav-link-standard ${location.pathname === '/explore' ? 'active' : ''}`}
            >
              <MapPin size={16} style={{ display: 'inline', marginRight: 4 }} />
              Explore
            </Link>
            <Link
              to="/plan-trip"
              className={`nav-link-standard ${location.pathname === '/plan-trip' || location.pathname === '/create' || location.pathname === '/trips/create' ? 'active' : ''}`}
            >
              <Sparkles size={16} style={{ display: 'inline', marginRight: 4 }} />
              Plan Trip
            </Link>
            <Link
              to="/chat"
              className={`nav-link-standard ${location.pathname === '/chat' ? 'active' : ''}`}
            >
              <MessageSquare size={16} style={{ display: 'inline', marginRight: 4 }} />
              AI Assistant
            </Link>
            <Link
              to="/trips"
              className={`nav-link-standard ${location.pathname.startsWith('/trips') && location.pathname !== '/trips/create' ? 'active' : ''}`}
            >
              <Calendar size={16} style={{ display: 'inline', marginRight: 4 }} />
              My Trips
            </Link>
            <Link
              to="/saved"
              className={`nav-link-standard ${location.pathname === '/saved' || location.pathname === '/favourites' ? 'active' : ''}`}
            >
              <Heart size={16} style={{ display: 'inline', marginRight: 4 }} />
              Saved
            </Link>
          </nav>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-12)' }}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)' }}>
                <Link to="/profile" className="btn-secondary" style={{ padding: '7px 16px', fontSize: 14 }}>
                  <User size={15} />
                  <span>{user?.name?.split(' ')[0] || 'Account'}</span>
                </Link>
                <button
                  onClick={logout}
                  className="btn-secondary"
                  title="Sign out"
                  style={{ padding: '7px 12px' }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)' }}>
                <Link
                  to="/login"
                  className="btn-secondary"
                  style={{ padding: '7px 14px', fontSize: 14, textDecoration: 'none' }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                  style={{ padding: '7px 16px', fontSize: 14, textDecoration: 'none' }}
                >
                  Join Free
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="btn-circle-utility"
              style={{
                display: 'none',
                color: 'var(--color-ink)',
                borderColor: 'var(--color-divider-gray)',
              }}
              id="mobile-nav-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            style={{
              backgroundColor: 'var(--surface-white-canvas)',
              borderBottom: '1px solid var(--color-divider-gray)',
              padding: 'var(--spacing-16)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-12)',
            }}
          >
            <Link
              to="/"
              onClick={closeMobileMenu}
              className={`nav-link-standard ${location.pathname === '/' ? 'active' : ''}`}
              style={{ padding: '10px 14px' }}
            >
              <Home size={16} style={{ display: 'inline', marginRight: 8 }} />
              Home
            </Link>
            <Link
              to="/explore"
              onClick={closeMobileMenu}
              className={`nav-link-standard ${location.pathname === '/explore' ? 'active' : ''}`}
              style={{ padding: '10px 14px' }}
            >
              <MapPin size={16} style={{ display: 'inline', marginRight: 8 }} />
              Explore
            </Link>
            <Link
              to="/plan-trip"
              onClick={closeMobileMenu}
              className={`nav-link-standard ${location.pathname === '/plan-trip' || location.pathname === '/create' ? 'active' : ''}`}
              style={{ padding: '10px 14px' }}
            >
              <Sparkles size={16} style={{ display: 'inline', marginRight: 8 }} />
              Plan Trip
            </Link>
            <Link
              to="/chat"
              onClick={closeMobileMenu}
              className={`nav-link-standard ${location.pathname === '/chat' ? 'active' : ''}`}
              style={{ padding: '10px 14px' }}
            >
              <MessageSquare size={16} style={{ display: 'inline', marginRight: 8 }} />
              AI Assistant
            </Link>
            <Link
              to="/trips"
              onClick={closeMobileMenu}
              className={`nav-link-standard ${location.pathname.startsWith('/trips') ? 'active' : ''}`}
              style={{ padding: '10px 14px' }}
            >
              <Calendar size={16} style={{ display: 'inline', marginRight: 8 }} />
              My Trips
            </Link>
            <Link
              to="/saved"
              onClick={closeMobileMenu}
              className={`nav-link-standard ${location.pathname === '/saved' || location.pathname === '/favourites' ? 'active' : ''}`}
              style={{ padding: '10px 14px' }}
            >
              <Heart size={16} style={{ display: 'inline', marginRight: 8 }} />
              Saved
            </Link>
            {isAuthenticated ? (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Link
                  to="/profile"
                  onClick={closeMobileMenu}
                  className="btn-secondary"
                  style={{ flex: 1, textAlign: 'center', padding: '10px' }}
                >
                  <User size={16} style={{ display: 'inline', marginRight: 6 }} />
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeMobileMenu();
                  }}
                  className="btn-secondary"
                  style={{ padding: '10px 14px' }}
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="btn-secondary"
                  style={{ flex: 1, textAlign: 'center', padding: '10px' }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="btn-primary"
                  style={{ flex: 1, textAlign: 'center', padding: '10px' }}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
};

export default Navbar;
