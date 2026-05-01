import { apiCall, API_BASE_URL, getBaseUrl } from './api';
import type { ApiResponse } from './api';
import { normalizeBanList, type Member, type MemberSkill, type SkillLevel } from '../data/members';

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

const normalizeMember = (input: unknown): Member => {
  const record = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;

  return {
    id: pickString(record.id, record.memberId, record.member_id) || String(Date.now()),
    mssv: pickString(record.mssv, record.studentId, record.student_id),
    name: pickString(record.name, record.fullName, record.full_name),
    gender: pickString(record.gender, record.sex),
    dob: pickString(record.dob, record.birthDate, record.birth_date),
    ban: normalizeBanList(record.ban ?? record.department),
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
 * GET /api/v1/members
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

  const endpoint = `/api/v1/members${query.toString() ? `?${query.toString()}` : ''}`;
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
 * GET /api/v1/members/{member_id}
 */
export const getMemberDetails = async (memberId: number | string, token?: string): Promise<ApiResponse<Member>> => {
  const response = await apiCall<unknown>(`/api/v1/members/${memberId}`, { method: 'GET' }, token);
  return normalizeMemberResponse(response, normalizeMember);
};

/**
 * Create Member
 * POST /api/v1/members
 */
export const createMember = async (member: Omit<Member, 'id'>, token?: string): Promise<ApiResponse<Member>> => {
  const response = await apiCall<unknown>('/api/v1/members', {
    method: 'POST',
    body: JSON.stringify(member)
  }, token);

  return normalizeMemberResponse(response, normalizeMember);
};

/**
 * Update Member
 * PATCH /api/v1/members/{member_id}
 */
export const updateMember = async (memberId: number | string, member: Partial<Member>, token?: string): Promise<ApiResponse<Member>> => {
  const response = await apiCall<unknown>(`/api/v1/members/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify(member)
  }, token);

  return normalizeMemberResponse(response, normalizeMember);
};

/**
 * Delete Member
 * DELETE /api/v1/members/{member_id}
 */
export const deleteMember = async (memberId: number | string, token?: string): Promise<ApiResponse<any>> => {
  return apiCall(`/api/v1/members/${memberId}`, { method: 'DELETE' }, token);
};

/**
 * Export Members
 * GET /api/v1/members/export?format={csv|zip}
 * Note: This returns a URL string, so it doesn't support automatic fallback easily.
 * However, since most other calls use apiCall, they will work.
 */
export const exportMembers = (params: { format: 'csv' | 'zip'; ban?: string; status?: string }, token?: string) => {
  const query = new URLSearchParams();
  query.append('format', params.format);
  if (params.ban) query.append('ban', params.ban);
  if (params.status) query.append('status', params.status);
  
  const API_BASE = getBaseUrl();
  // We'll default to the standard path, but if the user encounters issues they should check the base URL
  const url = `${API_BASE}/api/v1/members/export?${query.toString()}`;
  
  return url;
};

/**
 * Export Member Profile (DOCX)
 * GET /api/v1/members/{member_id}/profile
 */
export const exportMemberProfileUrl = (memberId: number | string) => {
  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  return `${API_BASE_URL}/api/v1/members/${memberId}/profile`;
};
