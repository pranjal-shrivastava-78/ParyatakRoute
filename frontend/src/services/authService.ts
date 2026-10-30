import apiClient from './apiClient';
import {
  APIResponse,
  AuthResponseData,
  LoginRequest,
  RegisterRequest,
  UserProfileResponse,
} from '../types/api';

/**
 * Extracts a human-readable error message from FastAPI APIErrorResponse or network errors.
 */
export function extractErrorMessage(err: any, fallback: string = 'An error occurred'): string {
  if (!err) return fallback;

  // Axios response error from FastAPI backend
  if (err.response?.data) {
    const data = err.response.data;

    // Structured ErrorDetail { code, message, details }
    if (data.error?.message) {
      return data.error.message;
    }

    // Top-level message or detail field
    if (data.message && typeof data.message === 'string') {
      return data.message;
    }

    if (data.detail && typeof data.detail === 'string') {
      return data.detail;
    }

    if (Array.isArray(data.detail)) {
      // Pydantic validation error list
      return data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
    }
  }

  // Network / Timeout errors
  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return 'Server request timed out. Please check your connection and retry.';
  }

  if (err.message === 'Network Error' || !err.response) {
    return 'Unable to reach ParyatakRoute API server. Please check your internet connection.';
  }

  return err.message || fallback;
}

export const authService = {
  /**
   * Register a new user account with the production backend.
   * Path: POST /api/v1/auth/register
   */
  async register(data: RegisterRequest): Promise<AuthResponseData> {
    const res = await apiClient.post<APIResponse<AuthResponseData>>('/auth/register', {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });

    if (!res.data || !res.data.data) {
      throw new Error(res.data?.message || 'Registration failed');
    }

    return res.data.data;
  },

  /**
   * Authenticate an existing user with email and password.
   * Path: POST /api/v1/auth/login
   */
  async login(data: LoginRequest): Promise<AuthResponseData> {
    const res = await apiClient.post<APIResponse<AuthResponseData>>('/auth/login', {
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });

    if (!res.data || !res.data.data) {
      throw new Error(res.data?.message || 'Login failed');
    }

    return res.data.data;
  },

  /**
   * Invalidate the current session on the backend.
   * Path: POST /api/v1/auth/logout
   */
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } catch {
      // Allow logout to proceed cleanly even if server session invalidation fails
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('paryatak_user');
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
  },

  /**
   * Retrieve currently authenticated user profile from Supabase/FastAPI.
   * Path: GET /api/v1/auth/me
   */
  async getMe(): Promise<UserProfileResponse> {
    const res = await apiClient.get<APIResponse<UserProfileResponse>>('/auth/me');

    if (!res.data || !res.data.data) {
      throw new Error('Failed to resolve profile from server');
    }

    return res.data.data;
  },

  /**
   * Update authenticated user profile display name or avatar.
   * Path: PATCH /api/v1/auth/me
   */
  async updateProfile(updates: { name?: string; avatar_url?: string }): Promise<UserProfileResponse> {
    const res = await apiClient.patch<APIResponse<UserProfileResponse>>('/auth/me', updates);

    if (!res.data || !res.data.data) {
      throw new Error(res.data?.message || 'Failed to update profile');
    }

    return res.data.data;
  },

  /**
   * Refresh access token using current refresh token.
   * Path: POST /api/v1/auth/refresh
   */
  async refreshToken(refreshToken: string): Promise<any> {
    const res = await apiClient.post<APIResponse<any>>('/auth/refresh', { refreshToken });
    return res.data.data;
  },
};

export default authService;
