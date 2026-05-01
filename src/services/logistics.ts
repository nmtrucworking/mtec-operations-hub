import { apiCall, ApiResponse } from './api';
import type { AssetItem } from '../data/logistics';

export interface AssetStats {
  total: number;
  borrowed: number;
  maintenance: number;
}

export interface AssetResponse {
  assets: AssetItem[];
  total: number;
}

/**
 * Get asset statistics
 */
export const getAssetStats = async (token?: string): Promise<ApiResponse<AssetStats>> => {
  return apiCall<AssetStats>('/api/v1/assets/stats', {}, token);
};

/**
 * Get asset categories
 */
export const getAssetCategories = async (token?: string): Promise<ApiResponse<string[]>> => {
  return apiCall<string[]>('/api/v1/assets/categories', {}, token);
};

/**
 * List assets
 */
export const getAssets = async (
  params: { search?: string; status?: string; page?: number; pageSize?: number } = {},
  token?: string
): Promise<ApiResponse<AssetResponse>> => {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.status) query.append('status', params.status);
  if (params.page) query.append('page', String(params.page));
  if (params.pageSize) query.append('pageSize', String(params.pageSize));

  const endpoint = `/api/v1/assets${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await apiCall<any>(endpoint, { method: 'GET' }, token);

  if (response.data) {
    const data = response.data;
    return {
      ...response,
      data: {
        assets: data.data || [],
        total: data.meta?.total || (data.data || []).length
      }
    };
  }

  return response;
};
