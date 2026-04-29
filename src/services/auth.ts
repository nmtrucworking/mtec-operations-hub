import { apiCall, type ApiResponse } from './api';
import type { UserAccount, UserRole } from '../types/app';

/**
 * Normalize user data from API response
 */
export const normalizeUser = (payload: unknown, fallback?: Partial<UserAccount>): UserAccount => {
  const record = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
  
  const fullName = String(record.fullName ?? record.full_name ?? record.name ?? fallback?.fullName ?? '').trim();
  const username = String(record.username ?? fallback?.username ?? '').trim();
  const role = String(record.role ?? fallback?.role ?? 'member') as UserRole;
  
  const initials = String(
    record.avatarInitials ??
      record.avatar_initials ??
      fallback?.avatarInitials ??
      (fullName
        ? fullName
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join('')
        : username.slice(0, 2).toUpperCase())
  );

  return {
    id: String(record.id ?? record.user_id ?? (username || fallback?.id)),
    username,
    fullName: fullName || username,
    role,
    avatarInitials: initials || username.slice(0, 2).toUpperCase(),
    email: record.email ? String(record.email) : fallback?.email,
    phone: record.phone ? String(record.phone) : fallback?.phone,
    isActive: record.isActive !== undefined ? Boolean(record.isActive) : fallback?.isActive,
    createdAt: record.createdAt ? String(record.createdAt) : fallback?.createdAt,
    updatedAt: record.updatedAt ? String(record.updatedAt) : fallback?.updatedAt,
  };
};

/**
 * Login API call
 * POST /api/auth/login
 */
export const login = async (username: string, password: string): Promise<ApiResponse<{
  accessToken: string;
  refreshToken: string;
  user: UserAccount;
}>> => {
  const response = await apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });

  if (response.data) {
    const data = response.data as any;
    // Handle different response structures
    const payload = data.data || data;
    const userPayload = payload.user || payload.account || payload;
    
    return {
      ...response,
      data: {
        accessToken: payload.accessToken || payload.access_token || payload.token,
        refreshToken: payload.refreshToken || payload.refresh_token,
        user: normalizeUser(userPayload)
      }
    };
  }

  return response;
};

/**
 * Logout API call
 * POST /api/auth/logout
 */
export const logout = async (refreshToken?: string, token?: string): Promise<ApiResponse<{ message: string }>> => {
  return apiCall('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken })
  }, token);
};

/**
 * Get current user info
 * GET /api/auth/me
 */
export const getCurrentUser = async (token: string): Promise<ApiResponse<UserAccount>> => {
  const response = await apiCall('/api/auth/me', { method: 'GET' }, token);
  
  if (response.data) {
    const data = response.data as any;
    const userPayload = data.data || data;
    return {
      ...response,
      data: normalizeUser(userPayload)
    };
  }
  
  return response;
};

/**
 * Refresh token API call
 * POST /api/auth/refresh
 */
export const refreshToken = async (token: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> => {
  return apiCall('/api/auth/refresh', { method: 'POST' }, token);
};

/**
 * Forgot password
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (emailOrUsername: string): Promise<ApiResponse<any>> => {
  return apiCall('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: emailOrUsername, username: emailOrUsername })
  });
};

/**
 * Reset password
 * POST /api/auth/reset-password
 */
export const resetPassword = async (token: string, newPassword: string): Promise<ApiResponse<any>> => {
  return apiCall('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword, password: newPassword })
  });
};

/**
 * Verify reset token
 * POST /api/auth/verify-reset-token
 */
export const verifyResetToken = async (token: string): Promise<ApiResponse<any>> => {
  return apiCall('/api/auth/verify-reset-token', {
    method: 'POST',
    body: JSON.stringify({ token })
  });
};

/**
 * Change password
 * POST /api/auth/change-password
 */
export const changePassword = async (currentPassword: string, newPassword: string, token: string): Promise<ApiResponse<any>> => {
  return apiCall('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword })
  }, token);
};

/**
 * Send verification email
 * POST /api/auth/send-verification-email
 */
export const sendVerificationEmail = async (email: string): Promise<ApiResponse<any>> => {
  return apiCall('/api/auth/send-verification-email', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
};

/**
 * Verify email
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (email: string, code: string): Promise<ApiResponse<any>> => {
  return apiCall('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, code })
  });
};

/**
 * Settings Endpoints
 */

export const getProfile = async (token: string): Promise<ApiResponse<UserAccount>> => {
  const response = await apiCall('/api/settings/profile', { method: 'GET' }, token);
  if (response.data) {
    const data = response.data as any;
    return {
      ...response,
      data: normalizeUser(data.data || data)
    };
  }
  return response;
};

export const updateProfile = async (data: { fullName?: string; email?: string; phone?: string; avatarInitials?: string }, token: string): Promise<ApiResponse<UserAccount>> => {
  const response = await apiCall('/api/settings/profile', {
    method: 'PATCH',
    body: JSON.stringify(data)
  }, token);
  if (response.data) {
    const data = response.data as any;
    return {
      ...response,
      data: normalizeUser(data.data || data)
    };
  }
  return response;
};

export const getNotificationSettings = async (token: string): Promise<ApiResponse<any>> => {
  return apiCall('/api/settings/notifications', { method: 'GET' }, token);
};

export const updateNotificationSettings = async (data: any, token: string): Promise<ApiResponse<any>> => {
  return apiCall('/api/settings/notifications', {
    method: 'PATCH',
    body: JSON.stringify(data)
  }, token);
};
