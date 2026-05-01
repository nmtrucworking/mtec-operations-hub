import { apiCall, type ApiResponse } from './api';
import type { RequestItem, RequestType, RequestStatus } from '../data/requests';

const toIsoDate = (value: unknown): string => {
  const text = String(value ?? '').trim();
  if (!text) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const m = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return text;
};

const toDisplayDate = (value: unknown): string => {
  const text = String(value ?? '').trim();
  if (!text) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return text;
  const m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return text;
};

const normalizeStatus = (value: unknown): RequestStatus => {
  const raw = String(value ?? '').trim();
  const compact = raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (compact.includes('cho') && compact.includes('duyet')) return 'Chờ duyệt';
  if (compact.includes('da') && compact.includes('duyet')) return 'Đã duyệt';
  if (compact.includes('tu') && compact.includes('choi')) return 'Từ chối';
  return 'Chờ duyệt';
};

const statusToBackend = (value: unknown): string | undefined => {
  const status = String(value ?? '').trim();
  if (!status) return undefined;
  if (status === 'Chờ duyệt') return 'Cho duyet';
  if (status === 'Đã duyệt') return 'Da duyet';
  if (status === 'Từ chối') return 'Tu choi';
  return status;
};

const normalizeRequest = (input: any): RequestItem => {
  const record = (input && typeof input === 'object' ? input : {}) as Record<string, any>;
  
  return {
    id: String(record.id || ''),
    mssv: record.mssv || '',
    name: record.name || '',
    type: (record.type as RequestType) || 'Bảo lưu sinh hoạt',
    date: toDisplayDate(record.date),
    reason: record.reason || '',
    status: normalizeStatus(record.status),
    reviewer: record.reviewer,
    reviewedAt: record.reviewedAt ? toDisplayDate(record.reviewedAt) : undefined,
    reviewNote: record.reviewNote,
    linkedTransactionId: record.linkedTransactionId,
    financeDraft: record.financeDraftEnabled ? {
      enabled: Boolean(record.financeDraftEnabled),
      title: record.financeDraftTitle,
      amount: record.financeDraftAmount,
      type: record.financeDraftType,
      category: record.financeDraftCategory
    } : undefined
  };
};

/**
 * List Requests
 * GET /api/v1/requests
 */
export const getRequests = async (
  params: { 
    search?: string; 
    type?: string; 
    status?: string; 
    page?: number; 
    pageSize?: number 
  } = {},
  token?: string
): Promise<ApiResponse<{ requests: RequestItem[]; total: number }>> => {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.type) query.append('type', params.type);
  const backendStatus = statusToBackend(params.status);
  if (backendStatus) query.append('status', backendStatus);
  if (params.page) query.append('page', String(params.page));
  if (params.pageSize) query.append('pageSize', String(params.pageSize));

  const endpoint = `/api/v1/requests${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await apiCall<any>(endpoint, { method: 'GET' }, token);

  if (response.data) {
    const data = response.data;
    const items = data.data || (Array.isArray(data) ? data : []);
    const meta = data.meta || {};
    
    return {
      ...response,
      data: {
        requests: items.map(normalizeRequest),
        total: meta.total || items.length
      }
    };
  }

  return response;
};

/**
 * Get Request Details
 * GET /api/v1/requests/{request_id}
 */
export const getRequestDetails = async (id: string, token?: string): Promise<ApiResponse<RequestItem>> => {
  const response = await apiCall<any>(`/api/v1/requests/${id}`, { method: 'GET' }, token);
  
  if (response.data) {
    const data = response.data;
    return {
      ...response,
      data: normalizeRequest(data.data || data)
    };
  }
  
  return response;
};

/**
 * Create Request
 * POST /api/v1/requests
 */
export const createRequest = async (data: Partial<RequestItem>, token?: string): Promise<ApiResponse<RequestItem>> => {
  const payload = {
    mssv: data.mssv,
    name: data.name,
    type: data.type,
    date: toIsoDate(data.date),
    reason: data.reason,
    financeDraftEnabled: data.financeDraft?.enabled,
    financeDraftTitle: data.financeDraft?.title,
    financeDraftAmount: data.financeDraft?.amount,
    financeDraftType: data.financeDraft?.type,
    financeDraftCategory: data.financeDraft?.category
  };
  
  const response = await apiCall<any>('/api/v1/requests', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, token);
  
  if (response.data) {
    const data = response.data;
    return {
      ...response,
      data: normalizeRequest(data.data || data)
    };
  }
  
  return response;
};

/**
 * Update Request
 * PATCH /api/v1/requests/{request_id}
 */
export const updateRequest = async (id: string, data: Partial<RequestItem>, token?: string): Promise<ApiResponse<RequestItem>> => {
  const payload = {
    reason: data.reason,
    financeDraftEnabled: data.financeDraft?.enabled,
    financeDraftTitle: data.financeDraft?.title,
    financeDraftAmount: data.financeDraft?.amount,
    financeDraftType: data.financeDraft?.type,
    financeDraftCategory: data.financeDraft?.category
  };

  const response = await apiCall<any>(`/api/v1/requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }, token);
  
  if (response.data) {
    const data = response.data;
    return {
      ...response,
      data: normalizeRequest(data.data || data)
    };
  }
  
  return response;
};

/**
 * Review Request
 * POST /api/v1/requests/{request_id}/review
 */
export const reviewRequest = async (id: string, status: 'Da duyet' | 'Tu choi', reviewNote?: string, token?: string): Promise<ApiResponse<any>> => {
  return apiCall(`/api/v1/requests/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ status, reviewNote })
  }, token);
};

/**
 * Delete Request
 * DELETE /api/v1/requests/{request_id}
 */
export const deleteRequest = async (id: string, token?: string): Promise<ApiResponse<any>> => {
  return apiCall(`/api/v1/requests/${id}`, { method: 'DELETE' }, token);
};
