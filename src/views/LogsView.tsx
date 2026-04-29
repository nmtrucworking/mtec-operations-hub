import React, { useState } from 'react';
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
  XCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { mockLogs, ActivityLog, LogAction, LogModule } from '../data/logs';
import { formatDate } from '../lib/helpers';

const ITEMS_PER_PAGE = 10;

export const LogsView = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState<LogModule | 'All'>('All');
  const [filterAction, setFilterAction] = useState<LogAction | 'All'>('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter logs
  const filteredLogs = mockLogs.filter((log) => {
    const matchSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchModule = filterModule === 'All' || log.module === filterModule;
    const matchAction = filterAction === 'All' || log.action === filterAction;
    
    return matchSearch && matchModule && matchAction;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getStatusBadge = (status: 'SUCCESS' | 'FAILURE') => {
    if (status === 'SUCCESS') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
          <CheckCircle2 size={12} />
          {t('common.success', 'Thành công')}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
        <XCircle size={12} />
        {t('common.failure', 'Thất bại')}
      </Badge>
    );
  };

  const getActionColor = (action: LogAction) => {
    switch (action) {
      case 'CREATE': return 'text-blue-600';
      case 'UPDATE': return 'text-amber-600';
      case 'DELETE': return 'text-red-600';
      case 'LOGIN': return 'text-green-600';
      case 'LOGOUT': return 'text-gray-600';
      default: return 'text-slate-600';
    }
  };

  const handleExport = () => {
    const headers = ['ID', 'Thời gian', 'Người thực hiện', 'Vai trò', 'Hành động', 'Module', 'Mô tả', 'Chi tiết', 'IP Address', 'Trạng thái'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => 
        `${log.id},"${formatDate(log.timestamp)}","${log.userName}","${log.userRole}","${log.action}","${log.module}","${log.description}","${log.details || ''}","${log.ipAddress}","${log.status}"`
      )
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('logs.title', 'Nhật ký hoạt động')}
          </h2>
          <p className="text-slate-500">
            {t('logs.subtitle', 'Theo dõi toàn bộ các thay đổi và hành động của thành viên trong hệ thống.')}
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
          <Download size={16} />
          {t('common.export', 'Xuất dữ liệu')}
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder={t('logs.searchPlaceholder', 'Tìm kiếm hành động, người dùng...')}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value as any)}
        >
          <option value="All">{t('logs.filterModuleAll', 'Tất cả module')}</option>
          <option value="MEMBERS">Members</option>
          <option value="FINANCE">Finance</option>
          <option value="LOGISTICS">Logistics</option>
          <option value="REQUESTS">Requests</option>
          <option value="SETTINGS">Settings</option>
          <option value="SYSTEM">System</option>
        </Select>
        <Select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value as any)}
        >
          <option value="All">{t('logs.filterActionAll', 'Tất cả hành động')}</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
          <option value="EXPORT">Export</option>
        </Select>
        <div className="flex items-center gap-2 text-sm text-slate-500 justify-end">
          <Clock size={16} />
          <span>{filteredLogs.length} {t('logs.totalRecords', 'bản ghi')}</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[180px]">{t('logs.colTimestamp', 'Thời gian')}</TableHead>
              <TableHead className="w-[200px]">{t('logs.colUser', 'Người thực hiện')}</TableHead>
              <TableHead className="w-[120px]">{t('logs.colAction', 'Hành động')}</TableHead>
              <TableHead className="w-[120px]">{t('logs.colModule', 'Module')}</TableHead>
              <TableHead>{t('logs.colDescription', 'Mô tả')}</TableHead>
              <TableHead className="w-[120px]">{t('logs.colStatus', 'Trạng thái')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-slate-700">
                    <div className="flex flex-col">
                      <span>{formatDate(log.timestamp).split(' ')[0]}</span>
                      <span className="text-xs text-slate-400">{formatDate(log.timestamp).split(' ')[1]}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200">
                        {log.userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{log.userName}</span>
                        <span className="text-xs text-slate-500">{log.userRole}</span>
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
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-700">{log.description}</span>
                      {log.details && (
                        <span className="text-xs text-slate-400 italic flex items-center gap-1">
                          <Info size={12} />
                          {log.details}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(log.status)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  {t('logs.noResults', 'Không tìm thấy kết quả nào.')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-500">
            {t('common.page', 'Trang')} {currentPage} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
