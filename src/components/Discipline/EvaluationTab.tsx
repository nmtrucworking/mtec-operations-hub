import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  BookOpen,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { UserAccount } from '../../types/app';
import { Member } from '../../data/members';
import {
  EvaluationCycle,
  EvaluationCycleSummary,
  getEvaluationCycleSummary,
  getEvaluationCycles,
} from '../../services/evaluations';

import EvaluationAppealsPanel from './EvaluationAppealsPanel';
import EvaluationCriteriaPanel from './EvaluationCriteriaPanel';
import EvaluationCyclesPanel from './EvaluationCyclesPanel';
import EvaluationEvidencePanel from './EvaluationEvidencePanel';
import EvaluationGuidePanel from './EvaluationGuidePanel';
import EvaluationMemberRolesPanel from './EvaluationMemberRolesPanel';
import EvaluationQuickReviewPanel from './EvaluationQuickReviewPanel';
import EvaluationResultsPanel from './EvaluationResultsPanel';
import EvaluationScoreEventsPanel from './EvaluationScoreEventsPanel';
import EvaluationSyncPanel from './EvaluationSyncPanel';

interface EvaluationTabProps {
  authToken?: string;
  currentUser: UserAccount;
  allMembers: Member[];
}

type InnerTabType =
  | 'guide'
  | 'cycles'
  | 'criteria'
  | 'roles'
  | 'events'
  | 'evidence'
  | 'quick-review'
  | 'results'
  | 'sync'
  | 'appeals';

