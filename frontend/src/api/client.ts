// ============================================
// Axios HTTP Client — Base Configuration
// ============================================
// All API calls go through this single client.
// It handles base URL, headers, and error formatting.

import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { ApiError } from '@/types/api.types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000, // 30s — ChEMBL/Open Targets can be slow
});

// ── Request Interceptor ──
// Attach auth token here in Phase 4 when Supabase auth is added
apiClient.interceptors.request.use(
  (config) => {
    // Future: config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ──
// Normalises all error responses into a consistent ApiError shape
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: error.response?.status,
    };

    if (error.response?.data) {
      const data = error.response.data as Record<string, unknown>;
      if (typeof data.detail === 'string') {
        apiError.message = data.detail;
        apiError.detail = data.detail;
      } else if (Array.isArray(data.detail)) {
        apiError.message = 'Validation error — check your input';
        apiError.detail = data.detail;
      } else if (typeof data.message === 'string') {
        apiError.message = data.message;
      }
    } else if (error.code === 'ECONNABORTED') {
      apiError.message = 'Request timed out — the external API may be slow. Please try again.';
    } else if (!error.response) {
      apiError.message = 'Cannot connect to server — make sure the backend is running on port 8000.';
    }

    return Promise.reject(apiError);
  }
);

export default apiClient;
