import { apiCall, ApiResponse } from './api';
import { unwrapApiList } from './response';

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
  const res = await apiCall<any>('/api/v1/competitions', { method: 'GET' }, token);

  return {
    ...res,
    data: unwrapApiList<Competition>(res),
  };
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

