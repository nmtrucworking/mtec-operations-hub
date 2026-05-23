import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  FileText,
  Lock,
  Unlock,
  XCircle,
  Eye,
  Edit2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UserAccount, UserRole } from '../../types/app';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { DatePicker } from '../ui/date-picker';
import { Modal } from '../ui/modal';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useToast } from '../ui/toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import { 
  EvaluationCycle, 
  getEvaluationCycles, 
  createEvaluationCycle,
  updateEvaluationCycle,
  submitEvaluationCycleReview,
  approveEvaluationCycle,
  markEvaluationCycleReadyForApproval,
  computeEvaluationCycle,
  lockEvaluationCycle,
  cancelEvaluationCycle
} from '../../services/evaluations';

interface EvaluationCyclesPanelProps {
  authToken?: string;
  currentUser: UserAccount;
  onSelectCycle: (cycle: EvaluationCycle | null) => void;
  selectedCycleId: string | null;
  onCyclesUpdated: () => void;
}

export const EvaluationCyclesPanel = ({ 
  authToken, 
  currentUser, 
  onSelectCycle, 
  selectedCycleId,
  onCyclesUpdated 
}: EvaluationCyclesPanelProps) => {
  const { t } = useTranslation();
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
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [missingModalOpen, setMissingModalOpen] = useState(false);
  const [missingDetails, setMissingDetails] = useState<any | null>(null);
  const [computeError, setComputeError] = useState<string | null>(null);
  const [pendingCycleId, setPendingCycleId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ cycleId: string, action: 'submit' | 'ready' | 'approve' | 'lock' | 'cancel', msg: string } | null>(null);
  
  // Form state
  const [formType, setFormType] = useState<'create' | 'edit'>('create');
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'MONTHLY', // MONTHLY, QUARTERLY, ACADEMIC_TERM
    startDate: '',
    endDate: '',
    description: ''
  });

  const fetchCyclesList = async () => {
    setIsLoading(true);
    try {
      const res = await getEvaluationCycles({ pageSize: 100 }, authToken);
      if (res?.data?.items) {
        setCycles(res.data.items);
      } else if (res?.error) {
        error(fmtError(res.error) || 'Lỗi tải chu kỳ', 'Lỗi tải chu kỳ');
      }
    } catch (err) {
      console.error(err);
      error('Đã xảy ra lỗi khi tải danh sách chu kỳ.', 'Lỗi tải chu kỳ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCyclesList();
  }, [authToken]);

  // Helper check roles
  const hasRole = (allowedRoles: UserRole[]) => {
    if (currentUser.roles && currentUser.roles.length > 0) {
      return currentUser.roles.some(r => allowedRoles.includes(r));
    }
    return allowedRoles.includes(currentUser.role);
  };

  const isOperator = hasRole(['bcn', 'bvh_discipline', 'bvh_hr']);
  const isAdmin = hasRole(['bcn']);

  const handleOpenCreateModal = () => {
    setFormType('create');
    setFormData({
      code: '',
      name: '',
      type: 'MONTHLY',
      startDate: '',
      endDate: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cycle: EvaluationCycle) => {
    setFormType('edit');
    setEditingCycleId(cycle.id);
    setFormData({
      code: cycle.code,
      name: cycle.name,
      type: cycle.type,
      startDate: cycle.startDate.split('T')[0],
      endDate: cycle.endDate.split('T')[0],
      description: cycle.description || ''
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = formData.code.trim();
    const trimmedName = formData.name.trim();

    if (!trimmedCode || !trimmedName || !formData.startDate || !formData.endDate) {
      warning('Vui lòng điền đầy đủ các thông tin bắt buộc.', 'Thiếu thông tin');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      warning('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.', 'Sai thông tin');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...formData, code: trimmedCode, name: trimmedName };
      if (formType === 'create') {
        const res = await createEvaluationCycle(payload, authToken);
        if (!res.error) {
          success(`Đã tạo chu kỳ "${trimmedName}" thành công!`, 'Tạo chu kỳ');
          setIsModalOpen(false);
          fetchCyclesList();
          onCyclesUpdated();
        } else {
          error(res.error || 'Lỗi không xác định khi tạo chu kỳ.', 'Tạo chu kỳ thất bại');
        }
      } else {
        if (!editingCycleId) return;
        const res = await updateEvaluationCycle(editingCycleId, payload, authToken);
        if (!res.error) {
          success(`Đã cập nhật chu kỳ "${trimmedName}" thành công!`, 'Cập nhật chu kỳ');
          setIsModalOpen(false);
          fetchCyclesList();
          onCyclesUpdated();
        } else {
          error(res.error || 'Lỗi không xác định khi cập nhật chu kỳ.', 'Cập nhật thất bại');
        }
      }
    } catch (err) {
      console.error(err);
      error('Đã xảy ra lỗi trong quá trình xử lý.', 'Lỗi hệ thống');
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateStatusTransition = (cycleId: string, action: 'submit' | 'ready' | 'approve' | 'lock' | 'cancel') => {
    let confirmMsg = '';
    switch(action) {
      case 'submit': confirmMsg = 'Xác nhận mở giai đoạn rà soát chu kỳ này?'; break;
      case 'ready': confirmMsg = 'Xác nhận hoàn tất rà soát và chuyển chu kỳ sang trạng thái Chờ duyệt?'; break;
      case 'approve': confirmMsg = 'Xác nhận duyệt chu kỳ này để bắt đầu ghi điểm?'; break;
      case 'lock': confirmMsg = 'Xác nhận khóa chu kỳ này? Mọi thao tác ghi điểm sẽ bị vô hiệu hóa.'; break;
      case 'cancel': confirmMsg = 'Xác nhận hủy chu kỳ này?'; break;
    }
    setConfirmAction({ cycleId, action, msg: confirmMsg });
  };

  const executeStatusTransition = async () => {
    if (!confirmAction) return;
    const { cycleId, action } = confirmAction;
    setConfirmAction(null);

    try {
      let res;
      switch(action) {
        case 'submit': res = await submitEvaluationCycleReview(cycleId, authToken); break;
        case 'ready': res = await markEvaluationCycleReadyForApproval(cycleId, authToken); break;
        case 'approve': res = await approveEvaluationCycle(cycleId, authToken); break;
        case 'lock': res = await lockEvaluationCycle(cycleId, authToken); break;
        case 'cancel': res = await cancelEvaluationCycle(cycleId, authToken); break;
      }

      if (!res?.error) {
        success('Thay đổi trạng thái chu kỳ thành công!', 'Cập nhật trạng thái');
        fetchCyclesList();
        onCyclesUpdated();
      } else {
        // in dev, log full response for debugging
        if (import.meta.env.DEV) console.debug('Status transition error response:', res);

        // If backend reports evaluation not ready, surface a guided modal
        const detail = (res?.data as any)?.detail ?? null;
        if (detail && detail.code === 'EVALUATION_NOT_READY_FOR_APPROVAL') {
          setMissingDetails(detail.details || null);
          setComputeError(null);
          setPendingCycleId(cycleId);
          setMissingModalOpen(true);
          return;
        }

        error(fmtError(res?.error) || 'Không thể chuyển đổi trạng thái chu kỳ.', 'Cập nhật thất bại');
      }
    } catch (err) {
      console.error(err);
      error('Lỗi khi chuyển đổi trạng thái.', 'Lỗi hệ thống');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 font-medium">Bản nháp</Badge>;
      case 'MEMBER_REVIEW':
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 font-medium">Đang rà soát</Badge>;
      case 'READY_FOR_APPROVAL':
        return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 font-medium">Chờ duyệt</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 font-medium">Đã duyệt</Badge>;
      case 'LOCKED':
        return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 font-medium">Đã khóa</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 font-medium">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCycleTypeLabel = (type: string) => {
    switch (type) {
      case 'MONTHLY': return 'Theo tháng';
      case 'QUARTERLY': return 'Theo quý';
      case 'ACADEMIC_TERM': return 'Theo học kỳ';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 text-foreground bg-background transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-transparent border-0 py-1">
        <div>
          <h3 className="text-lg font-bold text-foreground">{t('discipline.cycles.title', 'Danh sách Chu kỳ Đánh giá')}</h3>
          <p className="text-sm text-secondary mt-0.5">{t('discipline.cycles.subtitle', 'Quản lý và kích hoạt các chu kỳ đánh giá hiệu suất thành viên.')}</p>
        </div>
        {isOperator && (
          <Button 
            onClick={handleOpenCreateModal} 
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-focus hover:opacity-95 text-white rounded-xl shadow-md border-0 shrink-0"
          >
            <Plus size={16} /> {t('discipline.cycles.createBtn', 'Tạo chu kỳ mới')}
          </Button>
        )}
      </div>

      <div className="bg-card/45 border border-border/30 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 size={32} className="animate-spin text-primary mr-2" />
            <span className="text-secondary font-medium">Đang tải danh sách chu kỳ...</span>
          </div>
        ) : cycles.length === 0 ? (
          <div className="text-center p-12 text-secondary font-medium">
            Chưa có chu kỳ đánh giá nào được tạo.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[65vh] relative custom-scrollbar">
            <Table className="relative min-w-[700px]">
              <TableHeader className="bg-muted/95 backdrop-blur-md sticky top-0 z-10 shadow-sm border-b border-border/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="font-semibold text-secondary-foreground">{t('discipline.cycles.thCode', 'Mã chu kỳ')}</TableHead>
                  <TableHead className="font-semibold text-secondary-foreground">{t('discipline.cycles.thName', 'Tên chu kỳ')}</TableHead>
                  <TableHead className="font-semibold text-secondary-foreground">{t('discipline.cycles.thType', 'Loại')}</TableHead>
                  <TableHead className="font-semibold text-secondary-foreground">{t('discipline.cycles.thTime', 'Thời gian')}</TableHead>
                  <TableHead className="font-semibold text-secondary-foreground">{t('discipline.cycles.thStatus', 'Trạng thái')}</TableHead>
                  <TableHead className="text-right font-semibold text-secondary-foreground">{t('common.thAction', 'Thao tác')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycles.map((cycle) => {
                  const isSelected = selectedCycleId === cycle.id;
                  return (
                    <TableRow 
                      key={cycle.id} 
                      className={`hover:bg-muted/40 transition-colors ${isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                    >
                      <TableCell className="font-bold text-foreground">{cycle.code}</TableCell>
                      <TableCell className="font-semibold">{cycle.name}</TableCell>
                      <TableCell className="text-secondary-foreground text-sm">{getCycleTypeLabel(cycle.type)}</TableCell>
                      <TableCell className="text-secondary text-sm">
                        {new Date(cycle.startDate).toLocaleDateString('vi-VN')} - {new Date(cycle.endDate).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell>{getStatusBadge(cycle.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1.5 flex-wrap">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-lg shadow-sm text-sm py-1 px-2.5 h-8 flex items-center gap-1"
                            onClick={() => onSelectCycle(cycle)}
                          >
                            <Eye size={13} /> {isSelected ? 'Đang chọn' : 'Chọn'}
                          </Button>

                          {isOperator && cycle.status === 'DRAFT' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="rounded-lg shadow-sm text-sm py-1 px-2.5 h-8 flex items-center gap-1"
                                onClick={() => handleOpenEditModal(cycle)}
                              >
                                <Edit2 size={13} /> Sửa
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="rounded-lg shadow-sm text-sm py-1 px-2.5 h-8 flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => initiateStatusTransition(cycle.id, 'submit')}
                              >
                                <CheckCircle2 size={13} /> Gửi duyệt
                              </Button>
                            </>
                          )}

                          {isOperator && cycle.status === 'MEMBER_REVIEW' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-lg shadow-sm text-sm py-1 px-2.5 h-8 flex items-center gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                              onClick={() => initiateStatusTransition(cycle.id, 'ready')}
                            >
                              <CheckCircle2 size={13} /> Hoàn tất rà soát
                            </Button>
                          )}

                          {isAdmin && cycle.status === 'READY_FOR_APPROVAL' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-lg shadow-sm text-sm py-1 px-2.5 h-8 flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => initiateStatusTransition(cycle.id, 'approve')}
                            >
                              <CheckCircle2 size={13} /> Phê duyệt
                            </Button>
                          )}

                          {isAdmin && cycle.status === 'APPROVED' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-lg shadow-sm text-sm py-1 px-2.5 h-8 flex items-center gap-1 text-purple-600 border-purple-200 hover:bg-purple-50"
                              onClick={() => initiateStatusTransition(cycle.id, 'lock')}
                            >
                              <Lock size={13} /> Khóa
                            </Button>
                          )}

                          {isOperator && (cycle.status === 'DRAFT' || cycle.status === 'MEMBER_REVIEW' || cycle.status === 'READY_FOR_APPROVAL' || cycle.status === 'APPROVED') && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-lg shadow-sm text-sm py-1 px-2.5 h-8 flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => initiateStatusTransition(cycle.id, 'cancel')}
                            >
                              <XCircle size={13} /> Hủy
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

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={formType === 'create' ? 'Tạo chu kỳ đánh giá mới' : 'Cập nhật chu kỳ đánh giá'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Mã chu kỳ <span className="text-red-500">*</span>
              </label>
              <Input 
                required 
                placeholder="VD: CK_2026_T05" 
                value={formData.code} 
                onChange={e => setFormData({ ...formData, code: e.target.value })} 
                disabled={formType === 'edit'}
                className="rounded-xl" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Tên chu kỳ <span className="text-red-500">*</span>
              </label>
              <Input 
                required 
                placeholder="VD: Đánh giá Tháng 05/2026" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                className="rounded-xl" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Loại chu kỳ</label>
              <Select 
                value={formData.type} 
                onChange={e => setFormData({ ...formData, type: e.target.value })} 
                className="w-full rounded-xl"
              >
                <option value="MONTHLY">Hàng tháng</option>
                <option value="QUARTERLY">Hàng quý</option>
                <option value="ACADEMIC_TERM">Học kỳ</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <DatePicker 
                value={formData.startDate} 
                onChange={val => setFormData({ ...formData, startDate: val })} 
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <DatePicker 
                value={formData.endDate} 
                onChange={val => setFormData({ ...formData, endDate: val })} 
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Mô tả chu kỳ</label>
            <textarea 
              rows={3}
              placeholder="Nhập mô tả thêm về chu kỳ đánh giá..."
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
              {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : 'Lưu thông tin'}
            </Button>
          </div>
        </form>
      </Modal>
      {/* Missing requirements modal (guided flow) */}
      <Modal
        isOpen={missingModalOpen}
        onClose={() => setMissingModalOpen(false)}
        title="Chu kỳ chưa sẵn sàng cho phê duyệt"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">Hệ thống phát hiện một số yêu cầu chưa hoàn thành trước khi chuyển chu kỳ sang trạng thái <strong>Chờ duyệt</strong>.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <div className="text-xs text-secondary">Số lượng thành viên đã được chấm</div>
              <div className="text-lg font-bold">{missingDetails?.totalMemberEvaluations ?? 0}</div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <div className="text-xs text-secondary">Khiếu nại mở</div>
              <div className="text-lg font-bold">{missingDetails?.openAppeals ?? 0}</div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <div className="text-xs text-secondary">Kết quả không ổn định</div>
              <div className="text-lg font-bold">{missingDetails?.unstableMemberEvaluations ?? 0}</div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <div className="text-xs text-secondary">Trạng thái thành viên</div>
              <div className="text-sm">{missingDetails?.memberStatusCounts ? JSON.stringify(missingDetails.memberStatusCounts) : '{}'}</div>
            </div>
          </div>

          {computeError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Lỗi Compute:</p>
                <p>{computeError}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => { setMissingModalOpen(false); }}>Đóng</Button>
            <Button
              onClick={async () => {
                  if (!pendingCycleId) return;
                  // keep modal open to show result details
                  try {
                    setIsSubmitting(true);
                    setComputeError(null);
                    const res = await computeEvaluationCycle(pendingCycleId, { strict: true, evidenceMode: 'approval', recomputeExisting: true }, authToken);
                    if (!res?.error) {
                      success('Đã chạy Compute cho chu kỳ. Vui lòng thử lại chuyển trạng thái.', 'Compute hoàn tất');
                      fetchCyclesList();
                      setMissingModalOpen(false);
                    } else {
                      // show backend validation details when 422
                      if (res.status === 422 && res.data?.detail) {
                        const detail = res.data.detail;
                        // Instead of overwriting missingDetails, show in computeError
                        const errorMsg = detail.message || fmtError(res.error);
                        setComputeError(errorMsg);
                        error('Compute thất bại do dữ liệu không hợp lệ.', 'Compute thất bại');
                      } else {
                        setComputeError(fmtError(res.error) || 'Không thể chạy Compute.');
                        error('Không thể chạy Compute.', 'Compute thất bại');
                      }
                    }
                  } catch (err) {
                    console.error(err);
                    error('Lỗi khi chạy Compute.', 'Lỗi hệ thống');
                    setMissingModalOpen(false);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
            >
              Chạy Compute
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setMissingModalOpen(false);
                // select cycle so user can navigate to cycle details (appeals/evidence)
                const cycle = cycles.find(c => c.id === pendingCycleId) || null;
                onSelectCycle(cycle);
                warning('Vui lòng mở tab Minh chứng / Khiếu nại để xử lý các khiếu nại mở.', 'Hành động cần làm');
              }}
            >
              Xem Khiếu nại / Minh chứng
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeStatusTransition}
        title="Xác nhận trạng thái"
        message={confirmAction?.msg || ''}
        isDestructive={confirmAction?.action === 'cancel'}
      />
    </div>
  );
};

export default EvaluationCyclesPanel;
