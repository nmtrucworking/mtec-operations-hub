/**
 * API Client for Backend Integration
 * This module provides a centralized way to make API calls to the backend
 */

const RAW_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || '').trim();
const FALLBACK_BASE_URL = 'http://localhost:8000';
const CONFIGURED_BASE_URL = (RAW_BASE_URL || FALLBACK_BASE_URL).replace(/\/$/, '');

const shouldUseDevProxy =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
  CONFIGURED_BASE_URL.includes('onrender.com');

export const API_BASE_URL = shouldUseDevProxy ? '' : CONFIGURED_BASE_URL;

/**
 * Get a clean base URL without /api/v1 suffix
 */
export const getBaseUrl = () => API_BASE_URL.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');


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
  token?: string,
  skipFallback = false
): Promise<ApiResponse<T>> => {
  try {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Logic to handle potential double prefixing
    let finalEndpoint = cleanEndpoint;
    const baseHasV1 = API_BASE_URL.includes('/api/v1');
    const endpointHasV1 = cleanEndpoint.startsWith('/api/v1/');
    
    if (baseHasV1 && endpointHasV1) {
      // If both have /api/v1, remove it from endpoint to avoid double-prefixing
      finalEndpoint = cleanEndpoint.substring(7); 
    }
    
    const url = `${API_BASE_URL}${finalEndpoint}`;
    
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${options.method || 'GET'} ${url}`);
    }

    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');

    // Use provided token or fallback to localStorage
    const effectiveToken = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null);

    if (effectiveToken) {
      headers.set('Authorization', `Bearer ${effectiveToken}`);
    }

    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    // Automatic fallback for 404: if /api/v1/ fails, try /api/
    if (response.status === 404 && !skipFallback && endpointHasV1) {
      const fallbackEndpoint = cleanEndpoint.replace('/api/v1/', '/api/');
      if (import.meta.env.DEV) {
        console.warn(`[API 404] Falling back from ${cleanEndpoint} to ${fallbackEndpoint}`);
      }
      return apiCall(fallbackEndpoint, options, token, true);
    }

    if (response.status === 404 && import.meta.env.DEV) {
      console.error(`[API 404 Error] ${options.method || 'GET'} ${url}`);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:expired'));
        }
      }

      return {
        status: response.status,
        error: data.message || data.detail || `HTTP ${response.status}`,
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
