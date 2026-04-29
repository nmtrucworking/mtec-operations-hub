import type { ApiResponse } from './api';
import { apiCall } from './api';
import type { Member } from '../data/members';

export const fetchDashboardData = async (): Promise<ApiResponse<{ totalMembers: number; activeMembers: number }>> => {
  const response = await apiCall<{ totalMembers: number; activeMembers: number }>('/api/dashboard', { method: 'GET' });
  return response;
}