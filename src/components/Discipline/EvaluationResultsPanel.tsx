import React, { useState, useEffect, useMemo } from 'react';
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
  EvaluationCycle, 
  getEvaluationMemberResults, 
  getEvaluationMemberBreakdowns,
  computeEvaluationCycle,
  computeEvaluationMember,
  exportMemberEvaluationReportUrl
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
  const [isLoading, setIsLoading] = useState(false);
  const [isComputing, setIsComputing] = useState(false);
  const [computingMemberId, setComputingMemberId] = useState<string | null>(null);
  const [isConfirmComputeOpen, setIsConfirmComputeOpen] = useState(false);

  // Breakdown Modal state
  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedResult, setSelectedResult] = useState<MemberEvaluation | null>(null);
  const [breakdowns, setBreakdowns] = useState<MemberEvaluationBreakdown[]>([]);
  const [isLoadingBreakdowns, setIsLoadingBreakdowns] = useState(false);

  // Filters
  const [filterUnit, setFilterUnit] = useState('');
  const [filterClassification, setFilterClassification] = useState('');

  const fetchResultsList = async () => {
    setIsLoading(true);
    try {
      const params: any = { pageSize: 1000 };
      if (filterUnit) params.unitCode = filterUnit;
      if (filterClassification) params.classification = filterClassification;

      const res = await getEvaluationMemberResults(cycleId, params, authToken);
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
    fetchResultsList();
  }, [authToken, cycleId, filterUnit, filterClassification]);

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

  const executeComputeCycle = async () => {
    setIsComputing(true);
    try {
      const res = await computeEvaluationCycle(cycleId, {}, authToken);
      if (!res.error) {
        success('Đã tính toán xong kết quả chu kỳ!', 'Tính điểm chu kỳ');
        await fetchResultsList();
        if (onComputeComplete) onComputeComplete();
      } else {
        error(res.error || 'Lỗi không xác định khi tính toán kết quả.', 'Tính toán thất bại');
      }
    } catch (err) {
      console.error(err);
      error('Lỗi kết nối khi tính toán kết quả.', 'Lỗi hệ thống');
    } finally {
      setIsComputing(false);
    }
  };

  const handleComputeMember = async (memberId: string, memberName: string) => {
    setComputingMemberId(memberId);
    try {
      const res = await computeEvaluationMember(cycleId, memberId, {}, authToken);
      if (!res.error) {
        success(`Đã tính toán xong kết quả cho thành viên ${memberName}!`, 'Tính điểm thành viên');
        await fetchResultsList();
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
    setSelectedMember(member);
    setSelectedResult(result);
    setBreakdowns([]);
    setBreakdownModalOpen(true);
    setIsLoadingBreakdowns(true);

    try {
      const res = await getEvaluationMemberBreakdowns(cycleId, member.id, authToken);
      if (res?.data?.items) {
        setBreakdowns(res.data.items);
      } else if (res?.error) {
        error(res.error, 'Lỗi tải breakdown');
      }
    } catch (err) {
      console.error(err);
      error('Lỗi hệ thống khi tải chi tiết điểm.', 'Lỗi tải breakdown');
    } finally {
      setIsLoadingBreakdowns(false);
    }
  };

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
          <Button 
            onClick={() => setIsConfirmComputeOpen(true)} 
            disabled={isComputing}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-focus hover:opacity-95 text-white rounded-xl shadow-md border-0"
          >
            {isComputing ? <Loader2 size={16} className="animate-spin mr-1" /> : <Play size={16} />} 
            Chạy tính điểm toàn chu kỳ
          </Button>
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
          <div className="flex items-center justify-center p-12">
            <Loader2 size={32} className="animate-spin text-primary mr-2" />
            <span className="text-secondary font-medium">Đang tải danh sách kết quả...</span>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center p-12 text-secondary font-medium">
            Chưa có kết quả tính điểm. Vui lòng bấm "Chạy tính điểm toàn chu kỳ" để tạo điểm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Thành viên</TableHead>
                  <TableHead className="font-semibold text-center">Điểm I</TableHead>
                  <TableHead className="font-semibold text-center">Điểm II</TableHead>
                  <TableHead className="font-semibold text-center">Điểm III-A</TableHead>
                  <TableHead className="font-semibold text-center">Điểm III-B</TableHead>
                  <TableHead className="font-semibold text-center">Tổng điểm</TableHead>
                  <TableHead className="font-semibold text-center">Xếp loại</TableHead>
                  <TableHead className="font-semibold text-center">Trạng thái</TableHead>
                  <TableHead className="text-right font-semibold">Thao tác</TableHead>
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
                      <TableCell className="text-center font-black text-primary text-base">{Number(res.totalScore ?? 0).toFixed(2)}</TableCell>
                      <TableCell className="text-center">{getClassificationBadge(res.finalClassification)}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-xs text-secondary font-medium">{res.status}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-lg shadow-sm text-sm py-1 px-2.5 h-8 flex items-center gap-1 text-primary border-primary/20 hover:bg-primary/5"
                            onClick={() => m && handleOpenBreakdown(res, m)}
                          >
                            <Eye size={13} /> Chi tiết
                          </Button>
                          {canCompute && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              disabled={isSingleComputing}
                              className="rounded-lg shadow-sm text-sm py-1 px-2.5 h-8 flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
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
            ) : breakdowns.length === 0 ? (
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
                    {breakdowns.map(bd => (
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
    </div>
  );
};

export default EvaluationResultsPanel;
