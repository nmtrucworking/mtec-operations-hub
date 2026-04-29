import type { ApiResponse } from './api';
import { apiCall } from './api';
import type { Member } from '../data/members';

import { DashboardOverview } from '../types/dashboard';

export const fetchDashboardOverview = async (token: string): Promise<ApiResponse<DashboardOverview>> => {
  return apiCall<DashboardOverview>('/api/dashboard/overview', {
    method: 'GET'
  }, token);
};