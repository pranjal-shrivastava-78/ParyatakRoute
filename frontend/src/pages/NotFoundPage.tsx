import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, MapPin, Sparkles, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
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
          maxWidth: 580,
          textAlign: 'center',
          border: '1px solid var(--color-divider-gray)',
          borderRadius: 'var(--radius-images)', // 32px
          padding: 'var(--spacing-48) var(--spacing-32)',
          backgroundColor: 'var(--color-cloud)',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 'var(--radius-pills)',
            backgroundColor: 'var(--color-hopper-blue-subtle)',
            color: 'var(--color-hopper-blue)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'var(--spacing-20)',
          }}
        >
          <Compass size={36} />
        </div>

        <h1
          style={{
            fontSize: 'var(--text-app-heading)',
            fontWeight: 'var(--font-weight-extrabold)',
            color: 'var(--color-ink)',
            marginBottom: 8,
          }}
        >
          404 — Lost on the Trail?
        </h1>

        <p
          style={{
            color: 'var(--color-graphite)',
            fontSize: 16,
            lineHeight: 1.5,
            maxWidth: 440,
            margin: '0 auto var(--spacing-32) auto',
          }}
        >
          The destination or itinerary you are trying to visit has either shifted coordinates or does not exist in our global registry.
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--spacing-12)',
            flexWrap: 'wrap',
          }}
        >
          <Link
            to="/"
            className="btn-primary"
            style={{
              padding: '10px 22px',
              fontSize: 14,
              borderRadius: 'var(--radius-pills)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'none',
            }}
          >
            <Home size={15} />
            <span>Return to Homepage</span>
          </Link>

          <Link
            to="/explore"
            className="btn-secondary"
            style={{
              padding: '10px 20px',
              fontSize: 14,
              borderRadius: 'var(--radius-pills)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'none',
            }}
          >
            <MapPin size={15} />
            <span>Explore Places</span>
          </Link>

          <Link
            to="/create"
            className="btn-secondary"
            style={{
              padding: '10px 20px',
              fontSize: 14,
              borderRadius: 'var(--radius-pills)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'none',
            }}
          >
            <Sparkles size={15} />
            <span>Plan New Trip</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
