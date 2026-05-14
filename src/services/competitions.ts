import { apiCall, ApiResponse } from './api';

export interface Competition {
  id: string;
  title: string;
  date: string;
  scale: string;
  status: 'Ongoing' | 'Completed';
}

export interface CompetitionResult {
  memberId: string;
  achievement: string;
  bonusKpi: number;
}

export const getCompetitions = async (token?: string): Promise<ApiResponse<Competition[]>> => {
  return apiCall<Competition[]>('/api/v1/competitions', { method: 'GET' }, token);
};

export const createCompetition = async (data: Partial<Competition>, token?: string): Promise<ApiResponse<Competition>> => {
  return apiCall<Competition>('/api/v1/competitions', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
};

export const updateCompetitionResults = async (competitionId: string, results: CompetitionResult[], token?: string): Promise<ApiResponse<any>> => {
  return apiCall<any>(`/api/v1/competitions/${competitionId}/results`, {
    method: 'PUT',
    body: JSON.stringify(results),
  }, token);
};

export const syncCompetitionKPI = async (competitionId: string, token?: string): Promise<ApiResponse<{ message: string, syncedCount: number }>> => {
  return apiCall<any>(`/api/v1/discipline-records/sync-competition-kpi/${competitionId}`, {
    method: 'POST',
  }, token);
};