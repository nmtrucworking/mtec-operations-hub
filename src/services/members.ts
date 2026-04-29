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

const normalizeMember = (input: unknown): Member => {
  const record = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;

  return {
    id: Number(record.id ?? record.memberId ?? record.member_id ?? Date.now()),
    mssv: pickString(record.mssv, record.studentId, record.student_id),
    name: pickString(record.name, record.fullName, record.full_name),
    gender: pickString(record.gender, record.sex),
    dob: pickString(record.dob, record.birthDate, record.birth_date),
    ban: pickString(record.ban, record.department),
    role: pickString(record.role, record.position),
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

const extractMemberList = (payload: unknown): Member[] => {
  if (Array.isArray(payload)) {
    return payload.map(normalizeMember);
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const items = record.items ?? record.data ?? record.members ?? record.results;
    if (Array.isArray(items)) {
      return items.map(normalizeMember);
    }
  }

  return [];
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

export const getMembers = async (token?: string): Promise<ApiResponse<Member[]>> => {
  const response = await apiCall<unknown>('/api/members', { method: 'GET' }, token);
  return normalizeMemberResponse(response, extractMemberList);
};

export const createMember = async (member: Omit<Member, 'id'>, token?: string): Promise<ApiResponse<Member>> => {
  const response = await apiCall<unknown>('/api/members', {
    method: 'POST',
    body: JSON.stringify(member)
  }, token);

  return normalizeMemberResponse(response, normalizeMember);
};

export const updateMember = async (memberId: number, member: Omit<Member, 'id'>, token?: string): Promise<ApiResponse<Member>> => {
  const response = await apiCall<unknown>(`/api/members/${memberId}`, {
    method: 'PUT',
    body: JSON.stringify(member)
  }, token);

  return normalizeMemberResponse(response, normalizeMember);
};
