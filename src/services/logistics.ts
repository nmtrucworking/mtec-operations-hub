import { apiCall, ApiResponse } from './api';

export interface AssetStats {
  total: number;
  borrowed: number;
  maintenance: number;
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
