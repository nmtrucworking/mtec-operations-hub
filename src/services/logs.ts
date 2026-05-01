import { apiCall, ApiResponse } from './api';

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'PASSWORD_CHANGE' | 'EXPORT';
  module: 'MEMBERS' | 'USERS' | 'ASSETS' | 'FINANCE' | 'REQUESTS' | 'SYSTEM';
  resourceId?: string;
  details: string;
  snapshotBefore?: any;
  snapshotAfter?: any;
}

export interface LogsQuery {
  search?: string;
  module?: string;
  action?: string;
  page?: number;
  pageSize?: number;
}

export interface LogsResponse {
  logs: ActivityLog[];
  total: number;
}

/**
 * Get list of activity logs
 */
export const getLogs = async (query: LogsQuery = {}, token?: string): Promise<ApiResponse<LogsResponse>> => {
  const params = new URLSearchParams();
  if (query.search) params.append('search', query.search);
  if (query.module) params.append('module', query.module);
  if (query.action) params.append('action', query.action);
  if (query.page) params.append('page', query.page.toString());
  if (query.pageSize) params.append('pageSize', query.pageSize.toString());

  const queryString = params.toString();
  return apiCall<LogsResponse>(`/api/v1/logs${queryString ? `?${queryString}` : ''}`, {}, token);
};

/**
 * Export logs to CSV
 */
export const exportLogs = async (token?: string): Promise<ApiResponse<Blob>> => {
  // We use fetch directly for Blob responses usually, or handle it in apiCall
  // For simplicity here, we assume apiCall can handle it or we use a separate logic
  try {
    const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
    const response = await fetch(`${API_BASE}/api/v1/logs/export`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    
    if (!response.ok) throw new Error('Export failed');
    
    const blob = await response.blob();
    return { status: response.status, data: blob as any };
  } catch (error) {
    return { status: 0, error: 'Export failed' };
  }
};
