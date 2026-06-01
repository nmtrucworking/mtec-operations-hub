import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Scale,
  Users,
  Award,
  FileCheck,
  BarChart3,
  Activity,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  Calendar,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UserAccount } from '../../types/app';
import { Member } from '../../data/members';
import {
  EvaluationCycle,
  getEvaluationCycles,
  getEvaluationCycleSummary,
  EvaluationCycleSummary
} from '../../services/evaluations';

import EvaluationCyclesPanel from './EvaluationCyclesPanel';
import EvaluationCriteriaPanel from './EvaluationCriteriaPanel';
import EvaluationMemberRolesPanel from './EvaluationMemberRolesPanel';
import EvaluationScoreEventsPanel from './EvaluationScoreEventsPanel';
import EvaluationEvidencePanel from './EvaluationEvidencePanel';
import EvaluationResultsPanel from './EvaluationResultsPanel';
import EvaluationSyncPanel from './EvaluationSyncPanel';
import EvaluationAppealsPanel from './EvaluationAppealsPanel';
import EvaluationGuidePanel from './EvaluationGuidePanel';
import EvaluationQuickReviewPanel from './EvaluationQuickReviewPanel';

interface EvaluationTabProps {
  authToken?: string;
  currentUser: UserAccount;
  allMembers: Member[];
}

type InnerTabType = 'guide' | 'cycles' | 'criteria' | 'roles' | 'events' | 'evidence' | 'quick-review' | 'results' | 'sync' | 'appeals';

