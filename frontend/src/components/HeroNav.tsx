import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Sparkles, MapPin, Calendar, Heart, User, LogIn, MessageSquare, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';

interface HeroNavProps {
  onOpenAuth: () => void;
  activeService: 'trips' | 'explore' | 'stays';
  onSelectService: (service: 'trips' | 'explore' | 'stays') => void;
}

export const HeroNav: React.FC<HeroNavProps> = ({
  onOpenAuth,
  activeService,
  onSelectService,
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="hero-nav-bar">
      {/* Brand */}
      <BrandLogo variant="dark" height={42} />

      {/* Transparent Product Navigation per DESIGN.md */}
      <nav className="hero-product-nav">
        <button
          type="button"
          onClick={() => {
            onSelectService('trips');
            navigate('/create');
          }}
          className={`hero-nav-item ${activeService === 'trips' ? 'active' : ''}`}
        >
          <Sparkles size={16} />
          <span>Plan Itinerary</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSelectService('explore');
            navigate('/explore');
          }}
          className={`hero-nav-item ${activeService === 'explore' ? 'active' : ''}`}
        >
          <MapPin size={16} />
          <span>Explore Places</span>
        </button>

        <Link to="/chat" className="hero-nav-item">
          <MessageSquare size={16} />
          <span>AI Assistant</span>
        </Link>

        {isAuthenticated ? (
          <>
            <Link to="/trips" className="hero-nav-item">
              <Calendar size={16} />
              <span>My Trips</span>
            </Link>
            <Link to="/saved" className="hero-nav-item">
              <Heart size={16} />
              <span>Saved</span>
            </Link>
          </>
        ) : (
          <Link to="/create" className="hero-nav-item" title="No account needed to plan">
            <Calendar size={16} />
            <span>Instant Plan</span>
          </Link>
        )}
      </nav>

      {/* Actions */}
      <div className="hero-actions">
        <button
          type="button"
          className="btn-circle-utility"
          title="Global Geospatial Coverage (OpenStreetMap / OSRM)"
          aria-label="Language and currency"
        >
          <Globe size={18} />
        </button>

        {isAuthenticated ? (
          <Link to="/profile" className="btn-hero-outline">
            <User size={16} />
            <span>{user?.name?.split(' ')[0] || 'Profile'}</span>
          </Link>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onOpenAuth}
              className="btn-hero-outline"
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroNav;
