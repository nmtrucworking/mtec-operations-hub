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
    version: '1.2.2',
    date: '2026-05-14',
    changes: [
      { type: 'fix', description: 'Hotfix (Backend): Khắc phục các lỗi nghiêm trọng gây crash ứng dụng (lỗi import schemas, lỗi API chi tiết thành viên, lỗi syntax router).' },
      { type: 'fix', description: 'Hotfix (Backend): Tích hợp lifespan cho FastAPI để đảm bảo tự động khởi tạo cơ sở dữ liệu và nạp dữ liệu mẫu (seed data).' },
      { type: 'feature', description: 'Tính năng mới: Bổ sung module Quản lý tài khoản (Account Management) chi tiết trong tab Cài đặt (Settings).' }
    ]
  },
  {
    version: '1.2.1',
    date: '2026-05-01',
    changes: [
      { type: 'improvement', description: 'Bảo trì & Nâng cấp Hệ thống: Cập nhật hệ thống API v1, đồng bộ cấu hình Pop-up Toast toàn hệ thống.' },
      { type: 'improvement', description: 'Chuyển đổi toàn bộ API sang cấu trúc /api/v1 để đảm bảo tính ổn định.' },
      { type: 'improvement', description: 'Cập nhật hệ thống Thông báo (Toast) sang dạng Pop-up trung tâm có backdrop.' },
      { type: 'feature', description: 'Thêm nút Đăng xuất tại màn hình khôi phục phiên làm việc.' },
      { type: 'improvement', description: 'Đồng bộ hóa cấu hình môi trường và tài liệu triển khai API.' }
    ]
  },
  {
    version: '1.2.0',
    date: '2026-05-01',
    changes: [
      { type: 'feature', description: 'Triển khai hệ thống Nhật ký hoạt động (Activity Logs) toàn diện.' },
      { type: 'feature', description: 'Nâng cấp AI Generator: hỗ trợ template văn bản hành chính, trích xuất ngữ cảnh và xuất file DOCX.' },
      { type: 'feature', description: 'Cập nhật Dashboard Logistics & Discipline với số liệu thống kê thời gian thực.' },
      { type: 'improvement', description: 'Bổ sung Audit Logs Coverage cho toàn bộ hệ thống (Members, Assets, Finance, Requests).' },
      { type: 'security', description: 'Cập nhật phân quyền: Role BCM có quyền xem và xuất nhật ký hệ thống.' }
    ]
  },
  {
    version: '1.0.1',
    date: '2026-04-30',
    changes: [
      { type: 'fix', description: 'Sửa lỗi thống kê Ban chuyên môn trên Dashboard (chuẩn hóa tên, bỏ dấu).' },
      { type: 'feature', description: 'Thêm hệ thống Toast toàn cục (ToastProvider, useToast) và hiển thị thông báo ở góc trên phải.' },
      { type: 'improvement', description: 'Chuyển MembersView sang sử dụng `useToast` và loại bỏ banner inline.' },
      { type: 'improvement', description: 'Tích hợp các API Dashboard và Members, chuẩn hoá xử lý dữ liệu trả về.' }
    ]
  },
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
