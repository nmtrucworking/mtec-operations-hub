export type LogAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'OTHER';
export type LogModule = 'MEMBERS' | 'FINANCE' | 'LOGISTICS' | 'REQUESTS' | 'SETTINGS' | 'SYSTEM' | 'DASHBOARD';

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: number;
  userName: string;
  userRole: string;
  action: LogAction;
  module: LogModule;
  description: string;
  details?: string;
  ipAddress: string;
  status: 'SUCCESS' | 'FAILURE';
}

export const mockLogs: ActivityLog[] = [
  {
    id: '1',
    timestamp: '2024-03-20T10:30:00Z',
    userId: 1,
    userName: 'Nguyen Minh Truc',
    userRole: 'Pho Chu nhiem',
    action: 'UPDATE',
    module: 'MEMBERS',
    description: 'Cập nhật thông tin thành viên Nguyen Thi Ngoc Ngan',
    details: 'Thay đổi số điện thoại từ 0344006801 thành 0344006802',
    ipAddress: '192.168.1.1',
    status: 'SUCCESS'
  },
  {
    id: '2',
    timestamp: '2024-03-20T11:15:00Z',
    userId: 2,
    userName: 'Nguyen Thi Ngoc Ngan',
    userRole: 'Thanh vien',
    action: 'LOGIN',
    module: 'SYSTEM',
    description: 'Đăng nhập vào hệ thống',
    ipAddress: '192.168.1.5',
    status: 'SUCCESS'
  },
  {
    id: '3',
    timestamp: '2024-03-20T14:20:00Z',
    userId: 1,
    userName: 'Nguyen Minh Truc',
    userRole: 'Pho Chu nhiem',
    action: 'CREATE',
    module: 'FINANCE',
    description: 'Tạo phiếu chi mới: Mua văn phòng phẩm',
    details: 'Số tiền: 500.000 VNĐ',
    ipAddress: '192.168.1.1',
    status: 'SUCCESS'
  },
  {
    id: '4',
    timestamp: '2024-03-20T15:00:00Z',
    userId: 3,
    userName: 'Hoang Thi Ut Linh',
    userRole: 'Thanh vien',
    action: 'DELETE',
    module: 'REQUESTS',
    description: 'Xóa yêu cầu hỗ trợ kỹ thuật #123',
    ipAddress: '192.168.1.10',
    status: 'FAILURE'
  },
  {
    id: '5',
    timestamp: '2024-03-21T09:00:00Z',
    userId: 1,
    userName: 'Nguyen Minh Truc',
    userRole: 'Pho Chu nhiem',
    action: 'EXPORT',
    module: 'MEMBERS',
    description: 'Xuất danh sách thành viên ra file Excel',
    ipAddress: '192.168.1.1',
    status: 'SUCCESS'
  }
];
