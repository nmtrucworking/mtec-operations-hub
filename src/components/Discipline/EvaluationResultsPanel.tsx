import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Loader2, 
  AlertTriangle,
  Play,
  RotateCw,
  Eye,
  CheckCircle,
  TrendingUp,
  Award,
  Calendar
} from 'lucide-react';
import { UserAccount, UserRole } from '../../types/app';
import { Member } from '../../data/members';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { Badge } from '../ui/badge';
import { Modal } from '../ui/modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useToast } from '../ui/toast';
import { useTranslation } from 'react-i18next';
import { downloadFileWithAuth } from '../../lib/helpers';
import { 
  MemberEvaluation, 
  MemberEvaluationBreakdown,
  MemberCycleRole,
  EvaluationCycle, 
  getEvaluationMemberResults, 
  getEvaluationMemberBreakdowns,
  getMemberCycleRoles,
  getEvaluationCycleSummaryFresh,
  computeEvaluationCycle,
  computeEvaluationMember,
  getEvaluationComputeJob,
  cancelEvaluationComputeJob,
  EvaluationComputeJob,
  exportMemberEvaluationReportUrl,
  validateEvaluationCycleData
} from '../../services/evaluations';
import { EVALUATION_CLASSIFICATIONS, EVALUATION_UNIT_CODES } from '../../data/evaluations';
import { ConfirmModal } from '../ui/ConfirmModal';

interface EvaluationResultsPanelProps {
  authToken?: string;
  currentUser: UserAccount;
  cycleId: string;
  cycle: EvaluationCycle;
  allMembers: Member[];
  onComputeComplete?: () => void;
}

