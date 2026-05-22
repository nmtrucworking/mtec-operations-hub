import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Loader2, 
  AlertTriangle,
  Award,
  Ban,
  Undo2,
  Filter
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
  EvaluationScoreEvent, 
  EvaluationCycle, 
  getEvaluationScoreEvents, 
  createEvaluationScoreEvent, 
  voidEvaluationScoreEvent,
  getEvaluationCriteria,
  EvaluationCriterion,
  MemberCycleRole,
  getMemberCycleRoles
} from '../../services/evaluations';
import { EVALUATION_EVENT_TYPES, EVALUATION_UNIT_CODES } from '../../data/evaluations';
import { EvaluationScoreSpreadsheet } from './EvaluationScoreSpreadsheet';

interface EvaluationScoreEventsPanelProps {
  authToken?: string;
  currentUser: UserAccount;
  cycleId: string;
  cycle: EvaluationCycle;
  allMembers: Member[];
}

export const EvaluationScoreEventsPanel = ({ 
  authToken, 
  currentUser, 
  cycleId, 
  cycle, 
  allMembers 
}: EvaluationScoreEventsPanelProps) => {
  const { success, error, warning } = useToast();
  const [events, setEvents] = useState<EvaluationScoreEvent[]>([]);
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'spreadsheet'>('list');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [cycleRoles, setCycleRoles] = useState<MemberCycleRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [modalFilterDept, setModalFilterDept] = useState('');

  // Voiding State
  const [voidingEventId, setVoidingEventId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    memberId: '',
    criterionCode: '',
    unitCode: 'BCNg',
    eventType: 'BONUS',
    scoreDelta: 0.0,
    note: ''
  });

  // Filter State
  const [filterMemberId, setFilterMemberId] = useState('');
  const [filterCriterionCode, setFilterCriterionCode] = useState('');
  const [filterEventType, setFilterEventType] = useState('');

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

  const fetchEventsList = async () => {
    setIsLoading(true);
    try {
      const params: any = { pageSize: 1000 };
      if (filterMemberId) params.memberId = filterMemberId;
      if (filterCriterionCode) params.criterionCode = filterCriterionCode;
      if (filterEventType) params.eventType = filterEventType;

      const res = await getEvaluationScoreEvents(cycleId, params, authToken);
      if (res?.data?.items) {
        setEvents(res.data.items);
      } else if (res?.error) {
        error(res.error, 'Lỗi tải sự kiện điểm');
      }
    } catch (err) {
      console.error(err);
      error('Đã xảy ra lỗi khi tải danh sách sự kiện điểm.', 'Lỗi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCriteriaList = async () => {
    try {
      const res = await getEvaluationCriteria({ isActive: true, pageSize: 100 }, authToken);
      if (res?.data?.items) {
        const items = res.data.items;
        setCriteria(items);
        if (items.length > 0 && !formData.criterionCode) {
          setFormData(prev => ({ ...prev, criterionCode: items[0].code }));
        }
      }
    } catch (err) {
      console.error('Error fetching criteria:', err);
    }
  };

  useEffect(() => {
    fetchEventsList();
  }, [authToken, cycleId, filterMemberId, filterCriterionCode, filterEventType]);

  useEffect(() => {
    fetchCriteriaList();
  }, [authToken]);

  // Create member mapping
  const memberMap = useMemo(() => {
    return new Map(allMembers.map(m => [m.id, m]));
  }, [allMembers]);

  // Quick stats for filtered member
  const memberStats = useMemo(() => {
    if (!filterMemberId) return null;
    const evs = events || [];
    const count = evs.length;
    const total = evs.reduce((s, e) => s + Number(e.scoreDelta || 0), 0);
    const positive = evs.filter(e => e.scoreDelta > 0).reduce((s, e) => s + Number(e.scoreDelta || 0), 0);
    const negative = evs.filter(e => e.scoreDelta < 0).reduce((s, e) => s + Number(e.scoreDelta || 0), 0);
    const byCriterion = new Map<string, number>();
    for (const e of evs) {
      const prev = byCriterion.get(e.criterionCode) || 0;
      byCriterion.set(e.criterionCode, prev + Number(e.scoreDelta || 0));
    }
    const topCriteria = Array.from(byCriterion.entries())
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 3);
    return { count, total, positive, negative, topCriteria };
  }, [events, filterMemberId]);

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

  // Selected member role label in modal
  const selectedMemberRoleLabel = useMemo(() => {
    if (!formData.memberId) return '';
    const role = cycleRoles.find(r => r.memberId === formData.memberId);
    if (!role) return '';
    const foundUnit = EVALUATION_UNIT_CODES.find(u => u.value === role.unitCode);
    const unitLabel = foundUnit ? foundUnit.label : role.unitCode;
    const title = role.roleTitle || 'Thành viên';
    return `${unitLabel} - ${title}`;
  }, [formData.memberId, cycleRoles]);

  // Create criteria mapping
  const criteriaMap = useMemo(() => {
    return new Map(criteria.map(c => [c.code, c]));
  }, [criteria]);

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

  // Auto-fill unitCode based on selected member's role
  useEffect(() => {
    if (formData.memberId && cycleRoles.length > 0) {
      const role = cycleRoles.find(r => r.memberId === formData.memberId);
      if (role) {
        setFormData(prev => ({ ...prev, unitCode: role.unitCode }));
      }
    }
  }, [formData.memberId, cycleRoles]);

  // Helper check roles
  const hasRole = (allowedRoles: UserRole[]) => {
    if (currentUser.roles && currentUser.roles.length > 0) {
      return currentUser.roles.some(r => allowedRoles.includes(r));
    }
    return allowedRoles.includes(currentUser.role);
  };

  const isLocked = cycle.status === 'LOCKED';
  const canRecordEvents = hasRole(['bcn', 'bvh_discipline', 'bvh_hr', 'bcm']) && !isLocked;
  const canVoidEvents = hasRole(['bcn', 'bvh_discipline']) && !isLocked;

  const handleOpenAddModal = () => {
    setModalFilterDept('');
    setFormData({
      memberId: cycleMembers[0]?.id || '',
      criterionCode: criteria[0]?.code || '',
      unitCode: 'BCNg',
      eventType: 'BONUS',
      scoreDelta: 1.0,
      note: ''
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNote = formData.note.trim();

    if (!formData.memberId || !formData.criterionCode || !formData.eventType || !trimmedNote) {
      warning('Vui lòng nhập đầy đủ thông tin bắt buộc.', 'Thiếu thông tin');
      return;
    }

    if (formData.scoreDelta === 0) {
      warning('Điểm thay đổi phải khác 0.', 'Sai điểm số');
      return;
    }

    setIsSubmitting(true);
    try {
      // Automatic sign correction based on event type
      let delta = Number(formData.scoreDelta);
      if (formData.eventType === 'PENALTY' && delta > 0) {
        delta = -delta; // Ensure negative delta for penalties
      } else if (formData.eventType === 'BONUS' && delta < 0) {
        delta = -delta; // Ensure positive delta for bonuses
      }

      const selectedCriterion = criteria.find(c => c.code === formData.criterionCode);
      if (selectedCriterion && formData.eventType === 'BONUS' && Math.abs(delta) > selectedCriterion.maxScore) {
        warning(`Điểm cộng không được vượt quá tối đa của tiêu chí (${selectedCriterion.maxScore}).`, 'Vượt quá điểm');
        setIsSubmitting(false);
        return;
      }

      const res = await createEvaluationScoreEvent(cycleId, {
        memberId: formData.memberId,
        criterionCode: formData.criterionCode,
        unitCode: formData.unitCode,
        eventType: formData.eventType,
        scoreDelta: delta,
        note: trimmedNote
      }, authToken);

      if (!res.error) {
        success('Đã ghi nhận sự kiện điểm thành công!', 'Ghi điểm');
        setIsModalOpen(false);
        fetchEventsList();
      } else {
        error(res.error || 'Lỗi không xác định khi ghi nhận điểm.', 'Ghi nhận thất bại');
      }
    } catch (err) {
      console.error(err);
      error('Đã xảy ra lỗi khi ghi điểm.', 'Lỗi hệ thống');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenVoidModal = (eventId: string) => {
    setVoidingEventId(eventId);
    setVoidReason('');
    setIsVoidModalOpen(true);
  };

  const handleVoidEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidingEventId) return;
    const trimmedVoidReason = voidReason.trim();
    if (!trimmedVoidReason) {
      warning('Vui lòng nhập lý do thu hồi.', 'Thiếu lý do');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await voidEvaluationScoreEvent(voidingEventId, trimmedVoidReason, authToken);
      if (!res.error) {
        success('Đã thu hồi sự kiện điểm thành công!', 'Thu hồi điểm');
        setIsVoidModalOpen(false);
        fetchEventsList();
      } else {
        error(res.error || 'Lỗi không xác định khi thu hồi.', 'Thu hồi thất bại');
      }
    } catch (err) {
      console.error(err);
      error('Lỗi khi kết nối hệ thống.', 'Lỗi hệ thống');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'BONUS':
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 font-bold">Cộng điểm</Badge>;
      case 'PENALTY':
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 font-bold">Trừ điểm</Badge>;
      case 'MANUAL_SCORE':
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 font-bold">Ghi nhận</Badge>;
      case 'OVERRIDE':
        return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 font-bold">Điều chỉnh</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getUnitLabel = (code?: string | null) => {
    if (!code) return '-';
    const found = EVALUATION_UNIT_CODES.find(u => u.value === code);
    return found ? found.label : code;
  };

  const getCriterionName = (code: string) => {
    const c = criteriaMap.get(code);
    return c ? c.name : code;
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {isLocked && (
        <div className="bg-purple-50 border border-purple-200 text-purple-700 dark:bg-purple-950/20 dark:border-purple-900 dark:text-purple-400 p-4 rounded-xl flex items-start gap-2.5">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Chu kỳ đã khóa</h4>
            <p className="text-sm mt-0.5">Dữ liệu điểm đã khóa. Không thể tạo mới sự kiện điểm hoặc thu hồi điểm.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-transparent border-0 py-1">
        <div>
          <h3 className="text-lg font-bold text-foreground">Nhật ký Sự kiện Điểm</h3>
          <p className="text-sm text-secondary mt-0.5">Ghi nhận các sự kiện cộng/trừ điểm hoặc điều chỉnh KPI của thành viên.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border/50">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-secondary hover:text-foreground'}`}
            >
              Danh sách
            </button>
            <button 
              onClick={() => setViewMode('spreadsheet')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'spreadsheet' ? 'bg-background shadow-sm text-foreground' : 'text-secondary hover:text-foreground'}`}
            >
              Bảng tính (Spreadsheet)
            </button>
          </div>
          
          {canRecordEvents && viewMode === 'list' && (
            <Button 
              onClick={handleOpenAddModal} 
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-focus hover:opacity-95 text-white rounded-xl shadow-md border-0"
            >
              <Award size={16} /> Ghi nhận điểm mới
            </Button>
          )}
        </div>
      </div>

      {viewMode === 'spreadsheet' ? (
        <EvaluationScoreSpreadsheet
          cycleId={cycleId}
          authToken={authToken}
          cycleMembers={cycleMembers}
          criteria={criteria}
          cycleRoles={cycleRoles}
          onSaved={fetchEventsList}
          isLocked={isLocked}
        />
      ) : (
        <>
          {/* Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end py-2 bg-transparent border-0">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Filter size={12} /> Thành viên
              </label>
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
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Tiêu chí</label>
              <Select 
                value={filterCriterionCode} 
                onChange={e => setFilterCriterionCode(e.target.value)}
                className="w-full rounded-xl border border-border/40"
              >
                <option value="">-- Tất cả tiêu chí --</option>
                {criteria.map(c => (
                  <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Loại sự kiện</label>
              <Select 
                value={filterEventType} 
                onChange={e => setFilterEventType(e.target.value)}
                className="w-full rounded-xl border border-border/40"
              >
                <option value="">-- Tất cả loại sự kiện --</option>
                {EVALUATION_EVENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="w-full rounded-xl border-border/40 hover:bg-muted"
                onClick={() => {
                  setFilterMemberId('');
                  setFilterCriterionCode('');
                  setFilterEventType('');
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>

          {/* Quick stats when filtering by member */}
          {filterMemberId && memberStats && (
            <div className="bg-muted/20 border border-border/30 rounded-xl p-3 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs text-secondary">Thống kê nhanh (lọc thành viên)</div>
                <div className="font-semibold text-foreground">{memberStats.count} sự kiện • Tổng ảnh hưởng: {memberStats.total > 0 ? `+${memberStats.total}` : memberStats.total}</div>
              </div>
              <div className="text-sm text-secondary">
                <div>Cộng: {memberStats.positive > 0 ? `+${memberStats.positive}` : memberStats.positive} • Trừ: {memberStats.negative}</div>
                <div className="mt-1">Tiêu chí ảnh hưởng: {memberStats.topCriteria.length === 0 ? '-' : memberStats.topCriteria.map(t => `${t[0]} (${t[1] > 0 ? '+'+t[1] : t[1]})`).join(', ')}</div>
              </div>
              <div className="ml-auto sm:ml-0">
                <Button variant="outline" size="sm" onClick={() => setFilterMemberId('')}>Xóa lọc</Button>
              </div>
            </div>
          )}

          {/* Main Table */}
          <div className="bg-card/45 border border-border/30 rounded-xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 size={32} className="animate-spin text-primary mr-2" />
                <span className="text-secondary font-medium">Đang tải lịch sử sự kiện điểm...</span>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center p-12 text-secondary font-medium">
                Chưa có sự kiện điểm nào được ghi nhận cho chu kỳ này.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Thành viên</TableHead>
                      <TableHead className="font-semibold">Tiêu chí</TableHead>
                      <TableHead className="font-semibold">Ban</TableHead>
                      <TableHead className="font-semibold">Loại sự kiện</TableHead>
                      <TableHead className="font-semibold text-center">Thay đổi (Delta)</TableHead>
                      <TableHead className="font-semibold">Mô tả / Ghi chú</TableHead>
                      <TableHead className="font-semibold text-center">Trạng thái</TableHead>
                      {canVoidEvents && <TableHead className="text-right font-semibold">Thao tác</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => {
                      const m = memberMap.get(event.memberId);
                      const memberName = m ? m.name : 'Không rõ';
                      return (
                        <TableRow key={event.id} className={`hover:bg-muted/40 transition-colors ${event.isVoid ? 'opacity-50 line-through decoration-red-400 bg-red-50/10' : ''}`}>
                          <TableCell>
                            <div className="font-bold text-foreground">{memberName}</div>
                            <div className="text-xs text-secondary">{m?.mssv || event.memberId}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-sm">{event.criterionCode}</div>
                            <div className="text-xs text-secondary mt-0.5 max-w-[200px] truncate" title={getCriterionName(event.criterionCode)}>
                              {getCriterionName(event.criterionCode)}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{getUnitLabel(event.unitCode)}</TableCell>
                          <TableCell>{getEventTypeBadge(event.eventType)}</TableCell>
                          <TableCell className={`font-black text-center ${event.scoreDelta > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {event.scoreDelta > 0 ? `+${event.scoreDelta}` : event.scoreDelta}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-foreground max-w-[220px] truncate" title={event.note || ''}>{event.note || '-'}</div>
                            {event.isVoid && event.voidReason && (
                              <div className="text-xs text-red-500 font-medium italic mt-0.5">Lý do thu hồi: {event.voidReason}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {event.isVoid ? (
                              <span className="text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded font-bold border border-red-200">Đã thu hồi</span>
                            ) : (
                              <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded font-bold border border-green-200">Kích hoạt</span>
                            )}
                          </TableCell>
                          {canVoidEvents && (
                            <TableCell className="text-right">
                              {!event.isVoid && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-lg shadow-sm text-sm py-1 px-2.5 h-8 flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleOpenVoidModal(event.id)}
                                >
                                  <Undo2 size={13} /> Thu hồi
                                </Button>
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
        </>
      )}

      {/* Add score event modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ghi nhận sự kiện điểm mới">
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
                Chọn Thành viên <span className="text-red-500">*</span>
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
              {selectedMemberRoleLabel && (
                <p className="text-xs text-primary font-semibold mt-1">
                  Vai trò chu kỳ: {selectedMemberRoleLabel}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Chọn Tiêu chí áp dụng <span className="text-red-500">*</span>
            </label>
            <Select 
              value={formData.criterionCode} 
              onChange={e => setFormData({ ...formData, criterionCode: e.target.value })} 
              className="w-full rounded-xl"
            >
              {criteria.map(c => (
                <option key={c.id} value={c.code}>{c.code} - {c.name} (Tối đa: {c.maxScore})</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Ban áp dụng</label>
              <Select 
                value={formData.unitCode} 
                onChange={e => setFormData({ ...formData, unitCode: e.target.value })} 
                className="w-full rounded-xl"
              >
                {EVALUATION_UNIT_CODES.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Loại sự kiện <span className="text-red-500">*</span></label>
              <Select 
                value={formData.eventType} 
                onChange={e => setFormData({ ...formData, eventType: e.target.value })} 
                className="w-full rounded-xl"
              >
                {EVALUATION_EVENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Điểm thay đổi (Delta) <span className="text-red-500">*</span></label>
              <Input 
                type="number" 
                step="0.5" 
                value={formData.scoreDelta} 
                onChange={e => setFormData({ ...formData, scoreDelta: parseFloat(e.target.value) || 0 })} 
                className="rounded-xl font-bold text-primary" 
              />
              <span className="text-xs text-secondary mt-1 block">
                {formData.eventType === 'PENALTY' ? 'Lưu ý: Điểm trừ nên nhập số âm (hoặc số dương và hệ thống sẽ tự động trừ)' : ''}
                {formData.eventType === 'BONUS' ? 'Lưu ý: Điểm cộng nên nhập số dương' : ''}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Lý do / Mô tả chi tiết <span className="text-red-500">*</span></label>
            <textarea 
              rows={3}
              required
              placeholder="Nhập lý do cộng trừ điểm chi tiết (VD: Tham gia hỗ trợ dọn dẹp văn phòng)..."
              value={formData.note} 
              onChange={e => setFormData({ ...formData, note: e.target.value })} 
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
              {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : 'Ghi nhận điểm'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Void Modal */}
      <Modal isOpen={isVoidModalOpen} onClose={() => setIsVoidModalOpen(false)} title="Xác nhận thu hồi sự kiện điểm">
        <form onSubmit={handleVoidEvent} className="space-y-4 pt-2">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex gap-2 text-sm">
            <Ban size={18} className="shrink-0 mt-0.5" />
            <p><strong>Cảnh báo:</strong> Việc thu hồi sự kiện điểm này sẽ vô hiệu hóa điểm số liên quan trong tính toán kết quả chu kỳ. Hành động này không thể hoàn tác.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Lý do thu hồi <span className="text-red-500">*</span>
            </label>
            <textarea 
              rows={3}
              required
              placeholder="Nhập lý do thu hồi (VD: Nhập nhầm điểm, sai tiêu chí)..."
              value={voidReason} 
              onChange={e => setVoidReason(e.target.value)} 
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus-visible:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsVoidModalOpen(false)}>Hủy</Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md border-0"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : 'Xác nhận thu hồi'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EvaluationScoreEventsPanel;
