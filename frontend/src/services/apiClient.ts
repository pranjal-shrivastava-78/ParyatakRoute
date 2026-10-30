import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Default to live production API, or custom override via VITE_API_BASE_URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://paryatakrouteapi.itspranjal.in/api/v1';

export interface ApiDiagnostics {
  baseURL: string;
  method: string;
  url: string;
  fullUrl: string;
  code?: string;
  status?: number;
  statusText?: string;
  responseReceived: boolean;
  backendCode?: string;
  backendMessage?: string;
  timestamp: string;
}

export interface EnhancedAxiosError extends AxiosError {
  diagnostics?: ApiDiagnostics;
  userFacingMessage?: string;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // accommodate AI itinerary generation (typically 10-25s)
});

// Request Interceptor: Attach Supabase Access Token if available
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle Token Refresh, Enforce Diagnostics & User Messages
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: EnhancedAxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const method = originalRequest?.method?.toUpperCase() || 'UNKNOWN';
    const relativeUrl = originalRequest?.url || '';
    const fullUrl = `${API_BASE_URL}${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`;

    // Extract backend response details if available
    const data: any = error.response?.data;
    let backendCode: string | undefined = data?.error?.code;
    let backendMsg: string | undefined = data?.error?.message;

    if (!backendMsg) {
      if (typeof data?.detail === 'string') {
        backendMsg = data.detail;
      } else if (Array.isArray(data?.detail) && data.detail.length > 0) {
        backendMsg = data.detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
      } else if (data?.message) {
        backendMsg = data.message;
      }
    }

    // Attach structured diagnostics without exposing secrets/tokens
    const diagnostics: ApiDiagnostics = {
      baseURL: API_BASE_URL,
      method,
      url: relativeUrl,
      fullUrl,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseReceived: !!error.response,
      backendCode,
      backendMessage: backendMsg,
      timestamp: new Date().toISOString(),
    };
    error.diagnostics = diagnostics;

    // Determine specific user-facing message based on failure classification
    if (!error.response) {
      // Failure occurred before an HTTP response was received (CORS, offline, DNS, timeout)
      if (error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'))) {
        error.message = 'Request timed out after 45 seconds waiting for ParyatakRoute API. Please retry.';
      } else {
        error.message = `Unable to connect to ParyatakRoute API (${API_BASE_URL}). Please verify backend availability or CORS origin configuration.`;
      }
      return Promise.reject(error);
    }

    const status = error.response.status;

    // Handle HTTP-level errors with context-aware user guidance
    if (status === 400) {
      if (backendMsg && backendMsg.toLowerCase().includes('cors')) {
        error.message = `CORS origin rejection: ${window.location.origin} is not allowed by API CORS policy.`;
      } else {
        error.message = backendMsg || 'Invalid request parameters. Please verify your input and try again.';
      }
    } else if (status === 401) {
      error.message = backendMsg || 'Authentication required. Please sign in to access this feature.';
    } else if (status === 403) {
      error.message = backendMsg || 'Access denied. You do not have permission to access or modify this resource.';
    } else if (status === 404) {
      error.message = backendMsg || 'Requested travel resource or endpoint was not found.';
    } else if (status === 409) {
      error.message = backendMsg || 'Conflict: This itinerary or resource has already been claimed by another account.';
    } else if (status === 422) {
      error.message = backendMsg || 'Validation error: One or more travel preferences were invalid.';
    } else if (status === 429) {
      error.message = backendMsg || 'AI rate limit or quota exceeded on Groq Cloud. Please wait a moment before trying again.';
    } else if (status === 502) {
      error.message = backendMsg || 'AI travel synthesis provider error. Please try again or adjust your prompt.';
    } else if (status === 503) {
      if (backendCode === 'AI_NOT_CONFIGURED' || (backendMsg && backendMsg.includes('GROQ_API_KEY'))) {
        error.message = 'AI travel engine is not configured on the backend (missing GROQ_API_KEY).';
      } else {
        error.message = backendMsg || 'ParyatakRoute backend service is temporarily unavailable. Please retry in a few moments.';
      }
    } else if (status >= 500) {
      error.message = backendMsg || 'Internal server error encountered in ParyatakRoute API. Please retry shortly.';
    } else if (backendMsg) {
      error.message = backendMsg;
    }

    // Handle 401 Unauthorized for authenticated sessions
    if (status === 401 && originalRequest && !originalRequest._retry) {
      // Do not attempt refresh on authentication endpoints
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        return Promise.reject(error);
      }

      const hadToken = !!localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      // Only attempt refresh if a refresh token actually exists
      if (refreshToken) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers && token) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return apiClient(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const tokens = res.data?.data?.tokens || res.data?.data;
          const newAccessToken = tokens?.accessToken || tokens?.access_token;
          const newRefreshToken = tokens?.refreshToken || tokens?.refresh_token;

          if (newAccessToken) {
            localStorage.setItem('accessToken', newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
            }

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            processQueue(null, newAccessToken);
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('paryatak_user');
          window.dispatchEvent(new CustomEvent('auth:expired'));
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else if (hadToken) {
        // Only trigger auth:expired if user had an access token that is now unauthorized
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('paryatak_user');
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