export const EvaluationTab = ({ authToken, currentUser, allMembers }: EvaluationTabProps) => {
  const { t } = useTranslation();
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<EvaluationCycle | null>(null);
  const [innerTab, setInnerTab] = useState<InnerTabType>('guide');
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [summary, setSummary] = useState<EvaluationCycleSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const fetchCycles = async () => {
    try {
      const res = await getEvaluationCycles({ pageSize: 100 }, authToken);
      if (res?.data?.items) {
        setCycles(res.data.items);
        if (selectedCycleId) {
          const updated = res.data.items.find(cycle => cycle.id === selectedCycleId);
          if (updated) setSelectedCycle(updated);
        }
      }
    } catch (err) {
      console.error('Error fetching cycles in tab:', err);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, [authToken, selectedCycleId]);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!selectedCycleId) {
        setSummary(null);
        return;
      }
      setIsLoadingSummary(true);
      try {
        const res = await getEvaluationCycleSummary(selectedCycleId, authToken);
        if (res?.data) setSummary(res.data);
      } catch (err) {
        console.error('Error fetching cycle summary:', err);
      } finally {
        setIsLoadingSummary(false);
      }
    };
    fetchSummary();
  }, [selectedCycleId, authToken]);

  const handleCycleSelect = (cycle: EvaluationCycle | null) => {
    setSelectedCycle(cycle);
    setSelectedCycleId(cycle ? cycle.id : null);
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'MEMBER_REVIEW': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'APPROVED': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'LOCKED': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'CANCELLED': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'DRAFT': return t('discipline.status.draft', 'Bản nháp');
      case 'MEMBER_REVIEW': return t('discipline.status.memberReview', 'Đang rà soát');
      case 'APPROVED': return t('discipline.status.approved', 'Đã duyệt');
      case 'LOCKED': return t('discipline.status.locked', 'Đã khóa');
      case 'CANCELLED': return t('discipline.status.cancelled', 'Đã hủy');
      default: return status || '';
    }
  };

  const tabs = [
    { id: 'guide' as const, label: t('discipline.guide.title', 'Quy định'), icon: BookOpen },
    { id: 'cycles' as const, label: t('discipline.cycles.title', 'Chu kỳ'), icon: ClipboardCheck },
    { id: 'criteria' as const, label: t('discipline.criteria.title', 'Tiêu chí'), icon: Scale },
    { id: 'roles' as const, label: t('discipline.roles.title', 'Vai trò'), icon: Users },
    { id: 'events' as const, label: t('discipline.scoreEvents.title', 'Sự kiện'), icon: Award },
    { id: 'evidence' as const, label: t('discipline.evidence.title', 'Minh chứng'), icon: FileCheck },
    { id: 'quick-review' as const, label: t('discipline.quickReview.title', 'Quick Review'), icon: Activity },
    { id: 'results' as const, label: t('discipline.results.title', 'Kết quả'), icon: BarChart3 },
    { id: 'sync' as const, label: t('discipline.sync.title', 'Đồng bộ'), icon: RefreshCw },
    { id: 'appeals' as const, label: t('discipline.appeals.title', 'Khiếu nại'), icon: MessageSquare }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card/40 backdrop-blur-sm border border-border/30 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">{t('discipline.title', 'Kỷ luật & Chuyên cần')}</h3>
            <p className="text-sm text-secondary">
              {t('discipline.subtitle', 'Thiết lập chu kỳ đánh giá hiệu suất, chuyên cần, kỷ luật và năng lực chuyên môn của thành viên.')}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="text-sm font-semibold text-secondary-foreground whitespace-nowrap">
              {t('discipline.cycles.chooseLabel', 'Chọn Chu kỳ:')}
            </label>
            <select
              value={selectedCycleId || ''}
              onChange={(e) => {
                const found = cycles.find(cycle => cycle.id === e.target.value);
                handleCycleSelect(found || null);
              }}
              className="flex-1 md:w-64 rounded-xl border border-border/40 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
            >
              <option value="">{t('discipline.cycles.selectPlaceholder', '-- Chọn chu kỳ đánh giá --')}</option>
              {cycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.name} ({cycle.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedCycle && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border/20">
            <div className="bg-card/25 border border-border/15 p-4 rounded-xl space-y-1.5 shadow-sm/5">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">{t('discipline.cycles.infoTitle', 'Thông tin chu kỳ')}</span>
              <div className="flex items-center gap-2 text-foreground font-bold">
                <span className="truncate">{selectedCycle.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadgeColor(selectedCycle.status)}`}>
                  {getStatusLabel(selectedCycle.status)}
                </span>
              </div>
              <div className="text-xs text-secondary flex items-center gap-1">
                <Calendar size={12} />
                <span>
                  {new Date(selectedCycle.startDate).toLocaleDateString('vi-VN')} - {new Date(selectedCycle.endDate).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>

            <div className="bg-card/25 border border-border/15 p-4 rounded-xl space-y-1.5 shadow-sm/5">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">{t('discipline.cycles.memberCount', 'Số thành viên tham gia')}</span>
              <div className="text-2xl font-black text-foreground">
                {isLoadingSummary ? '...' : summary?.totalMembers ?? 0}
              </div>
              <p className="text-xs text-secondary">{t('discipline.cycles.rolesHint', 'Đã gán vai trò trong chu kỳ này')}</p>
            </div>

            <div className="bg-card/25 border border-border/15 p-4 rounded-xl space-y-1.5 shadow-sm/5">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">{t('discipline.cycles.averageScore', 'Điểm trung bình chu kỳ')}</span>
              <div className="text-2xl font-black text-primary">
                {isLoadingSummary ? '...' : (summary?.averageScore !== undefined ? summary.averageScore.toFixed(2) : '0.00')}
              </div>
              <p className="text-xs text-secondary">{t('discipline.cycles.averageHint', 'Dựa trên kết quả tính toán gần nhất')}</p>
            </div>

            <div className="bg-card/25 border border-border/15 p-4 rounded-xl space-y-1.5 shadow-sm/5">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">{t('discipline.cycles.editStatus', 'Trạng thái chỉnh sửa')}</span>
              <div className="flex items-center gap-1.5 font-bold text-sm">
                {selectedCycle.status === 'LOCKED' ? (
                  <>
                    <AlertTriangle size={16} className="text-purple-500 shrink-0" />
                    <span className="text-purple-600 dark:text-purple-400">{t('discipline.cycles.lockedData', 'Đã khóa dữ liệu')}</span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                    <span className="text-green-600 dark:text-green-400">{t('discipline.cycles.canEdit', 'Cho phép chỉnh sửa')}</span>
                  </>
                )}
              </div>
              <p className="text-xs text-secondary">
                {selectedCycle.status === 'LOCKED'
                  ? t('discipline.cycles.viewOnly', 'Chỉ xem dữ liệu, không thể sửa đổi')
                  : t('discipline.cycles.canScore', 'Cán bộ có quyền có thể ghi điểm/minh chứng')}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="relative w-full">
        <div className="flex overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
          <div className="flex gap-1.5 p-1.5 bg-card/40 backdrop-blur-xl border border-border/40 rounded-2xl w-max shadow-sm/50">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => (id === 'guide' || id === 'cycles' || id === 'criteria' || selectedCycleId) && setInnerTab(id)}
                disabled={id !== 'guide' && id !== 'cycles' && id !== 'criteria' && !selectedCycleId}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all rounded-xl whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                  (!selectedCycleId && id !== 'guide' && id !== 'cycles' && id !== 'criteria')
                    ? 'opacity-40 cursor-not-allowed text-secondary border-transparent'
                    : innerTab === id
                      ? 'bg-background text-primary shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-border/60'
                      : 'text-secondary hover:text-foreground hover:bg-muted/50 border border-transparent'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 transition-all">
        {innerTab === 'guide' && <EvaluationGuidePanel />}
        {innerTab === 'cycles' && (
          <EvaluationCyclesPanel
            authToken={authToken}
            currentUser={currentUser}
            onSelectCycle={handleCycleSelect}
            selectedCycleId={selectedCycleId}
            onCyclesUpdated={fetchCycles}
          />
        )}
        {innerTab === 'criteria' && <EvaluationCriteriaPanel authToken={authToken} currentUser={currentUser} />}

        {selectedCycleId && selectedCycle && (
          <>
            {innerTab === 'roles' && (
              <EvaluationMemberRolesPanel
                authToken={authToken}
                currentUser={currentUser}
                cycleId={selectedCycleId}
                cycle={selectedCycle}
                allMembers={allMembers}
              />
            )}
            {innerTab === 'events' && (
              <EvaluationScoreEventsPanel
                authToken={authToken}
                currentUser={currentUser}
                cycleId={selectedCycleId}
                cycle={selectedCycle}
                allMembers={allMembers}
              />
            )}
            {innerTab === 'evidence' && (
              <EvaluationEvidencePanel
                authToken={authToken}
                currentUser={currentUser}
                cycleId={selectedCycleId}
                cycle={selectedCycle}
                allMembers={allMembers}
              />
            )}
            {innerTab === 'quick-review' && (
              <EvaluationQuickReviewPanel
                authToken={authToken}
                currentUser={currentUser}
                cycleId={selectedCycleId}
                cycle={selectedCycle}
                allMembers={allMembers}
              />
            )}
            {innerTab === 'results' && (
              <EvaluationResultsPanel
                authToken={authToken}
                currentUser={currentUser}
                cycleId={selectedCycleId}
                cycle={selectedCycle}
                allMembers={allMembers}
                onComputeComplete={() => {
                  if (selectedCycleId) {
                    getEvaluationCycleSummary(selectedCycleId, authToken)
                      .then(res => res?.data && setSummary(res.data))
                      .catch(console.error);
                  }
                }}
              />
            )}
            {innerTab === 'sync' && (
              <EvaluationSyncPanel
                authToken={authToken}
                currentUser={currentUser}
                cycleId={selectedCycleId}
                cycle={selectedCycle}
              />
            )}
            {innerTab === 'appeals' && (
              <EvaluationAppealsPanel
                authToken={authToken}
                currentUser={currentUser}
                cycleId={selectedCycleId}
                cycle={selectedCycle}
                allMembers={allMembers}
              />
            )}
          </>
        )}

        {!selectedCycleId && innerTab !== 'guide' && innerTab !== 'cycles' && innerTab !== 'criteria' && (
          <div className="flex flex-col items-center justify-center p-12 bg-card border border-border/50 rounded-2xl shadow-sm text-center space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-600 rounded-full">
              <AlertTriangle size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-foreground">{t('discipline.cycles.noCycleSelected', 'Chưa chọn chu kỳ đánh giá')}</h4>
              <p className="text-sm text-secondary max-w-md">
                {t('discipline.cycles.noCycleSelectedHint', 'Vui lòng chọn một chu kỳ từ danh sách thả xuống ở phía trên hoặc chuyển sang tab "Chu kỳ đánh giá" để chọn/tạo chu kỳ mới.')}
              </p>
            </div>
            <button
              onClick={() => setInnerTab('cycles')}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-sm text-sm"
            >
              <span>{t('discipline.cycles.viewList', 'Xem danh sách chu kỳ')}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationTab;
