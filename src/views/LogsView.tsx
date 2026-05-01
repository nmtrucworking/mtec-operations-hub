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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { mockLogs, ActivityLog as MockActivityLog, LogAction, LogModule } from '../data/logs';
import { formatDate } from '../lib/helpers';
import { getLogs, exportLogs, type ActivityLog, type LogsQuery } from '../services/logs';

const ITEMS_PER_PAGE = 10;

interface LogsViewProps {
  authToken?: string;
}

export const LogsView = ({ authToken }: LogsViewProps) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState<string | 'All'>('All');
  const [filterAction, setFilterAction] = useState<string | 'All'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    switch (action) {
      case 'CREATE': return 'text-success-text';
      case 'UPDATE': return 'text-warning-text';
      case 'DELETE': return 'text-danger-text';
      case 'LOGIN': return 'text-success-text';
      case 'PASSWORD_CHANGE': return 'text-warning-text';
      default: return 'text-secondary';
    }
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
          <option value="MEMBERS">Members</option>
          <option value="FINANCE">Finance</option>
          <option value="LOGISTICS">Logistics</option>
          <option value="REQUESTS">Requests</option>
          <option value="USERS">Users</option>
          <option value="SYSTEM">System</option>
        </Select>
        <Select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
        >
          <option value="All">{t('logs.filterActionAll', 'Tất cả hành động')}</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="LOGIN">Login</option>
          <option value="PASSWORD_CHANGE">Password Change</option>
          <option value="EXPORT">Export</option>
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
                <TableRow key={log.id} className="hover:bg-background/40 transition-colors">
                  <TableCell className="font-medium text-secondary">
                    <div className="flex flex-col">
                      <span>{formatDate(log.timestamp).split(' ')[0]}</span>
                      <span className="text-xs text-secondary/70">{formatDate(log.timestamp).split(' ')[1]}</span>
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
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {log.module}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-secondary">{log.details}</span>
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
    </div>
  );
};
