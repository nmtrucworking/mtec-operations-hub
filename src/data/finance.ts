import { formatCurrency as formatCurrencyHelper } from '../lib/helpers';

export type TxType = 'Thu' | 'Chi';
export type TransactionStatus = 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối';
export type FinanceApprovalRole = 'bvh_finance' | 'bcn';

export interface LinkedRequestMeta {
  requestId: string;
  requestType: string;
}

export interface Transaction {
  id: string;
  date: string;
  title: string;
  type: TxType;
  amount: number;
  owner: string;
  category: string;
  status: TransactionStatus;
  requiredApprovalRole?: FinanceApprovalRole;
  reviewer?: string;
  reviewedAt?: string;
  approvalNote?: string;
  linkedRequest?: LinkedRequestMeta;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export const expenseApprovalPolicyByCategory: Record<string, FinanceApprovalRole> = {
  'Sự kiện': 'bvh_finance',
  'Vật tư': 'bvh_finance',
  'Hội phí': 'bvh_finance',
  'Đối ngoại': 'bcn',
  'Thiết bị': 'bcn',
  'Dự án lớn': 'bcn'
};

export const getRequiredApprovalRole = (type: TxType, category: string): FinanceApprovalRole | undefined => {
  if (type !== 'Chi') {
    return undefined;
  }
  return expenseApprovalPolicyByCategory[category] ?? 'bvh_finance';
};

export const transactionSeedData: Transaction[] = [
  {
    id: 'TX-501',
    date: '25/05/2026',
    title: 'Thu hội phí tháng 5',
    type: 'Thu',
    amount: 1200000,
    owner: 'Ban Vận hành',
    category: 'Hội phí',
    status: 'Đã duyệt',
    reviewer: 'Ban Vận Hành (Tài chính)',
    reviewedAt: '25/05/2026'
  },
  {
    id: 'TX-502',
    date: '20/05/2026',
    title: 'In ấn banner sự kiện Khai mạc',
    type: 'Chi',
    amount: 450000,
    owner: 'Ban Truyền thông',
    category: 'Sự kiện',
    status: 'Đã duyệt',
    requiredApprovalRole: 'bvh_finance',
    reviewer: 'Ban Vận Hành (Tài chính)',
    reviewedAt: '20/05/2026'
  },
  {
    id: 'TX-503',
    date: '18/05/2026',
    title: 'Tài trợ từ cựu thành viên',
    type: 'Thu',
    amount: 800000,
    owner: 'Ban Chủ nhiệm',
    category: 'Tài trợ',
    status: 'Đã duyệt',
    reviewer: 'Ban Chủ Nhiệm',
    reviewedAt: '18/05/2026'
  },
  {
    id: 'TX-504',
    date: '14/05/2026',
    title: 'Mua vật tư hậu cần',
    type: 'Chi',
    amount: 250000,
    owner: 'Ban Hậu cần',
    category: 'Vật tư',
    status: 'Đã duyệt',
    requiredApprovalRole: 'bvh_finance',
    reviewer: 'Ban Vận Hành (Tài chính)',
    reviewedAt: '15/05/2026',
    linkedRequest: {
      requestId: 'REQ-120',
      requestType: 'Yêu cầu chi'
    }
  },
  {
    id: 'TX-505',
    date: '27/04/2026',
    title: 'Thu tài trợ workshop tháng 4',
    type: 'Thu',
    amount: 600000,
    owner: 'Ban Truyền thông',
    category: 'Tài trợ',
    status: 'Đã duyệt',
    reviewer: 'Ban Vận Hành (Tài chính)',
    reviewedAt: '27/04/2026'
  },
  {
    id: 'TX-506',
    date: '27/04/2026',
    title: 'Đặt cọc âm thanh cho sự kiện tháng 5',
    type: 'Chi',
    amount: 1200000,
    owner: 'Ban Truyền thông',
    category: 'Đối ngoại',
    status: 'Chờ duyệt',
    requiredApprovalRole: 'bcn',
    approvalNote: 'Khoản mục đối ngoại cần BCN xác nhận.'
  }
];

export const formatCurrency = formatCurrencyHelper;
