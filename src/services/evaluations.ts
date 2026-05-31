import { apiCall, getBaseUrl, type ApiResponse } from './api';

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
  | 'DATA_COLLECTION'
  | 'SCORING'
  | 'MEMBER_REVIEW'
  | 'APPEAL_RESOLUTION'
  | 'READY_FOR_APPROVAL'
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
  metadata?: EvaluationCriterionMetadata | null;
}

export interface EvaluationCriterionRule {
  itemCode?: string;
  calculationNote?: string;
  detail?: string;
  scoreDelta?: string | number;
  note?: string;
  evidence?: string;
  recordingUnit?: string;
}

export interface EvaluationCriterionMetadata extends Record<string, unknown> {
  source?: {
    workbook?: string;
    sheet?: string;
  };
  formula?: string;
  evidence?: string;
  recordingUnit?: string;
  rules?: EvaluationCriterionRule[];
  rawMaxScore?: number;
  rawScaleMaxScore?: number;
  convertedMaxScore?: number;
  conversionFormula?: string;
  conversionFactor?: number;
  unitLabel?: string;
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
  reviewNote?: string | null;
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

export interface EvaluationAppeal {
  id: string;
  cycleId: string;
  memberId: string;
  memberEvaluationId?: string | null;
  criterionId?: string | null;
  criterionCode?: string | null;
  appealType?: string | null;
  content?: string | null;
  requestedScore?: number | null;
  status:
    | 'PENDING'
    | 'IN_REVIEW'
    | 'NEEDS_MORE_EVIDENCE'
    | 'ACCEPTED'
    | 'PARTIALLY_ACCEPTED'
    | 'REJECTED'
    | 'CANCELLED';
  resolvedByUserId?: string | null;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
  metadata?: Record<string, any> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EvaluationQuickReviewItem {
  cycleId: string;
  memberId: string;
  componentScores: {
    I?: number;
    II?: number;
    III_A?: number;
    III_B?: number;
    [key: string]: number | undefined;
  };
  totalScore: number;
  preliminaryClassification?: string | null;
  finalClassification?: string | null;
  attendanceRate?: number | null;
  blockers: unknown[];
  warnings: unknown[];
  breakdowns: MemberEvaluationBreakdown[];
  calculationVersion: string;
}

export interface EvaluationQuickReviewCycle {
  cycleId: string;
  totalMembers: number;
  averageScore: number;
  classificationDistribution: Record<string, number>;
  items: EvaluationQuickReviewItem[];
  errors: Array<{
    memberId: string;
    code: string;
    message: string;
  }>;
  isTemporary: boolean;
  persisted: boolean;
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

export const markEvaluationCycleReadyForApproval = async (cycleId: string, token?: string) => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/ready-for-approval`, { method: 'POST' }, token);
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
): Promise<ApiResponse<any>> => {
  const res = await apiCall(`${BASE}/criteria/seed`, { method: 'POST', body: JSON.stringify(payload) }, token);
  return unwrapData<any>(res);
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

export const createMemberCycleRolesBulk = async (cycleId: string, roles: any[], token?: string): Promise<ApiResponse<any>> => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/member-roles/bulk`, {
    method: 'POST',
    body: JSON.stringify({ roles }),
  }, token);
  return unwrapData(res);
};

export const deleteMemberCycleRole = async (roleId: string, token?: string): Promise<ApiResponse<any>> => {
  return await apiCall(`${BASE}/member-roles/${roleId}`, { method: 'DELETE' }, token);
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

export const createEvaluationScoreEventBulk = async (cycleId: string, events: any[], token?: string): Promise<ApiResponse<any>> => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/score-events/bulk`, {
    method: 'POST',
    body: JSON.stringify({ events }),
  }, token);
  return unwrapData(res);
};

export const voidEvaluationScoreEvent = async (eventId: string, reason: string, token?: string): Promise<ApiResponse<any>> => {
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
): Promise<ApiResponse<any>> => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/compute`, {
    method: 'POST',
    body: JSON.stringify({ strict: true, evidenceMode: 'approval', recomputeExisting: true, ...payload }),
  }, token);
  return unwrapData<any>(res);
};

