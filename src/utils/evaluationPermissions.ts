import type { UserAccount } from '../types/app';
import { hasAnyRole, hasRole } from '../lib/permissions';

export const isManager = (user: UserAccount | undefined | null): boolean => {
  if (!user) return false;
  const roles = user.roles ?? [user.role];
  return hasAnyRole(roles, ['bcn', 'bvh_discipline', 'bvh_hr']);
};

export const isRecorder = (user: UserAccount | undefined | null): boolean => {
  if (!user) return false;
  const roles = user.roles ?? [user.role];
  return hasAnyRole(roles, ['bcn', 'bvh_discipline', 'bvh_hr', 'bcm']);
};

export const canCreateAppeal = (user: UserAccount | undefined | null, isLinkedMember: boolean): boolean => {
  // Managers can create appeals for any member; members can create for themselves
  if (isManager(user)) return true;
  if (isLinkedMember) return true;
  return false;
};

export const canListGlobal = (user: UserAccount | undefined | null): boolean => {
  return isManager(user);
};

export default { isManager, isRecorder, canCreateAppeal, canListGlobal };
