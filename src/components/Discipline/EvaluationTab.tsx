import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Scale, 
  Users, 
  Award, 
  FileCheck, 
  BarChart3, 
  RefreshCw, 
  MessageSquare,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { UserAccount } from '../../types/app';
import { Member } from '../../data/members';
import { 
  EvaluationCycle, 
  getEvaluationCycles, 
  getEvaluationCycleSummary, 
  EvaluationCycleSummary 
} from '../../services/evaluations';

// Subcomponents (we will create these next)
import EvaluationCyclesPanel from './EvaluationCyclesPanel';
import EvaluationCriteriaPanel from './EvaluationCriteriaPanel';
import EvaluationMemberRolesPanel from './EvaluationMemberRolesPanel';
import EvaluationScoreEventsPanel from './EvaluationScoreEventsPanel';
import EvaluationEvidencePanel from './EvaluationEvidencePanel';
import EvaluationResultsPanel from './EvaluationResultsPanel';
import EvaluationSyncPanel from './EvaluationSyncPanel';
import EvaluationAppealsPanel from './EvaluationAppealsPanel';
import EvaluationGuidePanel from './EvaluationGuidePanel';

interface EvaluationTabProps {
  authToken?: string;
  currentUser: UserAccount;
  allMembers: Member[];
}

type InnerTabType = 'guide' | 'cycles' | 'criteria' | 'roles' | 'events' | 'evidence' | 'results' | 'sync' | 'appeals';

