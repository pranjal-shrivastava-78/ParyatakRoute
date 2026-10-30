import React from 'react';
import { Link } from 'react-router-dom';
import emblemLight from '../assets/emblem-light.png';
import emblemDark from '../assets/emblem-dark.png';

export interface BrandLogoProps {
  /**
   * 'light': for light surfaces (Warm Ivory, white, Sand Beige)
   * 'dark': for dark surfaces (Forest Green banners, dark cards, overlays)
   */
  variant?: 'light' | 'dark';
  /**
   * 'horizontal': [ Compass Pin Emblem ] [ ParyatakRoute ] (default, recommended for Navbar & Footer)
   * 'vertical': Compass Pin above ParyatakRoute wordmark (recommended for Auth, hero, standalone)
   * 'emblem-only': Compass Pin emblem icon only (recommended for AI assistant avatar, compact spots)
   */
  layout?: 'horizontal' | 'vertical' | 'emblem-only';
  /** Height in pixels of the pin emblem icon. Default: 40px for horizontal, 54px for vertical. */
  emblemHeight?: number;
  /** Alias for emblemHeight */
  height?: number;
  /** Font size in pixels for the wordmark. Default: 23px for horizontal. */
  fontSize?: number;
  /** Whether to show the official tagline: "YOUR JOURNEY, INTELLIGENTLY PLANNED." */
  withTagline?: boolean;
  /** Whether clicking navigates to homepage. Default: true. */
  clickable?: boolean;
  /** Target route if clickable. Default: '/'. */
  to?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Official ParyatakRoute Brand Identity & Logo Component
 * Strict Requirement:
 * - Employs the exact compass-and-landscape pin emblem extracted from user-provided assets
 * - Light variant: light logo pin emblem + dark green wordmark with terracotta 'Route'
 * - Dark variant: dark logo pin emblem + white wordmark with terracotta 'Route'
 * - Clean horizontal lockup for Navbar: [ Compass Pin Icon ] [ ParyatakRoute ]
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'light',
  layout = 'horizontal',
  emblemHeight,
  height,
  fontSize,
  withTagline = false,
  clickable = true,
  to = '/',
  className = '',
  style = {},
}) => {
  const isDark = variant === 'dark';
  const emblemSrc = isDark ? emblemDark : emblemLight;

  // Sizing defaults based on layout
  const resolvedEmblemHeight =
    emblemHeight ||
    height ||
    (layout === 'vertical' ? 56 : layout === 'emblem-only' ? 36 : 42);

  const resolvedFontSize =
    fontSize || (layout === 'vertical' ? 24 : 22);

  // Colors based on variant contrast
  const paryatakColor = isDark ? '#FFFFFF' : '#183D32';
  const routeColor = '#D97745'; // Official Terracotta accent
  const taglineColor = isDark ? 'rgba(255, 255, 255, 0.8)' : '#53635B';

  // Standalone Compass Pin Emblem Element
  const emblemElement = (
    <img
      src={emblemSrc}
      alt="ParyatakRoute Compass Pin Emblem"
      style={{
        height: `${resolvedEmblemHeight}px`,
        width: 'auto',
        aspectRatio: '0.81',
        objectFit: 'contain',
        display: 'block',
        flexShrink: 0,
      }}
      className="paryatak-emblem"
    />
  );

  // Wordmark element
  const wordmarkElement = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: layout === 'vertical' ? 'center' : 'flex-start',
        lineHeight: 1,
      }}
    >
      <span
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: `${resolvedFontSize}px`,
          fontWeight: 800,
          letterSpacing: '-0.025em',
          display: 'inline-flex',
          alignItems: 'baseline',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color: paryatakColor }}>Paryatak</span>
        <span style={{ color: routeColor }}>Route</span>
      </span>

      {withTagline && (
        <span
          style={{
            fontFamily: "'Inter', -apple-system, sans-serif",
            fontSize: `${Math.max(9, Math.round(resolvedFontSize * 0.42))}px`,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: taglineColor,
            marginTop: '4px',
            whiteSpace: 'nowrap',
          }}
        >
          YOUR JOURNEY, INTELLIGENTLY PLANNED.
        </span>
      )}
    </div>
  );

  // Combined Layout Render
  let content: React.ReactNode;

  if (layout === 'emblem-only') {
    content = emblemElement;
  } else if (layout === 'vertical') {
    content = (
      <div
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'center',
          ...style,
        }}
        className={`paryatak-brand-lockup vertical variant-${variant} ${className}`}
      >
        {emblemElement}
        {wordmarkElement}
      </div>
    );
  } else {
    // Horizontal layout (Default: Navbar & Footer)
    content = (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          ...style,
        }}
        className={`paryatak-brand-lockup horizontal variant-${variant} ${className}`}
      >
        {emblemElement}
        {wordmarkElement}
      </div>
    );
  }

  if (clickable) {
    return (
      <Link
        to={to}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          textDecoration: 'none',
          cursor: 'pointer',
          lineHeight: 1,
        }}
        aria-label="ParyatakRoute Home"
      >
        {content}
      </Link>
    );
  }

  return <>{content}</>;
};

export default BrandLogo;
