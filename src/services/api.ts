/**
 * API Client for Backend Integration
 * This module provides a centralized way to make API calls to the backend
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');

interface RequestOptions extends RequestInit {
  headers?: HeadersInit;
}

export interface ApiResponse<T> {
  data?: T;
  status: number;
  error?: string;
  success?: boolean;
}

/**
 * Make an authenticated API request
 * @param endpoint - API endpoint (e.g., '/api/v1/auth/login', '/api/v1/members')
 * @param options - Fetch options (method, body, headers, etc.)
 * @param token - Optional auth token (will be added to Authorization header)
 */
export const apiCall = async <T = any>(
  endpoint: string,
  options: RequestOptions = {},
  token?: string
): Promise<ApiResponse<T>> => {
  try {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${cleanEndpoint}`;
    const headers = new Headers(options.headers || {});

    // Add Authorization header if token is provided
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Set default Content-Type for JSON
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:expired'));
        }
      }

      return {
        status: response.status,
        error: data.message || `HTTP ${response.status}`,
        data: data as T
      };
    }

    return {
      status: response.status,
      data: data as T
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 0,
      error: `Network error: ${message}`
    };
  }
};

/**
 * Check backend health/connectivity
 * GET /health -> returns {"status":"ok"}
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await apiCall('/health');
    return response.status === 200;
  } catch {
    return false;
  }
};
