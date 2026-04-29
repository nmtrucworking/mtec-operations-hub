import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Bot, Clock, Loader2, PieChart, Sparkles, Users, XCircle, DollarSign, Package, AlertTriangle, ArrowRight, CheckCircle2, Download, Star } from 'lucide-react';
import { ActivityItem, ProgressBar, StatCard, RequestCard } from '../components/shared/Widgets';
import { callGeminiAPI } from '../services/gemini';
import { formatCurrency, type Transaction } from '../data/finance';
import { assetSeedData } from '../data/logistics';
import type { RequestItem } from '../data/requests';
import { normalizeBanList, normalizeText, type Member } from '../data/members';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Modal } from '../components/ui/modal';
import { Input } from '../components/ui/input';
import { DashboardOverviewData, DashboardActivity } from '../types/dashboard';
import { getDashboardOverview } from '../services/dashboard';
import { getMembers } from '../services/members';

import { apiCall } from '../services/api';

interface DashboardViewProps {
  authToken: string;
}

export const DashboardView = ({ authToken }: DashboardViewProps) => {
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState<DashboardOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [memberDirectory, setMemberDirectory] = useState<Member[] | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      const [overviewResponse, membersResponse] = await Promise.all([
        getDashboardOverview(authToken),
        getMembers({ pageSize: 1000 }, authToken)
      ]);

      if (overviewResponse.status === 200 && overviewResponse.data) {
        setDashboardData(overviewResponse.data);
      } else {
        setError(overviewResponse.error || 'Không thể truy xuất dữ liệu từ máy chủ.');
      }

      if (membersResponse.status >= 200 && membersResponse.status < 300 && membersResponse.data) {
        setMemberDirectory(membersResponse.data.members);
      } else {
        setMemberDirectory(null);
      }

      setIsLoading(false);
    };
    if (authToken) {
      void fetchDashboardData();
    }
  }, [authToken]);

  
  const [aiInsight, setAiInsight] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Derived data
  const totalMembers = memberDirectory ? memberDirectory.length : (dashboardData?.totalMembers ?? 0);

  const countMembersByAliases = (aliases: string[]) => {
    if (memberDirectory) {
      return memberDirectory.reduce((count, member) => {
        const memberBans = normalizeBanList(member.ban).map((ban) => normalizeText(ban));
        const hasMatch = memberBans.some((ban) => aliases.some((alias) => ban.includes(alias)));
        return count + (hasMatch ? 1 : 0);
      }, 0);
    }

    const normalizedAliases = aliases.map((alias) => normalizeText(alias));
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
  
  const resignRequests = [] as RequestItem[]; // Replace with actual request filtering logic if needed
  const maintenanceCount = assetSeedData.filter((item) => item.status === 'Cần bảo trì').length;
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
    const statusText = activity.status === 'Da duyet' ? 'Giao dịch' : 'Đang duyệt';
    const typeText = activity.type === 'Thu' ? 'thu' : 'chi';
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
      const response = await apiCall('/api/ai/generate-insight', {
        method: 'POST',
        body: JSON.stringify({ prompt })
      }, authToken);

      const responseBody = response.data as any;
      if (response.status === 200 && responseBody?.success && responseBody.data?.text) {
        setAiInsight(responseBody.data.text);
      } else {
        setAiInsight('Hệ thống AI không thể xử lý yêu cầu vào lúc này.');
      }
    } catch (err) {
      setAiInsight('Lỗi kết nối đến máy chủ AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-full w-full p-8 text-primary space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-gold" />
        <span className="text-lg font-medium animate-pulse">{t('dashboard.loading')}</span>
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
        <StatCard title={t('dashboard.statTotalMembers')} value={totalMembers.toString()} icon={<Users size={24} />} trend="+12" trendUp />
        <StatCard title={t('dashboard.statCurrentFund')} value={formatCurrency(dashboardData?.currentFund ?? 0)} icon={<DollarSign size={24} />} color="text-success-text" trend={`${(dashboardData?.totalIncome ?? 0) > (dashboardData?.totalExpense ?? 0) ? '+' : ''}${formatCurrency((dashboardData?.totalIncome ?? 0) - (dashboardData?.totalExpense ?? 0))}`} trendUp={(dashboardData?.totalIncome ?? 0) > (dashboardData?.totalExpense ?? 0)} />
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
                  date={new Date(req.date).toLocaleDateString('vi-VN')}
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
                <button onClick={() => setActiveModal('addMember')} className="p-4 bg-background hover:bg-brand-hover border border-border rounded-xl text-xs font-semibold text-center transition-all hover:border-gold hover:shadow-md active:scale-95 flex flex-col items-center gap-2">
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
              {dashboardData.recentActivities.map((activity) => (
                <ActivityItem 
                  key={activity.id}
                  title={formatActivityTitle(activity)}
                  time={new Date(activity.createdAt).toLocaleDateString('vi-VN')}
                  type={formatActivityType(activity)}
                />
              ))}
              {dashboardData.recentActivities.length === 0 && (
                <p className="text-sm text-secondary italic text-center py-8">
                  {t('dashboard.noRecentActivity')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={activeModal === 'addMember'} 
        onClose={() => setActiveModal(null)} 
        title={t('dashboard.qaAddMember')}
        footer={
          <>
            <Button variant="outline" onClick={() => setActiveModal(null)}>Hủy</Button>
            <Button onClick={() => setActiveModal(null)}>Thêm thành viên</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">{t('dashboard.memberName')}</label>
            <Input placeholder={t('dashboard.placeholder.memberName')} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">{t('dashboard.studentId')}</label>
            <Input placeholder={t('dashboard.placeholder.studentId')} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">{t('dashboard.email')}</label>
            <Input type="email" placeholder={t('dashboard.placeholder.email')} />
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={activeModal === 'financeTx'} 
        onClose={() => setActiveModal(null)} 
        title={t('dashboard.qaFinanceTx')}
        footer={
          <>
            <Button variant="outline" onClick={() => setActiveModal(null)}>Hủy</Button>
            <Button onClick={() => setActiveModal(null)}>Tạo giao dịch</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">{t('dashboard.transactionType')}</label>
            <select className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary">
              <option value="thu">{t('dashboard.income')}</option>
              <option value="chi">{t('dashboard.expense')}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">{t('dashboard.amount')}</label>
            <Input type="number" placeholder="0" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">{t('dashboard.reason')}</label>
            <Input placeholder={t('dashboard.placeholder.reason')} />
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={activeModal === 'export'} 
        onClose={() => setActiveModal(null)} 
        title={t('dashboard.qaExport')}
        footer={
          <>
            <Button variant="outline" onClick={() => setActiveModal(null)}>Hủy</Button>
            <Button onClick={() => setActiveModal(null)}>Xuất file</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary mb-4">{t('dashboard.selectReportType')}</p>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input type="radio" name="exportType" defaultChecked className="text-gold focus:ring-gold" />
              <span className="text-sm text-primary">{t('dashboard.overviewReport')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="radio" name="exportType" className="text-gold focus:ring-gold" />
              <span className="text-sm text-primary">{t('dashboard.financeReport')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="radio" name="exportType" className="text-gold focus:ring-gold" />
              <span className="text-sm text-primary">{t('dashboard.memberList')}</span>
            </label>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={activeModal === 'roles'} 
        onClose={() => setActiveModal(null)} 
        title={t('dashboard.qaRoles')}
        footer={
          <>
            <Button variant="outline" onClick={() => setActiveModal(null)}>Hủy</Button>
            <Button onClick={() => setActiveModal(null)}>Lưu thay đổi</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary mb-4">{t('dashboard.searchMembers')}</p>
          <div className="space-y-2">
            <Input placeholder={t('dashboard.placeholder.searchMembers')} />
          </div>
          <div className="p-4 border border-border rounded-lg bg-background mt-4 text-center">
            <p className="text-sm text-secondary">{t('dashboard.enterSearchInfo')}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
