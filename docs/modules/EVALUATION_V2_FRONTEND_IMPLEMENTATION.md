# Evaluation v2 — Tài liệu triển khai Frontend

## 1. Mục đích tài liệu

Tài liệu này mô tả phương án triển khai **Evaluation v2** ở frontend repository `mtec-operations-hub`.

Mục tiêu triển khai:

- Tích hợp Evaluation v2 vào module **Kỷ luật & Hiệu suất** (`DisciplineView`).
- Không tạo sidebar tab riêng ở giai đoạn đầu.
- Dùng API backend v2 hiện có tại `/api/v2/evaluations`.
- Cho phép Ban Chủ nhiệm, Ban Vận hành Kỷ luật/Nhân sự và Ban Chuyên môn thao tác theo đúng phân quyền backend.
- Tạo nền tảng UI cho đánh giá định kỳ thành viên, có thể mở rộng thành module riêng nếu quy mô tăng.

## 2. Kết luận kiến trúc

Evaluation v2 nên được triển khai ở frontend như một **submodule** của `Discipline`, không phải module sidebar độc lập.

Cấu trúc UI đề xuất:

```text
Kỷ luật & Hiệu suất
├── Hồ sơ Kỷ luật
├── Điểm danh Cuộc họp
├── Hiệu suất / Thi đua
└── Đánh giá Định kỳ
```

Lý do:

- Evaluation v2 sử dụng dữ liệu chuyên cần, KPI, kỷ luật, thi đua và minh chứng.
- `DisciplineView` hiện đã quản lý hồ sơ kỷ luật, điểm danh cuộc họp và hiệu suất thi đua.
- Backend Evaluation v2 đã có API đồng bộ attendance/competition sang score events.
- Không làm sidebar phình thêm trong giai đoạn MVP.

## 3. Phạm vi triển khai FE

### 3.1. Trong phạm vi

| Nhóm chức năng | Có triển khai FE |
|---|---:|
| Danh sách chu kỳ đánh giá | Có |
| Tạo/cập nhật chu kỳ đánh giá | Có |
| Gửi duyệt, duyệt, khóa, hủy chu kỳ | Có |
| Seed/xem/quản lý tiêu chí | Có mức MVP |
| Gán vai trò thành viên trong chu kỳ | Có |
| Ghi sự kiện điểm | Có |
| Nộp/xem/duyệt/từ chối minh chứng | Có |
| Tính điểm chu kỳ/từng thành viên | Có |
| Xem kết quả, breakdown, summary | Có |
| Khiếu nại/phúc khảo | Có mức MVP hoặc Phase 2 |
| Đồng bộ attendance/competition | Có |

### 3.2. Ngoài phạm vi MVP

| Chức năng | Lý do đưa sang Phase 2 |
|---|---|
| Upload file minh chứng thực sự | Backend hiện nhận `url`, `filePath`, `description`; FE có thể nhập URL trước |
| Biểu đồ phân phối nâng cao | Có thể thêm sau khi kết quả compute ổn định |
| Workflow review nhiều cấp | Backend đã có nền tảng, UI nên triển khai sau MVP |
| Export báo cáo đánh giá | Cần thống nhất format báo cáo trước |
| Notification realtime | Phụ thuộc module notification chưa hoàn thiện |

## 4. Cấu trúc file đề xuất

Thêm các file sau ở frontend:

```text
src/
├── services/
│   └── evaluations.ts
├── data/
│   └── evaluations.ts
├── components/
│   └── Discipline/
│       ├── EvaluationTab.tsx
│       ├── EvaluationCyclesPanel.tsx
│       ├── EvaluationCriteriaPanel.tsx
│       ├── EvaluationMemberRolesPanel.tsx
│       ├── EvaluationScoreEventsPanel.tsx
│       ├── EvaluationEvidencePanel.tsx
│       ├── EvaluationResultsPanel.tsx
│       ├── EvaluationAppealsPanel.tsx
│       └── EvaluationSyncPanel.tsx
└── views/
    └── DisciplineView.tsx
```

Không cần thêm tab mới vào `APP_VISIBLE_TABS` ở giai đoạn này.

## 5. Cập nhật `DisciplineView`

File:

```text
src/views/DisciplineView.tsx
```

### 5.1. Cập nhật type tab

Hiện tại:

```ts
type TabType = 'records' | 'meetings' | 'competitions';
```

Đổi thành:

```ts
type TabType = 'records' | 'meetings' | 'competitions' | 'evaluations';
```

### 5.2. Import tab mới

```ts
import EvaluationTab from '../components/Discipline/EvaluationTab';
```

### 5.3. Thêm nút tab UI

Thêm vào thanh điều hướng tab:

```tsx
<button
  onClick={() => setActiveTab('evaluations')}
  className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${activeTab === 'evaluations'
      ? 'border-primary text-primary'
      : 'border-transparent text-secondary hover:text-foreground hover:border-border'
    }`}
>
  <Trophy size={18} />
  Đánh giá Định kỳ
