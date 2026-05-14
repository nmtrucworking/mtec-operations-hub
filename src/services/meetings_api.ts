import { apiCall, ApiResponse } from './api';

export interface Meeting {
  id: string;
  title: string;
  date: string;
  meetingType: string;
  description: string;
  status: string;
  minutesUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  stats?: {
    present: number;
    absent: number;
    excused: number;
  };
}

export interface Attendance {
  id?: string;
  meetingId?: string;
  memberId: string;
  status: 'Present' | 'Absent' | 'Excused';
  note?: string;
}

export const getMeetings = async (token?: string): Promise<ApiResponse<Meeting[]>> => {
  return apiCall<Meeting[]>('/api/v1/meetings', {}, token);
};

export const createMeeting = async (data: any, token?: string): Promise<ApiResponse<Meeting>> => {
  return apiCall<Meeting>('/api/v1/meetings', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
};

export const updateMeeting = async (meetingId: string, data: any, token?: string): Promise<ApiResponse<Meeting>> => {
  return apiCall<Meeting>(`/api/v1/meetings/${meetingId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
};

export const getMeetingAttendance = async (meetingId: string, token?: string): Promise<ApiResponse<Attendance[]>> => {
  return apiCall<Attendance[]>(`/api/v1/meetings/${meetingId}/attendance`, {}, token);
};

export const updateAttendance = async (meetingId: string, attendances: Attendance[], token?: string): Promise<ApiResponse<any>> => {
  return apiCall<any>(`/api/v1/meetings/${meetingId}/attendance`, {
    method: 'PUT',
    body: JSON.stringify({ attendances }),
  }, token);
};

export const syncAttendanceToDiscipline = async (meetingId: string, token?: string): Promise<ApiResponse<any>> => {
  return apiCall<any>(`/api/v1/discipline-records/sync-attendance/${meetingId}`, {
    method: 'POST',
  }, token);
};
