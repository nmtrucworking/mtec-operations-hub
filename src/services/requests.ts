import { apiCall, type ApiResponse } from './api';
import type { RequestItem, RequestType, RequestStatus } from '../data/requests';

/**
 * Normalize request data from API
 */
const normalizeRequest = (input: any): RequestItem => {
  const record = (input && typeof input === 'object' ? input : {}) as Record<string, any>;
  
  return {
    id: String(record.id || ''),
    mssv: record.mssv || '',
    name: record.name || '',
    type: (record.type as RequestType) || 'Bảo lưu sinh hoạt',
    date: record.date || '',
    reason: record.reason || '',
    status: (record.status as RequestStatus) || 'Chờ duyệt',
    reviewer: record.reviewer,
    reviewedAt: record.reviewedAt,
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
 * GET /requests
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
  if (params.status) query.append('status', params.status);
  if (params.page) query.append('page', String(params.page));
  if (params.pageSize) query.append('pageSize', String(params.pageSize));

  const endpoint = `/requests${query.toString() ? `?${query.toString()}` : ''}`;
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
 * GET /requests/{request_id}
 */
export const getRequestDetails = async (id: string, token?: string): Promise<ApiResponse<RequestItem>> => {
  const response = await apiCall<any>(`/requests/${id}`, { method: 'GET' }, token);
  
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
 * POST /requests
 */
export const createRequest = async (data: Partial<RequestItem>, token?: string): Promise<ApiResponse<RequestItem>> => {
  const payload = {
    ...data,
    financeDraftEnabled: data.financeDraft?.enabled,
    financeDraftTitle: data.financeDraft?.title,
    financeDraftAmount: data.financeDraft?.amount,
    financeDraftType: data.financeDraft?.type,
    financeDraftCategory: data.financeDraft?.category
  };
  
  const response = await apiCall<any>('/requests', {
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
 * PATCH /requests/{request_id}
 */
export const updateRequest = async (id: string, data: Partial<RequestItem>, token?: string): Promise<ApiResponse<RequestItem>> => {
  const payload = {
    ...data,
    financeDraftEnabled: data.financeDraft?.enabled,
    financeDraftTitle: data.financeDraft?.title,
    financeDraftAmount: data.financeDraft?.amount,
    financeDraftType: data.financeDraft?.type,
    financeDraftCategory: data.financeDraft?.category
  };

  const response = await apiCall<any>(`/requests/${id}`, {
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
 * POST /requests/{request_id}/review
 */
export const reviewRequest = async (id: string, status: 'Da duyet' | 'Tu choi', reviewNote?: string, token?: string): Promise<ApiResponse<any>> => {
  return apiCall(`/requests/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ status, reviewNote })
  }, token);
};

/**
 * Delete Request
 * DELETE /requests/{request_id}
 */
export const deleteRequest = async (id: string, token?: string): Promise<ApiResponse<any>> => {
  return apiCall(`/requests/${id}`, { method: 'DELETE' }, token);
};
