import { apiCall, ApiResponse } from './api';

export interface DisciplineStats {
  totalMembers: number;
  warnedCases: number;
  averageKPI: number;
}

/**
 * Get discipline statistics
 */
export const getDisciplineStats = async (token?: string): Promise<ApiResponse<DisciplineStats>> => {
  return apiCall<DisciplineStats>('/api/discipline-records/stats', {}, token);
};
