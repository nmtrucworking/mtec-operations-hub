import type { ApiResponse } from './api';
import { apiCall } from './api';
import type { Member, MemberSkill, SkillLevel } from '../data/members';

/**
 * 
 * @param level 
 * @returns 
 */
const normalizeSkillLevel = (level: unknown): SkillLevel => {
  if (level === 'Tốt' || level === 'Trung bình' || level === 'Cơ bản') {
    return level;
  }

  const text = String(level ?? '').toLowerCase();
  if (text.includes('good') || text.includes('high') || text.includes('tốt')) {
    return 'Tốt';
  }
  if (text.includes('medium') || text.includes('trung bình')) {
    return 'Trung bình';
  }
  return 'Cơ bản';
};

const normalizeSkills = (input: unknown): MemberSkill[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Record<string, unknown>;
      const name = String(record.name ?? record.skillName ?? record.skill ?? '').trim();
      if (!name) {
        return null;
      }

      return {
        name,
        level: normalizeSkillLevel(record.level)
      } satisfies MemberSkill;
    })
    .filter((item): item is MemberSkill => item !== null);
};

const pickString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return '';
};

const normalizeStatus = (value: unknown): Member['status'] => {
  const text = String(value ?? '').toLowerCase();
  return text.includes('inactive') || text.includes('tạm nghỉ') || text.includes('tam nghi') ? 'Inactive' : 'Active';
};

const normalizeBan = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(v => v);
  }
  const str = String(value ?? '').trim();
  if (!str) return [];
  // Split by comma if it's a string
  return str.split(',').map(v => v.trim()).filter(v => v);
};

const normalizeMember = (input: unknown): Member => {
  const record = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;

  return {
    id: Number(record.id ?? record.memberId ?? record.member_id ?? Date.now()),
    mssv: pickString(record.mssv, record.studentId, record.student_id),
    name: pickString(record.name, record.fullName, record.full_name),
    gender: pickString(record.gender, record.sex),
    dob: pickString(record.dob, record.birthDate, record.birth_date),
    ban: normalizeBan(record.ban ?? record.department),
    role: pickString(record.roleTitle, record.role, record.position),
    status: normalizeStatus(record.status),
    phone: pickString(record.phone, record.phoneNumber, record.phone_number),
    email: pickString(record.email),
    joinDate: pickString(record.joinDate, record.join_date),
    lop: pickString(record.lop, record.className, record.class_name),
    chuyenNganh: pickString(record.chuyenNganh, record.chuyen_nganh, record.major),
    khoa: pickString(record.khoa, record.faculty),
    address: pickString(record.address),
    hardSkills: normalizeSkills(record.hardSkills ?? record.hard_skills),
    softSkills: normalizeSkills(record.softSkills ?? record.soft_skills),
    experience: pickString(record.experience),
    goal: pickString(record.goal),
    orientation: pickString(record.orientation)
  };
};

const normalizeMemberResponse = <T>(response: ApiResponse<unknown>, mapper: (payload: unknown) => T): ApiResponse<T> => {
  if (response.status === 0) {
    return response as ApiResponse<T>;
  }

  return {
    ...response,
    data: response.data !== undefined ? mapper(response.data) : undefined
  };
};

/**
 * List Members
 * GET /api/members
 */
export const getMembers = async (
  params: { search?: string; ban?: string; status?: string; page?: number; pageSize?: number } = {},
  token?: string
): Promise<ApiResponse<{ members: Member[]; total: number }>> => {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.ban) query.append('ban', params.ban);
  if (params.status) query.append('status', params.status);
  if (params.page) query.append('page', String(params.page));
  if (params.pageSize) query.append('pageSize', String(params.pageSize));

  const endpoint = `/api/members${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await apiCall<unknown>(endpoint, { method: 'GET' }, token);

  if (response.status === 0) return response as ApiResponse<any>;

  const data = response.data as any;
  const items = data.data || (Array.isArray(data) ? data : []);
  const meta = data.meta || {};

  return {
    ...response,
    data: {
      members: items.map(normalizeMember),
      total: meta.total || items.length
    }
  };
};

/**
 * Get Member Details
 * GET /api/members/{member_id}
 */
export const getMemberDetails = async (memberId: number | string, token?: string): Promise<ApiResponse<Member>> => {
  const response = await apiCall<unknown>(`/api/members/${memberId}`, { method: 'GET' }, token);
  return normalizeMemberResponse(response, normalizeMember);
};

/**
 * Create Member
 * POST /api/members
 */
export const createMember = async (member: Omit<Member, 'id'>, token?: string): Promise<ApiResponse<Member>> => {
  const response = await apiCall<unknown>('/api/members', {
    method: 'POST',
    body: JSON.stringify(member)
  }, token);

  return normalizeMemberResponse(response, normalizeMember);
};

/**
 * Update Member
 * PATCH /api/members/{member_id}
 */
export const updateMember = async (memberId: number | string, member: Partial<Member>, token?: string): Promise<ApiResponse<Member>> => {
  const response = await apiCall<unknown>(`/api/members/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify(member)
  }, token);

  return normalizeMemberResponse(response, normalizeMember);
};

/**
 * Delete Member
 * DELETE /api/members/{member_id}
 */
export const deleteMember = async (memberId: number | string, token?: string): Promise<ApiResponse<any>> => {
  return apiCall(`/api/members/${memberId}`, { method: 'DELETE' }, token);
};

/**
 * Export Members
 * GET /api/members/export?format={csv|zip}
 */
export const exportMembers = (params: { format: 'csv' | 'zip'; ban?: string; status?: string }, token?: string) => {
  const query = new URLSearchParams();
  query.append('format', params.format);
  if (params.ban) query.append('ban', params.ban);
  if (params.status) query.append('status', params.status);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const url = `${API_BASE_URL}/api/members/export?${query.toString()}`;
  
  // For file downloads, we typically open in new tab or use a hidden anchor with auth header if possible
  // Since we use Bearer token, we might need to use fetch and create a blob
  return url;
};

/**
 * Export Member Profile (DOCX)
 * GET /api/members/{member_id}/profile
 */
export const exportMemberProfileUrl = (memberId: number | string) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  return `${API_BASE_URL}/api/members/${memberId}/profile`;
};
