import { apiCall, ApiResponse, getBaseUrl } from './api';

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
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

type BackendApiResponse<T> = {
  success?: boolean;
  data?: T;
  meta?: { total?: number };
  message?: string;
};

type BackendAuditLog = {
  id?: string;
  actorName?: string;
  action?: string;
  module?: string;
  resourceId?: string;
  createdAt?: string;
};

const toText = (value: unknown): string => {
  if (value == null) return '';
  return String(value);
};

const buildDetails = (log: BackendAuditLog): string => {
  const action = toText(log.action).trim();
  const module = toText(log.module).trim();
  const resourceId = toText(log.resourceId).trim();
  if (action && module && resourceId) return `${action} ${module} (${resourceId})`;
  if (action && module) return `${action} ${module}`;
  if (action) return action;
  return 'SYSTEM';
};

const normalizeLog = (raw: any): ActivityLog => {
  const log: BackendAuditLog = {
    id: raw?.id,
    actorName: raw?.actorName ?? raw?.user ?? raw?.userName,
    action: raw?.action,
    module: raw?.module ?? raw?.resourceType ?? raw?.resource_type,
    resourceId: raw?.resourceId ?? raw?.resource_id,
    createdAt: raw?.createdAt ?? raw?.timestamp ?? raw?.created_at,
  };

  return {
    id: toText(log.id) || (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    timestamp: toText(log.createdAt),
    user: toText(log.actorName) || 'System',
    action: toText(log.action) || 'SYSTEM',
    module: toText(log.module) || 'SYSTEM',
    resourceId: toText(log.resourceId) || undefined,
    details: toText(raw?.details ?? raw?.description) || buildDetails(log),
    snapshotBefore: raw?.snapshotBefore ?? raw?.beforeSnapshot,
    snapshotAfter: raw?.snapshotAfter ?? raw?.afterSnapshot,
  };
};

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
  const res = await apiCall<unknown>(`/api/v1/logs${queryString ? `?${queryString}` : ''}`, {}, token);
  if (res.status === 0 || res.error) {
    return { ...res, data: undefined } as ApiResponse<LogsResponse>;
  }
  if (!res.data) return { ...res, data: { logs: [], total: 0 } };

  const body = res.data as BackendApiResponse<unknown> | unknown;
  const data = (body as any)?.data ?? body;
  const metaTotal = (body as any)?.meta?.total;

  const items = Array.isArray(data) ? data : [];
  const logs = items.map(normalizeLog);
  const total = typeof metaTotal === 'number' ? metaTotal : logs.length;

  return {
    ...res,
    data: { logs, total },
  };
};

/**
 * Export logs to CSV
 */
export const exportLogs = async (token?: string): Promise<ApiResponse<Blob>> => {
  // We use fetch directly for Blob responses usually, or handle it in apiCall
  // For simplicity here, we assume apiCall can handle it or we use a separate logic
  try {
    const API_BASE = getBaseUrl();
    // Try v1 first, then fallback to non-v1
    let url = `${API_BASE}/api/v1/logs/export`;
    let response = await fetch(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    
    if (response.status === 404) {
      url = `${API_BASE}/api/logs/export`;
      response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
    }
    
    if (!response.ok) throw new Error('Export failed');
    
    const blob = await response.blob();
    return { status: response.status, data: blob as any };
  } catch (error) {
    return { status: 0, error: 'Export failed' };
  }
};