export const EvaluationTab = ({ authToken, currentUser, allMembers }: EvaluationTabProps) => {
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<EvaluationCycle | null>(null);
  const [innerTab, setInnerTab] = useState<InnerTabType>('guide');
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [summary, setSummary] = useState<EvaluationCycleSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Load all cycles to pass down or use in selector
  const fetchCycles = async () => {
    try {
      const res = await getEvaluationCycles({ pageSize: 100 }, authToken);
      if (res?.data?.items) {
        setCycles(res.data.items);
        // If there's a selected cycle, update it
        if (selectedCycleId) {
          const updated = res.data.items.find(c => c.id === selectedCycleId);
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

  // Load summary for selected cycle
  useEffect(() => {
    const fetchSummary = async () => {
      if (!selectedCycleId) {
        setSummary(null);
        return;
      }
      setIsLoadingSummary(true);
      try {
        const res = await getEvaluationCycleSummary(selectedCycleId, authToken);
        if (res?.data) {
          setSummary(res.data);
        }
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
      case 'DRAFT': return 'Bản nháp';
      case 'MEMBER_REVIEW': return 'Đang rà soát';
      case 'APPROVED': return 'Đã duyệt';
      case 'LOCKED': return 'Đã khóa';
      case 'CANCELLED': return 'Đã hủy';
      default: return status || '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Cycle Selector & Quick Summary Banner */}
      <div className="bg-card/40 backdrop-blur-sm border border-border/30 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">Đánh giá Định kỳ thành viên</h3>
            <p className="text-sm text-secondary">
              Thiết lập chu kỳ đánh giá hiệu suất, chuyên cần, kỷ luật và năng lực chuyên môn của thành viên.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="text-sm font-semibold text-secondary-foreground whitespace-nowrap">Chọn Chu kỳ:</label>
            <select
              value={selectedCycleId || ''}
              onChange={(e) => {
                const found = cycles.find(c => c.id === e.target.value);
                handleCycleSelect(found || null);
              }}
              className="flex-1 md:w-64 rounded-xl border border-border/40 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
            >
              <option value="">-- Chọn chu kỳ đánh giá --</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedCycle && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border/20">
            <div className="bg-card/25 border border-border/15 p-4 rounded-xl space-y-1.5 shadow-sm/5">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Thông tin chu kỳ</span>
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
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Số thành viên tham gia</span>
              <div className="text-2xl font-black text-foreground">
                {isLoadingSummary ? '...' : summary?.totalMembers ?? 0}
              </div>
              <p className="text-xs text-secondary">Đã gán vai trò trong chu kỳ này</p>
            </div>

            <div className="bg-card/25 border border-border/15 p-4 rounded-xl space-y-1.5 shadow-sm/5">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Điểm trung bình chu kỳ</span>
              <div className="text-2xl font-black text-primary">
                {isLoadingSummary ? '...' : (summary?.averageScore !== undefined ? summary.averageScore.toFixed(2) : '0.00')}
              </div>
              <p className="text-xs text-secondary">Dựa trên kết quả tính toán gần nhất</p>
            </div>

            <div className="bg-card/25 border border-border/15 p-4 rounded-xl space-y-1.5 shadow-sm/5">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Trạng thái chỉnh sửa</span>
              <div className="flex items-center gap-1.5 font-bold text-sm">
                {selectedCycle.status === 'LOCKED' ? (
                  <>
                    <AlertTriangle size={16} className="text-purple-500 shrink-0" />
                    <span className="text-purple-600 dark:text-purple-400">Đã khóa dữ liệu</span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                    <span className="text-green-600 dark:text-green-400">Cho phép chỉnh sửa</span>
                  </>
                )}
              </div>
              <p className="text-xs text-secondary">
                {selectedCycle.status === 'LOCKED' 
                  ? 'Chỉ xem dữ liệu, không thể sửa đổi' 
                  : 'Cán bộ có quyền có thể ghi điểm/minh chứng'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Submodule Navigation */}
      <div className="flex space-x-1 border-b border-border/60 overflow-x-auto no-scrollbar w-full">
        <button
          onClick={() => setInnerTab('guide')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
            innerTab === 'guide'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary hover:text-foreground hover:border-border'
          }`}
        >
          <BookOpen size={16} />
          Quy định
        </button>

        <button
          onClick={() => setInnerTab('cycles')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
            innerTab === 'cycles'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary hover:text-foreground hover:border-border'
          }`}
        >
          <ClipboardCheck size={16} />
          Chu kỳ đánh giá
        </button>

        <button
          onClick={() => setInnerTab('criteria')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
            innerTab === 'criteria'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary hover:text-foreground hover:border-border'
          }`}
        >
          <Scale size={16} />
          Tiêu chí đánh giá
        </button>

        {/* The following tabs require a cycle to be selected */}
        <button
          onClick={() => selectedCycleId && setInnerTab('roles')}
          disabled={!selectedCycleId}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
            !selectedCycleId 
              ? 'opacity-40 cursor-not-allowed text-secondary border-transparent'
              : innerTab === 'roles'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-foreground hover:border-border'
          }`}
        >
          <Users size={16} />
          Vai trò thành viên
        </button>

        <button
          onClick={() => selectedCycleId && setInnerTab('events')}
          disabled={!selectedCycleId}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
            !selectedCycleId 
              ? 'opacity-40 cursor-not-allowed text-secondary border-transparent'
              : innerTab === 'events'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-foreground hover:border-border'
          }`}
        >
          <Award size={16} />
          Sự kiện điểm
        </button>

        <button
          onClick={() => selectedCycleId && setInnerTab('evidence')}
          disabled={!selectedCycleId}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
            !selectedCycleId 
              ? 'opacity-40 cursor-not-allowed text-secondary border-transparent'
              : innerTab === 'evidence'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-foreground hover:border-border'
          }`}
        >
          <FileCheck size={16} />
          Minh chứng
        </button>

        <button
          onClick={() => selectedCycleId && setInnerTab('results')}
          disabled={!selectedCycleId}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
            !selectedCycleId 
              ? 'opacity-40 cursor-not-allowed text-secondary border-transparent'
              : innerTab === 'results'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-foreground hover:border-border'
          }`}
        >
          <BarChart3 size={16} />
          Kết quả & Xếp loại
        </button>

        <button
          onClick={() => selectedCycleId && setInnerTab('sync')}
          disabled={!selectedCycleId}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
            !selectedCycleId 
              ? 'opacity-40 cursor-not-allowed text-secondary border-transparent'
              : innerTab === 'sync'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-foreground hover:border-border'
          }`}
        >
          <RefreshCw size={16} />
          Đồng bộ dữ liệu
        </button>

        <button
          onClick={() => selectedCycleId && setInnerTab('appeals')}
          disabled={!selectedCycleId}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
            !selectedCycleId 
              ? 'opacity-40 cursor-not-allowed text-secondary border-transparent'
              : innerTab === 'appeals'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-foreground hover:border-border'
          }`}
        >
          <MessageSquare size={16} />
          Khiếu nại
        </button>
      </div>

      {/* Render Panel according to tab */}
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

        {innerTab === 'criteria' && (
          <EvaluationCriteriaPanel
            authToken={authToken}
            currentUser={currentUser}
          />
        )}

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

            {innerTab === 'results' && (
              <EvaluationResultsPanel
                authToken={authToken}
                currentUser={currentUser}
                cycleId={selectedCycleId}
                cycle={selectedCycle}
                allMembers={allMembers}
                onComputeComplete={() => {
                  // Reload cycle summary
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
              <h4 className="text-lg font-bold text-foreground">Chưa chọn chu kỳ đánh giá</h4>
              <p className="text-sm text-secondary max-w-md">
                Vui lòng chọn một chu kỳ từ danh sách thả xuống ở phía trên hoặc chuyển sang tab "Chu kỳ đánh giá" để chọn/tạo chu kỳ mới.
              </p>
            </div>
            <button
              onClick={() => setInnerTab('cycles')}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-sm text-sm"
            >
              <span>Xem danh sách chu kỳ</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationTab;