</button>
```

Có thể thay icon `Trophy` bằng `ClipboardCheck`, `Scale`, `BarChart3` hoặc `Award` nếu muốn phân biệt với tab thi đua.

### 5.4. Render tab mới

```tsx
{activeTab === 'evaluations' && (
  <EvaluationTab
    authToken={authToken}
    currentUser={currentUser}
    allMembers={allMembers}
  />
)}
```

## 6. Service layer `src/services/evaluations.ts`

### 6.1. Lưu ý quan trọng về base URL

Backend Evaluation v2 chạy ở:

```text
/api/v2/evaluations
```

Frontend `apiCall()` hiện có logic fallback cho `/api/v1`, vì vậy service evaluation phải truyền endpoint tuyệt đối `/api/v2/...`, không dùng `/api/v1/...`.

### 6.2. File service mẫu

```ts
import { apiCall, type ApiResponse } from './api';

const BASE = '/api/v2/evaluations';

export interface EvaluationCycle {
  id: string;
  code: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  status: EvaluationCycleStatus;
  description?: string | null;
  approvedAt?: string | null;
  lockedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type EvaluationCycleStatus =
  | 'DRAFT'
  | 'MEMBER_REVIEW'
  | 'APPROVED'
  | 'LOCKED'
  | 'CANCELLED';

export interface EvaluationCriterion {
  id: string;
  code: string;
  name: string;
  component: string;
  unitScope: string;
  unitCode?: string | null;
  maxScore: number;
  scoreMethod: string;
  requiresEvidence: boolean;
  isActive: boolean;
  sortOrder: number;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface MemberCycleRole {
  id: string;
  cycleId: string;
  memberId: string;
  unitCode: string;
  roleType: string;
  roleTitle?: string | null;
  participationWeight: number;
  isPrimary: boolean;
  note?: string | null;
}

export interface EvaluationScoreEvent {
  id: string;
  cycleId: string;
  memberId: string;
  criterionId: string;
  criterionCode: string;
  component: string;
  unitCode?: string | null;
  eventType: string;
  sourceType?: string | null;
  sourceId?: string | null;
  rawValue?: number | null;
  scoreDelta: number;
  weight?: number | null;
  note?: string | null;
  isVoid: boolean;
  voidReason?: string | null;
  recordedAt?: string;
}

export interface EvaluationEvidence {
  id: string;
  cycleId: string;
  memberId: string;
  criterionId?: string | null;
  scoreEventId?: string | null;
  evidenceType: string;
  title: string;
  url?: string | null;
  filePath?: string | null;
  description?: string | null;
  capturedAt?: string | null;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt?: string;
  updatedAt?: string;
}

export interface MemberEvaluation {
  id: string;
  cycleId: string;
  memberId: string;
  componentIScore: number;
  componentIIScore: number;
  componentIIiAScore: number;
  componentIIiBScore: number;
  totalScore: number;
  preliminaryClassification?: string | null;
  finalClassification?: string | null;
  attendanceRate?: number | null;
  blockers: unknown[];
  status: string;
  computedAt?: string | null;
}

export interface MemberEvaluationBreakdown {
  id: string;
  memberEvaluationId: string;
  cycleId: string;
  memberId: string;
  criterionId: string;
  criterionCode: string;
  component: string;
  unitCode?: string | null;
  rawScore: number;
  finalScore: number;
  maxScoreSnapshot: number;
  capApplied: boolean;
  evidenceCount: number;
  calculationNote?: string | null;
}

export interface EvaluationCycleSummary {
  cycleId: string;
  totalMembers: number;
  averageScore: number;
  classificationDistribution: Record<string, number>;
}

const unwrapList = <T>(response: ApiResponse<any>): ApiResponse<{ items: T[]; total: number }> => {
  if (response.status === 0 || !response.data) return response as ApiResponse<any>;
  const data = response.data?.data ?? response.data;
  const meta = response.data?.meta ?? {};
  return {
    ...response,
    data: {
      items: Array.isArray(data) ? data : [],
      total: meta.total ?? (Array.isArray(data) ? data.length : 0),
    },
  };
};

const unwrapData = <T>(response: ApiResponse<any>): ApiResponse<T> => {
  if (response.status === 0 || !response.data) return response as ApiResponse<T>;
  return {
    ...response,
    data: response.data?.data ?? response.data,
  };
};

export const getEvaluationCycles = async (
  params: { status?: string; type?: string; search?: string; page?: number; pageSize?: number } = {},
  token?: string
): Promise<ApiResponse<{ items: EvaluationCycle[]; total: number }>> => {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.type) query.set('type', params.type);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  const res = await apiCall(`${BASE}/cycles${query.toString() ? `?${query.toString()}` : ''}`, {}, token);
  return unwrapList<EvaluationCycle>(res);
};

export const createEvaluationCycle = async (payload: {
  code: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  description?: string;
}, token?: string): Promise<ApiResponse<EvaluationCycle>> => {
  const res = await apiCall(`${BASE}/cycles`, { method: 'POST', body: JSON.stringify(payload) }, token);
  return unwrapData<EvaluationCycle>(res);
};

export const updateEvaluationCycle = async (
  cycleId: string,
  payload: Partial<Pick<EvaluationCycle, 'name' | 'type' | 'startDate' | 'endDate' | 'description' | 'status'>>,
  token?: string
): Promise<ApiResponse<EvaluationCycle>> => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}`, { method: 'PATCH', body: JSON.stringify(payload) }, token);
  return unwrapData<EvaluationCycle>(res);
};

export const submitEvaluationCycleReview = async (cycleId: string, token?: string) => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/submit-review`, { method: 'POST' }, token);
  return unwrapData<EvaluationCycle>(res);
};

