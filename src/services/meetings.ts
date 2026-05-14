import { apiCall, ApiResponse } from './api';
import type { Member } from '../data/members';

export interface Meeting {
  id: string;
  title: string;
  date: string;
  meetingType: string;
  description?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  minutesUrl?: string;
  stats?: {
    present: number;
    absent: number;
    excused: number;
  };
}

export interface Attendance {
  memberId: string;
  status: 'Present' | 'Absent' | 'Excused';
  note?: string;
}

/**
 * Lấy danh sách cuộc họp
 */
export const getMeetings = async (token?: string): Promise<ApiResponse<Meeting[]>> => {
  return apiCall<Meeting[]>('/api/v1/meetings', { method: 'GET' }, token);
};

/**
 * Tạo mới cuộc họp
 */
export const createMeeting = async (data: Partial<Meeting>, token?: string): Promise<ApiResponse<Meeting>> => {
  return apiCall<Meeting>('/api/v1/meetings', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
};

/**
 * Cập nhật trạng thái điểm danh cho cuộc họp
 */
export const updateAttendance = async (meetingId: string, attendances: Attendance[], token?: string): Promise<ApiResponse<any>> => {
  return apiCall<any>(`/api/v1/meetings/${meetingId}/attendance`, {
    method: 'PUT',
    body: JSON.stringify({ attendances }),
  }, token);
};

/**
 * Kích hoạt đồng bộ điểm danh sang hệ thống kỷ luật
 */
export const syncAttendanceToDiscipline = async (meetingId: string, token?: string): Promise<ApiResponse<{ message: string, syncedCount: number }>> => {
  return apiCall<any>(`/api/v1/discipline-records/sync-attendance/${meetingId}`, {
    method: 'POST',
  }, token);
};
/**
 * L?y chi ti?t cu?c h?p
 */
export const getMeetingDetail = async (meetingId: string, token?: string): Promise<ApiResponse<Meeting>> => {
  return apiCall<Meeting>(`/api/v1/meetings/${meetingId}`, { method: 'GET' }, token);
};

/**
 * C?p nh?t th�ng tin cu?c h?p (bao g?m bi�n b?n)
 */
export const updateMeeting = async (meetingId: string, data: Partial<Meeting>, token?: string): Promise<ApiResponse<Meeting>> => {
  return apiCall<Meeting>(`/api/v1/meetings/${meetingId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
};
