import React from 'react';
import { Link } from 'react-router-dom';
import logoLight from '../assets/download(3).png';
import logoDark from '../assets/download(4).png';

export interface BrandLogoProps {
  /**
   * 'light': download(3).png (for light backgrounds)
   * 'dark': download(4).png (for dark backgrounds)
   */
  variant?: 'light' | 'dark';
  /** Height in pixels or CSS string. Preserves aspect ratio with width: auto. */
  height?: number | string;
  /** Whether clicking the logo navigates to homepage. Default: true. */
  clickable?: boolean;
  /** Target link if clickable. Default: '/'. */
  to?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Official ParyatakRoute Brand Logo Component
 * Strict Rule: Uses the exact approved logo assets without distortion, cropping, or recoloring.
 * - Light variant (download(3).png) for light surfaces (Warm Ivory, white, Sand Beige)
 * - Dark variant (download(4).png) for dark surfaces (Forest Green banners, dark cards, dark overlays)
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'light',
  height = 42,
  clickable = true,
  to = '/',
  className = '',
  style = {},
}) => {
  const src = variant === 'dark' ? logoDark : logoLight;

  const imageElement = (
    <img
      src={src}
      alt="ParyatakRoute — Your Journey, Intelligently Planned."
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: 'auto',
        maxWidth: '100%',
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        borderRadius: '8px',
        ...style,
      }}
      className={`paryatak-brand-logo paryatak-logo-${variant} ${className}`}
    />
  );

  if (clickable) {
    return (
      <Link
        to={to}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          textDecoration: 'none',
          lineHeight: 1,
        }}
        aria-label="ParyatakRoute Home"
      >
        {imageElement}
      </Link>
    );
  }

  return imageElement;
};

export default BrandLogo;