export const computeEvaluationMember = async (
  cycleId: string,
  memberId: string,
  payload: { strict?: boolean; evidenceMode?: string; recomputeExisting?: boolean } = {},
  token?: string
): Promise<ApiResponse<any>> => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/members/${memberId}/compute`, {
    method: 'POST',
    body: JSON.stringify({ strict: true, evidenceMode: 'approval', recomputeExisting: true, ...payload }),
  }, token);
  return unwrapData<any>(res);
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

export const exportMemberEvaluationReportUrl = (cycleId: string, memberId: string) => {
  const API_BASE = getBaseUrl();
  // use the reports router path on the backend
  return `${API_BASE}/api/v2/evaluations/reports/cycles/${cycleId}/members/${memberId}/exports/report.docx`;
};

export const getEvaluationCycleSummary = async (cycleId: string, token?: string) => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/summary`, {}, token);
  return unwrapData<EvaluationCycleSummary>(res);
};

export const syncEvaluationAttendance = async (
  cycleId: string,
  meetingId: string,
  token?: string
): Promise<ApiResponse<{ message?: string }>> => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/sync/attendance/${meetingId}`, { method: 'POST' }, token);
  return unwrapData<{ message?: string }>(res);
};

export const syncEvaluationCompetition = async (
  cycleId: string,
  competitionId: string,
  token?: string
): Promise<ApiResponse<{ message?: string }>> => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/sync/competition/${competitionId}`, { method: 'POST' }, token);
  return unwrapData<{ message?: string }>(res);
};

export const getEvaluationQuickReviewCycle = async (
  cycleId: string,
  params: { strict?: boolean; evidenceMode?: string } = {},
  token?: string
): Promise<ApiResponse<EvaluationQuickReviewCycle>> => {
  const query = new URLSearchParams();

  if (params.strict !== undefined) {
    query.set('strict', String(params.strict));
  }

  if (params.evidenceMode) {
    query.set('evidenceMode', params.evidenceMode);
  }

  const res = await apiCall(
    `${BASE}/cycles/${cycleId}/quick-review${query.toString() ? `?${query.toString()}` : ''}`,
    {},
    token
  );
  return unwrapData<EvaluationQuickReviewCycle>(res);
};

export const getEvaluationQuickReviewMember = async (
  cycleId: string,
  memberId: string,
  params: { strict?: boolean; evidenceMode?: string } = {},
  token?: string
): Promise<ApiResponse<EvaluationQuickReviewItem>> => {
  const query = new URLSearchParams();

  if (params.strict !== undefined) {
    query.set('strict', String(params.strict));
  }

  if (params.evidenceMode) {
    query.set('evidenceMode', params.evidenceMode);
  }

  const res = await apiCall(
    `${BASE}/cycles/${cycleId}/members/${memberId}/quick-review${query.toString() ? `?${query.toString()}` : ''}`,
    {},
    token
  );
  return unwrapData<EvaluationQuickReviewItem>(res);
};

export const getEvaluationAppeals = async (
  cycleId: string,
  token?: string
): Promise<ApiResponse<{ items: EvaluationAppeal[]; total: number }>> => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/appeals`, {}, token);
  return unwrapList<EvaluationAppeal>(res);
};

export const createEvaluationAppeal = async (
  cycleId: string,
  payload: { 
    memberId: string;
    appealType: string;
    content: string;
    memberEvaluationId?: string | null;
    criterionId?: string | null;
    criterionCode?: string | null;
    requestedScore?: number | null;
    evidenceIds?: string[];
  },
  token?: string
): Promise<ApiResponse<EvaluationAppeal>> => {
  const res = await apiCall(`${BASE}/cycles/${cycleId}/appeals`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }, token);
  return unwrapData<EvaluationAppeal>(res);
};