export const approveEvaluationCycle = async (cycleId: string, token?: string) => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/approve`, { method: 'POST' }, token);
  return unwrapData<EvaluationCycle>(res);
};

export const lockEvaluationCycle = async (cycleId: string, token?: string) => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/lock`, { method: 'POST' }, token);
  return unwrapData<EvaluationCycle>(res);
};

export const cancelEvaluationCycle = async (cycleId: string, token?: string) => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/cancel`, { method: 'POST' }, token);
  return unwrapData<EvaluationCycle>(res);
};

export const seedEvaluationCriteria = async (
  payload: { version?: string; overwrite?: boolean; effectiveFrom?: string } = {},
  token?: string
) => {
  const res = await apiCall(`${BASE}/criteria/seed`, { method: 'POST', body: JSON.stringify(payload) }, token);
  return unwrapData(res);
};

export const getEvaluationCriteria = async (
  params: { component?: string; unitCode?: string; isActive?: boolean; search?: string; page?: number; pageSize?: number } = {},
  token?: string
): Promise<ApiResponse<{ items: EvaluationCriterion[]; total: number }>> => {
  const query = new URLSearchParams();
  if (params.component) query.set('component', params.component);
  if (params.unitCode) query.set('unitCode', params.unitCode);
  if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  const res = await apiCall(`${BASE}/criteria${query.toString() ? `?${query.toString()}` : ''}`, {}, token);
  return unwrapList<EvaluationCriterion>(res);
};

export const createMemberCycleRole = async (cycleId: string, payload: {
  memberId: string;
  unitCode: string;
  roleType: string;
  roleTitle?: string;
  participationWeight: number;
  isPrimary?: boolean;
  note?: string;
}, token?: string): Promise<ApiResponse<MemberCycleRole>> => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/member-roles`, { method: 'POST', body: JSON.stringify(payload) }, token);
  return unwrapData<MemberCycleRole>(res);
};

export const getMemberCycleRoles = async (
  cycleId: string,
  params: { memberId?: string; unitCode?: string; page?: number; pageSize?: number } = {},
  token?: string
): Promise<ApiResponse<{ items: MemberCycleRole[]; total: number }>> => {
  const query = new URLSearchParams();
  if (params.memberId) query.set('memberId', params.memberId);
  if (params.unitCode) query.set('unitCode', params.unitCode);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  const res = await apiCall(`${BASE}/cycles/${cycleId}/member-roles${query.toString() ? `?${query.toString()}` : ''}`, {}, token);
  return unwrapList<MemberCycleRole>(res);
};

export const createEvaluationScoreEvent = async (cycleId: string, payload: {
  memberId: string;
  criterionId?: string;
  criterionCode: string;
  unitCode?: string;
  eventType: string;
  sourceType?: string;
  sourceId?: string;
  rawValue?: number;
  scoreDelta: number;
  weight?: number;
  note?: string;
  metadata?: Record<string, unknown>;
}, token?: string): Promise<ApiResponse<EvaluationScoreEvent>> => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/score-events`, { method: 'POST', body: JSON.stringify(payload) }, token);
  return unwrapData<EvaluationScoreEvent>(res);
};

export const getEvaluationScoreEvents = async (
  cycleId: string,
  params: { memberId?: string; criterionCode?: string; component?: string; unitCode?: string; eventType?: string; sourceType?: string; isVoid?: boolean; page?: number; pageSize?: number } = {},
  token?: string
): Promise<ApiResponse<{ items: EvaluationScoreEvent[]; total: number }>> => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });
  const res = await apiCall(`${BASE}/cycles/${cycleId}/score-events${query.toString() ? `?${query.toString()}` : ''}`, {}, token);
  return unwrapList<EvaluationScoreEvent>(res);
};

export const voidEvaluationScoreEvent = async (eventId: string, reason?: string, token?: string) => {
  const res = await apiCall(`${BASE}/score-events/${eventId}/void`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  }, token);
  return unwrapData<EvaluationScoreEvent>(res);
};

export const createEvaluationEvidence = async (cycleId: string, payload: {
  memberId: string;
  criterionId?: string;
  criterionCode?: string;
  scoreEventId?: string;
  evidenceType: string;
  title: string;
  url?: string;
  filePath?: string;
  description?: string;
  capturedAt?: string;
  metadata?: Record<string, unknown>;
}, token?: string): Promise<ApiResponse<EvaluationEvidence>> => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/evidence`, { method: 'POST', body: JSON.stringify(payload) }, token);
  return unwrapData<EvaluationEvidence>(res);
};

export const getEvaluationEvidence = async (
  cycleId: string,
  params: { memberId?: string; criterionId?: string; evidenceType?: string; status?: string; page?: number; pageSize?: number } = {},
  token?: string
): Promise<ApiResponse<{ items: EvaluationEvidence[]; total: number }>> => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });
  const res = await apiCall(`${BASE}/cycles/${cycleId}/evidence${query.toString() ? `?${query.toString()}` : ''}`, {}, token);
  return unwrapList<EvaluationEvidence>(res);
};

export const verifyEvaluationEvidence = async (evidenceId: string, note?: string, token?: string) => {
  const res = await apiCall(`${BASE}/evidence/${evidenceId}/verify`, {
    method: 'PATCH',
    body: JSON.stringify({ note }),
  }, token);
  return unwrapData<EvaluationEvidence>(res);
};

