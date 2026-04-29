import { apiCall, type ApiResponse } from './api';
import { formatBanList } from '../data/members';
import type { DashboardOverviewData } from '../types/dashboard';

const normalizeDeptDistribution = (value: unknown): DashboardOverviewData['deptDistribution'] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Record<string, unknown>;
      const ban = formatBanList(record.ban ?? record.department ?? record.name);
      const count = Number(record.count ?? record.total ?? 0);

      if (!ban) {
        return null;
      }

      return {
        ban,
        count: Number.isFinite(count) ? count : 0
      };
    })
    .filter((item): item is DashboardOverviewData['deptDistribution'][number] => item !== null);
};

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
    const payload = data.data || data;
    return {
      ...response,
      data: {
        ...payload,
        deptDistribution: normalizeDeptDistribution(payload.deptDistribution)
      }
    };
  }

  return response;
};
