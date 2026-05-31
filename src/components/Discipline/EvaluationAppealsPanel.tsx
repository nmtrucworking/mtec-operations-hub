import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Loader2, 
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Filter
} from 'lucide-react';
import { UserAccount, UserRole } from '../../types/app';
import { Member } from '../../data/members';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Modal } from '../ui/modal';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useToast } from '../ui/toast';
import { 
  EvaluationAppeal, 
  EvaluationCycle, 
  getEvaluationAppeals, 
  createEvaluationAppeal,
  MemberCycleRole,
  getMemberCycleRoles
} from '../../services/evaluations';
import { EVALUATION_UNIT_CODES } from '../../data/evaluations';
import { canCreateAppeal, isManager as isManagerHelper } from '../../utils/evaluationPermissions';
import { Select } from '../ui/select';

interface EvaluationAppealsPanelProps {
  authToken?: string;
  currentUser: UserAccount;
  cycleId: string;
  cycle: EvaluationCycle;
  allMembers: Member[];
}

export const EvaluationAppealsPanel = ({ 
  authToken, 
  currentUser, 
  cycleId, 
  cycle, 
  allMembers 
}: EvaluationAppealsPanelProps) => {
  const { success, error, warning } = useToast();
  const [appeals, setAppeals] = useState<EvaluationAppeal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cycleRoles, setCycleRoles] = useState<MemberCycleRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [modalFilterDept, setModalFilterDept] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    memberId: '',
    title: '',
    description: ''
  });

  const fetchAppealsList = async () => {
    setIsLoading(true);
    try {
      const res = await getEvaluationAppeals(cycleId, authToken);
      if (res?.data?.items) {
        setAppeals(res.data.items);
      } else if (res?.error) {
        error(res.error, 'Lỗi tải khiếu nại');
      }
    } catch (err) {
      console.error(err);
      error('Đã xảy ra lỗi khi tải danh sách khiếu nại.', 'Lỗi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppealsList();
  }, [authToken, cycleId]);

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

  // Find member corresponding to current user
  const currentUserMember = useMemo(() => {
    return allMembers.find(m => 
      (currentUser.username && m.mssv && currentUser.username === m.mssv) ||
      (currentUser.email && m.email && currentUser.email.toLowerCase() === m.email.toLowerCase())
    );
  }, [allMembers, currentUser]);

  const isManager = isManagerHelper(currentUser);

  // Sync selected member ID with filters
  useEffect(() => {
    if (isManager) {
      if (filteredCycleMembers.length > 0) {
        if (!filteredCycleMembers.some(m => m.id === formData.memberId)) {
          setFormData(prev => ({ ...prev, memberId: filteredCycleMembers[0].id }));
        }
      } else {
        setFormData(prev => ({ ...prev, memberId: '' }));
      }
    } else {
      if (currentUserMember && formData.memberId !== currentUserMember.id) {
        setFormData(prev => ({ ...prev, memberId: currentUserMember.id }));
      }
    }
  }, [filteredCycleMembers, formData.memberId, isManager, currentUserMember]);

  const handleOpenAddModal = () => {
    setModalFilterDept('');
    setFormData({
      memberId: isManager ? (filteredCycleMembers[0]?.id || '') : (currentUserMember?.id || ''),
      title: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId) {
      warning('Không xác định được thành viên khiếu nại.', 'Thiếu thông tin');
      return;
    }
    if (!formData.title || !formData.description) {
      warning('Vui lòng nhập đầy đủ tiêu đề và nội dung khiếu nại.', 'Thiếu thông tin');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createEvaluationAppeal(cycleId, {
        memberId: formData.memberId,
        appealType: formData.title,
        content: formData.description
      }, authToken);
      if (!res.error) {
        success('Đã gửi đơn khiếu nại thành công! Vui lòng chờ phản hồi.', 'Gửi khiếu nại');
        setIsModalOpen(false);
        fetchAppealsList();
      } else {
        error(res.error || 'Lỗi không xác định khi gửi khiếu nại.', 'Gửi thất bại');
      }
    } catch (err) {
      console.error(err);
      error('Đã xảy ra lỗi khi gửi khiếu nại.', 'Lỗi hệ thống');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 font-bold">Đang chờ giải quyết</Badge>;
      case 'IN_REVIEW':
        return <Badge variant="outline" className="text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 font-bold">Đang xem xét</Badge>;
      case 'NEEDS_MORE_EVIDENCE':
        return <Badge variant="outline" className="text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 font-bold">Yêu cầu thêm chứng cứ</Badge>;
      case 'ACCEPTED':
        return <Badge variant="outline" className="text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 font-bold">Chấp thuận</Badge>;
      case 'PARTIALLY_ACCEPTED':
        return <Badge variant="outline" className="text-lime-700 dark:text-lime-300 border-lime-200 dark:border-lime-800 bg-lime-50 dark:bg-lime-900/20 font-bold">Chấp nhận một phần</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 font-bold">Từ chối</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20 font-bold">Đã huỷ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-transparent border-0 py-1">
        <div>
          <h3 className="text-lg font-bold text-foreground">Khiếu nại / Phúc khảo điểm số</h3>
          <p className="text-sm text-secondary mt-1">Gửi yêu cầu xem xét lại điểm số hoặc phân loại xếp loại nếu có sai sót.</p>
        </div>
        {canCreateAppeal(currentUser, !!currentUserMember) && (
          <Button 
            onClick={handleOpenAddModal} 
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-focus hover:opacity-95 text-white rounded-xl shadow-md border-0"
          >
            <Plus size={16} /> Gửi đơn khiếu nại
          </Button>
        )}
      </div>

      <div className="bg-card/45 border border-border/30 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 size={32} className="animate-spin text-primary mr-2" />
            <span className="text-secondary font-medium">Đang tải danh sách đơn khiếu nại...</span>
          </div>
        ) : appeals.length === 0 ? (
          <div className="text-center p-12 text-secondary font-medium">
            Chưa có đơn khiếu nại nào được nộp cho chu kỳ này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Thành viên nộp</TableHead>
                  <TableHead className="font-semibold">Tiêu đề khiếu nại</TableHead>
                  <TableHead className="font-semibold">Nội dung khiếu nại</TableHead>
                  <TableHead className="font-semibold text-center">Trạng thái</TableHead>
                  <TableHead className="font-semibold">Ghi chú giải quyết</TableHead>
                  <TableHead className="font-semibold text-right">Ngày gửi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appeals.map((appeal) => {
                  const m = memberMap.get(appeal.memberId);
                  const memberName = m ? m.name : 'Không rõ';
                  return (
                    <TableRow key={appeal.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell>
                        <div className="font-bold text-foreground">{memberName}</div>
                        <div className="text-xs text-secondary">{m?.mssv || appeal.memberId}</div>
                      </TableCell>
                      <TableCell className="font-semibold">{appeal.appealType || '-'}</TableCell>
                      <TableCell className="max-w-[250px]">
                        <p className="text-sm text-secondary-foreground">{appeal.content || '-'}</p>
                      </TableCell>
                      <TableCell className="text-center">{getStatusBadge(appeal.status)}</TableCell>
                      <TableCell className="text-sm italic text-secondary-foreground max-w-[200px] truncate" title={appeal.resolutionNote || ''}>
                        {appeal.resolutionNote || '-'}
                      </TableCell>
                      <TableCell className="text-right text-xs text-secondary">
                        {appeal.createdAt ? new Date(appeal.createdAt).toLocaleDateString('vi-VN') : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Gửi đơn khiếu nại / phúc khảo">
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 p-4 rounded-xl flex gap-2 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>Vui lòng ghi rõ mã tiêu chí, số điểm và lý do/minh chứng bạn muốn phúc khảo để Ban chủ nhiệm/Cán bộ đánh giá dễ dàng đối chiếu.</p>
          </div>

          {isManager ? (
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
              </div>
            </div>
          ) : (
            <div className="bg-muted/30 p-3.5 rounded-xl border border-border/20">
              <span className="text-sm font-semibold text-secondary">Người nộp khiếu nại:</span>
              <span className="ml-2 text-sm font-bold text-foreground">
                {currentUserMember ? `${currentUserMember.name} (${currentUserMember.mssv})` : currentUser.fullName || currentUser.username}
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Tiêu đề khiếu nại <span className="text-red-500">*</span>
            </label>
            <Input 
              required 
              placeholder="VD: Khiếu nại điểm chuyên cần họp tuần 5, Phúc khảo xếp loại Kỷ luật..." 
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })} 
              className="rounded-xl" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Nội dung khiếu nại chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea 
              rows={4}
              required
              placeholder="Ghi rõ lý do bạn khiếu nại, ví dụ: 'Tôi vắng họp tuần 5 do có xin phép và phép được duyệt nhưng vẫn bị trừ điểm...'"
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
              {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : 'Gửi đơn khiếu nại'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EvaluationAppealsPanel;