export const rejectEvaluationEvidence = async (evidenceId: string, note?: string, token?: string) => {
  const res = await apiCall(`${BASE}/evidence/${evidenceId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ note }),
  }, token);
  return unwrapData<EvaluationEvidence>(res);
};

export const computeEvaluationCycle = async (
  cycleId: string,
  payload: { strict?: boolean; evidenceMode?: string; recomputeExisting?: boolean } = {},
  token?: string
) => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/compute`, {
    method: 'POST',
    body: JSON.stringify({ strict: true, evidenceMode: 'approval', recomputeExisting: true, ...payload }),
  }, token);
  return unwrapData(res);
};

export const computeEvaluationMember = async (
  cycleId: string,
  memberId: string,
  payload: { strict?: boolean; evidenceMode?: string; recomputeExisting?: boolean } = {},
  token?: string
) => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/members/${memberId}/compute`, {
    method: 'POST',
    body: JSON.stringify({ strict: true, evidenceMode: 'approval', recomputeExisting: true, ...payload }),
  }, token);
  return unwrapData(res);
};

export const getEvaluationMemberResults = async (
  cycleId: string,
  params: { classification?: string; status?: string; minScore?: number; maxScore?: number; unitCode?: string; page?: number; pageSize?: number } = {},
  token?: string
): Promise<ApiResponse<{ items: MemberEvaluation[]; total: number }>> => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });
  const res = await apiCall(`${BASE}/cycles/${cycleId}/members${query.toString() ? `?${query.toString()}` : ''}`, {}, token);
  return unwrapList<MemberEvaluation>(res);
};

export const getEvaluationMemberBreakdowns = async (cycleId: string, memberId: string, token?: string) => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/members/${memberId}/breakdowns`, {}, token);
  return unwrapList<MemberEvaluationBreakdown>(res);
};

export const getEvaluationCycleSummary = async (cycleId: string, token?: string) => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/summary`, {}, token);
  return unwrapData<EvaluationCycleSummary>(res);
};

export const syncEvaluationAttendance = async (cycleId: string, meetingId: string, token?: string) => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/sync/attendance/${meetingId}`, { method: 'POST' }, token);
  return unwrapData(res);
};

export const syncEvaluationCompetition = async (cycleId: string, competitionId: string, token?: string) => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/sync/competition/${competitionId}`, { method: 'POST' }, token);
  return unwrapData(res);
};
```

## 7. Data constants `src/data/evaluations.ts`

Tạo file để chuẩn hóa label, option và mapping trạng thái.

```ts
export const EVALUATION_CYCLE_STATUSES = [
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'MEMBER_REVIEW', label: 'Đang rà soát' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'LOCKED', label: 'Đã khóa' },
  { value: 'CANCELLED', label: 'Đã hủy' },
] as const;

export const EVALUATION_COMPONENTS = [
  { value: 'I', label: 'Kỷ luật & Chuyên cần' },
  { value: 'II', label: 'Thái độ & Ý thức tổ chức' },
  { value: 'III_A', label: 'Hiệu suất chung' },
  { value: 'III_B', label: 'Hiệu suất chuyên môn theo ban' },
] as const;

export const EVALUATION_UNIT_CODES = [
  { value: 'BCN', label: 'Ban Chủ nhiệm' },
  { value: 'TECH', label: 'Ban Công nghệ' },
  { value: 'MEDIA', label: 'Ban Truyền thông' },
  { value: 'OPS_HR', label: 'Ban Vận hành - Nhân sự' },
  { value: 'OPS_FINANCE', label: 'Ban Vận hành - Tài chính' },
  { value: 'OPS_DISCIPLINE', label: 'Ban Vận hành - Kỷ luật' },
  { value: 'OPS_LOGISTICS', label: 'Ban Vận hành - Hậu cần' },
] as const;

export const EVALUATION_EVENT_TYPES = [
  { value: 'BONUS', label: 'Điểm cộng' },
  { value: 'PENALTY', label: 'Điểm trừ' },
  { value: 'RAW', label: 'Điểm ghi nhận' },
  { value: 'ADJUSTMENT', label: 'Điều chỉnh' },
] as const;

export const EVALUATION_EVIDENCE_TYPES = [
  { value: 'LINK', label: 'Đường dẫn' },
  { value: 'TEXT', label: 'Mô tả' },
  { value: 'FILE', label: 'Tệp minh chứng' },
] as const;

export const EVALUATION_CLASSIFICATIONS = [
  { value: 'EXCELLENT', label: 'Xuất sắc' },
  { value: 'GOOD', label: 'Tốt' },
  { value: 'QUALIFIED', label: 'Đạt' },
  { value: 'WARNING', label: 'Cần cải thiện' },
  { value: 'FAILED', label: 'Không đạt' },
] as const;
```

Nếu backend seed dùng code khác, FE phải map theo response thực tế từ API thay vì hard-code.

## 8. Component thiết kế

### 8.1. `EvaluationTab.tsx`

Vai trò: container chính cho submodule.

State chính:

```ts
const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
const [innerTab, setInnerTab] = useState<
  'cycles' | 'criteria' | 'roles' | 'events' | 'evidence' | 'results' | 'sync' | 'appeals'
>('cycles');
```

