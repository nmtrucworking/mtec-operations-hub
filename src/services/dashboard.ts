import { apiCall, type ApiResponse } from './api';
import type { DashboardApiResponse } from '../types/dashboard';

/**
 * Lấy dữ liệu tổng quan cho Dashboard từ Backend.
 * @param token - JWT Access Token để xác thực yêu cầu.
 */
export const getDashboardOverview = async (token: string): Promise<ApiResponse<DashboardApiResponse>> => {
  return apiCall<DashboardApiResponse>('/api/dashboard/overview', {
    method: 'GET'
  }, token);
};