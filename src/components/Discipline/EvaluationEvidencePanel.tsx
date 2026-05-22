import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Loader2, 
  AlertTriangle,
  FileCheck,
  CheckCircle,
  XCircle,
  ExternalLink,
  Info
} from 'lucide-react';
import { UserAccount, UserRole } from '../../types/app';
import { Member } from '../../data/members';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { Input } from '../ui/input';
import { Modal } from '../ui/modal';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useToast } from '../ui/toast';
import { 
  EvaluationEvidence, 
  EvaluationCycle, 
  getEvaluationEvidence, 
  createEvaluationEvidence, 
  verifyEvaluationEvidence,
  rejectEvaluationEvidence,
  getEvaluationScoreEvents,
  EvaluationScoreEvent,
  getEvaluationCriteria,
  EvaluationCriterion,
  MemberCycleRole,
  getMemberCycleRoles
} from '../../services/evaluations';
import { EVALUATION_EVIDENCE_TYPES, EVALUATION_UNIT_CODES } from '../../data/evaluations';

interface EvaluationEvidencePanelProps {
  authToken?: string;
  currentUser: UserAccount;
  cycleId: string;
  cycle: EvaluationCycle;
  allMembers: Member[];
}

export const EvaluationEvidencePanel = ({ 
  authToken, 
  currentUser, 
  cycleId, 
  cycle, 
  allMembers 
}: EvaluationEvidencePanelProps) => {
  const { success, error, warning } = useToast();
  const fmtError = (e: any) => {
    if (!e) return '';
    if (typeof e === 'string') return e;
    if (typeof e.message === 'string') return e.message;
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  };
  const [evidenceList, setEvidenceList] = useState<EvaluationEvidence[]>([]);
  const [forbiddenModalOpen, setForbiddenModalOpen] = useState(false);
  const [forbiddenInfo, setForbiddenInfo] = useState<any | null>(null);
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([]);
  const [scoreEvents, setScoreEvents] = useState<EvaluationScoreEvent[]>([]);
  const [missingEvents, setMissingEvents] = useState<EvaluationScoreEvent[]>([]);
  const [isLoadingMissing, setIsLoadingMissing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cycleRoles, setCycleRoles] = useState<MemberCycleRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [modalFilterDept, setModalFilterDept] = useState('');
  
  // Reviewing State
  const [reviewingEvidenceId, setReviewingEvidenceId] = useState<string | null>(null);
  const [reviewType, setReviewType] = useState<'verify' | 'reject'>('verify');
  const [reviewNote, setReviewNote] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    memberId: '',
    criterionId: '',
    evidenceType: 'LINK', // LINK, TEXT, FILE
    title: '',
    url: '',
    description: ''
  });

  // Filter State
  const [filterMemberId, setFilterMemberId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetchCycleRoles = async () => {
      setIsLoadingRoles(true);
      try {
        const res = await getMemberCycleRoles(cycleId, { pageSize: 1000 }, authToken);
        if (res?.data?.items) {
          setCycleRoles(res.data.items);
        }
      } catch (err) {
        console.error('Error fetching cycle roles:', err);
      } finally {
        setIsLoadingRoles(false);
      }
    };
    fetchCycleRoles();
  }, [authToken, cycleId]);

  const fetchEvidenceList = async () => {
    setIsLoading(true);
    try {
      const params: any = { pageSize: 1000 };
      if (filterMemberId) params.memberId = filterMemberId;
      if (filterStatus) params.status = filterStatus;

      const res = await getEvaluationEvidence(cycleId, params, authToken);
      if (res?.data?.items) {
        setEvidenceList(res.data.items);
      } else if (res?.error) {
        error(fmtError(res.error) || 'Lỗi tải minh chứng', 'Lỗi tải minh chứng');
      }
    } catch (err) {
      console.error(err);
      error('Đã xảy ra lỗi khi tải danh sách minh chứng.', 'Lỗi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCriteriaList = async () => {
    try {
      const res = await getEvaluationCriteria({ isActive: true, pageSize: 100 }, authToken);
      if (res?.data?.items) {
        // Only select criteria that require evidence
        const filtered = res.data.items.filter(c => c.requiresEvidence);
        setCriteria(filtered);
        if (filtered.length > 0 && !formData.criterionId) {
          setFormData(prev => ({ ...prev, criterionId: filtered[0].id }));
        }
      }
    } catch (err) {
      console.error('Error fetching criteria:', err);
    }
  };

  useEffect(() => {
    fetchEvidenceList();
  }, [authToken, cycleId, filterMemberId, filterStatus]);

  useEffect(() => {
    const fetchScoreEvents = async () => {
      try {
        const res = await getEvaluationScoreEvents(cycleId, { pageSize: 1000 }, authToken);
        if (res?.data?.items) {
          setScoreEvents(res.data.items);
        }
      } catch (err) {
        console.error('Error fetching score events:', err);
      }
    };
    fetchScoreEvents();
  }, [authToken, cycleId]);

  // Create criteria mapping
  const criteriaMap = useMemo(() => {
    return new Map(criteria.map(c => [c.id, c]));
  }, [criteria]);

  useEffect(() => {
    // compute missing events: score events whose criterion requires evidence and no evidence linked
    const mapEvidenceByEvent = new Map<string, number>();
    for (const ev of evidenceList) {
      if (ev.scoreEventId) {
        mapEvidenceByEvent.set(ev.scoreEventId, (mapEvidenceByEvent.get(ev.scoreEventId) || 0) + 1);
      }
    }

    const missing = scoreEvents.filter(se => {
      const crit = criteriaMap.get(se.criterionId ?? '');
      const requires = crit ? crit.requiresEvidence : false;
      const count = mapEvidenceByEvent.get(se.id) || 0;
      return requires && count === 0;
    });
    setMissingEvents(missing);
  }, [scoreEvents, evidenceList, criteriaMap]);

  useEffect(() => {
    fetchCriteriaList();
  }, [authToken]);

  // Create member mapping
  const memberMap = useMemo(() => {
    return new Map(allMembers.map(m => [m.id, m]));
  }, [allMembers]);

  // Create cycle members list based on cycleRoles and allMembers
  const cycleMembers = useMemo(() => {
    const rolesMap = new Map(cycleRoles.map(r => [r.memberId, r]));
    return allMembers.filter(m => rolesMap.has(m.id));
  }, [allMembers, cycleRoles]);

  // Filtered cycle members in modal
  const filteredCycleMembers = useMemo(() => {
    if (!modalFilterDept) return cycleMembers;
    const memberIdsInDept = new Set(
      cycleRoles
        .filter(r => r.unitCode === modalFilterDept)
        .map(r => r.memberId)
    );
    return cycleMembers.filter(m => memberIdsInDept.has(m.id));
  }, [cycleMembers, cycleRoles, modalFilterDept]);


  // Update member selection when filter changes
  useEffect(() => {
    if (filteredCycleMembers.length > 0) {
      if (!filteredCycleMembers.some(m => m.id === formData.memberId)) {
        setFormData(prev => ({ ...prev, memberId: filteredCycleMembers[0].id }));
      }
    } else {
      setFormData(prev => ({ ...prev, memberId: '' }));
    }
  }, [filteredCycleMembers, formData.memberId]);

  // Helper check roles
  const hasRole = (allowedRoles: UserRole[]) => {
    if (currentUser.roles && currentUser.roles.length > 0) {
      return currentUser.roles.some(r => allowedRoles.includes(r));
    }
    return allowedRoles.includes(currentUser.role);
  };

  const isLocked = cycle.status === 'LOCKED';
  const canSubmitEvidence = !isLocked; // Members or operators can submit
  const canVerifyEvidence = hasRole(['bcn', 'bvh_discipline', 'bvh_hr', 'bcm']) && !isLocked;

  const handleOpenAddModal = () => {
    setModalFilterDept('');
    setFormData({
      memberId: cycleMembers[0]?.id || '',
      criterionId: criteria[0]?.id || '',
      evidenceType: 'LINK',
      title: '',
      url: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = formData.title.trim();
    const trimmedUrl = formData.url.trim();
    const trimmedDesc = formData.description.trim();

    if (!formData.memberId || !trimmedTitle || !formData.evidenceType) {
      warning('Vui lòng điền đầy đủ các thông tin bắt buộc.', 'Thiếu thông tin');
      return;
    }

    if (formData.evidenceType === 'LINK' && !trimmedUrl) {
      warning('Cần nhập đường dẫn (URL) cho minh chứng dạng Link.', 'Thiếu thông tin');
      return;
    }

    if (!trimmedUrl && !trimmedDesc) {
      warning('Cần nhập ít nhất đường dẫn (URL) hoặc mô tả minh chứng.', 'Thiếu thông tin chi tiết');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createEvaluationEvidence(cycleId, {
        memberId: formData.memberId,
        criterionId: formData.criterionId || undefined,
        evidenceType: formData.evidenceType,
        title: trimmedTitle,
        url: trimmedUrl || undefined,
        description: trimmedDesc || undefined
      }, authToken);

      if (!res.error) {
        success('Nộp minh chứng thành công! Đang chờ phê duyệt.', 'Nộp minh chứng');
        setIsModalOpen(false);
        fetchEvidenceList();
      } else {
        error(fmtError(res.error) || 'Lỗi không xác định khi nộp minh chứng.', 'Nộp thất bại');
      }
    } catch (err) {
      console.error(err);
      error('Đã xảy ra lỗi khi nộp minh chứng.', 'Lỗi hệ thống');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReviewModal = (evidenceId: string, type: 'verify' | 'reject') => {
    setReviewingEvidenceId(evidenceId);
    setReviewType(type);
    setReviewNote('');
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingEvidenceId) return;

    // prevent self-review client-side to avoid 403 from backend
    const evidenceItem = evidenceList.find(x => x.id === reviewingEvidenceId);
    if (evidenceItem && evidenceItem.memberId === currentUser.id) {
      error('Bạn không thể tự duyệt minh chứng do bạn là người nộp.', 'Không thể tự duyệt');
      return;
    }

    const trimmedNote = reviewNote.trim();
    if (reviewType === 'reject' && !trimmedNote) {
      warning('Vui lòng nhập lý do từ chối để thông báo cho người nộp biết.', 'Thiếu lý do');
      return;
    }

    setIsSubmitting(true);
    try {
      let res;
      if (reviewType === 'verify') {
        res = await verifyEvaluationEvidence(reviewingEvidenceId, trimmedNote, authToken);
      } else {
        res = await rejectEvaluationEvidence(reviewingEvidenceId, trimmedNote, authToken);
      }

      if (!res.error) {
        success(
          reviewType === 'verify' ? 'Phê duyệt minh chứng thành công!' : 'Từ chối minh chứng thành công!',
          'Duyệt minh chứng'
        );
        setIsReviewModalOpen(false);
        fetchEvidenceList();
      } else {
        // Special-case 403 to provide actionable guidance
        if (res.status === 403) {
          if (import.meta.env.DEV) console.debug('Verify forbidden response:', res);
          setForbiddenInfo(res?.data ?? { status: res.status, error: res.error });
          setForbiddenModalOpen(true);
          // If backend explicitly states self-review not allowed, show clearer message
          const backendCode = res?.data?.detail?.code || res?.data?.code || null;
          if (backendCode === 'EVIDENCE_SELF_REVIEW_NOT_ALLOWED') {
            error('Không thể tự duyệt minh chứng do bạn là người nộp. Vui lòng yêu cầu người khác xử lý.', 'Không cho phép tự duyệt');
          } else {
            error(fmtError(res.error) || 'Bạn không có quyền thực hiện hành động này.', 'Quyền bị từ chối');
          }
        } else {
          error(fmtError(res.error) || 'Gặp lỗi trong quá trình xử lý phê duyệt.', 'Xử lý thất bại');
        }
      }
    } catch (err) {
      console.error(err);
      error('Đã xảy ra lỗi hệ thống.', 'Lỗi hệ thống');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 font-bold">Chờ duyệt</Badge>;
      case 'VERIFIED':
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 font-bold">Đã duyệt</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 font-bold">Đã từ chối</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEvidenceTypeLabel = (type: string) => {
    const found = EVALUATION_EVIDENCE_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getCriterionName = (id?: string | null) => {
    if (!id) return 'Đánh giá chung';
    const c = criteriaMap.get(id);
    return c ? `${c.code} - ${c.name}` : id;
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {isLocked && (
        <div className="bg-purple-50 border border-purple-200 text-purple-700 dark:bg-purple-950/20 dark:border-purple-900 dark:text-purple-400 p-4 rounded-xl flex items-start gap-2.5">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Chu kỳ đã khóa</h4>
            <p className="text-sm mt-0.5">Dữ liệu minh chứng đã khóa. Không thể nộp hoặc phê duyệt minh chứng.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-transparent border-0 py-1">
        <div>
          <h3 className="text-lg font-bold text-foreground">Hồ sơ Minh chứng</h3>
          <p className="text-sm text-secondary mt-0.5">Quản lý các minh chứng thực tế phục vụ đánh giá (báo cáo, đường dẫn sản phẩm, ghi chú).</p>
        </div>
        {canSubmitEvidence && (
          <Button 
            onClick={handleOpenAddModal} 
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-focus hover:opacity-95 text-white rounded-xl shadow-md border-0"
          >
            <Plus size={16} /> Nộp minh chứng mới
          </Button>
        )}
      </div>

      {/* Missing evidence requests panel */}
      {missingEvents.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold">Yêu cầu cung cấp minh chứng còn thiếu</h4>
              <p className="text-sm text-secondary mt-1">Có {missingEvents.length} sự kiện ghi điểm yêu cầu minh chứng nhưng chưa có minh chứng liên kết.</p>
            </div>
            <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={isLoadingMissing}
                  onClick={async () => {
                    // bulk create evidence requests - skip events that already have evidence to avoid duplicates
                    setIsLoadingMissing(true);
                    try {
                      const existingByEvent = new Set(evidenceList.filter(ev => ev.scoreEventId).map(ev => ev.scoreEventId));
                      const toCreate = missingEvents.filter(ev => !existingByEvent.has(ev.id));
                      if (toCreate.length === 0) {
                        warning('Không có sự kiện nào còn thiếu minh chứng (hoặc đã có yêu cầu).', 'Không có hành động');
                        return;
                      }
                      for (const ev of toCreate) {
                        await createEvaluationEvidence(cycleId, {
                          memberId: ev.memberId,
                          scoreEventId: ev.id,
                          criterionId: ev.criterionId,
                          evidenceType: 'TEXT',
                          title: `Yêu cầu minh chứng cho sự kiện ${ev.id}`,
                          description: `Vui lòng nộp minh chứng cho sự kiện ghi điểm ${ev.id} (tiêu chí ${ev.criterionCode}).`
                        }, authToken);
                      }
                      success(`Đã tạo yêu cầu minh chứng cho ${toCreate.length} sự kiện.`, 'Yêu cầu tạo');
                      fetchEvidenceList();
                    } catch (err) {
                      console.error('Error creating evidence requests:', err);
                      error('Lỗi khi tạo yêu cầu minh chứng.', 'Lỗi');
                    } finally {
                      setIsLoadingMissing(false);
                    }
                  }}
                >Tạo tất cả</Button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2">
            {missingEvents.slice(0, 8).map(ev => {
              const member = memberMap.get(ev.memberId);
              const critName = criteriaMap.get(ev.criterionId || '') ? `${criteriaMap.get(ev.criterionId || '')!.code} - ${criteriaMap.get(ev.criterionId || '')!.name}` : ev.criterionCode;
              return (
                <div key={ev.id} className="p-3 bg-white rounded-lg border border-border flex items-center justify-between">
                  <div>
                    <div className="font-medium">{member ? member.name : ev.memberId} — {critName}</div>
                    <div className="text-xs text-secondary">Sự kiện: {ev.id} • Điểm: {ev.scoreDelta}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={isLoadingMissing}
                      onClick={async () => {
                        try {
                          // check if evidence already exists for this event to avoid duplicate
                          const exists = evidenceList.some(x => x.scoreEventId === ev.id);
                          if (exists) {
                            warning('Đã có minh chứng hoặc yêu cầu cho sự kiện này.', 'Bỏ qua');
                            return;
                          }
                          setIsLoadingMissing(true);
                          await createEvaluationEvidence(cycleId, {
                            memberId: ev.memberId,
                            scoreEventId: ev.id,
                            criterionId: ev.criterionId,
                            evidenceType: 'TEXT',
                            title: `Yêu cầu minh chứng cho sự kiện ${ev.id}`,
                            description: `Vui lòng nộp minh chứng cho sự kiện ghi điểm ${ev.id} (tiêu chí ${ev.criterionCode}).`
                          }, authToken);
                          success('Đã tạo yêu cầu minh chứng.', 'Tạo thành công');
                          fetchEvidenceList();
                        } catch (err) {
                          console.error(err);
                          error('Không thể tạo yêu cầu minh chứng.', 'Lỗi');
                        } finally {
                          setIsLoadingMissing(false);
                        }
                      }}
                    >Tạo yêu cầu</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-end py-2 bg-transparent border-0">
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Lọc theo thành viên</label>
          <Select 
            value={filterMemberId} 
            onChange={e => setFilterMemberId(e.target.value)}
            className="w-full rounded-xl border border-border/40"
          >
            <option value="">-- Tất cả thành viên --</option>
            {cycleMembers.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.mssv})</option>
            ))}
          </Select>
        </div>
        <div className="w-full sm:w-64">
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Trạng thái phê duyệt</label>
          <Select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full rounded-xl border border-border/40"
          >
            <option value="">-- Tất cả trạng thái --</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="VERIFIED">Đã phê duyệt</option>
            <option value="REJECTED">Đã từ chối</option>
          </Select>
        </div>
        <div className="w-full sm:w-auto flex gap-2">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto rounded-xl border-border/40 hover:bg-muted"
            onClick={() => {
              setFilterMemberId('');
              setFilterStatus('');
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
            <span className="text-secondary font-medium">Đang tải danh sách minh chứng...</span>
          </div>
        ) : evidenceList.length === 0 ? (
          <div className="text-center p-12 text-secondary font-medium">
            Chưa có minh chứng nào được nộp trong chu kỳ này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Thành viên</TableHead>
                  <TableHead className="font-semibold">Tiêu đề minh chứng</TableHead>
                  <TableHead className="font-semibold">Tiêu chí</TableHead>
                  <TableHead className="font-semibold">Loại</TableHead>
                  <TableHead className="font-semibold">Nội dung</TableHead>
                  <TableHead className="font-semibold">Trạng thái</TableHead>
                  {canVerifyEvidence && <TableHead className="text-right font-semibold">Thao tác duyệt</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {evidenceList.map((ev) => {
                  const m = memberMap.get(ev.memberId);
                  const memberName = m ? m.name : 'Không rõ';
                  return (
                    <TableRow key={ev.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell>
                        <div className="font-bold text-foreground">{memberName}</div>
                        <div className="text-xs text-secondary">{m?.mssv || ev.memberId}</div>
                      </TableCell>
                      <TableCell className="font-semibold">{ev.title}</TableCell>
                      <TableCell className="text-sm font-medium max-w-[150px] truncate" title={getCriterionName(ev.criterionId)}>
                        {getCriterionName(ev.criterionId)}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-secondary-foreground">{getEvidenceTypeLabel(ev.evidenceType)}</TableCell>
                      <TableCell className="max-w-[200px]">
                        {ev.url && (
                          <a 
                            href={ev.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold text-sm break-all"
                          >
                            Xem link <ExternalLink size={12} />
                          </a>
                        )}
                        {ev.description && (
                          <p className="text-xs text-secondary-foreground mt-1 block max-h-16 overflow-y-auto no-scrollbar">{ev.description}</p>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(ev.status)}</TableCell>
                      {canVerifyEvidence && (
                        <TableCell className="text-right">
                          {ev.status === 'PENDING' ? (
                            ev.memberId === currentUser.id ? (
                              <span className="text-xs text-orange-600 font-medium">Không thể tự duyệt</span>
                            ) : (
                              <div className="flex justify-end gap-1.5">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-lg shadow-sm text-sm py-1 px-2.5 h-8 flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
                                  onClick={() => handleOpenReviewModal(ev.id, 'verify')}
                                >
                                  <CheckCircle size={13} /> Duyệt
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-lg shadow-sm text-sm py-1 px-2.5 h-8 flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleOpenReviewModal(ev.id, 'reject')}
                                >
                                  <XCircle size={13} /> Từ chối
                                </Button>
                              </div>
                            )
                          ) : (
                            <span className="text-xs text-secondary">Đã xử lý</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add Evidence Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nộp minh chứng đánh giá mới">
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Lọc nhanh theo Ban
              </label>
              <Select
                value={modalFilterDept}
                onChange={e => setModalFilterDept(e.target.value)}
                className="w-full rounded-xl"
              >
                <option value="">-- Tất cả các Ban --</option>
                {EVALUATION_UNIT_CODES.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Thành viên được chứng minh <span className="text-red-500">*</span>
              </label>
              <Select 
                value={formData.memberId} 
                onChange={e => setFormData({ ...formData, memberId: e.target.value })} 
                className="w-full rounded-xl"
              >
                {filteredCycleMembers.length === 0 ? (
                  <option value="">Không có thành viên nào</option>
                ) : (
                  filteredCycleMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.mssv})</option>
                  ))
                )}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Tiêu chí chứng minh <span className="text-xs text-secondary">(Chỉ hiển thị các tiêu chí bắt buộc minh chứng)</span>
            </label>
            <Select 
              value={formData.criterionId} 
              onChange={e => setFormData({ ...formData, criterionId: e.target.value })} 
              className="w-full rounded-xl"
            >
              <option value="">-- Đánh giá chung (Không gắn tiêu cụ thể) --</option>
              {criteria.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-sm font-semibold text-foreground mb-1.5">Loại minh chứng</label>
              <Select 
                value={formData.evidenceType} 
                onChange={e => setFormData({ ...formData, evidenceType: e.target.value })} 
                className="w-full rounded-xl"
              >
                {EVALUATION_EVIDENCE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-foreground mb-1.5">Tiêu đề minh chứng <span className="text-red-500">*</span></label>
              <Input 
                required 
                placeholder="VD: Báo cáo kỹ thuật tuần 5, Link github dự án..." 
                value={formData.title} 
                onChange={e => setFormData({ ...formData, title: e.target.value })} 
                className="rounded-xl" 
              />
            </div>
          </div>

          {formData.evidenceType === 'LINK' && (
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Đường dẫn liên kết (URL) <span className="text-red-500">*</span></label>
              <Input 
                type="url"
                placeholder="https://example.com/report/1" 
                value={formData.url} 
                onChange={e => setFormData({ ...formData, url: e.target.value })} 
                className="rounded-xl" 
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Mô tả minh chứng chi tiết</label>
            <textarea 
              rows={3}
              placeholder="Nhập mô tả kết quả, chi tiết đóng góp hoặc các ghi chú khác..."
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus-visible:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="bg-primary hover:opacity-95 text-white rounded-xl shadow-md border-0"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : 'Nộp minh chứng'}
            </Button>
          </div>
        </form>
      </Modal>
      {/* Forbidden guidance modal */}
      <Modal
        isOpen={forbiddenModalOpen}
        onClose={() => setForbiddenModalOpen(false)}
        title="Quyền bị từ chối — Hướng dẫn khắc phục"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">Hệ thống yêu cầu quyền cao hơn để thực hiện thao tác này.</p>
          <div className="p-3 bg-muted/30 rounded-lg border border-border">
            <div className="text-xs text-secondary">Chi tiết lỗi</div>
            <div className="text-sm font-medium mt-1 break-words">{fmtError(forbiddenInfo?.error) || 'Forbidden'}</div>
          </div>

          <div className="p-3 bg-muted/20 rounded-lg border border-border">
            <div className="text-xs text-secondary">Vai trò hiện tại của bạn</div>
            <div className="text-sm font-medium mt-1">{(currentUser.roles && currentUser.roles.length > 0) ? currentUser.roles.join(', ') : currentUser.role}</div>
          </div>

          <div className="text-sm">
            <div className="font-semibold">Gợi ý khắc phục</div>
            <ul className="list-disc list-inside mt-2 text-sm text-secondary">
              <li>Đăng nhập lại bằng tài khoản có quyền: <strong>bcn</strong>, <strong>bvh_discipline</strong>, <strong>bvh_hr</strong>, hoặc <strong>bcm</strong>.</li>
              <li>Kiểm tra header `Authorization` (token) trong trình duyệt hoặc cấu hình proxy dev.</li>
              <li>Nếu cần, liên hệ admin để cấp quyền hoặc thực hiện hành động thay bạn.</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setForbiddenModalOpen(false)}>Đóng</Button>
            <Button
              onClick={() => {
                // attempt to open profile/logout page or refresh to prompt re-login
                setForbiddenModalOpen(false);
                // perform a soft reload to refresh tokens
                window.location.reload();
              }}
            >Đăng nhập lại</Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal 
        isOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)} 
        title={reviewType === 'verify' ? 'Phê duyệt minh chứng' : 'Từ chối minh chứng'}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
          <div className="flex gap-2.5 text-sm p-4 bg-muted/40 rounded-xl border border-border/40 text-secondary-foreground">
            <Info size={18} className="shrink-0 text-primary mt-0.5" />
            <p>
              {reviewType === 'verify' 
                ? 'Xác nhận phê duyệt minh chứng này. Điểm số của thành viên tương ứng sẽ được công nhận khi chạy Compute.'
                : 'Nhập lý do từ chối để thông báo cho người nộp biết.'
              }
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Ghi chú phản hồi {reviewType === 'reject' ? <span className="text-red-500">*</span> : '(Không bắt buộc)'}
            </label>
            <textarea 
              rows={3}
              required={reviewType === 'reject'}
              placeholder={reviewType === 'verify' ? 'Nhập ghi chú phê duyệt (VD: Báo cáo đạt yêu cầu)...' : 'Lý do từ chối cụ thể...'}
              value={reviewNote} 
              onChange={e => setReviewNote(e.target.value)} 
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus-visible:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsReviewModalOpen(false)}>Hủy</Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className={`text-white rounded-xl shadow-md border-0 ${reviewType === 'verify' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : 'Xác nhận'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EvaluationEvidencePanel;