export const EvaluationResultsPanel = ({ 
  authToken, 
  currentUser, 
  cycleId, 
  cycle, 
  allMembers,
  onComputeComplete
}: EvaluationResultsPanelProps) => {
  const { success, error, warning } = useToast();
  const { t } = useTranslation();
  const [results, setResults] = useState<MemberEvaluation[]>([]);
  const [cycleRoles, setCycleRoles] = useState<MemberCycleRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComputing, setIsComputing] = useState(false);
  const [computeModalOpen, setComputeModalOpen] = useState(false);
  const [computeProgress, setComputeProgress] = useState(0);
  const [computeTotal, setComputeTotal] = useState<number | null>(null);
  const computeTotalRef = useRef<number | null>(null);
  const [computeLogs, setComputeLogs] = useState<string[]>([]);
  const [computeStartedAt, setComputeStartedAt] = useState<number | null>(null);
  const [computeElapsedSeconds, setComputeElapsedSeconds] = useState(0);
  const [computingMemberId, setComputingMemberId] = useState<string | null>(null);
  const [isConfirmComputeOpen, setIsConfirmComputeOpen] = useState(false);
  const [computeJobId, setComputeJobId] = useState<string | null>(null);
  const computeAbortControllerRef = useRef<AbortController | null>(null);
  const computePollTimerRef = useRef<number | null>(null);

  // Breakdown Modal state
  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedResult, setSelectedResult] = useState<MemberEvaluation | null>(null);
  const [breakdowns, setBreakdowns] = useState<MemberEvaluationBreakdown[]>([]);
  const [isLoadingBreakdowns, setIsLoadingBreakdowns] = useState(false);

  // Validation Report state
  const [validationReportOpen, setValidationReportOpen] = useState(false);
  const [validationReport, setValidationReport] = useState<any | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const resultsRequestSeqRef = useRef(0);
  const rolesRequestSeqRef = useRef(0);
  const breakdownRequestSeqRef = useRef(0);

  // Filters
  const [filterUnit, setFilterUnit] = useState('');
  const [filterClassification, setFilterClassification] = useState('');

  const fetchResultsList = async (fresh = false) => {
    const requestSeq = ++resultsRequestSeqRef.current;
    setIsLoading(true);
    try {
      const params: any = { pageSize: 1000 };
      if (filterUnit) params.unitCode = filterUnit;
      if (filterClassification) params.classification = filterClassification;

      const res = await getEvaluationMemberResults(cycleId, params, authToken, { noCache: fresh });
      if (requestSeq !== resultsRequestSeqRef.current) {
        return;
      }

      if (res?.data?.items) {
        setResults(res.data.items);
      } else if (res?.error) {
        error(res.error, 'Lỗi tải kết quả');
      }
    } catch (err) {
      console.error(err);
      error('Đã xảy ra lỗi khi tải danh sách kết quả.', 'Lỗi tải kết quả');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setResults([]);
    setCycleRoles([]);
    fetchResultsList();
  }, [authToken, cycleId, filterUnit, filterClassification]);

  useEffect(() => {
    setCycleRoles([]);
    const requestSeq = ++rolesRequestSeqRef.current;
    const fetchCycleRoles = async () => {
      try {
        const res = await getMemberCycleRoles(cycleId, { pageSize: 1000 }, authToken);
        if (requestSeq !== rolesRequestSeqRef.current) {
          return;
        }

        if (res?.data?.items) {
          setCycleRoles(res.data.items);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchCycleRoles();
  }, [authToken, cycleId]);

  // Create member mapping
  const memberMap = useMemo(() => {
    return new Map(allMembers.map(m => [m.id, m]));
  }, [allMembers]);

  // Helper check roles
  const hasRole = (allowedRoles: UserRole[]) => {
    if (currentUser.roles && currentUser.roles.length > 0) {
      return currentUser.roles.some(r => allowedRoles.includes(r));
    }
    return allowedRoles.includes(currentUser.role);
  };

  const isLocked = cycle.status === 'LOCKED';
  const canCompute = hasRole(['bcn', 'bvh_discipline', 'bvh_hr']) && !isLocked;
  const computePercent = computeTotal && computeTotal > 0
    ? Math.min(100, Math.round((computeProgress / computeTotal) * 100))
    : computeProgress > 0 ? 50 : 0;
  const showComputeProgressButton = canCompute && !computeModalOpen && (isComputing || computeLogs.length > 0);
  const computeStatusText = isComputing
    ? 'Backend đang xử lý dữ liệu và tính lại điểm chu kỳ...'
    : computeProgress > 0
      ? 'Kết quả đã được tính xong, đang tải lại dữ liệu hiển thị...'
      : 'Chưa bắt đầu tính toán.';

  const formatElapsed = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remain = seconds % 60;
    if (minutes <= 0) {
      return `${remain}s`;
    }
    return `${minutes}m ${remain.toString().padStart(2, '0')}s`;
  };

  const stopComputePolling = () => {
    if (computePollTimerRef.current) {
      window.clearInterval(computePollTimerRef.current);
      computePollTimerRef.current = null;
    }
  };

  const resetComputeRuntime = () => {
    stopComputePolling();
    computeAbortControllerRef.current = null;
    setIsComputing(false);
  };

  const applyComputeJobStatus = (job: EvaluationComputeJob) => {
    setComputeJobId(job.jobId);
    setComputeProgress(job.processedMembers ?? 0);
    setComputeTotal(job.totalMembers || null);
    computeTotalRef.current = job.totalMembers || computeTotalRef.current;
    if (Array.isArray(job.logs) && job.logs.length > 0) {
      setComputeLogs(job.logs.slice(-20));
    }
  };

  const waitForJobPoll = (ms: number, signal: AbortSignal) => (
    new Promise<void>((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }

      const timer = window.setTimeout(resolve, ms);
      signal.addEventListener(
        'abort',
        () => {
          window.clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        },
        { once: true }
      );
    })
  );

  const waitForComputeJob = async (jobId: string, abortController: AbortController) => {
    while (!abortController.signal.aborted) {
      await waitForJobPoll(5000, abortController.signal);
      const jobRes = await getEvaluationComputeJob(cycleId, jobId, authToken, {
        signal: abortController.signal,
      });
      if (jobRes.error || !jobRes.data) {
        throw new Error(jobRes.error || 'Không thể tải trạng thái job tính điểm.');
      }

      applyComputeJobStatus(jobRes.data);
      if (['SUCCEEDED', 'FAILED', 'CANCELLED'].includes(jobRes.data.status)) {
        return jobRes.data;
      }
    }

    throw new DOMException('Aborted', 'AbortError');
  };

  const handleCancelCompute = async () => {
    if (!isComputing && !computeAbortControllerRef.current) {
      return;
    }

    const currentJobId = computeJobId;
    if (currentJobId) {
      try {
        const cancelRes = await cancelEvaluationComputeJob(cycleId, currentJobId, authToken);
        if (cancelRes.data) {
          applyComputeJobStatus(cancelRes.data);
        }
      } catch (cancelError) {
        console.error('Cancel compute job failed:', cancelError);
      }
    }

    computeAbortControllerRef.current?.abort();
    stopComputePolling();
    setComputeLogs((prev) => [
      ...prev,
      currentJobId
        ? 'Đã gửi yêu cầu hủy tới backend.'
        : 'Đã hủy yêu cầu ở phía trình duyệt.',
    ]);
    setIsComputing(false);
    warning(
      currentJobId
        ? 'Đã gửi yêu cầu hủy tới backend. Job sẽ dừng sau member đang xử lý hiện tại.'
        : 'Đã hủy yêu cầu trên trình duyệt.',
      'Đã hủy tiến trình'
    );
  };

  const handleValidateCycleData = async () => {
    setIsValidating(true);
    try {
      const res = await validateEvaluationCycleData(cycleId, { evidenceMode: 'approval', strict: true }, authToken);
      if (res?.error) {
        if (res.status === 422 && res.data?.detail && res.data.detail.code === 'EVALUATION_VALIDATION_ERROR') {
          setValidationReport(res.data.detail.details);
          setValidationReportOpen(true);
          error(res.data.detail.message || 'Lỗi dữ liệu không hợp lệ.', 'Kiểm tra dữ liệu thất bại');
        } else {
          error(res.error || 'Lỗi không xác định khi kiểm tra dữ liệu.', 'Kiểm tra dữ liệu thất bại');
        }
      } else {
        const report = res.data;
        setValidationReport(report);
        setValidationReportOpen(true);
        if (report?.hasErrors) {
          error(`Phát hiện ${report.errorsCount} lỗi dữ liệu trong chu kỳ.`, 'Kiểm tra dữ liệu thất bại');
        } else {
          success('Dữ liệu chu kỳ hợp lệ! Sẵn sàng tính điểm.', 'Kiểm tra thành công');
        }
      }
    } catch (err) {
      console.error(err);
      error('Lỗi hệ thống khi kiểm tra dữ liệu.', 'Lỗi hệ thống');
    } finally {
      setIsValidating(false);
    }
  };

  const executeComputeCycle = async () => {
    // Open progress modal and start compute with a local elapsed-time heartbeat.
    setComputeModalOpen(true);
    setIsComputing(true);
    setComputeLogs([]);
    setComputeProgress(0);
    setComputeTotal(null);
    setComputeStartedAt(Date.now());
    setComputeElapsedSeconds(0);
    setComputeJobId(null);
    computeTotalRef.current = null;
    const abortController = new AbortController();
    computeAbortControllerRef.current = abortController;
    stopComputePolling();

    try {
      // determine expected total members from cycle summary
      try {
        const sumRes = await getEvaluationCycleSummaryFresh(cycleId, authToken, {
          signal: abortController.signal,
        });
        if (sumRes?.data?.totalMembers !== undefined) {
          setComputeTotal(sumRes.data.totalMembers);
          computeTotalRef.current = sumRes.data.totalMembers;
        }
      } catch (e) {
        // ignore summary error, we'll fallback to polling counts
      }

      setComputeLogs(['Đang gửi yêu cầu tính điểm toàn chu kỳ...']);
      const startedAt = Date.now();
      computePollTimerRef.current = window.setInterval(async () => {
        if (abortController.signal.aborted) {
          return;
        }

        const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        setComputeElapsedSeconds(elapsedSeconds);
        if (elapsedSeconds % 5 === 0) {
          setComputeLogs((prev) => [...prev.slice(-20), `Backend đang xử lý... (${elapsedSeconds}s)`]);
        }
      }, 3000);

      const res = await computeEvaluationCycle(cycleId, {}, authToken, {
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) {
        setComputeLogs((prev) => [...prev, 'Tiến trình đã được hủy.']);
        return;
      }

      if (res?.error) {
        if (res.status === 422 && res.data?.detail && res.data.detail.code === 'EVALUATION_VALIDATION_ERROR') {
          setValidationReport(res.data.detail.details);
          setValidationReportOpen(true);
          setComputeModalOpen(false); // Close progress modal
          setComputeLogs(prev => [...prev, `ERROR: ${res.data.detail.message}`]);
          error(res.data.detail.message || 'Lỗi dữ liệu không hợp lệ.', 'Kiểm tra dữ liệu thất bại');
        } else {
          setComputeLogs(prev => [...prev, `ERROR: ${res.error}`]);
          error(res.error || 'Lỗi không xác định khi tính toán kết quả.', 'Tính toán thất bại');
        }
        return;
      }

      let data: any = res.data || {};
      if (data.jobId) {
        applyComputeJobStatus(data as EvaluationComputeJob);
        setComputeLogs((prev) => [
          ...prev,
          `Backend đã nhận job ${data.jobId}. Đang theo dõi trạng thái...`,
        ]);
        const finalJob = await waitForComputeJob(data.jobId, abortController);
        data = finalJob.result || finalJob;

        if (finalJob.status === 'CANCELLED') {
          setComputeLogs((prev) => [...prev, 'Job đã được hủy. Không lưu thay đổi tính điểm.']);
          warning('Job tính điểm đã được hủy.', 'Đã hủy tiến trình');
          return;
        }

        if (finalJob.status === 'FAILED') {
          const message = finalJob.error || 'Backend không thể hoàn tất job tính điểm.';
          setComputeLogs((prev) => [...prev, `ERROR: ${message}`]);
          error(message, 'Tính toán thất bại');
          return;
        }
      }

      stopComputePolling();
      const computedMembers = Number(data.computedMembers ?? 0);
      const skippedMembers = Number(data.skippedMembers ?? 0);
      const errorsList = Array.isArray(data.errors) ? data.errors : [];

      setComputeProgress(computedMembers);
      if (computeTotalRef.current !== null && computeTotalRef.current !== undefined) {
        setComputeTotal(computeTotalRef.current);
      }
      setComputeLogs((prev) => [
        ...prev,
        `Hoàn tất tính toán cho ${computedMembers} thành viên`,
        skippedMembers > 0 ? `Bỏ qua ${skippedMembers} thành viên do lỗi dữ liệu` : 'Không có thành viên nào bị bỏ qua',
        ...errorsList.slice(0, 10).map((item: any) => `WARN ${item.memberId || 'unknown'}: ${item.message || item.code || 'Unknown error'}`),
      ]);

      // final refresh
      await fetchResultsList(true);
      if (onComputeComplete) onComputeComplete();
      if (errorsList.length > 0) {
        warning(
          `Đã tính xong nhưng có ${errorsList.length} thành viên bị lỗi hoặc bị bỏ qua. Kiểm tra log tiến trình để xử lý tiếp.`,
          'Tính điểm chu kỳ hoàn tất một phần'
        );
      } else {
        success('Đã tính toán xong kết quả chu kỳ!', 'Tính điểm chu kỳ');
      }
      setComputeLogs(prev => [...prev, 'Hoàn thành tính toán']);
    } catch (err) {
      if (abortController.signal.aborted) {
        setComputeLogs((prev) => [...prev, 'Tiến trình đã được hủy trước khi hoàn tất.']);
        return;
      }
      console.error(err);
      setComputeLogs(prev => [...prev, `Lỗi hệ thống: ${String(err)}`]);
      error('Lỗi kết nối khi tính toán kết quả.', 'Lỗi hệ thống');
    } finally {
      stopComputePolling();
      if (computeStartedAt) {
        setComputeElapsedSeconds(Math.max(1, Math.round((Date.now() - computeStartedAt) / 1000)));
      }
      resetComputeRuntime();
      // leave modal open so user can review progress; provide a close button
    }
  };

  const handleComputeMember = async (memberId: string, memberName: string) => {
    setComputingMemberId(memberId);
    try {
      const res = await computeEvaluationMember(cycleId, memberId, {}, authToken);
      if (!res.error) {
        success(`Đã tính toán xong kết quả cho thành viên ${memberName}!`, 'Tính điểm thành viên');
        await fetchResultsList(true);
        if (onComputeComplete) onComputeComplete();
      } else {
        error(res.error || 'Lỗi không xác định.', 'Tính toán thất bại');
      }
    } catch (err) {
      console.error(err);
      error('Lỗi kết nối hệ thống.', 'Lỗi hệ thống');
    } finally {
      setComputingMemberId(null);
    }
  };

  const handleOpenBreakdown = async (result: MemberEvaluation, member: Member) => {
    const requestSeq = ++breakdownRequestSeqRef.current;
    setSelectedMember(member);
    setSelectedResult(result);
    setBreakdowns([]);
    setBreakdownModalOpen(true);
    setIsLoadingBreakdowns(true);

    try {
      const res = await getEvaluationMemberBreakdowns(cycleId, member.id, authToken);
      if (requestSeq !== breakdownRequestSeqRef.current) {
        return;
      }

      if (res?.data?.items) {
        setBreakdowns(res.data.items);
      } else if (res?.error) {
        error(res.error, 'Lỗi tải breakdown');
      }
    } catch (err) {
      console.error(err);
      error('Lỗi hệ thống khi tải chi tiết điểm.', 'Lỗi tải breakdown');
    } finally {
      if (requestSeq === breakdownRequestSeqRef.current) {
        setIsLoadingBreakdowns(false);
      }
    }
  };

  const visibleBreakdowns = useMemo(() => {
    if (!selectedMember) {
      return breakdowns;
    }

    const memberUnitCodes = new Set(
      cycleRoles
        .filter(role => role.memberId === selectedMember.id)
        .map(role => role.unitCode)
    );

    return breakdowns.filter(bd => {
      if (bd.component !== 'III_B') {
        return true;
      }

      return Boolean(bd.unitCode && memberUnitCodes.has(bd.unitCode));
    });
  }, [breakdowns, cycleRoles, selectedMember]);

  const handleDownloadMemberReport = async () => {
    if (!selectedMember || !selectedResult) {
      return;
    }

    const url = exportMemberEvaluationReportUrl(cycleId, selectedMember.id);
    const filename = `Phieu_danh_gia_${selectedMember.name.replace(/\s+/g, '_')}_${selectedMember.mssv}.docx`;

    if (authToken) {
      const ok = await downloadFileWithAuth(url, authToken, filename);
      if (!ok) {
        error('Không thể tải phiếu đánh giá. Vui lòng thử lại sau.', 'Tải phiếu đánh giá thất bại');
      }
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getClassificationBadge = (classification?: string | null) => {
    if (!classification) return <Badge variant="outline" className="text-gray-500">Chưa xếp loại</Badge>;
    switch (classification) {
      case 'EXCELLENT':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold border-0">Xuất sắc</Badge>;
      case 'GOOD':
        return <Badge className="bg-green-600 hover:bg-green-700 text-white font-bold border-0">Tốt</Badge>;
      case 'PASSED':
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold border-0">Đạt</Badge>;
      case 'NEEDS_IMPROVEMENT':
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-bold border-0">Cần cải thiện</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-600 hover:bg-red-700 text-white font-bold border-0">Không đạt</Badge>;
      default:
        return <Badge variant="outline">{classification}</Badge>;
    }
  };


  const getComponentLabel = (component: string) => {
    switch (component) {
      case 'I': return 'Chuyên cần';
      case 'II': return 'Thái độ';
      case 'III_A': return 'Hiệu suất chung';
      case 'III_B': return 'Hiệu suất chuyên môn';
      default: return component;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {isLocked && (
        <div className="bg-purple-50 border border-purple-200 text-purple-700 dark:bg-purple-950/20 dark:border-purple-900 dark:text-purple-400 p-4 rounded-xl flex items-start gap-2.5">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Chu kỳ đã khóa</h4>
            <p className="text-sm mt-0.5">Dữ liệu kết quả đã khóa cố định. Nút tính toán (Compute) bị vô hiệu hóa.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-transparent border-0 py-1">
        <div>
          <h3 className="text-lg font-bold text-foreground">Kết quả & Phân loại</h3>
          <p className="text-sm text-secondary mt-1">Tính toán điểm trung bình chu kỳ và xếp loại thành viên theo thuật toán v2.</p>
        </div>
        {canCompute && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {showComputeProgressButton && (
              <Button
                variant="outline"
                onClick={() => setComputeModalOpen(true)}
                className="flex items-center gap-2 rounded-xl border-primary/30 text-primary bg-primary/5 hover:bg-primary/10"
              >
                {isComputing ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                {isComputing ? `Hiển thị tiến trình ${computePercent}%` : 'Xem tiến trình gần nhất'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleValidateCycleData}
              disabled={isComputing || isValidating}
              className="flex items-center gap-2 rounded-xl border-orange-200 text-orange-600 bg-orange-50/50 hover:bg-orange-50 hover:text-orange-700 h-10"
            >
              {isValidating ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
              Kiểm tra dữ liệu
            </Button>
            <Button
              onClick={() => setIsConfirmComputeOpen(true)}
              disabled={isComputing}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-focus hover:opacity-95 text-white rounded-xl shadow-md border-0 h-10"
            >
              {isComputing ? <Loader2 size={16} className="animate-spin mr-1" /> : <Play size={16} />}
              Chạy tính điểm toàn chu kỳ
            </Button>
          </div>
        )}
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end py-2 bg-transparent border-0">
        <div>
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Lọc theo Ban</label>
          <Select 
            value={filterUnit} 
            onChange={e => setFilterUnit(e.target.value)}
            className="w-full rounded-xl border border-border/40"
          >
            <option value="">-- Tất cả các Ban --</option>
            {EVALUATION_UNIT_CODES.map(u => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Lọc theo Xếp loại</label>
          <Select 
            value={filterClassification} 
            onChange={e => setFilterClassification(e.target.value)}
            className="w-full rounded-xl border border-border/40"
          >
            <option value="">-- Tất cả phân loại --</option>
            {EVALUATION_CLASSIFICATIONS.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
        </div>
        <div className="flex items-end">
          <Button 
            variant="outline" 
            className="w-full rounded-xl border-border/40 hover:bg-muted"
            onClick={() => {
              setFilterUnit('');
              setFilterClassification('');
            }}
          >
            Xóa bộ lọc
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card/45 border border-border/30 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 size={28} className="animate-spin text-primary mr-2" />
            <span className="text-secondary font-medium">Đang tải danh sách kết quả...</span>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center p-6 text-secondary font-medium">
            Chưa có kết quả tính điểm. Vui lòng bấm "Chạy tính điểm toàn chu kỳ" để tạo điểm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-sm">Thành viên</TableHead>
                  <TableHead className="font-semibold text-center text-sm">Điểm I</TableHead>
                  <TableHead className="font-semibold text-center text-sm">Điểm II</TableHead>
                  <TableHead className="font-semibold text-center text-sm">Điểm III-A</TableHead>
                  <TableHead className="font-semibold text-center text-sm">Điểm III-B</TableHead>
                  <TableHead className="font-semibold text-center text-sm">Tổng điểm</TableHead>
                  <TableHead className="font-semibold text-center text-sm">Xếp loại</TableHead>
                  <TableHead className="font-semibold text-center text-sm">Trạng thái</TableHead>
                  <TableHead className="text-right font-semibold text-sm">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((res) => {
                  const m = memberMap.get(res.memberId);
                  const memberName = m ? m.name : 'Không rõ';
                  const isSingleComputing = computingMemberId === res.memberId;
                  return (
                    <TableRow key={res.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell>
                        <div className="font-bold text-foreground">{memberName}</div>
                        <div className="text-xs text-secondary">{m?.mssv || res.memberId}</div>
                      </TableCell>
                      <TableCell className="text-center font-semibold text-secondary-foreground">{res.componentIScore}</TableCell>
                      <TableCell className="text-center font-semibold text-secondary-foreground">{res.componentIIScore}</TableCell>
                      <TableCell className="text-center font-semibold text-secondary-foreground">{res.componentIIiAScore}</TableCell>
                      <TableCell className="text-center font-semibold text-secondary-foreground">{res.componentIIiBScore}</TableCell>
                      <TableCell className="text-center font-black text-primary text-sm">{Number(res.totalScore ?? 0).toFixed(2)}</TableCell>
                      <TableCell className="text-center">{getClassificationBadge(res.finalClassification)}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-xs text-secondary font-medium">{res.status}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-lg text-sm py-1 px-2 h-8 flex items-center gap-1 text-primary border-primary/20 hover:bg-primary/5"
                            onClick={() => m && handleOpenBreakdown(res, m)}
                          >
                            <Eye size={13} /> Chi tiết
                          </Button>
                          {canCompute && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              disabled={isSingleComputing}
                              className="rounded-lg text-sm py-1 px-2 h-8 flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => m && handleComputeMember(res.memberId, m.name)}
                            >
                              {isSingleComputing ? (
                                <Loader2 size={13} className="animate-spin text-green-600" />
                              ) : (
                                <RotateCw size={13} />
                              )}
                              Tải lại
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Breakdown Modal */}
      {selectedMember && selectedResult && (
        <Modal 
          isOpen={breakdownModalOpen} 
          onClose={() => setBreakdownModalOpen(false)} 
          title={`Chi tiết điểm số: ${selectedMember.name}`}
        >
          <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
            {/* Header info */}
            <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl border border-border/40 text-sm">
              <div>
                <span className="text-secondary text-xs block">Thành viên:</span>
                <span className="font-bold text-foreground">{selectedMember.name} ({selectedMember.mssv})</span>
              </div>
              <div>
                <span className="text-secondary text-xs block">Xếp loại chu kỳ:</span>
                <span className="font-bold text-foreground flex items-center gap-1.5 mt-0.5">
                  {getClassificationBadge(selectedResult.finalClassification)}
                  <span className="text-xs text-secondary">(Tổng điểm: {Number(selectedResult.totalScore ?? 0).toFixed(2)})</span>
                </span>
              </div>
            </div>

            <h4 className="font-bold text-foreground text-sm flex items-center gap-2 border-b border-border pb-1.5 mt-4">
              <TrendingUp size={16} className="text-primary" /> Điểm Breakdown theo Tiêu chí
            </h4>

            {isLoadingBreakdowns ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 size={24} className="animate-spin text-primary mr-2" />
                <span className="text-secondary text-sm">Đang tải bảng điểm chi tiết...</span>
              </div>
            ) : visibleBreakdowns.length === 0 ? (
              <div className="text-center p-8 text-secondary text-sm">
                Không tìm thấy dữ liệu điểm chi tiết tiêu chí của thành viên này.
              </div>
            ) : (
              <div className="border border-border/50 rounded-xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-semibold text-xs py-2">Tiêu chí</TableHead>
                      <TableHead className="font-semibold text-xs py-2">Phần</TableHead>
                      <TableHead className="font-semibold text-xs py-2 text-center">Điểm gốc</TableHead>
                      <TableHead className="font-semibold text-xs py-2 text-center">Điểm chốt</TableHead>
                      <TableHead className="font-semibold text-xs py-2 text-center">Tối đa</TableHead>
                      <TableHead className="font-semibold text-xs py-2">Ghi chú tính toán</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleBreakdowns.map(bd => (
                      <TableRow key={bd.id} className="hover:bg-muted/30">
                        <TableCell className="py-2.5">
                          <span className="font-bold text-foreground block text-sm">{bd.criterionCode}</span>
                        </TableCell>
                        <TableCell className="py-2.5 text-xs font-semibold">{getComponentLabel(bd.component)}</TableCell>
                        <TableCell className="py-2.5 text-center font-medium text-xs text-secondary-foreground">{bd.rawScore}</TableCell>
                        <TableCell className="py-2.5 text-center font-black text-xs text-primary">{bd.finalScore}</TableCell>
                        <TableCell className="py-2.5 text-center font-medium text-xs text-secondary">{bd.maxScoreSnapshot}</TableCell>
                        <TableCell className="py-2.5 text-xs text-secondary max-w-[200px] truncate" title={bd.calculationNote || ''}>
                          {bd.calculationNote || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={handleDownloadMemberReport}
              >
                <Award size={16} className="mr-2" />
                {t('common.downloadEvaluationReport')}
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => setBreakdownModalOpen(false)}>Đóng</Button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmModal
        isOpen={isConfirmComputeOpen}
        onClose={() => setIsConfirmComputeOpen(false)}
        onConfirm={executeComputeCycle}
        title="Xác nhận tính toán"
        message="Xác nhận tính toán kết quả đánh giá cho toàn bộ thành viên trong chu kỳ này?"
      />

      {/* Compute Progress Modal */}
      <Modal
        isOpen={computeModalOpen}
        onClose={() => setComputeModalOpen(false)}
        title="Tiến trình tính điểm"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-foreground">{computeStatusText}</div>
              <div className="text-xs text-secondary whitespace-nowrap">
                Thời gian: {formatElapsed(computeElapsedSeconds)}
              </div>
            </div>
            <div className="text-xs text-secondary">
              Cửa sổ sẽ tự cập nhật khi có tiến độ mới. Nếu đóng lúc đang chạy, bạn vẫn có thể mở lại bằng nút Hiển thị tiến trình.
            </div>
          </div>

          <div className="w-full bg-muted/20 rounded-xl h-3 overflow-hidden border border-border/20">
            <div
              className="h-3 bg-primary"
              style={{ width: `${computePercent}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-secondary">
            <div>Đã xử lý: {computeProgress}{computeTotal ? ` / ${computeTotal}` : ''}</div>
            <div>Tiến độ: {computePercent}%</div>
          </div>

          <div className="h-32 overflow-y-auto bg-card/30 border border-border/20 rounded-md p-2 text-xs font-mono">
            {computeLogs.length === 0 ? (
              <div className="text-secondary">Chưa có nhật ký tiến trình.</div>
            ) : (
              computeLogs.map((l, i) => <div key={i} className="py-0.5">{l}</div>)
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={handleCancelCompute}
              disabled={!isComputing}
            >
              {isComputing ? 'Hủy tiến trình' : 'Không có tiến trình đang chạy'}
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => setComputeModalOpen(false)}>
              {isComputing ? 'Ẩn tiến trình' : 'Đóng'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Validation Report Modal */}
      {validationReport && (
        <Modal
          isOpen={validationReportOpen}
          onClose={() => setValidationReportOpen(false)}
          title="Kết quả kiểm tra dữ liệu chu kỳ"
        >
          <div className="space-y-4 pt-2 max-h-[60vh] overflow-y-auto pr-1">
            {validationReport.hasErrors ? (
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                Phát hiện {validationReport.errorsCount} lỗi dữ liệu trong chu kỳ. Vui lòng khắc phục trước khi tính điểm:
              </p>
            ) : (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                Không phát hiện lỗi dữ liệu nào. Dữ liệu hợp lệ để tính điểm!
              </p>
            )}

            {validationReport.issues && validationReport.issues.length > 0 && (
              <div className="space-y-3">
                {validationReport.issues.map((issue: any, index: number) => (
                  <div key={index} className="p-3 bg-card border border-border/60 rounded-xl space-y-1.5 shadow-sm">
                    <div className="font-bold text-sm text-foreground flex justify-between">
                      <span>{issue.name || 'Thành viên'} {issue.mssv ? `(${issue.mssv})` : ''}</span>
                      <span className="text-xs text-secondary font-mono">{issue.memberId?.slice(0, 8)}</span>
                    </div>
                    <div className="space-y-1 pl-2.5 border-l-2 border-primary/45">
                      {issue.errors?.map((err: any, idx: number) => (
                        <p key={idx} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1">
                          <span className="font-bold shrink-0">• [Lỗi] {err.code}:</span>
                          <span>{err.message}</span>
                        </p>
                      ))}
                      {issue.warnings?.map((warn: any, idx: number) => (
                        <p key={idx} className="text-xs text-yellow-600 dark:text-yellow-500 flex items-start gap-1">
                          <span className="font-bold shrink-0">• [Cảnh báo] {warn.code}:</span>
                          <span>{warn.message}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button variant="outline" className="rounded-xl" onClick={() => setValidationReportOpen(false)}>Đóng</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EvaluationResultsPanel;
