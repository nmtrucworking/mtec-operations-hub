/**
 * API Client for Backend Integration
 * This module provides a centralized way to make API calls to the backend
 */

const RAW_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || '').trim();
const FALLBACK_BASE_URL = 'http://localhost:8000';
const CONFIGURED_BASE_URL = (RAW_BASE_URL || FALLBACK_BASE_URL).replace(/\/$/, '');
export const API_BASE_URL = CONFIGURED_BASE_URL;

/**
 * Get a clean base URL without /api/v1 suffix
 */
export const getBaseUrl = () => API_BASE_URL.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');

const API_CACHE_PREFIX = 'mtec-api-cache:v1:';
const API_CACHE_TTL_MS = Number(import.meta.env.VITE_API_CACHE_TTL_MS || 5 * 60 * 1000);

interface CachedApiResponse<T> extends ApiResponse<T> {
  cachedAt: number;
  expiresAt: number;
}

interface RequestOptions extends RequestInit {
  headers?: HeadersInit;
}

export interface ApiResponse<T> {
  data?: T;
  status: number;
  error?: string;
  success?: boolean;
}

const canUseBrowserStorage = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const hashString = (value: string) => {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
};

const isCacheableRequest = (method: string, endpoint: string, options: RequestOptions) => {
  if (method !== 'GET' || options.body || API_CACHE_TTL_MS <= 0) return false;
  if (endpoint.includes('/auth/') || endpoint === '/health') return false;
  return true;
};

const getCacheKey = (url: string, token?: string | null) => {
  const tokenScope = token ? hashString(token) : 'anonymous';
  return `${API_CACHE_PREFIX}${tokenScope}:${url}`;
};

const readCachedResponse = <T>(key: string): ApiResponse<T> | undefined => {
  if (!canUseBrowserStorage()) return undefined;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;

    const cached = JSON.parse(raw) as CachedApiResponse<T>;
    if (!cached.expiresAt || cached.expiresAt < Date.now()) {
      localStorage.removeItem(key);
      return undefined;
    }

    return {
      status: cached.status,
      success: cached.success,
      data: cached.data
    };
  } catch {
    localStorage.removeItem(key);
    return undefined;
  }
};

const writeCachedResponse = <T>(key: string, response: ApiResponse<T>) => {
  if (!canUseBrowserStorage() || response.status !== 200 || !response.success) return;

  try {
    const cached: CachedApiResponse<T> = {
      ...response,
      cachedAt: Date.now(),
      expiresAt: Date.now() + API_CACHE_TTL_MS
    };
    localStorage.setItem(key, JSON.stringify(cached));
  } catch {
    // Storage can be full or disabled. The app should continue without cache.
  }
};

const clearApiCache = () => {
  if (!canUseBrowserStorage()) return;

  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(API_CACHE_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore cache cleanup failures.
  }
};

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
    const method = (options.method || 'GET').toUpperCase();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Logic to handle potential double prefixing
    let finalEndpoint = cleanEndpoint;
    const baseHasV1 = API_BASE_URL.includes('/api/v1');
    const endpointHasV1 = cleanEndpoint.startsWith('/api/v1/');
    
    if (baseHasV1 && endpointHasV1) {
      // If both have /api/v1, remove it from endpoint to avoid double-prefixing
      finalEndpoint = cleanEndpoint.substring(7); 
    }
    
    let url = `${API_BASE_URL}${finalEndpoint}`;
    
    // Special handling for v2 endpoints when base URL has v1
    if (cleanEndpoint.startsWith('/api/v2/') && baseHasV1) {
      const baseUrlWithoutV1 = API_BASE_URL.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
      url = `${baseUrlWithoutV1}${cleanEndpoint}`;
    }
    
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

    const cacheKey = getCacheKey(url, effectiveToken);
    const cacheableRequest = isCacheableRequest(method, cleanEndpoint, options);
    if (cacheableRequest) {
      const cached = readCachedResponse<T>(cacheKey);
      if (cached) {
        if (import.meta.env.DEV) {
          console.log(`[API Cache] HIT ${url}`);
        }
        return cached;
      }
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
        clearApiCache();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:expired'));
        }
      }

      const deriveError = () => {
        if (!data) return `HTTP ${response.status}`;
        if (typeof data === 'string') return data;
        // prefer string message fields when available
        if (typeof (data as any).message === 'string') return (data as any).message;
        if (typeof (data as any).detail === 'string') return (data as any).detail;
        // message may be an object like { code, message }
        if ((data as any).message && typeof (data as any).message === 'object') {
          try {
            return JSON.stringify((data as any).message);
          } catch {
            return String((data as any).message);
          }
        }
        try {
          return JSON.stringify(data);
        } catch {
          return `HTTP ${response.status}`;
        }
      };

      return {
        status: response.status,
        success: false,
        error: deriveError(),
        data: data as T
      };
    }

    const apiResponse = {
      status: response.status,
      success: true,
      data: data as T
    };
    if (cacheableRequest) {
      writeCachedResponse(cacheKey, apiResponse);
    }

    if (method !== 'GET') {
      clearApiCache();
    }

    return apiResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        status: 0,
        success: false,
        error: 'Request cancelled'
      };
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 0,
      success: false,
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
