import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Bot, Clock, Loader2, Sparkles, Users, DollarSign, Package, AlertTriangle, ArrowRight, CheckCircle2, Download, Star } from 'lucide-react';
import { ActivityItem, ProgressBar, StatCard, RequestCard } from '../components/shared/Widgets';
import { formatCurrency } from '../data/finance';
import { normalizeBanList, normalizeText, type Member } from '../data/members';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Modal } from '../components/ui/modal';
import { Input } from '../components/ui/input';
import { DashboardOverviewData, DashboardActivity } from '../types/dashboard';
import { getDashboardOverview } from '../services/dashboard';
import { createMember, getMembers } from '../services/members';
import { generateAIInsight } from '../services/ai';
import { getLogs, type ActivityLog } from '../services/logs';
import { createTransaction, getTransactions } from '../services/finance';
import { getBaseUrl } from '../services/api';
import { getUsers, updateUser } from '../services/users';
import type { UserAccount, UserRole } from '../types/app';

interface DashboardViewProps {
  authToken: string;
}

export const DashboardView = ({ authToken }: DashboardViewProps) => {
  const { t, i18n } = useTranslation();
  const [dashboardData, setDashboardData] = useState<DashboardOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [memberDirectory, setMemberDirectory] = useState<Member[] | null>(null);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [isLoadingRecentLogs, setIsLoadingRecentLogs] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      setRecentLogs([]);
      try {
        const [overviewResponse, membersResponse] = await Promise.all([
          getDashboardOverview(authToken),
          getMembers({ pageSize: 1000 }, authToken)
        ]);

        if (overviewResponse.status === 200 && overviewResponse.data) {
          setDashboardData(overviewResponse.data);

          if (!overviewResponse.data.recentActivities || overviewResponse.data.recentActivities.length === 0) {
            setIsLoadingRecentLogs(true);
            try {
              const res = await getLogs({ page: 1, pageSize: 5 }, authToken);
              if (res.data?.logs) {
                setRecentLogs(res.data.logs);
              }
            } finally {
              setIsLoadingRecentLogs(false);
            }
          }
        } else {
          setDashboardData(null);
          setError(overviewResponse.error || t('dashboard.errors.fetchFailed', 'Không thể truy xuất dữ liệu từ máy chủ.'));
        }

        if (membersResponse.status >= 200 && membersResponse.status < 300 && membersResponse.data) {
          setMemberDirectory(membersResponse.data.members);
        } else {
          setMemberDirectory(null);
        }
      } catch (err) {
        setDashboardData(null);
        setMemberDirectory(null);
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(t('dashboard.errors.fetchFailedWithReason', { reason: message, defaultValue: `Không thể truy xuất dữ liệu từ máy chủ. (${message})` }));
      } finally {
        setIsLoading(false);
      }
    };
    if (authToken) {
      void fetchDashboardData();
    }
  }, [authToken]);


  const [aiInsight, setAiInsight] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const [addMemberForm, setAddMemberForm] = useState<{ name: string; mssv: string; email: string }>({
    name: '',
    mssv: '',
    email: ''
  });
  const [addMemberErrors, setAddMemberErrors] = useState<{ name?: string; mssv?: string; email?: string }>({});
  const [isCheckingAddMember, setIsCheckingAddMember] = useState(false);
  const [addMemberApiError, setAddMemberApiError] = useState<string | null>(null);

  const [financeForm, setFinanceForm] = useState<{ type: 'Thu' | 'Chi'; amount: string; title: string; owner: string; category: string }>({
    type: 'Chi',
    amount: '',
    title: '',
    owner: '',
    category: ''
  });
  const [financeErrors, setFinanceErrors] = useState<{ amount?: string; title?: string; owner?: string; category?: string }>({});
  const [isSavingFinance, setIsSavingFinance] = useState(false);
  const [financeApiError, setFinanceApiError] = useState<string | null>(null);

  const [exportType, setExportType] = useState<'overview' | 'finance' | 'members'>('overview');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [rolesQuery, setRolesQuery] = useState('');
  const [rolesResults, setRolesResults] = useState<UserAccount[]>([]);
  const [rolesSelectedUser, setRolesSelectedUser] = useState<UserAccount | null>(null);
  const [rolesSelectedRole, setRolesSelectedRole] = useState<UserRole>('member');
  const [isSearchingRoles, setIsSearchingRoles] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  useEffect(() => {
    if (activeModal !== 'addMember') return;
    setAddMemberForm({ name: '', mssv: '', email: '' });
    setAddMemberErrors({});
    setIsCheckingAddMember(false);
    setAddMemberApiError(null);
  }, [activeModal]);

  useEffect(() => {
    if (activeModal !== 'financeTx') return;
    setFinanceForm({ type: 'Chi', amount: '', title: '', owner: '', category: '' });
    setFinanceErrors({});
    setIsSavingFinance(false);
    setFinanceApiError(null);
  }, [activeModal]);

  useEffect(() => {
    if (activeModal !== 'export') return;
    setExportType('overview');
    setIsExporting(false);
    setExportError(null);
  }, [activeModal]);

  useEffect(() => {
    if (activeModal !== 'roles') return;
    setRolesQuery('');
    setRolesResults([]);
    setRolesSelectedUser(null);
    setRolesSelectedRole('member');
    setIsSearchingRoles(false);
    setIsSavingRole(false);
    setRolesError(null);
  }, [activeModal]);

  const locale = (i18n.resolvedLanguage || i18n.language || 'vi').split('-')[0];

  const formatLocaleDate = (value: unknown) => {
    const date = value instanceof Date ? value : new Date(String(value ?? ''));
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(locale);
  };

  const logsModuleKey = (value: string) => {
    const module = (value || '').trim().toLowerCase();
    if (module === 'members') return 'member';
    if (module === 'users') return 'user';
    if (module === 'requests') return 'request';
    if (module === 'transactions') return 'transaction';
    if (module === 'assets') return 'asset';
    if (module === 'discipline-records' || module === 'discipline_records' || module === 'discipline') return 'discipline';
    if (module === 'settings') return 'settings';
    if (module === 'auth') return 'auth';
    return module || 'system';
  };

  const logsModuleLabel = (value: string) => {
    const key = logsModuleKey(value);
    return t(`logs.modules.${key}`, value);
  };

  const logsActionKey = (value: string) => {
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

  const logsActionLabel = (value: string) => {
    const key = logsActionKey(value);
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

  const logsShortId = (value: string | undefined) => {
    const text = String(value || '').trim();
    if (!text) return '';
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(text)) return text.slice(0, 8);
    return text;
  };

  const activeMembers = useMemo(() => {
    if (!memberDirectory) return null;
    return memberDirectory.filter((member) => member.status === 'Active');
  }, [memberDirectory]);

  const totalMembers = activeMembers ? activeMembers.length : (dashboardData?.totalMembers ?? 0);

  const parseFlexibleDate = (value: unknown): Date | null => {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    const raw = String(value ?? '').trim();
    if (!raw) return null;

    // Try to parse as a date string with slashes
    const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const day = Number(slashMatch[1]);
      const month = Number(slashMatch[2]);
      const year = Number(slashMatch[3]);
      const date = new Date(year, month - 1, day);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    // Fallback to standard date parsing
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const totalMembersTrend = useMemo(() => {
    if (!activeMembers) {
      return { trend: '0', trendUp: true };
    }

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let thisMonthNew = 0;
    let prevMonthNew = 0;
    let validJoinDates = 0;

    for (const member of activeMembers) {
      const joined = parseFlexibleDate(member.joinDate);
      if (!joined) continue;
      validJoinDates += 1;

      if (joined >= startOfThisMonth && joined < startOfNextMonth) thisMonthNew += 1;
      if (joined >= startOfPrevMonth && joined < startOfThisMonth) prevMonthNew += 1;
    }

    if (validJoinDates === 0) {
      return { trend: '0', trendUp: true };
    }

    if (thisMonthNew === 0 && prevMonthNew === 0) {
      return { trend: '0', trendUp: true };
    }

    if (thisMonthNew === 0) {
      return { trend: '0', trendUp: true };
    }

    const delta = thisMonthNew - prevMonthNew;
    console.log(thisMonthNew, prevMonthNew);
    console.log(delta);
    return {
      trend: delta > 0 ? `+${delta}` : String(delta),
      trendUp: delta >= 0
    };
  }, [activeMembers]);

  const closeAddMemberModal = () => {
    setActiveModal(null);
  };

  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  const handleSubmitAddMember = async () => {
    const name = addMemberForm.name.trim();
    const mssv = addMemberForm.mssv.trim();
    const email = addMemberForm.email.trim();

    setAddMemberErrors({});
    setAddMemberApiError(null);
    setIsCheckingAddMember(true);

    try {
      const nextErrors: { name?: string; mssv?: string; email?: string } = {};

      if (!name) {
        nextErrors.name = t('dashboard.addMember.errors.requiredName', 'Vui lòng nhập họ và tên.');
      }
      if (!mssv) {
        nextErrors.mssv = t('dashboard.addMember.errors.requiredStudentId', 'Vui lòng nhập MSSV.');
      }

      if (mssv) {
        const existsLocal = memberDirectory
          ? memberDirectory.some((member) => String(member.mssv || '').trim() === mssv)
          : false;

        let existsRemote = false;
        if (!existsLocal) {
          const res = await getMembers({ search: mssv, pageSize: 5 }, authToken);
          if (res.data?.members) {
            existsRemote = res.data.members.some((member) => String(member.mssv || '').trim() === mssv);
          }
        }

        if (existsLocal || existsRemote) {
          nextErrors.mssv = t('dashboard.addMember.errors.duplicateStudentId', 'MSSV đã tồn tại trong hệ thống.');
        }
      }

      if (email && memberDirectory) {
        const target = normalizeEmail(email);
        const existsEmail = memberDirectory.some((member) => normalizeEmail(String(member.email || '')) === target);
        if (existsEmail) {
          nextErrors.email = t('dashboard.addMember.errors.duplicateEmail', 'Email đã tồn tại trong hệ thống.');
        }
      }

      if (Object.keys(nextErrors).length > 0) {
        setAddMemberErrors(nextErrors);
        return;
      }

      const payload = {
        mssv,
        name,
        email: email || undefined,

        // default values
        status: 'Active',
        gender: '',
        dob: '',
        ban: [],
        role: '',
        phone: '',
        joinDate: '',
        lop: '',
        chuyenNganh: '',
        khoa: '',
        address: '',
        hardSkills: [],
        softSkills: [],
        experience: 'Không',
        goal: 'Không',
        orientation: 'Không',
      };

      const res = await createMember(payload as any, authToken);
      if (res.status >= 200 && res.status < 300 && res.data) {
        if (memberDirectory) {
          const next = [...memberDirectory, res.data];
          setMemberDirectory(next);
        }
        setDashboardData((prev) => (prev ? { ...prev, totalMembers: prev.totalMembers + 1 } : prev));
        closeAddMemberModal();
      } else {
        setAddMemberApiError(res.error || t('common.error'));
      }
    } finally {
      setIsCheckingAddMember(false);
    }
  };

  const closeFinanceModal = () => {
    setActiveModal(null);
  };

  const handleSubmitFinanceTx = async () => {
    setFinanceErrors({});
    setFinanceApiError(null);
    setIsSavingFinance(true);

    try {
      const amountNumber = Number(financeForm.amount);
      const nextErrors: { amount?: string; title?: string; owner?: string; category?: string } = {};
      if (!financeForm.title.trim()) nextErrors.title = t('dashboard.financeTx.errors.requiredTitle', 'Vui lòng nhập nội dung giao dịch.');
      if (!financeForm.owner.trim()) nextErrors.owner = t('dashboard.financeTx.errors.requiredOwner', 'Vui lòng nhập người phụ trách.');
      if (!financeForm.category.trim()) nextErrors.category = t('dashboard.financeTx.errors.requiredCategory', 'Vui lòng nhập danh mục.');
      if (!Number.isFinite(amountNumber) || amountNumber <= 0) nextErrors.amount = t('dashboard.financeTx.errors.invalidAmount', 'Số tiền không hợp lệ.');

      if (Object.keys(nextErrors).length > 0) {
        setFinanceErrors(nextErrors);
        return;
      }

      const now = new Date();
      const yyyy = String(now.getFullYear());
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');

      const res = await createTransaction({
        date: `${yyyy}-${mm}-${dd}`,
        title: financeForm.title.trim(),
        type: financeForm.type,
        amount: amountNumber,
        owner: financeForm.owner.trim(),
        category: financeForm.category.trim()
      } as any, authToken);

      if (res.status >= 200 && res.status < 300) {
        const overviewResponse = await getDashboardOverview(authToken);
        if (overviewResponse.status === 200 && overviewResponse.data) {
          setDashboardData(overviewResponse.data);
        }
        closeFinanceModal();
      } else {
        setFinanceApiError(res.error || t('common.error'));
      }
    } finally {
      setIsSavingFinance(false);
    }
  };

  const downloadBlob = (filename: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toCsv = (rows: Array<Record<string, unknown>>) => {
    if (rows.length === 0) return '';
    const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
    const escapeCell = (value: unknown) => {
      const text = String(value ?? '');
      const needsQuotes = /[",\n\r]/.test(text);
      const escaped = text.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };
    const lines = [headers.join(',')];
    for (const row of rows) {
      lines.push(headers.map((h) => escapeCell(row[h])).join(','));
    }
    return lines.join('\n');
  };

  const closeExportModal = () => setActiveModal(null);

  const handleExport = async () => {
    setExportError(null);
    setIsExporting(true);
    try {
      const date = new Date().toISOString().slice(0, 10);

      if (exportType === 'overview') {
        const res = await getDashboardOverview(authToken);
        if (res.status !== 200 || !res.data) {
          setExportError(res.error || t('common.error'));
          return;
        }

        const rows = [
          { metric: 'totalMembers', value: res.data.totalMembers },
          { metric: 'currentFund', value: res.data.currentFund },
          { metric: 'totalIncome', value: res.data.totalIncome },
          { metric: 'totalExpense', value: res.data.totalExpense },
          { metric: 'maintenanceCount', value: res.data.maintenanceCount },
          { metric: 'pendingRequestsCount', value: res.data.pendingRequestsCount }
        ];

        const csv = toCsv(rows);
        downloadBlob(`dashboard_overview_${date}.csv`, new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        closeExportModal();
        return;
      }

      if (exportType === 'finance') {
        const res = await getTransactions({ page: 1, pageSize: 5000, includeDeleted: false }, authToken);
        if (res.status !== 200 || !res.data) {
          setExportError(res.error || t('common.error'));
          return;
        }

        const rows = res.data.transactions.map((tx) => ({
          id: tx.id,
          date: tx.date,
          title: tx.title,
          type: tx.type,
          amount: tx.amount,
          owner: tx.owner,
          category: tx.category,
          status: tx.status
        }));
        const csv = toCsv(rows);
        downloadBlob(`finance_report_${date}.csv`, new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        closeExportModal();
        return;
      }

      const API_BASE = getBaseUrl();
      const url = `${API_BASE}/api/v1/members/export?format=csv`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (!response.ok) {
        setExportError(`${t('common.error')} (HTTP ${response.status})`);
        return;
      }

      const blob = await response.blob();
      downloadBlob(`members_${date}.csv`, blob);
      closeExportModal();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  };

  const closeRolesModal = () => setActiveModal(null);

  useEffect(() => {
    if (activeModal !== 'roles') return;
    const q = rolesQuery.trim();
    if (q.length < 2) {
      setRolesResults([]);
      setRolesError(null);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSearchingRoles(true);
      setRolesError(null);
      try {
        const res = await getUsers({ search: q, page: 1, pageSize: 8 }, authToken);
        if (res.data?.users) {
          setRolesResults(res.data.users);
        } else if (res.error) {
          setRolesResults([]);
          setRolesError(res.error);
        }
      } finally {
        setIsSearchingRoles(false);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [activeModal, rolesQuery, authToken]);

  const roleOptions: UserRole[] = ['bcn', 'bvh_hr', 'bvh_finance', 'bvh_discipline', 'bvh_logistics', 'bcm', 'member'];

  const handleSaveRole = async () => {
    if (!rolesSelectedUser) return;
    setIsSavingRole(true);
    setRolesError(null);
    try {
      const res = await updateUser(rolesSelectedUser.id, { role: rolesSelectedRole }, authToken);
      if (res.status >= 200 && res.status < 300) {
        closeRolesModal();
      } else {
        setRolesError(res.error || t('common.error'));
      }
    } finally {
      setIsSavingRole(false);
    }
  };

  const countMembersByAliases = (aliases: string[]) => {
    const normalizedAliases = aliases.map((alias) => normalizeText(alias));

    if (activeMembers) {
      return activeMembers.reduce((count, member) => {
        const memberBans = normalizeBanList(member.ban).map((ban) => normalizeText(ban));
        const hasMatch = memberBans.some((ban) => normalizedAliases.some((alias) => ban.includes(alias)));
        return count + (hasMatch ? 1 : 0);
      }, 0);
    }

    const dept = dashboardData?.deptDistribution.find((item: any) => {
      const name = normalizeText(item?.ban);
      return normalizedAliases.some((alias) => name === alias || name.includes(alias) || alias.includes(name));
    });
    return dept ? dept.count : 0;
  };

  const pctMedia = totalMembers ? Math.round((countMembersByAliases(['truyen thong']) / totalMembers) * 100) : 0;
  const pctTech = totalMembers ? Math.round((countMembersByAliases(['cong nghe']) / totalMembers) * 100) : 0;
  const pctBoard = totalMembers ? Math.round((countMembersByAliases(['chu nhiem']) / totalMembers) * 100) : 0;
  const pctOps = totalMembers ? Math.round((countMembersByAliases(['van hanh', 'dieu hanh']) / totalMembers) * 100) : 0;
  /*
    // Calculate dynamic activities
    const recentActivities = [
      ...requests.map(req => ({
        title: `${req.status === 'Đã duyệt' ? 'Duyệt đơn' : 'Đơn mới'}: ${req.name} (${req.type})`,
        time: req.date,
        type: req.status === 'Đã duyệt' ? 'success' : req.status === 'Từ chối' ? 'warning' : 'info' as const,
        timestamp: new Date(req.date.split('/').reverse().join('-')).getTime()
      })),
      ...transactions.map(tx => ({
        title: `${tx.status === 'Đã duyệt' ? 'Giao dịch' : 'Đang duyệt'} ${tx.type === 'Thu' ? 'thu' : 'chi'}: ${tx.title}`,
        time: tx.date,
        type: tx.status === 'Từ chối' ? 'warning' : tx.type === 'Thu' ? 'success' : 'info' as const,
        timestamp: new Date(tx.date.split('/').reverse().join('-')).getTime()
      }))
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  */

  // Hàm xử lý chuỗi tiêu đề dựa trên các trạng thái (status) từ cơ sở dữ liệu
  const formatActivityTitle = (activity: DashboardActivity) => {
    // Đối chiếu định dạng không dấu từ CSDL: 'Da duyet', 'Tu choi', 'Cho duyet'
    const statusText =
      activity.status === 'Cho duyet'
        ? t('dashboard.activity.pending', 'Đang duyệt')
        : t('dashboard.activity.transaction', 'Giao dịch');
    const typeText = activity.type === 'Thu' ? t('finance.typeIncome', 'Thu') : t('finance.typeExpense', 'Chi');
    return `${statusText} ${typeText}: ${activity.title}`;
  };

  // Hàm phân loại màu sắc/trạng thái UI 
  const formatActivityType = (activity: DashboardActivity): 'success' | 'warning' | 'info' => {
    if (activity.status === 'Tu choi') return 'warning';
    if (activity.type === 'Thu') return 'success';
    return 'info'; // Áp dụng mặc định cho các giao dịch 'Chi' hoặc đang 'Cho duyet'
  };

  const handleGenerateInsight = async () => {
    if (!dashboardData) return;
    setIsAiLoading(true);

    const prompt = `Với tư cách là chuyên gia Nhân sự và Quản lý của CLB MTEC. Hãy phân tích ngắn gọn (khoảng 3-4 dòng) về tình hình hiện tại của CLB dựa trên dữ liệu sau:
    - Tổng thành viên: ${totalMembers}
    - Đơn yêu cầu đang chờ duyệt: ${dashboardData.pendingRequestsCount}
    - Số dư quỹ: ${formatCurrency(dashboardData.currentFund)} (Tổng thu: ${formatCurrency(dashboardData.totalIncome)}, Tổng chi: ${formatCurrency(dashboardData.totalExpense)})
    - Thiết bị cần bảo trì: ${dashboardData.maintenanceCount}
    Đưa ra nhận xét về sức khỏe tài chính và nhân sự, cùng 1 lời khuyên chiến lược.`;

    try {
      const response = await generateAIInsight({ prompt }, authToken);

      if (response.status === 200 && response.data?.text) {
        setAiInsight(response.data.text);
      } else {
        setAiInsight(t('dashboard.ai.unavailable', 'Hệ thống AI không thể xử lý yêu cầu vào lúc này.'));
      }
    } catch (err) {
      setAiInsight(t('dashboard.ai.networkError', 'Lỗi kết nối đến máy chủ AI.'));
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-full w-full p-8 text-primary space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-gold" />
        <span className="text-lg font-medium animate-pulse">{t('dashboard.loading', 'Đang tải dữ liệu...')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-danger-bg text-danger-text rounded-xl border border-danger-border flex flex-col items-center space-y-4 max-w-2xl mx-auto mt-12">
        <AlertTriangle size={48} />
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">{t('common.error')}</h3>
          <p>{error}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">{t('dashboard.title')}</h2>
          <p className="text-secondary mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <Button
            onClick={handleGenerateInsight}
            disabled={isAiLoading}
            isLoading={isAiLoading}
            className="flex-1 sm:flex-none bg-gradient-to-r from-brand-blue-light to-brand-blue hover:from-brand-blue-hover hover:to-brand-blue text-white shadow-lg border-0"
          >
            {!isAiLoading && <Sparkles size={16} className="mr-2" />}
            {t('dashboard.aiInsightBtn')}
          </Button>
        </div>
      </div>

      {aiInsight ? (
        <div className="bg-card border border-border-highlight rounded-xl p-5 flex items-start space-x-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-3 bg-gold/10 rounded-lg text-gold shrink-0">
            <Bot size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-primary flex items-center">
              {t('dashboard.aiInsightTitle')} <Sparkles size={14} className="ml-2 text-gold" />
            </h4>
            <p className="text-sm text-secondary leading-relaxed">{aiInsight}</p>
          </div>
        </div>
      ) : null}

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard title={t('dashboard.statTotalMembers')} 
          value={totalMembers.toString()} 
          icon={<Users size={24} />} 
          trend={totalMembersTrend.trend}
          trendUp={totalMembersTrend.trendUp}
        />
        <StatCard title={t('dashboard.statCurrentFund')}
          value={formatCurrency(dashboardData?.currentFund ?? 0)}
          icon={<DollarSign size={24} />} color="text-success-text"
          trend={`${(dashboardData?.totalIncome ?? 0) >
            (dashboardData?.totalExpense ?? 0) ? '+' : ''}${formatCurrency((dashboardData?.totalIncome ?? 0) - (dashboardData?.totalExpense ?? 0))}`} trendUp={(dashboardData?.totalIncome ?? 0) > (dashboardData?.totalExpense ?? 0)} 
          />
        <StatCard title={t('dashboard.statMaintenance')} value={dashboardData?.maintenanceCount.toString()} icon={<Package size={24} />} color="text-danger-text" />
        <StatCard title={t('dashboard.statPendingReqs')} value={dashboardData?.pendingRequestsCount.toString()} icon={<Clock size={24} />} color="text-warning-text" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: HR & Logistics */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
              <CardTitle className="text-lg font-bold">{t('dashboard.chartMembersByDept')}</CardTitle>
              <BarChart3 className="text-secondary" size={20} />
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <ProgressBar label={t('dashboard.deptMedia')} percent={pctMedia} color="bg-blue-500" />
              <ProgressBar label={t('dashboard.deptTech')} percent={pctTech} color="bg-indigo-500" />
              <ProgressBar label={t('dashboard.deptOps')} percent={pctOps} color="bg-success-text" />
              <ProgressBar label={t('dashboard.deptBoard')} percent={pctBoard} color="bg-gold" />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle size={20} className="text-warning-text" />
                {t('dashboard.urgentTasks')}
              </CardTitle>
              <button className="text-sm text-gold hover:underline transition-colors flex items-center font-medium">
                {t('dashboard.viewAll')} <ArrowRight size={14} className="ml-1" />
              </button>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {dashboardData.urgentRequests.map(req => (
                <RequestCard
                  key={req.id}
                  name={req.name}
                  mssv={req.id}
                  date={formatLocaleDate(req.date) || String(req.date ?? '')}
                  reason={req.type}
                />
              ))}
              {dashboardData.urgentRequests.length === 0 && (
                <div className="py-8 text-center space-y-2">
                  <div className="flex justify-center">
                    <CheckCircle2 size={40} className="text-success-text opacity-20" />
                  </div>
                  <p className="text-sm text-secondary italic">{t('dashboard.noPendingReqs')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Activity & Quick Actions */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-lg font-bold">{t('dashboard.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setActiveModal('addMember')} 
                  className="p-4 bg-background hover:bg-brand-hover border border-border rounded-xl text-xs font-semibold text-center transition-all hover:border-gold hover:shadow-md active:scale-95 flex flex-col items-center gap-2">
                  <Users size={18} className="text-gold" />
                  {t('dashboard.qaAddMember')}
                </button>
                <button onClick={() => setActiveModal('financeTx')} className="p-4 bg-background hover:bg-brand-hover border border-border rounded-xl text-xs font-semibold text-center transition-all hover:border-gold hover:shadow-md active:scale-95 flex flex-col items-center gap-2">
                  <DollarSign size={18} className="text-gold" />
                  {t('dashboard.qaFinanceTx')}
                </button>
                <button onClick={() => setActiveModal('export')} className="p-4 bg-background hover:bg-brand-hover border border-border rounded-xl text-xs font-semibold text-center transition-all hover:border-gold hover:shadow-md active:scale-95 flex flex-col items-center gap-2">
                  <Download size={18} className="text-gold" />
                  {t('dashboard.qaExport')}
                </button>
                <button onClick={() => setActiveModal('roles')} className="p-4 bg-background hover:bg-brand-hover border border-border rounded-xl text-xs font-semibold text-center transition-all hover:border-gold hover:shadow-md active:scale-95 flex flex-col items-center gap-2">
                  <Star size={18} className="text-gold" />
                  {t('dashboard.qaRoles')}
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-lg font-bold">{t('dashboard.recentActivity')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              {dashboardData.recentActivities.length > 0
                ? dashboardData.recentActivities.map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    title={formatActivityTitle(activity)}
                    time={formatLocaleDate(activity.createdAt) || String(activity.createdAt ?? '')}
                    type={formatActivityType(activity)}
                  />
                ))
                : recentLogs.length > 0
                  ? recentLogs.map((log) => {
                    const titleParts = [
                      logsActionLabel(log.action),
                      logsModuleLabel(log.module),
                      logsShortId(log.resourceId)
                    ].filter(Boolean);

                    const action = (log.action || '').toUpperCase();
                    const type: 'success' | 'warning' | 'info' =
                      action.startsWith('DELETE')
                        ? 'warning'
                        : action.startsWith('CREATE') || action.startsWith('UPDATE') || action.startsWith('REVIEW') || action === 'LOGIN'
                          ? 'success'
                          : 'info';

                    return (
                      <ActivityItem
                        key={log.id}
                        title={titleParts.join(' • ') || log.details}
                        time={formatLocaleDate(log.timestamp) || String(log.timestamp ?? '')}
                        type={type}
                      />
                    );
                  })
                  : isLoadingRecentLogs
                    ? (
                      <p className="text-sm text-secondary italic text-center py-8">
                        {t('common.loading')}
                      </p>
                    )
                    : (
                      <p className="text-sm text-secondary italic text-center py-8">
                        {t('dashboard.noRecentActivity')}
                      </p>
                    )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {/* Add Member Modal */}
      <Modal
        isOpen={activeModal === 'addMember'}
        onClose={closeAddMemberModal}
        title={t('dashboard.qaAddMember')}
        footer={
          <>
            <Button variant="outline" onClick={closeAddMemberModal}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmitAddMember} isLoading={isCheckingAddMember}>{t('members.addBtn', 'Thêm thành viên')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {addMemberApiError ? <p className="text-sm text-danger-text">{addMemberApiError}</p> : null}
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">{t('dashboard.memberName', 'Họ và tên')}</label>
            <Input
              value={addMemberForm.name}
              onChange={(e) => {
                const value = e.target.value;
                setAddMemberForm((prev) => ({ ...prev, name: value }));
                if (addMemberErrors.name) setAddMemberErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder={t('dashboard.placeholder.memberName', 'Nhập họ tên')}
              className={addMemberErrors.name ? 'border-danger-border focus-visible:ring-danger-border' : undefined}
            />
            {addMemberErrors.name ? <p className="text-xs text-danger-text">{addMemberErrors.name}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">{t('dashboard.studentId', 'MSSV')}</label>
            <Input
              value={addMemberForm.mssv}
              onChange={(e) => {
                const value = e.target.value;
                setAddMemberForm((prev) => ({ ...prev, mssv: value }));
                if (addMemberErrors.mssv) setAddMemberErrors((prev) => ({ ...prev, mssv: undefined }));
              }}
              placeholder={t('dashboard.placeholder.studentId', 'Nhập MSSV')}
              className={addMemberErrors.mssv ? 'border-danger-border focus-visible:ring-danger-border' : undefined}
            />
            {addMemberErrors.mssv ? <p className="text-xs text-danger-text">{addMemberErrors.mssv}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">{t('dashboard.email', 'Email')}</label>
            <Input
              type="email"
              value={addMemberForm.email}
              onChange={(e) => {
                const value = e.target.value;
                setAddMemberForm((prev) => ({ ...prev, email: value }));
                if (addMemberErrors.email) setAddMemberErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder={t('dashboard.placeholder.email', 'Nhập email')}
              className={addMemberErrors.email ? 'border-danger-border focus-visible:ring-danger-border' : undefined}
            />
            {addMemberErrors.email ? <p className="text-xs text-danger-text">{addMemberErrors.email}</p> : null}
          </div>
        </div>
      </Modal>

      {/* Finance Transaction Modal */}
      <Modal
        isOpen={activeModal === 'financeTx'}
        onClose={closeFinanceModal}
        title={t('dashboard.qaFinanceTx')}
        footer={
          <>
            <Button variant="outline" onClick={closeFinanceModal}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmitFinanceTx} isLoading={isSavingFinance}>{t('finance.addBtn', 'Thêm giao dịch')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {financeApiError ? <p className="text-sm text-danger-text">{financeApiError}</p> : null}
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">{t('dashboard.transactionType', 'Loại giao dịch')}</label>
            <select
              value={financeForm.type}
              onChange={(e) => setFinanceForm((prev) => ({ ...prev, type: e.target.value === 'Thu' ? 'Thu' : 'Chi' }))}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary"
            >
              <option value="Thu">{t('finance.typeIncome', 'Thu')}</option>
              <option value="Chi">{t('finance.typeExpense', 'Chi')}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">{t('finance.phTitle', 'Nội dung')}</label>
            <Input
              value={financeForm.title}
              onChange={(e) => {
                const value = e.target.value;
                setFinanceForm((prev) => ({ ...prev, title: value }));
                if (financeErrors.title) setFinanceErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder={t('finance.phTitle', 'Nội dung')}
              className={financeErrors.title ? 'border-danger-border focus-visible:ring-danger-border' : undefined}
            />
            {financeErrors.title ? <p className="text-xs text-danger-text">{financeErrors.title}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">{t('dashboard.amount', 'Số tiền')}</label>
            <Input
              type="number"
              value={financeForm.amount}
              onChange={(e) => {
                const value = e.target.value;
                setFinanceForm((prev) => ({ ...prev, amount: value }));
                if (financeErrors.amount) setFinanceErrors((prev) => ({ ...prev, amount: undefined }));
              }}
              placeholder={t('dashboard.placeholder.amount', '0')}
              className={financeErrors.amount ? 'border-danger-border focus-visible:ring-danger-border' : undefined}
            />
            {financeErrors.amount ? <p className="text-xs text-danger-text">{financeErrors.amount}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">{t('finance.thOwner', 'Người phụ trách')}</label>
            <Input
              value={financeForm.owner}
              onChange={(e) => {
                const value = e.target.value;
                setFinanceForm((prev) => ({ ...prev, owner: value }));
                if (financeErrors.owner) setFinanceErrors((prev) => ({ ...prev, owner: undefined }));
              }}
              placeholder={t('finance.phOwner', 'Người phụ trách')}
              className={financeErrors.owner ? 'border-danger-border focus-visible:ring-danger-border' : undefined}
            />
            {financeErrors.owner ? <p className="text-xs text-danger-text">{financeErrors.owner}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">{t('finance.phCategory', 'Danh mục')}</label>
            <Input
              value={financeForm.category}
              onChange={(e) => {
                const value = e.target.value;
                setFinanceForm((prev) => ({ ...prev, category: value }));
                if (financeErrors.category) setFinanceErrors((prev) => ({ ...prev, category: undefined }));
              }}
              placeholder={t('finance.phCategory', 'Danh mục')}
              className={financeErrors.category ? 'border-danger-border focus-visible:ring-danger-border' : undefined}
            />
            {financeErrors.category ? <p className="text-xs text-danger-text">{financeErrors.category}</p> : null}
          </div>
        </div>
      </Modal>

      {/* Export Modal */}
      <Modal
        isOpen={activeModal === 'export'}
        onClose={closeExportModal}
        title={t('dashboard.qaExport')}
        footer={
          <>
            <Button variant="outline" onClick={closeExportModal}>{t('common.cancel')}</Button>
            <Button onClick={handleExport} isLoading={isExporting}>{t('common.export')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {exportError ? <p className="text-sm text-danger-text">{exportError}</p> : null}
          <p className="text-sm text-secondary mb-4">{t('dashboard.selectReportType', 'Chọn loại báo cáo')}</p>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="exportType"
                value="overview"
                checked={exportType === 'overview'}
                onChange={() => setExportType('overview')}
                className="text-gold focus:ring-gold"
              />
              <span className="text-sm text-primary">{t('dashboard.overviewReport', 'Báo cáo tổng quan')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="exportType"
                value="finance"
                checked={exportType === 'finance'}
                onChange={() => setExportType('finance')}
                className="text-gold focus:ring-gold"
              />
              <span className="text-sm text-primary">{t('dashboard.financeReport', 'Báo cáo tài chính')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="exportType"
                value="members"
                checked={exportType === 'members'}
                onChange={() => setExportType('members')}
                className="text-gold focus:ring-gold"
              />
              <span className="text-sm text-primary">{t('dashboard.memberList', 'Danh sách thành viên')}</span>
            </label>
          </div>
        </div>
      </Modal>

        {/* Roles Modal */}
      <Modal
        isOpen={activeModal === 'roles'}
        onClose={closeRolesModal}
        title={t('dashboard.qaRoles')}
        footer={
          <>
            <Button variant="outline" onClick={closeRolesModal}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveRole} isLoading={isSavingRole} disabled={!rolesSelectedUser}>{t('common.save')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {rolesError ? <p className="text-sm text-danger-text">{rolesError}</p> : null}
          <p className="text-sm text-secondary mb-4">{t('dashboard.searchMembers', 'Tìm kiếm tài khoản')}</p>
          <div className="space-y-2">
            <Input
              value={rolesQuery}
              onChange={(e) => setRolesQuery(e.target.value)}
              placeholder={t('dashboard.placeholder.searchMembers', 'Nhập username hoặc họ tên...')}
            />
          </div>
          {isSearchingRoles ? (
            <div className="p-4 border border-border rounded-lg bg-background text-center">
              <p className="text-sm text-secondary">{t('common.loading')}</p>
            </div>
          ) : rolesResults.length === 0 ? (
            <div className="p-4 border border-border rounded-lg bg-background text-center">
              <p className="text-sm text-secondary">{t('dashboard.enterSearchInfo', 'Nhập ít nhất 2 ký tự để tìm')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rolesResults.map((user) => {
                const isSelected = rolesSelectedUser?.id === user.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      setRolesSelectedUser(user);
                      setRolesSelectedRole(user.role);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${isSelected ? 'border-gold bg-gold/10' : 'border-border bg-background hover:bg-brand-hover'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-primary">{user.fullName || user.username}</div>
                        <div className="text-xs text-secondary">{user.username} • {user.role}</div>
                      </div>
                      <div className="text-xs text-secondary">{user.isActive === false ? t('members.statusInactive', 'Inactive') : t('members.statusActive', 'Active')}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {rolesSelectedUser ? (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <label className="text-sm font-medium text-primary">{t('settings.role', 'Chức vụ')}</label>
              <select
                value={rolesSelectedRole}
                onChange={(e) => setRolesSelectedRole(e.target.value as UserRole)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
};
