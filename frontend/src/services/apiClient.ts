import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Default to live production API, or custom override via VITE_API_BASE_URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://paryatakrouteapi.itspranjal.in/api/v1';

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

// Response Interceptor: Handle Token Refresh and Enrich Error Messages
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
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Format network / connectivity errors with descriptive user guidance
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        error.message = 'Request timed out waiting for ParyatakRoute API. Please try again.';
      } else {
        error.message = 'Unable to connect to ParyatakRoute API server. Please check your network connection or verify backend status.';
      }
      return Promise.reject(error);
    }

    // Extract backend validation or custom error message if present
    const data: any = error.response.data;
    if (data?.error?.message) {
      error.message = data.error.message;
    } else if (typeof data?.detail === 'string') {
      error.message = data.detail;
    } else if (Array.isArray(data?.detail) && data.detail.length > 0) {
      error.message = data.detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
    } else if (data?.message) {
      error.message = data.message;
    }

    // Handle 401 Unauthorized for authenticated sessions
    if (error.response.status === 401 && originalRequest && !originalRequest._retry) {
      // Do not attempt refresh on auth endpoints
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
