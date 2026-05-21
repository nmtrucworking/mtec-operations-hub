export const EVALUATION_CYCLE_STATUSES = [
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'DATA_COLLECTION', label: 'Đang thu thập dữ liệu' },
  { value: 'SCORING', label: 'Đang chấm điểm' },
  { value: 'MEMBER_REVIEW', label: 'Đang rà soát' },
  { value: 'APPEAL_RESOLUTION', label: 'Đang xử lý khiếu nại' },
  { value: 'READY_FOR_APPROVAL', label: 'Chờ phê duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'LOCKED', label: 'Đã khóa' },
  { value: 'CANCELLED', label: 'Đã hủy' },
] as const;

export const EVALUATION_COMPONENTS = [
  { value: 'I', label: 'Kỷ luật & Chuyên cần' },
  { value: 'II', label: 'Thái độ & Ý thức tổ chức' },
  { value: 'III_A', label: 'Hiệu suất chuyên môn dùng chung' },
  { value: 'III_B', label: 'Hiệu suất đặc thù theo Ban/Tổ' },
] as const;

export const EVALUATION_UNIT_CODES = [
  { value: 'BCN', label: 'Ban Chủ nhiệm' },
  { value: 'BCNg', label: 'Ban Công nghệ' },
  { value: 'BTT', label: 'Ban Truyền thông' },
  { value: 'BVH-HC', label: 'Ban Vận hành - Tổ Hậu cần' },
  { value: 'BVH-NS', label: 'Ban Vận hành - Tổ Nhân sự' },
  { value: 'BVH-KL', label: 'Ban Vận hành - Tổ Kỷ luật' },
  { value: 'BVH-TC', label: 'Ban Vận hành - Tổ Tài chính' },
] as const;

export const EVALUATION_EVENT_TYPES = [
  { value: 'BASE', label: 'Điểm nền' },
  { value: 'BONUS', label: 'Điểm cộng' },
  { value: 'PENALTY', label: 'Điểm trừ' },
  { value: 'MANUAL_SCORE', label: 'Điểm ghi nhận' },
  { value: 'OVERRIDE', label: 'Điều chỉnh' },
] as const;

export const EVALUATION_EVIDENCE_TYPES = [
  { value: 'LINK', label: 'Đường dẫn' },
  { value: 'TEXT', label: 'Mô tả' },
  { value: 'FILE', label: 'Tệp minh chứng' },
] as const;

export const EVALUATION_CLASSIFICATIONS = [
  { value: 'EXCELLENT', label: 'Xuất sắc' },
  { value: 'GOOD', label: 'Tốt' },
  { value: 'PASSED', label: 'Đạt' },
  { value: 'NEEDS_IMPROVEMENT', label: 'Cần cải thiện' },
  { value: 'FAILED', label: 'Không đạt' },
] as const;
