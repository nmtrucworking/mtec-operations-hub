export interface VersionEntry {
  version: string;
  date: string;
  changes: {
    type: 'feature' | 'fix' | 'improvement' | 'security';
    description: string;
  }[];
}

export const VERSION_HISTORY: VersionEntry[] = [
  {
    version: '1.0.0',
    date: '2026-04-30',
    changes: [
      { type: 'feature', description: 'Phát hành phiên bản chính thức đầu tiên của MTEC Operations Hub.' },
      { type: 'feature', description: 'Hệ thống quản lý thành viên toàn diện.' },
      { type: 'feature', description: 'Quản lý tài chính và phê duyệt giao dịch.' },
      { type: 'feature', description: 'Dashboard tổng quan tích hợp AI Insight.' },
      { type: 'feature', description: 'Hệ thống phân quyền chi tiết (BCN, BVH, Member).' },
      { type: 'improvement', description: 'Giao diện Responsive hoàn chỉnh cho Mobile và Tablet.' },
      { type: 'improvement', description: 'Tối ưu hóa hiệu suất tải dữ liệu với Skeleton Loading.' }
    ]
  },
  {
    version: '0.9.5',
    date: '2026-04-25',
    changes: [
      { type: 'feature', description: 'Tích hợp đa ngôn ngữ (Tiếng Việt & Tiếng Anh).' },
      { type: 'fix', description: 'Sửa lỗi hiển thị biểu đồ trên màn hình nhỏ.' },
      { type: 'improvement', description: 'Nâng cấp giao diện Dark Mode.' }
    ]
  },
  {
    version: '0.9.0',
    date: '2026-04-15',
    changes: [
      { type: 'feature', description: 'Bản Beta thử nghiệm nội bộ cho Ban Vận Hành.' }
    ]
  }
];
