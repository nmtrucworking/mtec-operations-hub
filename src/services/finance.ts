import { apiCall, type ApiResponse } from './api';
import type { Transaction, TxType, TransactionStatus } from '../data/finance';

/**
 * Normalize transaction data from API
 */
const normalizeTransaction = (input: any): Transaction => {
  const record = (input && typeof input === 'object' ? input : {}) as Record<string, any>;
  
  return {
    id: String(record.id || ''),
    date: record.date || '',
    title: record.title || '',
    type: (record.type as TxType) || 'Chi',
    amount: Number(record.amount || 0),
    owner: record.owner || '',
    category: record.category || '',
    status: (record.status as TransactionStatus) || 'Chờ duyệt',
    requiredApprovalRole: record.requiredApprovalRole,
    reviewer: record.reviewer,
    reviewedAt: record.reviewedAt,
    approvalNote: record.approvalNote,
    linkedRequest: record.linkedRequestId ? {
      requestId: record.linkedRequestId,
      requestType: record.linkedRequestType || ''
    } : undefined,
    isDeleted: Boolean(record.isDeleted),
    deletedAt: record.deletedAt,
    deletedBy: record.deletedBy
  };
};

/**
 * List Transactions
 * GET /api/v1/transactions
 */
export const getTransactions = async (
  params: { 
    search?: string; 
    type?: string; 
    status?: string; 
    fromDate?: string; 
    toDate?: string;
    includeDeleted?: boolean;
    page?: number; 
    pageSize?: number 
  } = {},
  token?: string
): Promise<ApiResponse<{ transactions: Transaction[]; total: number }>> => {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.type) query.append('type', params.type);
  if (params.status) query.append('status', params.status);
  if (params.fromDate) query.append('fromDate', params.fromDate);
  if (params.toDate) query.append('toDate', params.toDate);
  if (params.includeDeleted) query.append('includeDeleted', 'true');
  if (params.page) query.append('page', String(params.page));
  if (params.pageSize) query.append('pageSize', String(params.pageSize));

  const endpoint = `/api/v1/transactions${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await apiCall<any>(endpoint, { method: 'GET' }, token);

  if (response.data) {
    const data = response.data;
    const items = data.data || (Array.isArray(data) ? data : []);
    const meta = data.meta || {};
    
    return {
      ...response,
      data: {
        transactions: items.map(normalizeTransaction),
        total: meta.total || items.length
      }
    };
  }

  return response;
};

/**
 * Get Pending Transactions
 * GET /api/v1/transactions/pending
 */
export const getPendingTransactions = async (token?: string): Promise<ApiResponse<Transaction[]>> => {
  const response = await apiCall<any>('/api/v1/transactions/pending', { method: 'GET' }, token);
  
  if (response.data) {
    const data = response.data;
    const items = data.data || (Array.isArray(data) ? data : []);
    return {
      ...response,
      data: items.map(normalizeTransaction)
    };
  }
  
  return response;
};

/**
 * Get Transaction Details
 * GET /api/v1/transactions/{transaction_id}
 */
export const getTransactionDetails = async (id: string, token?: string): Promise<ApiResponse<Transaction>> => {
  const response = await apiCall<any>(`/api/v1/transactions/${id}`, { method: 'GET' }, token);
  
  if (response.data) {
    const data = response.data;
    return {
      ...response,
      data: normalizeTransaction(data.data || data)
    };
  }
  
  return response;
};

/**
 * Create Transaction
 * POST /api/v1/transactions
 */
export const createTransaction = async (data: Partial<Transaction>, token?: string): Promise<ApiResponse<Transaction>> => {
  const payload = {
    ...data,
    linkedRequestId: data.linkedRequest?.requestId,
    linkedRequestType: data.linkedRequest?.requestType
  };
  
  const response = await apiCall<any>('/api/v1/transactions', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, token);
  
  if (response.data) {
    const data = response.data;
    return {
      ...response,
      data: normalizeTransaction(data.data || data)
    };
  }
  
  return response;
};

/**
 * Update Transaction
 * PATCH /api/v1/transactions/{transaction_id}
 */
export const updateTransaction = async (id: string, data: Partial<Transaction>, token?: string): Promise<ApiResponse<Transaction>> => {
  const payload = {
    ...data,
    linkedRequestId: data.linkedRequest?.requestId,
    linkedRequestType: data.linkedRequest?.requestType
  };

  const response = await apiCall<any>(`/api/v1/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }, token);
  
  if (response.data) {
    const data = response.data;
    return {
      ...response,
      data: normalizeTransaction(data.data || data)
    };
  }
  
  return response;
};

/**
 * Review/Approve Transaction
 * POST /api/v1/transactions/{transaction_id}/review
 */
export const reviewTransaction = async (id: string, status: 'Da duyet' | 'Tu choi', approvalNote?: string, token?: string): Promise<ApiResponse<any>> => {
  return apiCall(`/api/v1/transactions/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ status, approvalNote })
  }, token);
};

/**
 * Soft Delete Transaction
 * DELETE /api/v1/transactions/{transaction_id}
 */
export const deleteTransaction = async (id: string, token?: string): Promise<ApiResponse<any>> => {
  return apiCall(`/api/v1/transactions/${id}`, { method: 'DELETE' }, token);
};