export const EvaluationTab = ({ authToken, currentUser, allMembers }: EvaluationTabProps) => {
  const { t } = useTranslation();
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [innerTab, setInnerTab] = useState<InnerTabType>('guide');
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [summary, setSummary] = useState<EvaluationCycleSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const cyclesRequestSeqRef = useRef(0);
  const summaryRequestSeqRef = useRef(0);

  const selectedCycle = useMemo(
    () => cycles.find((cycle) => cycle.id === selectedCycleId) || null,
    [cycles, selectedCycleId]
  );

  const fetchCycles = async () => {
    const requestSeq = ++cyclesRequestSeqRef.current;
    try {
      const res = await getEvaluationCycles({ pageSize: 100 }, authToken);
      if (requestSeq !== cyclesRequestSeqRef.current) {
        return;
      }

      if (res?.data?.items) {
        setCycles(res.data.items);
      }
    } catch (error) {
      console.error('Error fetching cycles in tab:', error);
    }
  };

  const refreshSelectedCycleSummary = async () => {
    const requestSeq = ++summaryRequestSeqRef.current;
    if (!selectedCycleId) {
      setSummary(null);
      setIsLoadingSummary(false);
      return;
    }

    setSummary(null);
    setIsLoadingSummary(true);
    try {
      const res = await getEvaluationCycleSummary(selectedCycleId, authToken);
      if (requestSeq !== summaryRequestSeqRef.current) {
        return;
      }

      if (res?.data) {
        setSummary(res.data);
      }
    } catch (error) {
      if (requestSeq !== summaryRequestSeqRef.current) {
        return;
      }
      console.error('Error fetching cycle summary:', error);
    } finally {
      if (requestSeq === summaryRequestSeqRef.current) {
        setIsLoadingSummary(false);
      }
    }
  };

  useEffect(() => {
    fetchCycles();
  }, [authToken]);

  useEffect(() => {
    refreshSelectedCycleSummary();
  }, [selectedCycleId, authToken]);

  const handleCycleSelect = (cycle: EvaluationCycle | null) => {
    setSelectedCycleId(cycle ? cycle.id : null);
    setInnerTab((currentTab) =>
      cycle || currentTab === 'guide' || currentTab === 'cycles' || currentTab === 'criteria'
        ? currentTab
        : 'guide'
    );
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'MEMBER_REVIEW':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'APPROVED':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'LOCKED':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'DRAFT':
        return t('discipline.status.draft', 'Bản nháp');
      case 'MEMBER_REVIEW':
        return t('discipline.status.memberReview', 'Đang rà soát');
      case 'APPROVED':
        return t('discipline.status.approved', 'Đã duyệt');
      case 'LOCKED':
        return t('discipline.status.locked', 'Đã khóa');
      case 'CANCELLED':
        return t('discipline.status.cancelled', 'Đã hủy');
      default:
        return status || '';
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
    { id: 'appeals' as const, label: t('discipline.appeals.title', 'Khiếu nại'), icon: MessageSquare },
  ];

  const selectedCycleLocked = selectedCycle?.status === 'LOCKED';

  return (
    <div className="space-y-5">
      <div className="bg-card/40 backdrop-blur-sm border border-border/20 p-3 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">{t('discipline.title', 'Kỷ luật & Chuyên cần')}</h3>
            <p className="text-sm text-secondary max-w-2xl">
              {t(
                'discipline.subtitle',
                'Thiết lập chu kỳ đánh giá hiệu suất, chuyên cần, kỷ luật và năng lực chuyên môn của thành viên.'
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="text-sm font-medium text-secondary-foreground whitespace-nowrap">
              {t('discipline.cycles.chooseLabel', 'Chọn Chu kỳ:')}
            </label>
            <select
              value={selectedCycleId || ''}
              onChange={(e) => {
                const found = cycles.find((cycle) => cycle.id === e.target.value);
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border/10">
            <div className="bg-card/25 border border-border/10 p-3 rounded-xl space-y-1">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                {t('discipline.cycles.infoTitle', 'Thông tin chu kỳ')}
              </span>
              <div className="flex items-center gap-2 text-foreground font-semibold min-w-0">
                <span className="truncate text-sm">{selectedCycle.name}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${getStatusBadgeColor(selectedCycle.status)}`}>
                  {getStatusLabel(selectedCycle.status)}
                </span>
              </div>
              <div className="text-xs text-secondary flex items-center gap-1">
                <Calendar size={12} />
                <span>
                  {new Date(selectedCycle.startDate).toLocaleDateString('vi-VN')} -{' '}
                  {new Date(selectedCycle.endDate).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>

            <div className="bg-card/25 border border-border/10 p-3 rounded-xl space-y-1">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                {t('discipline.cycles.memberCount', 'Số thành viên tham gia')}
              </span>
              <div className="text-xl font-extrabold text-foreground">{isLoadingSummary ? '...' : summary?.totalMembers ?? 0}</div>
              <p className="text-xs text-secondary">{t('discipline.cycles.rolesHint', 'Đã gán vai trò trong chu kỳ này')}</p>
            </div>

            <div className="bg-card/25 border border-border/10 p-3 rounded-xl space-y-1">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                {t('discipline.cycles.averageScore', 'Điểm trung bình chu kỳ')}
              </span>
              <div className="text-xl font-extrabold text-primary">
                {isLoadingSummary ? '...' : summary?.averageScore !== undefined ? summary.averageScore.toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-secondary">{t('discipline.cycles.averageHint', 'Dựa trên kết quả tính toán gần nhất')}</p>
            </div>

            <div className="bg-card/25 border border-border/10 p-3 rounded-xl space-y-1">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                {t('discipline.cycles.editStatus', 'Trạng thái chỉnh sửa')}
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-sm">
                {selectedCycleLocked ? (
                  <>
                    <AlertTriangle size={16} className="text-purple-500 shrink-0" />
                    <span className="text-purple-600 dark:text-purple-400">
                      {t('discipline.cycles.lockedData', 'Đã khóa dữ liệu')}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                    <span className="text-green-600 dark:text-green-400">
                      {t('discipline.cycles.canEdit', 'Cho phép chỉnh sửa')}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-secondary">
                {selectedCycleLocked
                  ? t('discipline.cycles.viewOnly', 'Chỉ xem dữ liệu, không thể sửa đổi')
                  : t('discipline.cycles.canScore', 'Cán bộ có quyền có thể ghi điểm/minh chứng')}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="relative w-full">
        <div className="rounded-2xl border border-border/20 bg-card/30 p-1">
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 xl:grid-cols-5">
            {tabs.map(({ id, label, icon: Icon }) => {
              const isLocked = !selectedCycleId && id !== 'guide' && id !== 'cycles' && id !== 'criteria';

              return (
                <button
                  key={id}
                  onClick={() => (id === 'guide' || id === 'cycles' || id === 'criteria' || selectedCycleId) && setInnerTab(id)}
                  disabled={isLocked}
                  className={`flex min-h-10 w-full items-center justify-start gap-2 rounded-xl border px-2 py-1 text-left text-xs font-semibold transition-all outline-none ${
                    isLocked
                      ? 'cursor-not-allowed border-transparent bg-muted/20 text-secondary opacity-60'
                      : innerTab === id
                        ? 'border-border/70 bg-background text-primary'
                        : 'border-transparent bg-transparent text-secondary hover:border-border/30 hover:bg-muted/30 hover:text-foreground'
                  }`}
                >
                  <Icon size={14} className="shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-1 transition-all">
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
        {innerTab === 'criteria' && <EvaluationCriteriaPanel authToken={authToken} currentUser={currentUser} cycleId={selectedCycleId} />}

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
                refreshSelectedCycleSummary().catch(console.error);
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
          <div className="flex flex-col items-center justify-center p-6 bg-card border border-border/30 rounded-2xl text-center space-y-3">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-600 rounded-full">
              <AlertTriangle size={32} />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-foreground">
                {t('discipline.cycles.noCycleSelected', 'Chưa chọn chu kỳ đánh giá')}
              </h4>
              <p className="text-sm text-secondary max-w-sm">
                {t(
                  'discipline.cycles.noCycleSelectedHint',
                  'Vui lòng chọn một chu kỳ từ danh sách thả xuống ở phía trên hoặc chuyển sang tab "Chu kỳ đánh giá" để chọn/tạo chu kỳ mới.'
                )}
              </p>
            </div>
            <button
              onClick={() => setInnerTab('cycles')}
              className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-sm"
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
