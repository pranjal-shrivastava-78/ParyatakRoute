import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu if window resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          <div className="app-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-12)' }}>
            {isAuthenticated ? (
              <div className="nav-actions-desktop" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)' }}>
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
              <div className="nav-actions-desktop" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)' }}>
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
              className={`mobile-hamburger-btn ${mobileMenuOpen ? 'menu-open' : ''}`}
              id="mobile-nav-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              <span className="hamburger-icon-wrapper">
                {mobileMenuOpen ? (
                  <X size={22} strokeWidth={2.3} className="hamburger-icon icon-close" />
                ) : (
                  <Menu size={22} strokeWidth={2.3} className="hamburger-icon icon-menu" />
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu with Backdrop */}
        {mobileMenuOpen && (
          <>
            <div
              className="mobile-nav-backdrop"
              onClick={closeMobileMenu}
              aria-hidden="true"
            />
            <div className="mobile-nav-panel">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className={`mobile-nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                <Home size={18} />
                <span>Home</span>
              </Link>
              <Link
                to="/explore"
                onClick={closeMobileMenu}
                className={`mobile-nav-link ${location.pathname === '/explore' ? 'active' : ''}`}
              >
                <MapPin size={18} />
                <span>Explore</span>
              </Link>
              <Link
                to="/plan-trip"
                onClick={closeMobileMenu}
                className={`mobile-nav-link ${location.pathname === '/plan-trip' || location.pathname === '/create' ? 'active' : ''}`}
              >
                <Sparkles size={18} />
                <span>Plan Trip</span>
              </Link>
              <Link
                to="/chat"
                onClick={closeMobileMenu}
                className={`mobile-nav-link ${location.pathname === '/chat' ? 'active' : ''}`}
              >
                <MessageSquare size={18} />
                <span>AI Assistant</span>
              </Link>
              <Link
                to="/trips"
                onClick={closeMobileMenu}
                className={`mobile-nav-link ${location.pathname.startsWith('/trips') ? 'active' : ''}`}
              >
                <Calendar size={18} />
                <span>My Trips</span>
              </Link>
              <Link
                to="/saved"
                onClick={closeMobileMenu}
                className={`mobile-nav-link ${location.pathname === '/saved' || location.pathname === '/favourites' ? 'active' : ''}`}
              >
                <Heart size={18} />
                <span>Saved</span>
              </Link>

              <div className="mobile-nav-divider" />

              {isAuthenticated ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Link
                    to="/profile"
                    onClick={closeMobileMenu}
                    className="btn-secondary"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      padding: '12px',
                      fontSize: 15,
                      fontWeight: 600,
                    }}
                  >
                    <User size={16} />
                    <span>My Profile ({user?.name?.split(' ')[0] || 'Account'})</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                    }}
                    className="btn-secondary"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      padding: '12px',
                      fontSize: 15,
                      color: 'var(--color-danger, #D9383A)',
                      borderColor: 'rgba(217, 56, 58, 0.3)',
                    }}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="btn-secondary"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      padding: '12px',
                      fontSize: 15,
                      fontWeight: 600,
                    }}
                  >
                    <LogIn size={16} />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      padding: '12px',
                      fontSize: 15,
                      fontWeight: 600,
                    }}
                  >
                    <Sparkles size={16} />
                    <span>Join Free</span>
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </header>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
};

export default Navbar;
