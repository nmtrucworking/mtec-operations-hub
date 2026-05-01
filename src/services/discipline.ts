import { apiCall, ApiResponse } from './api';

export interface DisciplineStats {
  totalMembers: number;
  warnedCases: number;
  averageKPI: number;
}

export interface DisciplineRecord {
  id: string;
  mssv: string;
  name: string;
  absents: number;
  disciplineLevel: string;
  kpi: number;
  committee: string;
  note?: string;
}

export interface DisciplineResponse {
  records: DisciplineRecord[];
  total: number;
}

/**
 * Get discipline statistics
 */
export const getDisciplineStats = async (token?: string): Promise<ApiResponse<DisciplineStats>> => {
  return apiCall<DisciplineStats>('/api/v1/discipline-records/stats', {}, token);
};

/**
 * List discipline records
 */
export const getDisciplineRecords = async (
  params: { search?: string; disciplineLevel?: string; page?: number; pageSize?: number } = {},
  token?: string
): Promise<ApiResponse<DisciplineResponse>> => {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.disciplineLevel) query.append('disciplineLevel', params.disciplineLevel);
  if (params.page) query.append('page', String(params.page));
  if (params.pageSize) query.append('pageSize', String(params.pageSize));

  const endpoint = `/api/v1/discipline-records${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await apiCall<any>(endpoint, { method: 'GET' }, token);

  if (response.data) {
    const data = response.data;
    return {
      ...response,
      data: {
        records: data.data || [],
        total: data.meta?.total || (data.data || []).length
      }
    };
  }

  return response;
};
