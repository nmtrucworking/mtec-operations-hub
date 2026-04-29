export type AppTab =
  | 'dashboard'
  | 'members'
  | 'requests'
  | 'finance'
  | 'discipline'
  | 'logistics'
  | 'generator'
  | 'settings';


export type UserRole = 
  | 'bcn' 
  | 'bvh_hr' 
  | 'bvh_finance' 
  | 'bvh_discipline' 
  | 'bvh_logistics' 
  | 'bcm' 
  | 'member';

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  avatarInitials: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
