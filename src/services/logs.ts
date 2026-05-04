import { apiCall, ApiResponse, getBaseUrl } from './api';

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  resourceId?: string;
  details: string;
  changes?: LogChange[];
  snapshotBefore?: any;
  snapshotAfter?: any;
}

export interface LogChange {
  field: string;
  before: string;
  after: string;
  isTruncated?: boolean;
}

export interface LogsQuery {
  search?: string;
  module?: string;
  action?: string;
  page?: number;
  pageSize?: number;
}

export interface LogsResponse {
  logs: ActivityLog[];
  total: number;
}

type BackendApiResponse<T> = {
  success?: boolean;
  data?: T;
  meta?: { total?: number };
  message?: string;
};

type BackendAuditLog = {
  id?: string;
  actorName?: string;
  action?: string;
  module?: string;
  resourceId?: string;
  createdAt?: string;
  beforeSnapshot?: any;
  afterSnapshot?: any;
};

const toText = (value: unknown): string => {
  if (value == null) return '';
  return String(value);
};

const normalizeValue = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const truncate = (value: string, maxLen: number) => {
  const text = value.trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
};

const memberFieldLabel: Record<string, string> = {
  mssv: 'MSSV',
  name: 'Họ tên',
  gender: 'Giới tính',
  dob: 'Ngày sinh',
  ban: 'Ban',
  status: 'Trạng thái',
  role_title: 'Chức vụ',
  phone: 'SĐT',
  email: 'Email',
  join_date: 'Ngày vào',
  lop: 'Lớp',
  chuyen_nganh: 'Chuyên ngành',
  khoa: 'Khoa',
  address: 'Địa chỉ',
  experience: 'Kinh nghiệm',
  goal: 'Mục tiêu',
  orientation: 'Định hướng'
};

const buildSnapshotDiff = (
  beforeSnapshot: any,
  afterSnapshot: any,
): LogChange[] => {
  const before = beforeSnapshot && typeof beforeSnapshot === 'object' ? (beforeSnapshot as Record<string, unknown>) : {};
  const after = afterSnapshot && typeof afterSnapshot === 'object' ? (afterSnapshot as Record<string, unknown>) : {};

  const keys = new Set<string>([...Object.keys(before), ...Object.keys(after)]);
  const ordered = Array.from(keys);
  ordered.sort((a, b) => a.localeCompare(b));

  const changes: LogChange[] = [];
  for (const key of ordered) {
    const beforeValue = normalizeValue(before[key]);
    const afterValue = normalizeValue(after[key]);
    if (beforeValue === afterValue) continue;

    const isLongField = key === 'address' || key === 'experience' || key === 'goal' || key === 'orientation';
    const leftRaw = beforeValue || '—';
    const rightRaw = afterValue || '—';
    const left = isLongField ? truncate(leftRaw, 40) : leftRaw;
    const right = isLongField ? truncate(rightRaw, 40) : rightRaw;
    changes.push({
      field: key,
      before: left,
      after: right,
      isTruncated: isLongField && (left !== leftRaw || right !== rightRaw)
    });
  }

  return changes;
};

const shortId = (value: string): string => {
  const text = value.trim();
  if (!text) return '';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(text)) return text.slice(0, 8);
  return text;
};

const labelModule = (value: string): string => {
  const module = value.trim().toUpperCase();
  switch (module) {
    case 'MEMBER':
    case 'MEMBERS':
      return 'Thành viên';
    case 'USER':
    case 'USERS':
      return 'Tài khoản';
    case 'REQUEST':
    case 'REQUESTS':
      return 'Đơn từ';
    case 'TRANSACTION':
    case 'TRANSACTIONS':
      return 'Giao dịch';
    case 'ASSET':
    case 'ASSETS':
      return 'Tài sản';
    case 'DISCIPLINE':
      return 'Kỷ luật';
    case 'SETTINGS':
      return 'Cài đặt';
    case 'AUTH':
      return 'Xác thực';
    case 'SYSTEM':
      return 'Hệ thống';
    default:
      return module || 'Hệ thống';
  }
};

const labelAction = (value: string): string => {
  const action = value.trim().toUpperCase();
  if (!action) return 'Hệ thống';
  if (action === 'LOGIN') return 'Đăng nhập';
  if (action === 'LOGOUT') return 'Đăng xuất';
  if (action === 'PASSWORD_CHANGE') return 'Đổi mật khẩu';
  if (action === 'EXPORT') return 'Xuất dữ liệu';

  const verb = action.split('_')[0];
  const object = action.replace(`${verb}_`, '');

  const objectLabel = (() => {
    switch (object) {
      case 'MEMBER':
        return 'thành viên';
      case 'USER':
        return 'tài khoản';
      case 'REQUEST':
        return 'đơn';
      case 'TRANSACTION':
        return 'giao dịch';
      case 'ASSET':
        return 'tài sản';
      default:
        return object ? object.toLowerCase() : '';
    }
  })();

  if (verb === 'CREATE') return objectLabel ? `Tạo ${objectLabel}` : 'Tạo';
  if (verb === 'UPDATE') return objectLabel ? `Cập nhật ${objectLabel}` : 'Cập nhật';
  if (verb === 'DELETE') return objectLabel ? `Xoá ${objectLabel}` : 'Xoá';
  if (verb === 'REVIEW') return objectLabel ? `Duyệt ${objectLabel}` : 'Duyệt';

  return action;
};