Props:

```ts
interface EvaluationTabProps {
  authToken?: string;
  currentUser: UserAccount;
  allMembers: Member[];
}
```

Layout đề xuất:

```text
EvaluationTab
├── Header: Đánh giá Định kỳ
├── Cycle selector
├── Quick stats / summary cards
├── Inner tabs
│   ├── Chu kỳ
│   ├── Tiêu chí
│   ├── Vai trò thành viên
│   ├── Sự kiện điểm
│   ├── Minh chứng
│   ├── Kết quả
│   ├── Đồng bộ dữ liệu
│   └── Khiếu nại
└── Panel theo innerTab
```

### 8.2. `EvaluationCyclesPanel.tsx`

Chức năng:

- Lấy danh sách chu kỳ.
- Tạo chu kỳ mới.
- Chọn chu kỳ đang thao tác.
- Gửi duyệt.
- Duyệt chu kỳ.
- Khóa chu kỳ.
- Hủy chu kỳ.

Các API dùng:

```text
GET    /api/v2/evaluations/cycles
POST   /api/v2/evaluations/cycles
PATCH  /api/v2/evaluations/cycles/{cycle_id}
POST   /api/v2/evaluations/cycles/{cycle_id}/submit-review
POST   /api/v2/evaluations/cycles/{cycle_id}/approve
POST   /api/v2/evaluations/cycles/{cycle_id}/lock
POST   /api/v2/evaluations/cycles/{cycle_id}/cancel
```

Form tạo chu kỳ:

| Field | Type | Required |
|---|---|---:|
| `code` | string | Có |
| `name` | string | Có |
| `type` | string | Có |
| `startDate` | date | Có |
| `endDate` | date | Có |
| `description` | textarea | Không |

Validation FE:

- `code` không rỗng.
- `name` không rỗng.
- `startDate <= endDate`.
- Không cho khóa nếu cycle chưa có kết quả compute, trừ khi BCN xác nhận.

### 8.3. `EvaluationCriteriaPanel.tsx`

Chức năng:

- Xem danh sách tiêu chí.
- Lọc theo component, unitCode, trạng thái active.
- Seed tiêu chí mặc định version `2026`.
- Tạo/cập nhật tiêu chí nếu cần.

Các API dùng:

```text
POST  /api/v2/evaluations/criteria/seed
GET   /api/v2/evaluations/criteria
GET   /api/v2/evaluations/criteria/{criterion_id}
POST  /api/v2/evaluations/criteria
PATCH /api/v2/evaluations/criteria/{criterion_id}
PATCH /api/v2/evaluations/criteria/{criterion_id}/status
```

MVP nên có:

- Nút `Seed tiêu chí 2026`.
- Bảng tiêu chí.
- Bộ lọc component/unitCode.
- Chưa cần editor phức tạp nếu tiêu chí đã seed đúng.

### 8.4. `EvaluationMemberRolesPanel.tsx`

Chức năng:

- Gán thành viên vào đơn vị/ban trong một chu kỳ.
- Hỗ trợ thành viên đa ban.
- Đánh dấu vai trò chính (`isPrimary`).
- Gán trọng số tham gia (`participationWeight`).

Các API dùng:

```text
POST   /api/v2/evaluations/cycles/{cycle_id}/member-roles
GET    /api/v2/evaluations/cycles/{cycle_id}/member-roles
GET    /api/v2/evaluations/cycles/{cycle_id}/members/{member_id}/roles
PATCH  /api/v2/evaluations/member-roles/{role_id}
DELETE /api/v2/evaluations/member-roles/{role_id}
```

Form gán vai trò:

| Field | Type | Required | Ghi chú |
|---|---|---:|---|
| `memberId` | select | Có | Lấy từ `allMembers` |
| `unitCode` | select | Có | TECH/MEDIA/OPS_* |
| `roleType` | select/text | Có | MEMBER/LEAD/CONTRIBUTOR |
| `roleTitle` | text | Không | Thành viên, Trưởng nhóm... |
| `participationWeight` | number | Có | 0–1 |
| `isPrimary` | checkbox | Không | Chỉ một primary role mỗi cycle |
| `note` | textarea | Không | Ghi chú |

### 8.5. `EvaluationScoreEventsPanel.tsx`

Chức năng:

- Ghi điểm cộng/trừ/thô/điều chỉnh.
- Xem lịch sử score events.
- Void score event nếu ghi sai.

Các API dùng:

```text
POST  /api/v2/evaluations/cycles/{cycle_id}/score-events
GET   /api/v2/evaluations/cycles/{cycle_id}/score-events
PATCH /api/v2/evaluations/score-events/{event_id}/void
```

Form tạo score event:

| Field | Type | Required |
|---|---|---:|
| `memberId` | select | Có |
| `criterionCode` | select/text | Có |
| `unitCode` | select | Không |
| `eventType` | select | Có |
| `sourceType` | text/select | Không |
| `sourceId` | text | Không |
| `rawValue` | number | Không |
| `scoreDelta` | number | Có |
| `weight` | number | Không |
| `note` | textarea | Không |

Validation FE:

- `scoreDelta` phải là số.
- Nếu `eventType = PENALTY`, có thể cho nhập số dương; backend sẽ chuyển về âm theo logic hiện có.
- Nếu có `sourceType`, nên có `sourceId` để chống ghi trùng nguồn.

