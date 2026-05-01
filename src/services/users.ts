import { apiCall, type ApiResponse } from './api';
import { normalizeUser } from './auth';
import type { UserAccount } from '../types/app';

/**
 * List Users
 * GET /users
 */
export const getUsers = async (
  params: { search?: string; role?: string; page?: number; pageSize?: number } = {},
  token?: string
): Promise<ApiResponse<{ users: UserAccount[]; total: number }>> => {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.role) query.append('role', params.role);
  if (params.page) query.append('page', String(params.page));
  if (params.pageSize) query.append('pageSize', String(params.pageSize));

  const endpoint = `/users${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await apiCall(endpoint, { method: 'GET' }, token);

  if (response.data) {
    const data = response.data as any;
    const items = data.data || data.users || (Array.isArray(data) ? data : []);
    const meta = data.meta || {};
    
    return {
      ...response,
      data: {
        users: items.map(normalizeUser),
        total: meta.total || items.length
      }
    };
  }

  return response;
};

/**
 * Create User
 * POST /users
 */
export const createUser = async (userData: Partial<UserAccount>, token?: string): Promise<ApiResponse<UserAccount>> => {
  const response = await apiCall('/users', {
    method: 'POST',
    body: JSON.stringify(userData)
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

/**
 * Get User Details
 * GET /users/{user_id}
 */
export const getUserDetails = async (userId: string, token?: string): Promise<ApiResponse<UserAccount>> => {
  const response = await apiCall(`/users/${userId}`, { method: 'GET' }, token);

  if (response.data) {
    const data = response.data as any;
    return {
      ...response,
      data: normalizeUser(data.data || data)
    };
  }

  return response;
};

/**
 * Update User
 * PATCH /users/{user_id}
 */
export const updateUser = async (userId: string, userData: Partial<UserAccount>, token?: string): Promise<ApiResponse<UserAccount>> => {
  const response = await apiCall(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(userData)
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

/**
 * Update User Status
 * PATCH /users/{user_id}/status
 */
export const updateUserStatus = async (userId: string, isActive: boolean, token?: string): Promise<ApiResponse<any>> => {
  return apiCall(`/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive })
  }, token);
};

/**
 * Reset User Password
 * POST /users/{user_id}/reset-password
 */
export const resetUserPassword = async (userId: string, newPassword: string, token?: string): Promise<ApiResponse<any>> => {
  return apiCall(`/users/${userId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword })
  }, token);
};

/**
 * Delete User
 * DELETE /users/{user_id}
 */
export const deleteUser = async (userId: string, token?: string): Promise<ApiResponse<any>> => {
  return apiCall(`/users/${userId}`, { method: 'DELETE' }, token);
};
