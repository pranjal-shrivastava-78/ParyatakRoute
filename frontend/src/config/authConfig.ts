/**
 * Authentication Configuration for ParyatakRoute
 * Centralized credentials and auth constants.
 * Sourced from Vite environment variables with production fallbacks.
 */
export const DEMO_CREDENTIALS = {
  email: import.meta.env.VITE_DEMO_EMAIL || 'demo@paryatakroute.in',
  password: import.meta.env.VITE_DEMO_PASSWORD || 'Paryatak@Demo2026',
} as const;

