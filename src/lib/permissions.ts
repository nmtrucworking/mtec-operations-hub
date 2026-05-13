import type { UserRole } from '../types/app';

const ROLE_PRIORITY: UserRole[] = [
  'bcn',
  'bvh_finance',
  'bvh_hr',
  'bvh_discipline',
  'bvh_logistics',
  'bcm',
  'member'
];

export const normalizeRoles = (
  roles: unknown,
  fallbackRole?: UserRole | string
): UserRole[] => {
  const list = Array.isArray(roles) ? roles : [];
  const normalized = list
    .map((item) => String(item).trim())
    .filter(Boolean) as UserRole[];

  if (normalized.length > 0) {
    return Array.from(new Set(normalized));
  }

  if (fallbackRole) {
    return [String(fallbackRole).trim() as UserRole];
  }

  return ['member'];
};

export const getPrimaryRole = (
  roles: readonly UserRole[] | undefined,
  fallbackRole: UserRole = 'member'
): UserRole => {
  const list = roles && roles.length > 0 ? [...roles] : [fallbackRole];
  return list.sort((a, b) => ROLE_PRIORITY.indexOf(a) - ROLE_PRIORITY.indexOf(b))[0] ?? fallbackRole;
};

export const hasRole = (roles: readonly UserRole[] | undefined, role: UserRole): boolean => {
  if (!roles || roles.length === 0) return false;
  return roles.includes(role);
};

export const hasAnyRole = (roles: readonly UserRole[] | undefined, required: UserRole[]): boolean => {
  if (!roles || roles.length === 0 || required.length === 0) return false;
  return required.some((role) => roles.includes(role));
};