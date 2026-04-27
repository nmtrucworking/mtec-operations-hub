export type RequestType = 'Rút khỏi CLB' | 'Cam kết trách nhiệm' | 'Bảo lưu sinh hoạt';
export type RequestStatus = 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối';

export interface RequestFinanceDraft {
  enabled: boolean;
  title?: string;
  amount?: number;
  type?: 'Thu' | 'Chi';
  category?: string;
}

export interface RequestItem {
  id: string;
  mssv: string;
  name: string;
  type: RequestType;
  date: string;
  reason: string;
  status: RequestStatus;
  reviewer?: string;
  reviewedAt?: string;
  reviewNote?: string;
  linkedTransactionId?: string;
  financeDraft?: RequestFinanceDraft;
}

export const requestSeedData: RequestItem[] = [
  {
    id: 'REQ-091',
    mssv: '2400001871',
    name: 'Nguyễn Hữu Chí',
    type: 'Rút khỏi CLB',
    date: '26/04/2026',
    reason: 'Quá bận lịch học chuyên ngành',
    status: 'Chờ duyệt',
    reviewNote: 'Chờ xác nhận bàn giao tài sản và công việc.'
  },
  {
    id: 'REQ-092',
    mssv: '2400000549',
    name: 'Lê Thị Ngọc Nhi',
    type: 'Rút khỏi CLB',
    date: '20/04/2026',
    reason: 'Chuyển trường',
    status: 'Đã duyệt',
    reviewer: 'Ban Chủ nhiệm',
    reviewedAt: '21/04/2026'
  },
  {
    id: 'REQ-102',
    mssv: '2500019500',
    name: 'Phạm Quốc Bảo',
    type: 'Cam kết trách nhiệm',
    date: '25/04/2026',
    reason: 'Nộp mẫu NS-08 học kỳ 2',
    status: 'Đã duyệt',
    reviewer: 'Ban Nhân sự',
    reviewedAt: '25/04/2026'
  },
  {
    id: 'REQ-103',
    mssv: '2500011690',
    name: 'Hà Quốc Toản',
    type: 'Cam kết trách nhiệm',
    date: '25/04/2026',
    reason: 'Chờ xác nhận chữ ký số',
    status: 'Chờ duyệt',
    reviewNote: 'Cần bổ sung tệp ký số.'
  },
  {
    id: 'REQ-110',
    mssv: '2500017768',
    name: 'Hoàng Thị Út Linh',
    type: 'Bảo lưu sinh hoạt',
    date: '24/04/2026',
    reason: 'Thực tập giữa kỳ 8 tuần',
    status: 'Từ chối',
    reviewer: 'Ban Vận hành',
    reviewedAt: '25/04/2026',
    reviewNote: 'Yêu cầu chuyển sang chế độ cộng tác viên thay vì bảo lưu.'
  },
  {
    id: 'REQ-120',
    mssv: '2500010312',
    name: 'Phan Đức Lâm',
    type: 'Cam kết trách nhiệm',
    date: '27/04/2026',
    reason: 'Chi phí vật tư cho workshop tháng 5',
    status: 'Đã duyệt',
    reviewer: 'Ban Vận Hành',
    reviewedAt: '27/04/2026',
    linkedTransactionId: 'TX-504',
    financeDraft: {
      enabled: true,
      title: 'Mua vật tư hậu cần',
      amount: 250000,
      type: 'Chi',
      category: 'Vật tư'
    }
  },
  {
    id: 'REQ-121',
    mssv: '2500011120',
    name: 'Trần Minh Hiếu',
    type: 'Cam kết trách nhiệm',
    date: '27/04/2026',
    reason: 'Đề xuất tạm ứng âm thanh cho sự kiện giao lưu',
    status: 'Chờ duyệt',
    financeDraft: {
      enabled: true,
      title: 'Đặt cọc âm thanh cho sự kiện tháng 5',
      amount: 1200000,
      type: 'Chi',
      category: 'Đối ngoại'
    }
  }
];
