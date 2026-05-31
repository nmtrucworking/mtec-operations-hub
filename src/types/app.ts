export type AppTab =
  | 'dashboard'
  | 'members'
  | 'requests'
  | 'finance'
  | 'discipline'
  | 'logistics'
  | 'settings'
  | 'logs';


export type UserRole = 
  | 'bcn' // ban chu nhiem
  | 'bvh_hr' // ban van hanh - nhan su
  | 'bvh_finance' // ban van hanh - tai chinh
  | 'bvh_discipline' // ban van hanh - ky luat
  | 'bvh_logistics' // ban van hanh - hau can
  | 'bcm' // ban chuyen mon
  | 'member';

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  roles?: UserRole[];
  avatarInitials: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
