import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Loader2,
  Trash2,
  AlertTriangle,
  UserPlus,
  Edit2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserAccount, UserRole } from '../../types/app';
import { Member } from '../../data/members';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { Input } from '../ui/input';
import { Modal } from '../ui/modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table';
import { useToast } from '../ui/toast';
import {
  MemberCycleRole,
  EvaluationCycle,
  getMemberCycleRoles,
  createMemberCycleRole,
  deleteMemberCycleRole
} from '../../services/evaluations';
import { EVALUATION_UNIT_CODES } from '../../data/evaluations';
import { EvaluationMemberRolesSpreadsheet } from './EvaluationMemberRolesSpreadsheet';
import { createMemberCycleRolesBulk } from '../../services/evaluations';
import { ConfirmModal } from '../ui/ConfirmModal';
import { EvaluationMemberRolesGroupedList } from './EvaluationMemberRolesGroupedList';

interface EvaluationMemberRolesPanelProps {
  authToken?: string;
  currentUser: UserAccount;
  cycleId: string;
  cycle: EvaluationCycle;
  allMembers: Member[];
}

export const EvaluationMemberRolesPanel = ({
  authToken,
  currentUser,
  cycleId,
  cycle,
  allMembers
}: EvaluationMemberRolesPanelProps) => {
  const { success, error, warning } = useToast();
  const [roles, setRoles] = useState<MemberCycleRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'spreadsheet'>('list');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterDept, setFilterDept] = useState<string>('');
  const [editingRole, setEditingRole] = useState<MemberCycleRole | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ roleId: string, memberName: string } | null>(null);
  const rolesRequestSeqRef = React.useRef(0);

  // Filtered members for selector in Modal
  const filteredMembers = useMemo(() => {
    if (!filterDept) return allMembers;
    return allMembers.filter(m => m.ban && m.ban.some(b => b.toLowerCase().includes(filterDept.toLowerCase())));
  }, [allMembers, filterDept]);

  // Form State
  const [formData, setFormData] = useState({
    memberId: '',
    unitCode: 'BCNg',
    roleType: 'MEMBER', // MEMBER, LEAD, CONTRIBUTOR
    roleTitle: 'Thành viên',
    participationWeight: 1.0,
    isPrimary: true,
    note: ''
  });

  const currentMemberWeightsInfo = useMemo(() => {
    if (!formData.memberId) return null;
    const memberRoles = roles.filter(r => r.memberId === formData.memberId);
    
    const otherRoles = editingRole 
      ? memberRoles.filter(r => r.id !== editingRole.id)
      : memberRoles;
    
    const otherWeightsSum = otherRoles.reduce((sum, r) => sum + (r.participationWeight || 0), 0);
    const newTotalWeight = otherWeightsSum + (Number(formData.participationWeight) || 0);
    
    return {
      rolesCount: memberRoles.length,
      otherRoles,
      otherWeightsSum,
      newTotalWeight,
      isInvalid: Math.abs(newTotalWeight - 1.0) > 0.001
    };
  }, [formData.memberId, formData.participationWeight, roles, editingRole]);

  useEffect(() => {
    if (filteredMembers.length > 0) {
      if (!filteredMembers.some(m => m.id === formData.memberId)) {
        setFormData(prev => ({ ...prev, memberId: filteredMembers[0].id }));
      }
    } else {
      setFormData(prev => ({ ...prev, memberId: '' }));
    }
  }, [filteredMembers, formData.memberId]);

  // Suggest role fields when a member is selected (quick-fill)
  const suggestFromMember = (member?: Member) => {
    if (!member) return { unitCode: 'BCNg', roleTitle: 'Thành viên', participationWeight: 1.0 };
    const banText = (member.ban || []).join(' ').toLowerCase();
    let unitCode = 'BCNg';
    if (banText.includes('chu nhiem') || banText.includes('chủ nhiem')) unitCode = 'BCN';
    else if (banText.includes('công nghệ') || banText.includes('cong nghe')) unitCode = 'BCNg';
    else if (banText.includes('truyền thông') || banText.includes('truyen thong')) unitCode = 'BTT';
    else if (banText.includes('vận hành') || banText.includes('van hanh')) unitCode = 'BVH-NS';

    const roleTitle = member.role || 'Thành viên';
    const participationWeight = 1.0;
    return { unitCode, roleTitle, participationWeight };
  };

  useEffect(() => {
    if (editingRole) return; // don't override when editing
    if (!formData.memberId) return;
    const member = allMembers.find(m => m.id === formData.memberId);
    if (!member) return;
    const suggestion = suggestFromMember(member);
    setFormData(prev => ({
      ...prev,
      unitCode: suggestion.unitCode,
      roleTitle: suggestion.roleTitle,
      participationWeight: suggestion.participationWeight
    }));
  }, [formData.memberId, editingRole, allMembers]);

  const fetchRolesList = async () => {
    const requestSeq = ++rolesRequestSeqRef.current;
    setIsLoading(true);
    try {
      const res = await getMemberCycleRoles(cycleId, { pageSize: 1000 }, authToken);
      if (requestSeq !== rolesRequestSeqRef.current) {
        return;
      }

      if (res?.data?.items) {
        setRoles(res.data.items);
      } else if (res?.error) {
        error(res.error, 'Lỗi tải danh sách vai trò');
      }
    } catch (err) {
      if (requestSeq !== rolesRequestSeqRef.current) {
        return;
      }
      console.error(err);
      error('Đã xảy ra lỗi khi tải danh sách vai trò thành viên.', 'Lỗi tải vai trò');
    } finally {
      if (requestSeq === rolesRequestSeqRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    setRoles([]);
    fetchRolesList();
  }, [authToken, cycleId]);

  // Create member mapping
  const memberMap = useMemo(() => {
    return new Map(allMembers.map(m => [m.id, m]));
  }, [allMembers]);

  // Count members without any assigned role in this cycle
  const unassignedCount = useMemo(() => {
    const assigned = new Set(roles.map(r => r.memberId));
    return allMembers.filter(m => !assigned.has(m.id)).length;
  }, [roles, allMembers]);

  // List of members without assigned role (for suggestions)
  const unassignedMembers = useMemo(() => {
    const assigned = new Set(roles.map(r => r.memberId));
    return allMembers.filter(m => !assigned.has(m.id));
  }, [roles, allMembers]);

  // Helper check roles
  const hasRole = (allowedRoles: UserRole[]) => {
    if (currentUser.roles && currentUser.roles.length > 0) {
      return currentUser.roles.some(r => allowedRoles.includes(r));
    }
    return allowedRoles.includes(currentUser.role);
  };

  const isLocked = cycle.status === 'LOCKED';
  const canManageRoles = hasRole(['bcn', 'bvh_discipline', 'bvh_hr']) && !isLocked;

  const handleOpenAddModal = () => {
    setFilterDept('');
    setEditingRole(null);
    setFormData({
      memberId: allMembers[0]?.id || '',
      unitCode: 'BCNg',
      roleType: 'MEMBER',
      roleTitle: 'Thành viên',
      participationWeight: 1.0,
      isPrimary: true,
      note: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: MemberCycleRole) => {
    setFilterDept('');
    setEditingRole(role);
    setFormData({
      memberId: role.memberId,
      unitCode: role.unitCode,
      roleType: role.roleType,
      roleTitle: role.roleTitle || 'Thành viên',
      participationWeight: role.participationWeight,
      isPrimary: role.isPrimary,
      note: role.note || ''
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId || !formData.unitCode || !formData.roleType) {
      warning('Vui lòng nhập đầy đủ thông tin bắt buộc.', 'Thiếu thông tin');
      return;
    }

    setIsSubmitting(true);
    try {
      let res;
      if (editingRole) {
        res = await createMemberCycleRolesBulk(cycleId, [{
          memberId: formData.memberId,
          unitCode: formData.unitCode,
          roleType: formData.roleType,
          roleTitle: formData.roleTitle,
          participationWeight: Number(formData.participationWeight),
          isPrimary: formData.isPrimary,
          note: formData.note
        }], authToken);
      } else {
        res = await createMemberCycleRole(cycleId, {
          memberId: formData.memberId,
          unitCode: formData.unitCode,
          roleType: formData.roleType,
          roleTitle: formData.roleTitle,
          participationWeight: Number(formData.participationWeight),
          isPrimary: formData.isPrimary,
          note: formData.note
        }, authToken);
      }

      if (!res.error) {
        success(editingRole ? 'Đã cập nhật vai trò thành công!' : 'Đã gán vai trò thành công!', 'Gán vai trò');
        setIsModalOpen(false);
        fetchRolesList();
      } else {
        error(res.error || 'Lỗi không xác định khi lưu vai trò.', 'Lưu vai trò thất bại');
      }
    } catch (err) {
      console.error(err);
      error('Đã xảy ra lỗi khi gán vai trò.', 'Lỗi hệ thống');
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDeleteRole = async () => {
    if (!confirmDelete) return;
    try {
      const res = await deleteMemberCycleRole(confirmDelete.roleId, authToken);
      if (!res.error) {
        success('Xóa vai trò thành công!', 'Xóa vai trò');
        fetchRolesList();
      } else {
        error(res.error || 'Không thể xóa vai trò.', 'Xóa vai trò thất bại');
      }
    } catch (err) {
      console.error(err);
      error('Lỗi khi thực hiện xóa vai trò.', 'Lỗi hệ thống');
    } finally {
      setConfirmDelete(null);
    }
  };

  const getUnitLabel = (code: string) => {
    const found = EVALUATION_UNIT_CODES.find(u => u.value === code);
    return found ? found.label : code;
  };

  const getRoleTypeLabel = (type: string) => {
    switch (type) {
      case 'MEMBER': return 'Thành viên';
      case 'LEAD': return 'Trưởng nhóm / Ban';
      case 'CONTRIBUTOR': return 'Cộng tác viên';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {isLocked && (
        <div className="bg-purple-50 border border-purple-200 text-purple-700 dark:bg-purple-950/20 dark:border-purple-900 dark:text-purple-400 p-4 rounded-xl flex items-start gap-2.5">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Chu kỳ đã khóa</h4>
            <p className="text-sm mt-0.5">Dữ liệu vai trò thành viên đã được khóa cố định. Không thể gán thêm hoặc xóa vai trò.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-transparent border-0 py-1">
        <div>
          <h3 className="text-lg font-bold text-foreground">Vai trò Thành viên</h3>
          <p className="text-sm text-secondary mt-0.5">Phân quyền, phân ban và gán trọng số tham gia cho thành viên trong chu kỳ này.</p>
          <p className="text-sm text-secondary mt-1">Thành viên chưa gán vai trò: <span className="font-semibold text-foreground">{unassignedCount}</span> / {allMembers.length}</p>
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
              Bảng nhập nhanh
            </button>
          </div>

          {canManageRoles && viewMode === 'list' && (
            <Button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-focus hover:opacity-95 text-white rounded-xl shadow-md border-0"
            >
              <UserPlus size={16} /> Gán vai trò mới
            </Button>
          )}
        </div>
      </div>

      {viewMode === 'spreadsheet' ? (
        <EvaluationMemberRolesSpreadsheet
          cycleId={cycleId}
          authToken={authToken}
          allMembers={allMembers}
          onSaved={fetchRolesList}
          isLocked={isLocked}
        />
      ) : (
        <div className="bg-card/45 border border-border/30 rounded-xl shadow-sm overflow-hidden p-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 size={32} className="animate-spin text-primary mr-2" />
              <span className="text-secondary font-medium">
                Đang tải danh sách vai trò...
              </span>
            </div>
          ) : (
            <EvaluationMemberRolesGroupedList
              roles={roles}
              allMembers={allMembers}
              canManageRoles={canManageRoles}
              onEditRole={handleOpenEditModal}
              onAskRemoveRole={(role, memberName) =>
                setConfirmDelete({ roleId: role.id, memberName })
              }
            />
          )}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRole ? "Sửa vai trò thành viên" : "Gán vai trò thành viên mới"}>
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">

          <div className="rounded-xl border border-border/50 bg-muted/30 p-3 text-sm text-secondary">
            {editingRole
              ? 'Trạng thái: đang chỉnh sửa một vai trò đã có trên hệ thống.'
              : 'Trạng thái: đang tạo vai trò mới, chưa có trên hệ thống cho đến khi lưu.'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Lọc nhanh theo Ban CLB
              </label>
              <Select
                value={filterDept}
                onChange={e => setFilterDept(e.target.value)}
                className="w-full rounded-xl"
              >
                <option value="">-- Tất cả các Ban --</option>
                {['Ban Chủ nhiệm', 'Ban Vận hành', 'Ban Công nghệ', 'Ban Truyền thông'].map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
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
                disabled={!!editingRole}
                className="w-full rounded-xl"
              >
                {filteredMembers.length === 0 ? (
                  <option value="">Không có thành viên nào</option>
                ) : (
                  filteredMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.mssv})</option>
                  ))
                )}
              </Select>
              {formData.memberId && !editingRole && (
                <div className="mt-2 text-sm text-secondary">
                  Gợi ý: <span className="font-medium text-foreground">Ban</span> sẽ được tự động chọn theo thông tin thành viên; <span className="font-medium text-foreground">Chức vụ</span> gợi ý từ hồ sơ thành viên.
                </div>
              )}

              {/* Suggestions: show unassigned members for quick selection */}
              {!editingRole && unassignedMembers.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm text-secondary mb-2">Gợi ý thành viên chưa gán vai trò:</div>
                  <div className="flex flex-wrap gap-2">
                    {unassignedMembers.slice(0, 8).map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, memberId: m.id }))}
                        className="px-2 py-1 text-sm rounded-lg bg-muted/30 border border-border hover:bg-muted"
                        title={`${m.name} (${m.mssv})`}
                      >
                        {m.name.split(' ').slice(-1)[0]} • {m.mssv}
                      </button>
                    ))}
                    {unassignedMembers.length > 8 && (
                      <div className="px-2 py-1 text-sm rounded-lg text-secondary">+{unassignedMembers.length - 8} khác</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Ban / Bộ phận <span className="text-red-500">*</span>
              </label>
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
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Chức vụ / Chức danh
              </label>
              <Input
                value={formData.roleTitle}
                onChange={e => setFormData({ ...formData, roleTitle: e.target.value })}
                placeholder="VD: Thành viên, Trưởng nhóm"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Loại vai trò</label>
              <Select
                value={formData.roleType}
                onChange={e => setFormData({ ...formData, roleType: e.target.value })}
                className="w-full rounded-xl"
              >
                <option value="MEMBER">Thành viên</option>
                <option value="LEAD">Trưởng nhóm</option>
                <option value="CONTRIBUTOR">Cộng tác viên</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Trọng số tham gia</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={formData.participationWeight}
                onChange={e => setFormData({ ...formData, participationWeight: parseFloat(e.target.value) || 0 })}
                className="rounded-xl font-bold"
              />
              {currentMemberWeightsInfo && (
                <div className={`mt-2 text-xs font-semibold p-2 rounded-lg border ${currentMemberWeightsInfo.isInvalid ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/20 dark:border-orange-900/50' : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20'}`}>
                  {currentMemberWeightsInfo.isInvalid ? '⚠️' : '✓'} Tổng trọng số sau thay đổi: {currentMemberWeightsInfo.newTotalWeight.toFixed(2)}
                  {currentMemberWeightsInfo.isInvalid && (
                    <p className="mt-1 font-normal text-secondary-foreground">
                      Lưu ý: Để chạy tính điểm, tổng trọng số của thành viên phải bằng đúng 1.0. Bạn nên dùng <b>"Bảng nhập nhanh"</b> ngoài danh sách để sửa trọng số của các thành viên đa ban dễ dàng hơn.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center pt-8">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPrimary}
                  onChange={e => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary h-4.5 w-4.5"
                />
                <span className="text-sm font-semibold text-foreground">Là Ban chính</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Ghi chú</label>
            <textarea
              rows={2}
              placeholder="Nhập ghi chú (nếu có)..."
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
              {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : 'Lưu vai trò'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={executeDeleteRole}
        title="Xác nhận xóa"
        message={confirmDelete ? `Xác nhận xóa vai trò của thành viên ${confirmDelete.memberName}?` : ''}
        isDestructive={true}
      />
    </div>
  );
};

export default EvaluationMemberRolesPanel;