### 8.6. `EvaluationEvidencePanel.tsx`

Chức năng:

- Nộp minh chứng cho thành viên/tiêu chí/score event.
- Xem danh sách minh chứng.
- Duyệt/từ chối minh chứng.

Các API dùng:

```text
POST  /api/v2/evaluations/cycles/{cycle_id}/evidence
GET   /api/v2/evaluations/cycles/{cycle_id}/evidence
PATCH /api/v2/evaluations/evidence/{evidence_id}/verify
PATCH /api/v2/evaluations/evidence/{evidence_id}/reject
```

Form minh chứng:

| Field | Type | Required |
|---|---|---:|
| `memberId` | select | Có |
| `criterionCode` | select/text | Không nếu đã có scoreEventId |
| `scoreEventId` | select/text | Không |
| `evidenceType` | select | Có |
| `title` | text | Có |
| `url` | text | Ít nhất một trong url/filePath/description |
| `filePath` | text | Ít nhất một trong url/filePath/description |
| `description` | textarea | Ít nhất một trong url/filePath/description |
| `capturedAt` | datetime | Không |

Validation FE bắt buộc:

```ts
if (!url && !filePath && !description) {
  throw new Error('Cần nhập ít nhất một trong: đường dẫn, filePath hoặc mô tả minh chứng.');
}
```

### 8.7. `EvaluationResultsPanel.tsx`

Chức năng:

- Compute điểm toàn chu kỳ.
- Compute điểm từng thành viên.
- Xem danh sách kết quả.
- Xem breakdown từng thành viên.
- Xem summary chu kỳ.

Các API dùng:

```text
POST /api/v2/evaluations/cycles/{cycle_id}/compute
POST /api/v2/evaluations/cycles/{cycle_id}/members/{member_id}/compute
GET  /api/v2/evaluations/cycles/{cycle_id}/members
GET  /api/v2/evaluations/cycles/{cycle_id}/members/{member_id}
GET  /api/v2/evaluations/cycles/{cycle_id}/members/{member_id}/breakdowns
GET  /api/v2/evaluations/cycles/{cycle_id}/summary
```

Bảng kết quả nên có:

| Cột | Dữ liệu |
|---|---|
| Thành viên | map `memberId` sang `allMembers.name` |
| Ban chính | lấy từ member roles hoặc member.ban |
| Điểm I | `componentIScore` |
| Điểm II | `componentIIScore` |
| Điểm III-A | `componentIIiAScore` |
| Điểm III-B | `componentIIiBScore` |
| Tổng điểm | `totalScore` |
| Xếp loại | `finalClassification` |
| Trạng thái | `status` |
| Thao tác | Xem breakdown / compute lại |

### 8.8. `EvaluationSyncPanel.tsx`

Chức năng:

- Đồng bộ dữ liệu điểm danh từ meeting vào score events.
- Đồng bộ dữ liệu thi đua/cuộc thi vào score events.

Các API dùng:

```text
POST /api/v2/evaluations/cycles/{cycle_id}/sync/attendance/{meeting_id}
POST /api/v2/evaluations/cycles/{cycle_id}/sync/competition/{competition_id}
```

Dữ liệu nguồn:

- Meeting list: dùng service `meetings_api.ts` hiện có.
- Competition list: dùng service competitions hiện có hoặc cần tạo nếu chưa có.

UI đề xuất:

```text
Đồng bộ dữ liệu
├── Chọn chu kỳ đánh giá
├── Đồng bộ điểm danh
│   ├── Chọn meeting
│   └── Button: Đồng bộ attendance
└── Đồng bộ thi đua
    ├── Chọn competition
    └── Button: Đồng bộ competition
```

### 8.9. `EvaluationAppealsPanel.tsx`

MVP có thể chỉ xem và tạo khiếu nại. Phase 2 xử lý resolve đầy đủ.

Các API dùng:

```text
POST /api/v2/evaluations/cycles/{cycle_id}/appeals
GET  /api/v2/evaluations/cycles/{cycle_id}/appeals
GET  /api/v2/evaluations/appeals/{appeal_id}
```

Nếu backend đã có thêm endpoint resolve/cancel ở phần sau của file router, cập nhật service tương ứng sau khi xác minh đường dẫn.

## 9. Phân quyền FE

Backend đã kiểm tra quyền chính thức. FE vẫn nên ẩn hoặc disable thao tác theo role để giảm lỗi thao tác.

### 9.1. Role nhóm

```ts
const EVALUATION_ADMIN_ROLES = ['bcn'];
const EVALUATION_OPERATOR_ROLES = ['bcn', 'bvh_discipline', 'bvh_hr'];
const EVALUATION_RECORDER_ROLES = ['bcn', 'bvh_discipline', 'bvh_hr', 'bcm'];
const EVALUATION_MANAGER_ROLES = ['bcn', 'bvh_discipline', 'bvh_hr'];
```

### 9.2. Matrix thao tác

