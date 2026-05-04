import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Clock, 
  User, 
  Activity, 
  ChevronLeft, 
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Modal } from '../components/ui/modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { mockLogs, ActivityLog as MockActivityLog, LogAction, LogModule } from '../data/logs';
import { getLogs, exportLogs, type ActivityLog, type LogsQuery } from '../services/logs';

const ITEMS_PER_PAGE = 10;

interface LogsViewProps {
  authToken?: string;
}

export const LogsView = ({ authToken }: LogsViewProps) => {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState<string | 'All'>('All');
  const [filterAction, setFilterAction] = useState<string | 'All'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const formatTimestamp = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      return { date: value || '---', time: '' };
    }
    const locale = (i18n.resolvedLanguage || i18n.language || 'vi').split('-')[0];
    const date = d.toLocaleDateString(locale);
    const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    return { date, time };
  };

  const moduleKey = (value: string) => {
    const module = (value || '').trim().toLowerCase();
    if (module === 'members') return 'member';
    if (module === 'users') return 'user';
    if (module === 'requests') return 'request';
    if (module === 'transactions') return 'transaction';
    if (module === 'assets') return 'asset';
    return module || 'system';
  };

  const moduleLabel = (value: string) => {
    const key = moduleKey(value);
    return t(`logs.modules.${key}`, value);
  };

  const actionKey = (value: string) => {
    const action = (value || '').trim().toUpperCase();
    if (!action) return 'system';
    if (action === 'LOGIN') return 'login';
    if (action === 'LOGOUT') return 'logout';
    if (action === 'CHANGE_PASSWORD' || action === 'PASSWORD_CHANGE') return 'change_password';
    if (action === 'EXPORT') return 'export';
    if (action.startsWith('CREATE_')) return 'create';
    if (action.startsWith('UPDATE_')) return 'update';
    if (action.startsWith('DELETE_')) return 'delete';
    if (action.startsWith('REVIEW_')) return 'review';
    return action.toLowerCase();
  };

  const actionLabel = (value: string) => {
    const key = actionKey(value);
    if (key === 'create') return t('logs.actions.create', value);
    if (key === 'update') return t('logs.actions.update', value);
    if (key === 'delete') return t('logs.actions.delete', value);
    if (key === 'review') return t('logs.actions.review', value);
    if (key === 'login') return t('logs.actions.login', value);
    if (key === 'logout') return t('logs.actions.logout', value);
    if (key === 'change_password') return t('logs.actions.changePassword', value);
    if (key === 'export') return t('logs.actions.export', value);
    return value;
  };

  const shortId = (value: string | undefined) => {
    const text = String(value || '').trim();
    if (!text) return '';
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(text)) return text.slice(0, 8);
    return text;
  };

  const formatDetails = (log: ActivityLog) => {
    const action = (log.action || '').toUpperCase();
    if (action === 'UPDATE_MEMBER' && Array.isArray(log.changes) && log.changes.length > 0) {
      const shown = log.changes.slice(0, 4);
      const rest = log.changes.length - shown.length;
      const parts = shown.map((change) => {
        const label = t(`logs.fields.${change.field}`, change.field);
        const before = change.before || '—';
        const after = change.after || '—';
        return `${label}: ${before} → ${after}`;
      });
      const header = [
        actionLabel(log.action),
        moduleLabel(log.module),
        shortId(log.resourceId)
      ].filter(Boolean).join(' • ');
      return `${header}: ${parts.join('; ')}${rest > 0 ? ` (+${rest})` : ''}`;
    }
    const header = [
      actionLabel(log.action),
      moduleLabel(log.module),
      shortId(log.resourceId)
    ].filter(Boolean).join(' • ');
    return header || log.details;
  };

  const fetchLogs = async () => {
    if (!authToken) {
      setError(t('auth.invalidToken', 'Token không hợp lệ hoặc đã hết hạn'));
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const query: LogsQuery = {
      page: currentPage,
      pageSize: ITEMS_PER_PAGE,
      search: searchTerm || undefined,
      module: filterModule === 'All' ? undefined : filterModule,
      action: filterAction === 'All' ? undefined : filterAction
    };
    
    const res = await getLogs(query, authToken);
    if (res.data) {
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } else if (res.error) {
      setError(res.error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filterModule, filterAction, authToken]);

  // Handle search with debounce or manual trigger
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const handleExport = async () => {
    const res = await exportLogs(authToken);
    if (res.data) {
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getActionColor = (action: string) => {
    const key = (action || '').toUpperCase();
    if (key.startsWith('CREATE') || key === 'LOGIN') return 'text-success-text';
    if (key.startsWith('UPDATE') || key === 'CHANGE_PASSWORD') return 'text-warning-text';
    if (key.startsWith('DELETE')) return 'text-danger-text';
    if (key.startsWith('REVIEW')) return 'text-primary';
    if (key === 'EXPORT') return 'text-secondary';
    return 'text-secondary';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">
            {t('logs.title', 'Nhật ký hoạt động')}
          </h2>
          <p className="text-secondary">
            {t('logs.subtitle', 'Theo dõi toàn bộ các thay đổi và hành động của thành viên trong hệ thống.')}
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
          <Download size={16} />
          {t('common.export')}
        </Button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
          <Input
            placeholder={t('logs.searchPlaceholder', 'Tìm kiếm hành động, người dùng...')}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
        >
          <option value="All">{t('logs.filterModuleAll', 'Tất cả module')}</option>
          <option value="member">{t('logs.modules.member', 'Thành viên')}</option>
          <option value="user">{t('logs.modules.user', 'Tài khoản')}</option>
          <option value="request">{t('logs.modules.request', 'Đơn từ')}</option>
          <option value="transaction">{t('logs.modules.transaction', 'Giao dịch')}</option>
          <option value="asset">{t('logs.modules.asset', 'Tài sản')}</option>
          <option value="discipline">{t('logs.modules.discipline', 'Kỷ luật')}</option>
          <option value="settings">{t('logs.modules.settings', 'Cài đặt')}</option>
          <option value="auth">{t('logs.modules.auth', 'Xác thực')}</option>
        </Select>
        <Select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
        >
          <option value="All">{t('logs.filterActionAll', 'Tất cả hành động')}</option>
          <option value="CREATE">{t('logs.actions.create', 'Tạo')}</option>
          <option value="UPDATE">{t('logs.actions.update', 'Cập nhật')}</option>
          <option value="DELETE">{t('logs.actions.delete', 'Xoá')}</option>
          <option value="REVIEW">{t('logs.actions.review', 'Duyệt')}</option>
          <option value="LOGIN">{t('logs.actions.login', 'Đăng nhập')}</option>
          <option value="LOGOUT">{t('logs.actions.logout', 'Đăng xuất')}</option>
          <option value="CHANGE_PASSWORD">{t('logs.actions.changePassword', 'Đổi mật khẩu')}</option>
          <option value="EXPORT">{t('logs.actions.export', 'Xuất dữ liệu')}</option>
        </Select>
        <div className="flex items-center gap-2 text-sm text-secondary justify-end">
          <Clock size={16} />
          <span>{total} {t('logs.totalRecords', 'bản ghi')}</span>
        </div>
      </form>

      {/* Table */}
      <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden min-h-[400px] relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="animate-spin text-gold" size={32} />
          </div>
        )}
        
        {error && (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-4">
            <XCircle className="text-danger-text w-12 h-12" />
            <div className="space-y-1">
              <p className="font-semibold text-primary">{t('common.error')}</p>
              <p className="text-sm text-secondary">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              {t('common.retry')}
            </Button>
          </div>
        )}

        {!error && (
          <Table>
          <TableHeader className="bg-background/40">
            <TableRow>
              <TableHead className="w-[180px]">{t('logs.colTimestamp', 'Thời gian')}</TableHead>
              <TableHead className="w-[200px]">{t('logs.colUser', 'Người thực hiện')}</TableHead>
              <TableHead className="w-[120px]">{t('logs.colAction', 'Hành động')}</TableHead>
              <TableHead className="w-[120px]">{t('logs.colModule', 'Module')}</TableHead>
              <TableHead>{t('logs.colDescription', 'Mô tả')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  className="hover:bg-background/40 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <TableCell className="font-medium text-secondary">
                    <div className="flex flex-col">
                      <span>{formatTimestamp(log.timestamp).date}</span>
                      <span className="text-xs text-secondary/70">{formatTimestamp(log.timestamp).time}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center text-secondary font-bold text-xs border border-border">
                        {log.user.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-primary">{log.user}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold text-xs tracking-wider ${getActionColor(log.action)}`}>
                      {actionLabel(log.action)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {moduleLabel(log.module)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-secondary">{formatDetails(log)}</span>
                      {log.resourceId && (
                        <span className="text-[10px] text-secondary/70 uppercase">ID: {log.resourceId}</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-secondary">
                  {isLoading ? t('common.loading', 'Đang tải...') : t('logs.noLogsFound', 'Không tìm thấy nhật ký nào.')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-secondary">
            {t('common.page')} {currentPage} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1 || isLoading}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              <ChevronLeft size={16} className="mr-1" /> {t('common.prev')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages || isLoading}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              {t('common.next')} <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        title={t('logs.detailsTitle', 'Chi tiết log')}
        className="max-w-3xl"
      >
        {selectedLog ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-secondary">{t('logs.detailTime', 'Thời gian')}</div>
                <div className="text-primary font-medium">
                  {formatTimestamp(selectedLog.timestamp).date} {formatTimestamp(selectedLog.timestamp).time}
                </div>
              </div>
              <div>
                <div className="text-secondary">{t('logs.detailUser', 'Người thực hiện')}</div>
                <div className="text-primary font-medium">{selectedLog.user}</div>
              </div>
              <div>
                <div className="text-secondary">{t('logs.detailAction', 'Hành động')}</div>
                <div className="text-primary font-medium">{actionLabel(selectedLog.action)}</div>
              </div>
              <div>
                <div className="text-secondary">{t('logs.detailModule', 'Module')}</div>
                <div className="text-primary font-medium">{moduleLabel(selectedLog.module)}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-secondary">{t('logs.detailResourceId', 'ID đối tượng')}</div>
                <div className="text-primary font-medium break-all">{selectedLog.resourceId || '—'}</div>
              </div>
            </div>

            <div>
              <div className="text-secondary text-sm mb-2">{t('logs.detailDescription', 'Mô tả')}</div>
              <div className="text-primary text-sm bg-background/40 border border-border rounded-lg p-3">
                {formatDetails(selectedLog) || '—'}
              </div>
            </div>

            <div>
              <div className="text-secondary text-sm mb-2">{t('logs.detailChanges', 'Các thay đổi')}</div>
              {Array.isArray(selectedLog.changes) && selectedLog.changes.length > 0 ? (
                <div className="space-y-1 text-sm">
                  {selectedLog.changes.map((change, idx) => (
                    <div key={`${change.field}-${idx}`} className="text-primary">
                      {t(`logs.fields.${change.field}`, change.field)}: {change.before || '—'} → {change.after || '—'}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-secondary">{t('logs.detailNoChanges', 'Không có dữ liệu thay đổi.')}</div>
              )}
            </div>

            {(selectedLog.snapshotBefore || selectedLog.snapshotAfter) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-secondary text-sm mb-2">{t('logs.detailBefore', 'Trước')}</div>
                  <pre className="text-xs bg-background/40 border border-border rounded-lg p-3 overflow-auto max-h-64">
                    {selectedLog.snapshotBefore ? JSON.stringify(selectedLog.snapshotBefore, null, 2) : '—'}
                  </pre>
                </div>
                <div>
                  <div className="text-secondary text-sm mb-2">{t('logs.detailAfter', 'Sau')}</div>
                  <pre className="text-xs bg-background/40 border border-border rounded-lg p-3 overflow-auto max-h-64">
                    {selectedLog.snapshotAfter ? JSON.stringify(selectedLog.snapshotAfter, null, 2) : '—'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
