import React from 'react';
import { ShieldCheck, FileCode } from 'lucide-react';
import BrandLogo from './BrandLogo';

export const Footer: React.FC = () => {
  return (
    <footer style={{ marginTop: 'auto' }}>
      {/* Baseline disclaimer and attribution */}
      <div style={{ backgroundColor: 'var(--color-bg-main)', borderTop: '1px solid var(--color-divider-gray)', padding: '24px 0' }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BrandLogo variant="light" layout="horizontal" emblemHeight={36} fontSize={19} />
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
            <a
              href="https://github.com/pranjal-shrivastava-78/ParyatakRoute"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              title="GitHub Repository"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                color: 'var(--color-graphite)',
                textDecoration: 'none',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-graphite)')}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </a>
            <a
              href="https://paryatakrouteapi.itspranjal.in/docs"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Backend API Documentation"
              title="Backend API Documentation"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                color: 'var(--color-graphite)',
                textDecoration: 'none',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-graphite)')}
            >
              <FileCode size={14} style={{ flexShrink: 0 }} />
              <span>API Docs</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