| Thao tác | Role FE được hiện nút |
|---|---|
| Tạo/cập nhật chu kỳ | `bcn`, `bvh_discipline`, `bvh_hr` |
| Submit review | `bvh_discipline`, `bvh_hr` |
| Approve/lock/cancel cycle | `bcn` |
| Seed/quản lý tiêu chí | `bcn`, `bvh_discipline` |
| Gán member roles | `bcn`, `bvh_discipline`, `bvh_hr` |
| Ghi score events | `bcn`, `bvh_discipline`, `bvh_hr`, `bcm` |
| Void score events | `bcn`, `bvh_discipline` |
| Submit evidence | recorder hoặc member liên kết nếu sau này mở UI member |
| Verify/reject evidence | `bcn`, `bvh_discipline`, `bvh_hr`, `bcm` |
| Compute result | `bcn`, `bvh_discipline`, `bvh_hr` |
| View results manager | `bcn`, `bvh_discipline`, `bvh_hr` |

## 10. Luồng UX MVP

### 10.1. Thiết lập chu kỳ đánh giá

```text
Mở Kỷ luật & Hiệu suất
        ↓
Chọn tab Đánh giá Định kỳ
        ↓
Tạo chu kỳ mới
        ↓
Seed tiêu chí 2026 nếu chưa có
        ↓
Gán vai trò thành viên trong chu kỳ
```

### 10.2. Ghi nhận dữ liệu đánh giá

```text
Đồng bộ attendance từ cuộc họp
        ↓
Đồng bộ competition từ thi đua
        ↓
Ghi bổ sung score events thủ công nếu cần
        ↓
Nộp/duyệt minh chứng
```

### 10.3. Tính và duyệt kết quả

```text
Compute toàn chu kỳ
        ↓
Xem summary và bảng kết quả
        ↓
Xem breakdown thành viên bất thường
        ↓
Submit review
        ↓
BCN approve
        ↓
BCN lock cycle
```

## 11. State management đề xuất

Không cần thêm Zustand trong MVP. Có thể dùng local state + service calls.

State tối thiểu trong `EvaluationTab`:

```ts
const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
const [summary, setSummary] = useState<EvaluationCycleSummary | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

Nếu module phình lớn, có thể tách hook:

```text
src/hooks/
└── useEvaluationCycle.ts
```

## 12. Error handling

Backend Evaluation v2 trả lỗi dạng:

```json
{
  "detail": {
    "code": "EVALUATION_CYCLE_LOCKED",
    "message": "Evaluation cycle is locked"
  }
}
```

Frontend `apiCall()` hiện lấy `data.message || data.detail || HTTP status`. Nếu `detail` là object, toast có thể hiển thị `[object Object]`.

Khuyến nghị cập nhật helper parse error trong service hoặc global `apiCall`:

```ts
const extractApiError = (data: any, fallback: string) => {
  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.detail === 'string') return data.detail;
  if (typeof data?.detail?.message === 'string') return data.detail.message;
  if (typeof data?.detail?.code === 'string') return data.detail.code;
  return fallback;
};
```

Nếu chưa sửa global `apiCall`, service `evaluations.ts` nên normalize lỗi trước khi trả về UI.

## 13. Loading/empty/error state

Mỗi panel phải có đủ trạng thái:

| State | Cách xử lý |
|---|---|
| Loading | Skeleton hoặc spinner |
| Empty | Hiển thị hướng dẫn hành động tiếp theo |
| Error | Toast + message trong panel |
| Forbidden | Ẩn nút thao tác hoặc hiển thị “Không có quyền” |
| Locked cycle | Disable toàn bộ thao tác ghi/sửa |

## 14. Quy tắc khóa chu kỳ

Khi cycle có trạng thái `LOCKED`:

- Không cho cập nhật chu kỳ.
- Không cho tạo/sửa/xóa member roles.
- Không cho tạo score events.
- Không cho void score events.
- Không cho tạo/duyệt/reject evidence.
- Không cho compute lại.
- Chỉ cho xem kết quả, breakdown, summary và logs.

UI nên có banner:

```text
Chu kỳ này đã khóa. Dữ liệu chỉ được xem, không thể chỉnh sửa.
```

## 15. Mapping memberId sang thông tin thành viên

`Evaluation` API trả nhiều object theo `memberId`. FE nên nhận `allMembers` từ `DisciplineView` và tạo map:

```ts
const memberById = useMemo(() => {
  return new Map(allMembers.map((member) => [member.id, member]));
}, [allMembers]);
```

Khi render:

```tsx
const member = memberById.get(row.memberId);
return member ? `${member.name} (${member.mssv})` : row.memberId;
```

## 16. Chuẩn component UI

Dùng lại component hiện có:

```text
src/components/ui/button.tsx
src/components/ui/input.tsx
src/components/ui/select.tsx
src/components/ui/modal.tsx
src/components/ui/badge.tsx
src/components/ui/table.tsx
src/components/ui/toast.tsx
src/components/ui/skeleton.tsx
```

Không tạo UI kit mới cho Evaluation v2.

## 17. Kế hoạch triển khai theo phase

### Phase 1 — MVP đọc/thiết lập chu kỳ

- Tạo `src/services/evaluations.ts`.
- Tạo `src/data/evaluations.ts`.
- Thêm tab `evaluations` vào `DisciplineView`.
- Tạo `EvaluationTab`.
- Tạo `EvaluationCyclesPanel`.
- Tạo `EvaluationCriteriaPanel` với seed/list criteria.

Definition of Done:

- Vào được tab Đánh giá Định kỳ.
- List/create/update cycle hoạt động.
- Seed/list criteria hoạt động.
- Có phân quyền ẩn nút cơ bản.

### Phase 2 — Gán vai trò và ghi dữ liệu

- Tạo `EvaluationMemberRolesPanel`.
- Tạo `EvaluationScoreEventsPanel`.
- Tạo `EvaluationEvidencePanel`.
- Gắn `allMembers` vào select member.

Definition of Done:

- Gán member vào cycle được.
- Tạo score event được.
- Nộp/duyệt/từ chối evidence được.

### Phase 3 — Compute và xem kết quả

- Tạo `EvaluationResultsPanel`.
- Tạo summary cards.
- Tạo breakdown modal.
- Thêm compute cycle/member.

Definition of Done:

- Compute toàn chu kỳ được.
- Xem danh sách kết quả được.
- Xem breakdown từng thành viên được.
- Xem summary chu kỳ được.

### Phase 4 — Đồng bộ dữ liệu và appeal

- Tạo `EvaluationSyncPanel`.
- Tích hợp meeting list và competition list.
- Tạo `EvaluationAppealsPanel` MVP.

Definition of Done:

- Đồng bộ attendance sang evaluation score events được.
- Đồng bộ competition sang evaluation score events được.
- Xem/tạo appeal cơ bản được.

## 18. Checklist test thủ công

### 18.1. Role `bcn`

- Thấy tab Đánh giá Định kỳ.
- Tạo chu kỳ mới.
- Seed tiêu chí.
- Gán member roles.
- Tạo score event.
- Duyệt evidence.
- Compute result.
- Approve và lock cycle.

### 18.2. Role `bvh_discipline`

- Thấy tab Đánh giá Định kỳ.
- Tạo/cập nhật chu kỳ nếu chưa lock.
- Seed/quản lý tiêu chí.
- Ghi score event.
- Compute result.
- Không được approve/lock cycle nếu backend không cho.

### 18.3. Role `bvh_hr`

- Thấy tab Đánh giá Định kỳ nếu truy cập qua Discipline hoặc nếu mở quyền view.
- Gán member roles.
- Ghi score event nếu đúng quyền backend.
- Compute result.
- Không được approve/lock cycle.

### 18.4. Role `bcm`

- Chỉ ghi score event/minh chứng trong phạm vi được backend cho phép.
- Không thấy nút quản lý chu kỳ, lock, approve.

### 18.5. Cycle locked

- Mọi nút tạo/sửa/xóa/compute bị disable.
- Vẫn xem được results, breakdown, summary.

## 19. Acceptance criteria tổng

Evaluation v2 FE được xem là hoàn thành MVP khi:

- `DisciplineView` có tab con `Đánh giá Định kỳ`.
- FE gọi đúng API `/api/v2/evaluations`, không nhầm sang `/api/v1`.
- Có service `evaluations.ts` typed rõ ràng.
- Có thể tạo/list/update cycle.
- Có thể seed/list criteria.
- Có thể gán member role vào cycle.
- Có thể tạo/list/void score events.
- Có thể tạo/list/verify/reject evidence.
- Có thể compute cycle/member.
- Có thể xem member results, breakdown và summary.
- Có xử lý loading/empty/error/forbidden/locked state.
- FE không cho thao tác vượt quyền thông qua UI, dù backend vẫn là lớp kiểm soát chính.

## 20. Rủi ro kỹ thuật

| Rủi ro | Mức độ | Biện pháp |
|---|---:|---|
| Gọi sai `/api/v1` thay vì `/api/v2` | Cao | Dùng `BASE = '/api/v2/evaluations'` cố định trong service |
| Toast lỗi hiển thị `[object Object]` | Trung bình | Parse `detail.message` trong error helper |
| Evaluation UI quá lớn trong một file | Cao | Tách panel component theo chức năng |
| Cycle locked nhưng UI vẫn cho sửa | Cao | Disable thao tác khi `selectedCycle.status === 'LOCKED'` |
| Không map được `memberId` sang tên | Trung bình | Truyền `allMembers` từ `DisciplineView`, tạo `memberById` map |
| Backend role khác frontend role | Trung bình | FE chỉ ẩn nút; backend vẫn là nguồn xác thực cuối cùng |
| Criteria code không đồng bộ với seed backend | Cao | Luôn lấy criteria từ API, hạn chế hard-code |

## 21. Gợi ý thứ tự commit

```text
1. docs: add evaluation v2 FE implementation guide
2. feat(evaluations): add evaluation API service and types
3. feat(discipline): add evaluations tab container
4. feat(evaluations): add cycles and criteria panels
5. feat(evaluations): add member roles and score events panels
6. feat(evaluations): add evidence panel
7. feat(evaluations): add results and summary panels
8. feat(evaluations): add sync and appeals panels
9. fix(evaluations): harden error handling and locked-cycle state
```

## 22. Kết luận

Evaluation v2 nên được triển khai như **submodule Đánh giá Định kỳ** trong `DisciplineView`. Cách này phù hợp với miền nghiệp vụ hiện tại, tận dụng được dữ liệu điểm danh/KPI/thi đua, và không cần thay đổi cấu trúc sidebar.

Sau khi MVP ổn định, nếu khối lượng UI và tần suất sử dụng tăng, có thể tách `evaluations` thành module sidebar độc lập bằng cách thêm tab vào `APP_VISIBLE_TABS` và `APP_TAB_DEFINITIONS`.
