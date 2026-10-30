import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import BrandLogo from './BrandLogo';

export const Footer: React.FC = () => {
  return (
    <footer style={{ marginTop: 'auto' }}>
      {/* Link Directory Band on #ededed per DESIGN.md */}
      <div className="link-directory-band">
        <div className="container">
          <div style={{ marginBottom: 'var(--spacing-28)' }}>
            <h3
              style={{
                fontSize: 'var(--text-section-heading)',
                lineHeight: 'var(--leading-section-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-ink)',
                marginBottom: 6,
              }}
            >
              Popular Journeys & Destinations
            </h3>
            <p style={{ fontSize: 14, color: 'var(--color-graphite)' }}>
              Explore AI-curated itineraries across high-altitude peaks, coastal paradises, and heritage circuits.
            </p>
          </div>

          <div className="directory-columns">
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 12 }}>
                Northern Highlands
              </h4>
              <ul className="directory-list">
                <li><Link to="/explore?query=Leh Ladakh" className="directory-link">Leh Ladakh Circuit</Link></li>
                <li><Link to="/explore?query=Manali Himachal" className="directory-link">Manali & Solang Valley</Link></li>
                <li><Link to="/explore?query=Srinagar Kashmir" className="directory-link">Srinagar & Dal Lake</Link></li>
                <li><Link to="/explore?query=Rishikesh Uttarakhand" className="directory-link">Rishikesh Adventure</Link></li>
                <li><Link to="/explore?query=Spiti Valley" className="directory-link">Spiti Trans-Himalaya</Link></li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 12 }}>
                Royal & Cultural Heritage
              </h4>
              <ul className="directory-list">
                <li><Link to="/explore?query=Jaipur Rajasthan" className="directory-link">Jaipur Pink City</Link></li>
                <li><Link to="/explore?query=Udaipur Lakes" className="directory-link">Udaipur City of Lakes</Link></li>
                <li><Link to="/explore?query=Varanasi Ghats" className="directory-link">Varanasi Spiritual Ghats</Link></li>
                <li><Link to="/explore?query=Hampi Karnataka" className="directory-link">Hampi Vijayanagara Ruins</Link></li>
                <li><Link to="/explore?query=Agra Taj Mahal" className="directory-link">Agra Architectural Wonders</Link></li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 12 }}>
                Coastal & Tropical
              </h4>
              <ul className="directory-list">
                <li><Link to="/explore?query=Goa Beaches" className="directory-link">North & South Goa</Link></li>
                <li><Link to="/explore?query=Munnar Kerala" className="directory-link">Munnar Tea Plantations</Link></li>
                <li><Link to="/explore?query=Alleppey Backwaters" className="directory-link">Alleppey Houseboat Trail</Link></li>
                <li><Link to="/explore?query=Andaman Islands" className="directory-link">Havelock & Radhanagar</Link></li>
                <li><Link to="/explore?query=Pondicherry French Quarter" className="directory-link">Puducherry Promenade</Link></li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 12 }}>
                Platform & Data
              </h4>
              <ul className="directory-list">
                <li><a href="https://paryatakrouteapi.itspranjal.in/docs" target="_blank" rel="noopener noreferrer" className="directory-link">Live API Swagger Docs</a></li>
                <li><Link to="/create" className="directory-link">AI Itinerary Planner</Link></li>
                <li><Link to="/explore" className="directory-link">Nominatim Place Geocoding</Link></li>
                <li><Link to="/explore" className="directory-link">Open-Meteo 7-Day Forecast</Link></li>
                <li><Link to="/profile" className="directory-link">Account & Security</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Baseline disclaimer and attribution */}
      <div style={{ backgroundColor: 'var(--color-bg-main)', borderTop: '1px solid var(--color-divider-gray)', padding: '24px 0' }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BrandLogo variant="light" height={40} />
            <span style={{ color: 'var(--color-placeholder-gray)', margin: '0 4px' }}>•</span>
            <span style={{ fontSize: 13, color: 'var(--color-graphite)' }}>
              Intelligent Travel Engine & Real-Time Geospatial System
            </span>
          </div>

          <div style={{ fontSize: 12, color: 'var(--color-graphite)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={14} color="var(--color-success)" />
              Cost figures are AI estimates. Verify bookings with local operators.
            </span>
            <span>
              Geospatial data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
