/**
 * API Client for Backend Integration
 * This module provides a centralized way to make API calls to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  headers?: HeadersInit;
}

export interface ApiResponse<T> {
  data?: T;
  status: number;
  error?: string;
}

/**
 * Make an authenticated API request
 * @param endpoint - API endpoint (e.g., '/api/auth/login', '/api/members')
 * @param options - Fetch options (method, body, headers, etc.)
 * @param token - Optional auth token (will be added to Authorization header)
 */
export const apiCall = async <T = any>(
  endpoint: string,
  options: RequestOptions = {},
  token?: string
): Promise<ApiResponse<T>> => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
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

/**
 * Login API call
 * POST /api/auth/login
 */
export const login = async (username: string, password: string) => {
  return apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
};

/**
 * Refresh token API call
 * POST /api/auth/refresh
 */
export const refreshToken = async (token: string) => {
  return apiCall('/api/auth/refresh', { method: 'POST' }, token);
};

/**
 * Get current user info
 * GET /api/auth/me
 */
export const getCurrentUser = async (token: string) => {
  return apiCall('/api/auth/me', { method: 'GET' }, token);
};

/**
 * Forgot password - Request password reset email
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (emailOrUsername: string) => {
  return apiCall('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: emailOrUsername, username: emailOrUsername })
  });
};

/**
 * Verify reset token - Check if reset token is valid
 * POST /api/auth/verify-reset-token
 */
export const verifyResetToken = async (token: string) => {
  return apiCall('/api/auth/verify-reset-token', {
    method: 'POST',
    body: JSON.stringify({ token })
  });
};

/**
 * Reset password - Set new password with reset token
 * POST /api/auth/reset-password
 */
export const resetPassword = async (token: string, newPassword: string) => {
  return apiCall('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword, password: newPassword })
  });
};

/**
 * Change password - Update password when already logged in
 * POST /api/auth/change-password
 */
export const changePassword = async (currentPassword: string, newPassword: string, token: string) => {
  return apiCall('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword })
  }, token);
};

/**
 * Verify email - Send verification code to email
 * POST /api/auth/send-verification-email
 */
export const sendVerificationEmail = async (email: string) => {
  return apiCall('/api/auth/send-verification-email', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
};

/**
 * Verify email code - Verify email with code
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (email: string, code: string) => {
  return apiCall('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, code })
  });
};

export default {
  apiCall,
  checkApiHealth,
  login,
  refreshToken,
  getCurrentUser,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  changePassword,
  sendVerificationEmail,
  verifyEmail,
  API_BASE_URL
};
