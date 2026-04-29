import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Bot, Clock, Loader2, PieChart, Sparkles, Users, XCircle, DollarSign, Package, AlertTriangle, ArrowRight } from 'lucide-react';
import { ActivityItem, ProgressBar, StatCard, RequestCard } from '../components/shared/Widgets';
import { callGeminiAPI } from '../services/gemini';
import { formatCurrency, type Transaction } from '../data/finance';
import { assetSeedData } from '../data/logistics';
import type { RequestItem } from '../data/requests';
import { mockMembers } from '../data/members';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Modal } from '../components/ui/modal';
import { Input } from '../components/ui/input';
import { DashboardOverviewData, DashboardActivity } from '../types/dashboard';
import { getDashboardOverview } from '../services/dashboard';

import { apiCall } from '../services/api';

interface DashboardViewProps {
  authToken: string;
}

export const DashboardView = ({ authToken }: DashboardViewProps) => {
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState<DashboardOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      const response = await getDashboardOverview(authToken);

      if (response.status === 200 && response.data?.data) {
        setDashboardData(response.data.data);
      } else {
        setError(response.error || 'Không thể truy xuất dữ liệu từ máy chủ.');
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
  const totalMembers = dashboardData?.totalMembers ?? 0;
  
  // Calculate dept stats
  const countBan = (ban: string) => mockMembers.filter(m => m.ban.includes(ban)).length;

  const getDeptCount = (ban: string) => {
  const dept = dashboardData?.deptDistribution.find((d: any) => d.ban === ban);
    return dept ? dept.count : 0;
  };

  const pctMedia = totalMembers ? Math.round((getDeptCount('Ban Truyen thong') / totalMembers) * 100) : 0;
  const pctTech = totalMembers ? Math.round((getDeptCount('Ban Cong nghe') / totalMembers) * 100) : 0;
  const pctBoard = totalMembers ? Math.round((getDeptCount('Ban Chu nhiem') / totalMembers) * 100) : 0;
  const pctOps = totalMembers ? Math.round((getDeptCount('Ban Dieu hanh') / totalMembers) * 100) : 0;
  
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
      <div className="flex justify-center items-center h-full w-full p-8 text-primary">
        <span>Đang tải dữ liệu tổng quan hệ thống...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md border border-red-300">
        Lỗi hệ thống: {error}
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">{t('dashboard.title')}</h2>
          <p className="text-blue-300 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleGenerateInsight}
            disabled={isAiLoading}
            isLoading={isAiLoading}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-purple-500/20 border-0"
          >
            {!isAiLoading && <Sparkles size={16} className="mr-2" />}
            ✨ {t('dashboard.aiInsightBtn')}
          </Button>
        </div>
      </div>

      {aiInsight ? (
        <div className="bg-indigo-900/40 border border-indigo-500/50 rounded-xl p-5 flex items-start space-x-4 animate-in fade-in">
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300 shrink-0">
            <Bot size={24} />
          </div>
          <div>
            <h4 className="font-semibold text-indigo-200 mb-1 flex items-center">
              {t('dashboard.aiInsightTitle')} <Sparkles size={14} className="ml-2 text-indigo-300" />
            </h4>
            <p className="text-sm text-blue-100 leading-relaxed">{aiInsight}</p>
          </div>
        </div>
      ) : null}

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('dashboard.statTotalMembers')} value={totalMembers.toString()} icon={<Users size={24} />} trend="+12" trendUp />
        <StatCard title={t('dashboard.statCurrentFund')} value={formatCurrency(dashboardData?.currentFund ?? 0)} icon={<DollarSign size={24} />} color="text-green-400" trend={`${(dashboardData?.totalIncome ?? 0) > (dashboardData?.totalExpense ?? 0) ? '+' : ''}${formatCurrency((dashboardData?.totalIncome ?? 0) - (dashboardData?.totalExpense ?? 0))}`} trendUp={(dashboardData?.totalIncome ?? 0) > (dashboardData?.totalExpense ?? 0)} />
        <StatCard title={t('dashboard.statMaintenance')} value={dashboardData?.maintenanceCount.toString()} icon={<Package size={24} />} color="text-red-400" />
        <StatCard title={t('dashboard.statPendingReqs')} value={dashboardData?.pendingRequestsCount.toString()} icon={<Clock size={24} />} color="text-orange-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: HR & Logistics */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">{t('dashboard.chartMembersByDept')}</CardTitle>
              <BarChart3 className="text-secondary" />
            </CardHeader>
            <CardContent className="space-y-4">
              <ProgressBar label={t('dashboard.deptMedia')} percent={pctMedia} color="bg-blue-400" />
              <ProgressBar label={t('dashboard.deptTech')} percent={pctTech} color="bg-indigo-400" />
              <ProgressBar label={t('dashboard.deptOps')} percent={pctOps} color="bg-green-400" />
              <ProgressBar label={t('dashboard.deptBoard')} percent={pctBoard} color="bg-yellow-400" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle size={18} className="text-orange-400" />
                {t('dashboard.urgentTasks')}
              </CardTitle>
              <button className="text-sm text-secondary hover:text-gold transition-colors flex items-center">
                {t('dashboard.viewAll')} <ArrowRight size={14} className="ml-1" />
              </button>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboardData.urgentRequests.map(req => (
                <RequestCard 
                  key={req.id}
                  name={req.name}
                  mssv={req.id}
                  date={new Date(req.date).toLocaleDateString('vi-VN')}
                  reason={req.type}
                />
              ))}
              {dashboardData.pendingRequestsCount === 0 && (
                <p className="text-sm text-secondary italic text-center py-4">{t('dashboard.noPendingReqs')}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Activity & Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t('dashboard.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setActiveModal('addMember')} className="p-3 bg-background hover:bg-brand-hover border border-border rounded-lg text-sm text-center transition-colors whitespace-pre-line">
                  {t('dashboard.qaAddMember')}
                </button>
                <button onClick={() => setActiveModal('financeTx')} className="p-3 bg-background hover:bg-brand-hover border border-border rounded-lg text-sm text-center transition-colors whitespace-pre-line">
                  {t('dashboard.qaFinanceTx')}
                </button>
                <button onClick={() => setActiveModal('export')} className="p-3 bg-background hover:bg-brand-hover border border-border rounded-lg text-sm text-center transition-colors whitespace-pre-line">
                  {t('dashboard.qaExport')}
                </button>
                <button onClick={() => setActiveModal('roles')} className="p-3 bg-background hover:bg-brand-hover border border-border rounded-lg text-sm text-center transition-colors whitespace-pre-line">
                  {t('dashboard.qaRoles')}
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t('dashboard.recentActivity')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardData.recentActivities.map((activity) => (
                <ActivityItem 
                  key={activity.id}
                  title={formatActivityTitle(activity)}
                  time={new Date(activity.createdAt).toLocaleDateString('vi-VN')}
                  type={formatActivityType(activity)}
                />
              ))}
              {dashboardData.recentActivities.length === 0 && (
                <p className="text-sm text-secondary italic text-center py-4">
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
