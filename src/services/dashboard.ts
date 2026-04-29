import { apiCall, type ApiResponse } from './api';
import type { DashboardOverviewData } from '../types/dashboard';

/**
 * Get Dashboard Overview Data
 * GET /api/dashboard/overview
 */
export const getDashboardOverview = async (token: string): Promise<ApiResponse<DashboardOverviewData>> => {
  const response = await apiCall<any>('/api/dashboard/overview', {
    method: 'GET'
  }, token);

  if (response.data) {
    const data = response.data;
    return {
      ...response,
      data: data.data || data
    };
  }

  return response;
};