const buildDetails = (log: BackendAuditLog): string => {
  const action = toText(log.action).trim();
  const module = toText(log.module).trim();
  const resourceId = toText(log.resourceId).trim();

  const actionText = labelAction(action);
  const moduleText = labelModule(module);
  const idText = shortId(resourceId);

  if (action.toUpperCase() === 'UPDATE_MEMBER') {
    const diffs = buildSnapshotDiff(log.beforeSnapshot, log.afterSnapshot);
    if (diffs.length > 0) {
      const shown = diffs.slice(0, 4);
      const rest = diffs.length - shown.length;
      const suffix = rest > 0 ? ` (+${rest})` : '';
      const parts = shown.map((diff) => {
        const label = memberFieldLabel[diff.field] || diff.field;
        return `${label}: ${diff.before} → ${diff.after}`;
      });
      return `${actionText} • ${moduleText}${idText ? ` • ${idText}` : ''}: ${parts.join('; ')}${suffix}`;
    }
  }

  if (actionText && moduleText && idText) return `${actionText} • ${moduleText} • ${idText}`;
  if (actionText && moduleText) return `${actionText} • ${moduleText}`;
  if (actionText) return actionText;
  return moduleText || 'Hệ thống';
};

const normalizeLog = (raw: any): ActivityLog => {
  const log: BackendAuditLog = {
    id: raw?.id,
    actorName: raw?.actorName ?? raw?.user ?? raw?.userName,
    action: raw?.action,
    module: raw?.module ?? raw?.resourceType ?? raw?.resource_type,
    resourceId: raw?.resourceId ?? raw?.resource_id,
    createdAt: raw?.createdAt ?? raw?.timestamp ?? raw?.created_at,
    beforeSnapshot: raw?.beforeSnapshot ?? raw?.snapshotBefore ?? raw?.before_snapshot,
    afterSnapshot: raw?.afterSnapshot ?? raw?.snapshotAfter ?? raw?.after_snapshot,
  };

  const changes =
    toText(log.action).toUpperCase() === 'UPDATE_MEMBER'
      ? buildSnapshotDiff(log.beforeSnapshot, log.afterSnapshot)
      : undefined;

  return {
    id: toText(log.id) || (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    timestamp: toText(log.createdAt),
    user: toText(log.actorName) || 'System',
    action: toText(log.action) || 'SYSTEM',
    module: toText(log.module) || 'SYSTEM',
    resourceId: toText(log.resourceId) || undefined,
    details: toText(raw?.details ?? raw?.description) || buildDetails(log),
    changes,
    snapshotBefore: log.beforeSnapshot,
    snapshotAfter: log.afterSnapshot,
  };
};

/**
 * Get list of activity logs
 */
export const getLogs = async (query: LogsQuery = {}, token?: string): Promise<ApiResponse<LogsResponse>> => {
  const params = new URLSearchParams();
  if (query.search) params.append('search', query.search);
  if (query.module) params.append('module', query.module);
  if (query.action) params.append('action', query.action);
  if (query.page) params.append('page', query.page.toString());
  if (query.pageSize) params.append('pageSize', query.pageSize.toString());

  const queryString = params.toString();
  const res = await apiCall<unknown>(`/api/v1/logs${queryString ? `?${queryString}` : ''}`, {}, token);
  if (res.status === 0 || res.error) {
    return { ...res, data: undefined } as ApiResponse<LogsResponse>;
  }
  if (!res.data) return { ...res, data: { logs: [], total: 0 } };

  const body = res.data as BackendApiResponse<unknown> | unknown;
  const data = (body as any)?.data ?? body;
  const metaTotal = (body as any)?.meta?.total;

  const items = Array.isArray(data) ? data : [];
  const logs = items.map(normalizeLog);
  const total = typeof metaTotal === 'number' ? metaTotal : logs.length;

  return {
    ...res,
    data: { logs, total },
  };
};

/**
 * Export logs to CSV
 */
export const exportLogs = async (token?: string): Promise<ApiResponse<Blob>> => {
  // We use fetch directly for Blob responses usually, or handle it in apiCall
  // For simplicity here, we assume apiCall can handle it or we use a separate logic
  try {
    const API_BASE = getBaseUrl();
    // Try v1 first, then fallback to non-v1
    let url = `${API_BASE}/api/v1/logs/export`;
    let response = await fetch(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    
    if (response.status === 404) {
      url = `${API_BASE}/api/logs/export`;
      response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
    }
    
    if (!response.ok) throw new Error('Export failed');
    
    const blob = await response.blob();
    return { status: response.status, data: blob as any };
  } catch (error) {
    return { status: 0, error: 'Export failed' };
  }
};
