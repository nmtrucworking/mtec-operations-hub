import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Save, Filter, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { Member } from '../../data/members';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { useToast } from '../ui/toast';
import { apiCall } from '../../services/api';
import {
  MemberCycleRole,
  createMemberCycleRolesBulk,
  getMemberCycleRoles
} from '../../services/evaluations';
import { EVALUATION_UNIT_CODES } from '../../data/evaluations';

import { useTranslation } from 'react-i18next';

const EVALUATION_ROLE_TYPES = (t: any) => [
  { value: 'MEMBER', label: t('discipline.roles.member', 'Thành viên') },
  { value: 'LEAD', label: t('discipline.roles.lead', 'Trưởng nhóm / Ban') },
  { value: 'CONTRIBUTOR', label: t('discipline.roles.contributor', 'Cộng tác viên') }
];

interface EvaluationMemberRolesSpreadsheetProps {
  cycleId: string;
  authToken?: string;
  allMembers: Member[];
  onSaved: () => void | Promise<void>;
  isLocked: boolean;
}

type RoleDefaults = {
  unitCode: string;
  roleType: string;
  roleTitle: string;
  participationWeight: number;
  isPrimary: boolean;
  note?: string | null;
};

type DraftRoleRow = {
  rowKey: string;
  memberId: string;
  defaults: RoleDefaults;
};

type RoleGridRow = {
  rowKey: string;
  member: Member;
  role?: MemberCycleRole;
  defaults: RoleDefaults;
  indexInMember: number;
  isPlaceholder: boolean;
  isDraft: boolean;
};

const createDraftKey = () => `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const roleToDefaults = (role?: MemberCycleRole): RoleDefaults => ({
  unitCode: role?.unitCode || '',
  roleType: role?.roleType || 'MEMBER',
  roleTitle: role?.roleTitle || 'Thành viên',
  participationWeight: role?.participationWeight ?? 1.0,
  isPrimary: role?.isPrimary ?? false,
  note: role?.note || ''
});

const getRoleValue = (row: RoleGridRow, edits: Record<string, any>, field: keyof RoleDefaults) => {
  if (edits[row.rowKey] !== undefined && edits[row.rowKey][field] !== undefined) {
    return edits[row.rowKey][field];
  }
  return (row.defaults as any)[field];
};

const normalizeWeight = (value: unknown) => {
  const parsed = parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 1.0;
};

export const EvaluationMemberRolesSpreadsheet = ({
  cycleId,
  authToken,
  allMembers,
  onSaved,
  isLocked
}: EvaluationMemberRolesSpreadsheetProps) => {
  const { success, error, warning } = useToast();
  const { t } = useTranslation();
  const roleTypesList = EVALUATION_ROLE_TYPES(t);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Existing roles fetched from API. A member can have multiple rows in one cycle.
  const [existingRoles, setExistingRoles] = useState<MemberCycleRole[]>([]);

  // Edits state: key = role row key, value = partial role data.
  const [edits, setEdits] = useState<Record<string, any>>({});

  // Draft rows represent additional Ban/Tổ roles before they are saved.
  const [draftRows, setDraftRows] = useState<DraftRoleRow[]>([]);

  // Filter states
  const [filterDept, setFilterDept] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick fill state
  const [quickUnit, setQuickUnit] = useState('');
  const [quickRole, setQuickRole] = useState('');
  const [quickTitle, setQuickTitle] = useState('Thành viên');
  const [quickWeight, setQuickWeight] = useState('1.0');

  const fetchExistingRoles = async () => {
    setIsLoading(true);
    try {
      const res = await getMemberCycleRoles(cycleId, { pageSize: 5000 }, authToken);
      if (res.error) {
        error(res.error, 'Không thể tải dữ liệu vai trò hiện tại');
        setExistingRoles([]);
        return;
      }

      setExistingRoles(res.data?.items || []);
    } catch (err) {
      console.error(err);
      error('Không thể tải dữ liệu vai trò hiện tại.', 'Lỗi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMembers = useMemo(() => {
    let list = allMembers;
    if (filterDept) {
      list = list.filter(m => m.ban && m.ban.some(b => b.toLowerCase().includes(filterDept.toLowerCase())));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.mssv.toLowerCase().includes(q));
    }
    return list;
  }, [allMembers, filterDept, searchQuery]);

  useEffect(() => {
    void fetchExistingRoles();
  }, [cycleId, authToken]);

  const roleRows = useMemo<RoleGridRow[]>(() => {
    const rolesByMember = new Map<string, MemberCycleRole[]>();
    for (const role of existingRoles) {
      const list = rolesByMember.get(role.memberId) || [];
      list.push(role);
      rolesByMember.set(role.memberId, list);
    }

    const draftsByMember = new Map<string, DraftRoleRow[]>();
    for (const draft of draftRows) {
      const list = draftsByMember.get(draft.memberId) || [];
      list.push(draft);
      draftsByMember.set(draft.memberId, list);
    }

    const rows: RoleGridRow[] = [];
    for (const member of filteredMembers) {
      const memberRoles = (rolesByMember.get(member.id) || []).sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
        return a.unitCode.localeCompare(b.unitCode);
      });
      const memberDrafts = draftsByMember.get(member.id) || [];

      if (memberRoles.length === 0 && memberDrafts.length === 0) {
        rows.push({
          rowKey: `placeholder:${member.id}`,
          member,
          defaults: {
            unitCode: '',
            roleType: 'MEMBER',
            roleTitle: 'Thành viên',
            participationWeight: 1.0,
            isPrimary: true,
            note: ''
          },
          indexInMember: 0,
          isPlaceholder: true,
          isDraft: true
        });
        continue;
      }

      memberRoles.forEach((role, index) => {
        rows.push({
          rowKey: role.id,
          member,
          role,
          defaults: roleToDefaults(role),
          indexInMember: index,
          isPlaceholder: false,
          isDraft: false
        });
      });

      memberDrafts.forEach((draft, index) => {
        rows.push({
          rowKey: draft.rowKey,
          member,
          defaults: draft.defaults,
          indexInMember: memberRoles.length + index,
          isPlaceholder: false,
          isDraft: true
        });
      });
    }

    return rows;
  }, [existingRoles, draftRows, filteredMembers]);

  const handleInputChange = (rowKey: string, field: string, value: any) => {
    if (isLocked) return;
    setEdits(prev => {
      const currentEdit = prev[rowKey] || {};
      return {
        ...prev,
        [rowKey]: { ...currentEdit, [field]: value }
      };
    });
  };

  const handleAddRoleRow = (member: Member) => {
    if (isLocked) return;
    setDraftRows(prev => [
      ...prev,
      {
        rowKey: createDraftKey(),
        memberId: member.id,
        defaults: {
          unitCode: '',
          roleType: 'MEMBER',
          roleTitle: 'Vai trò bổ sung',
          participationWeight: 0.5,
          isPrimary: false,
          note: ''
        }
      }
    ]);
  };

  const handleRemoveDraftRow = (rowKey: string) => {
    if (isLocked) return;
    setDraftRows(prev => prev.filter(row => row.rowKey !== rowKey));
    setEdits(prev => {
      const next = { ...prev };
      delete next[rowKey];
      return next;
    });
  };

  const handleQuickFill = () => {
    if (isLocked) return;

    setEdits(prev => {
      const newEdits = { ...prev };
      for (const row of roleRows) {
        newEdits[row.rowKey] = {
          ...(newEdits[row.rowKey] || {}),
          ...(quickUnit ? { unitCode: quickUnit } : {}),
          ...(quickRole ? { roleType: quickRole } : {}),
          ...(quickTitle !== '' ? { roleTitle: quickTitle } : {}),
          ...(quickWeight !== '' && !isNaN(parseFloat(quickWeight)) ? { participationWeight: Math.max(0, Math.min(1, parseFloat(quickWeight))) } : {})
        };
      }
      return newEdits;
    });
    success(`Đã điền thông tin nhanh cho ${roleRows.length} dòng vai trò đang hiển thị.`, 'Điền nhanh');
  };

  const handleClearEntries = () => {
    if (isLocked) {
      warning('Chu kỳ đã khóa.', 'Không hợp lệ');
      return;
    }
    // Ask for confirmation before clearing unsaved edits
    // eslint-disable-next-line no-restricted-globals
    const ok = confirm('Xác nhận xóa toàn bộ dữ liệu đang nhập (chưa lưu)? Hành động này không thể hoàn tác.');
    if (!ok) return;

    setEdits({});
    setDraftRows([]);
    setQuickUnit('');
    setQuickRole('');
    setQuickTitle('Thành viên');
    setQuickWeight('1.0');
    setFilterDept('');
    setSearchQuery('');
    success('Đã xóa nội dung điền danh tạm thời.', 'Đã xóa');
  };

  const updateExistingRole = async (roleId: string, payload: Record<string, unknown>) => {
    return apiCall(`/api/v2/evaluations/member-roles/${roleId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }, authToken);
  };

  const buildPayload = (row: RoleGridRow) => {
    const participationWeight = normalizeWeight(getRoleValue(row, edits, 'participationWeight'));
    return {
      memberId: row.member.id,
      unitCode: String(getRoleValue(row, edits, 'unitCode') || '').trim(),
      roleType: String(getRoleValue(row, edits, 'roleType') || '').trim(),
      roleTitle: String(getRoleValue(row, edits, 'roleTitle') || 'Thành viên').trim(),
      participationWeight,
      isPrimary: Boolean(getRoleValue(row, edits, 'isPrimary'))
    };
  };

  const rowHasChanges = (row: RoleGridRow) => {
    const edited = edits[row.rowKey];
    if (!edited) return false;
    if (!row.role) {
      const payload = buildPayload(row);
      return Boolean(payload.unitCode || payload.roleType || payload.roleTitle !== 'Thành viên' || payload.participationWeight !== 1.0);
    }
    const payload = buildPayload(row);
    return payload.unitCode !== row.role.unitCode
      || payload.roleType !== row.role.roleType
      || payload.roleTitle !== (row.role.roleTitle || 'Thành viên')
      || payload.participationWeight !== row.role.participationWeight
      || payload.isPrimary !== row.role.isPrimary;
  };

  const validateRowsBeforeSave = () => {
    const validRoleKeys = new Set<string>();
    const primaryCountByMember = new Map<string, number>();
    const unitKeySet = new Set<string>();

    for (const row of roleRows) {
      const payload = buildPayload(row);
      const hasAnyData = Boolean(row.role || payload.unitCode || payload.roleType || edits[row.rowKey]);

      if (!hasAnyData) continue;

      if (row.role && (!payload.unitCode || !payload.roleType)) {
        warning(`Vai trò hiện có của ${row.member.name} không được để trống Ban/Tổ hoặc Loại vai trò. Nếu cần xóa, dùng chế độ Danh sách.`, 'Dòng không hợp lệ');
        return false;
      }

      if (!payload.unitCode || !payload.roleType) {
        continue;
      }

      if (payload.participationWeight < 0 || payload.participationWeight > 1) {
        warning(`Thành viên ${row.member.name} có trọng số không hợp lệ (${payload.participationWeight}). Trọng số phải từ 0 đến 1.`, 'Trọng số không hợp lệ');
        return false;
      }

      const unitKey = `${payload.memberId}:${payload.unitCode}`;
      if (unitKeySet.has(unitKey)) {
        warning(`${row.member.name} đang có nhiều dòng cùng Ban/Tổ ${payload.unitCode}. Mỗi thành viên chỉ nên có một vai trò trên một Ban/Tổ trong cùng chu kỳ.`, 'Trùng Ban/Tổ');
        return false;
      }
      unitKeySet.add(unitKey);
      validRoleKeys.add(row.rowKey);

      if (payload.isPrimary) {
        primaryCountByMember.set(payload.memberId, (primaryCountByMember.get(payload.memberId) || 0) + 1);
      }
    }

    for (const [memberId, count] of primaryCountByMember.entries()) {
      if (count > 1) {
        const member = allMembers.find(m => m.id === memberId);
        warning(`${member?.name || memberId} có ${count} vai trò chính. Mỗi thành viên chỉ được có một Ban chính trong một chu kỳ.`, 'Trùng Ban chính');
        return false;
      }
    }

    return validRoleKeys;
  };

  const handleSaveAll = async () => {
    if (isLocked) {
      warning('Chu kỳ đã khóa.', 'Không hợp lệ');
      return;
    }

    const validRoleKeys = validateRowsBeforeSave();
    if (!validRoleKeys) return;

    const changedExistingRows = roleRows
      .filter(row => row.role && validRoleKeys.has(row.rowKey) && rowHasChanges(row));
    const newRows = roleRows
      .filter(row => !row.role && validRoleKeys.has(row.rowKey) && rowHasChanges(row));

    if (changedExistingRows.length === 0 && newRows.length === 0) {
      warning('Không có thay đổi nào để lưu.', 'Chưa có thay đổi');
      return;
    }

    setIsSaving(true);
    try {
      const nonPrimaryUpdates = changedExistingRows.filter(row => !buildPayload(row).isPrimary);
      const primaryUpdates = changedExistingRows.filter(row => buildPayload(row).isPrimary);

      let updatedCount = 0;
      for (const row of [...nonPrimaryUpdates, ...primaryUpdates]) {
        if (!row.role) continue;
        const payload = buildPayload(row);
        const res = await updateExistingRole(row.role.id, {
          unitCode: payload.unitCode,
          roleType: payload.roleType,
          roleTitle: payload.roleTitle,
          participationWeight: payload.participationWeight,
          isPrimary: payload.isPrimary
        });
        if (res.error) {
          error(res.error || 'Lỗi khi cập nhật vai trò hiện có.', 'Lưu thất bại');
          return;
        }
        updatedCount += 1;
      }

      let createdCount = 0;
      if (newRows.length > 0) {
        const createPayload = newRows.map(row => buildPayload(row));
        const res = await createMemberCycleRolesBulk(cycleId, createPayload, authToken);
        if (res.error) {
          error(res.error || 'Lỗi khi tạo vai trò bổ sung.', 'Lưu thất bại');
          return;
        }
        createdCount = res.data?.createdCount ?? createPayload.length;
      }

      success(`Đã cập nhật vai trò đa ban. Tạo mới: ${createdCount}, cập nhật: ${updatedCount}.`, 'Lưu thành công');
      setEdits({});
      setDraftRows([]);
      await fetchExistingRoles();
      await Promise.resolve(onSaved());
    } catch (err) {
      console.error(err);
      error('Đã xảy ra lỗi hệ thống.', 'Lỗi hệ thống');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
      {isLocked && (
        <div className="bg-purple-50 border border-purple-200 text-purple-700 p-4 rounded-xl flex items-start gap-2.5">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Chu kỳ đã khóa</h4>
            <p className="text-sm mt-0.5">Dữ liệu vai trò đã khóa. Không thể sửa bằng bảng tính.</p>
          </div>
        </div>
      )}

      <div className="bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 p-4 rounded-xl">
        <h4 className="font-bold text-sm">Cơ chế đa ban trong chu kỳ đánh giá</h4>
        <p className="text-sm mt-1 leading-relaxed">
          Mỗi thành viên có thể có nhiều dòng vai trò theo Ban/Tổ. Chỉ một dòng được đánh dấu là Ban chính; các dòng còn lại là vai trò phụ và được tính theo trọng số tham gia.
        </p>
      </div>

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 bg-card/45 p-4 rounded-xl border border-border/30">
        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          <div className="w-full sm:w-48">
            <label className="block text-xs font-bold text-secondary uppercase mb-1.5 flex items-center gap-1">
              <Filter size={12} /> Lọc Ban/Tổ
            </label>
            <Select
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              className="w-full rounded-lg text-sm"
            >
              <option value="">-- Tất cả --</option>
              {['Ban Chủ nhiệm', 'Ban Vận hành', 'Ban Công nghệ', 'Ban Truyền thông'].map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </Select>
          </div>
          <div className="w-full sm:w-64">
            <label className="block text-xs font-bold text-secondary uppercase mb-1.5 flex items-center gap-1">
              Tìm kiếm
            </label>
            <Input
              placeholder="Tên, MSSV..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-end gap-3 mt-2 xl:mt-0 w-full xl:w-auto">
          {!isLocked && (
            <div className="flex flex-wrap items-end gap-2 p-2.5 bg-background/50 rounded-lg border border-border/40">
              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase mb-1">Ban / Tổ</label>
                <Select
                  value={quickUnit}
                  onChange={e => setQuickUnit(e.target.value)}
                  className="w-28 h-8 text-xs rounded-md"
                >
                  <option value="">-- Bỏ qua --</option>
                  {EVALUATION_UNIT_CODES.map(u => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase mb-1">Vai trò</label>
                <Select
                  value={quickRole}
                  onChange={e => setQuickRole(e.target.value)}
                  className="w-28 h-8 text-xs rounded-md"
                >
                  <option value="">-- {t('common.skip', 'Bỏ qua')} --</option>
                  {roleTypesList.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase mb-1">Chức danh</label>
                <Input
                  value={quickTitle}
                  onChange={e => setQuickTitle(e.target.value)}
                  className="w-24 h-8 text-xs rounded-md"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase mb-1">Trọng số</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={quickWeight}
                  onChange={e => setQuickWeight(e.target.value)}
                  className="w-16 h-8 text-xs rounded-md"
                />
              </div>
              <Button
                onClick={handleQuickFill}
                variant="secondary"
                className="h-8 px-3 text-xs bg-primary/10 text-primary hover:bg-primary/20 border-0"
              >
                Điền nhanh
              </Button>
            </div>
          )}

          {!isLocked && (
            <Button
              onClick={handleSaveAll}
              disabled={isSaving || isLoading}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white rounded-lg shadow-sm border-0 h-10 px-4 whitespace-nowrap"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Lưu thay đổi
            </Button>
          )}
        </div>
      </div>

      {!isLocked && (
        <div className="flex justify-end mt-2">
          <Button
            onClick={handleClearEntries}
            variant="outline"
            className="flex items-center gap-2 text-sm rounded-lg h-9 px-3 text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 size={14} /> Xóa nội dung điền danh
          </Button>
        </div>
      )}

      <div className="bg-white dark:bg-card border border-border/50 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <Loader2 size={32} className="animate-spin text-primary mb-4" />
            <span className="text-secondary font-medium">Đang tải dữ liệu vai trò...</span>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[65vh] relative custom-scrollbar">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur shadow-sm">
                <tr>
                  <th className="sticky left-0 z-30 bg-muted/95 p-3 text-left font-bold border-b border-r border-border/50 w-[220px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    {t('common.member', 'Thành viên')}
                  </th>
                  <th className="p-3 text-left font-semibold border-b border-r border-border/50 min-w-[160px]">
                    {t('discipline.roles.unit', 'Ban/Tổ (Unit)')}
                  </th>
                  <th className="p-3 text-left font-semibold border-b border-r border-border/50 min-w-[150px]">
                    {t('discipline.roles.type', 'Loại Vai trò')}
                  </th>
                  <th className="p-3 text-left font-semibold border-b border-r border-border/50 min-w-[150px]">
                    {t('discipline.roles.title', 'Chức danh (Title)')}
                  </th>
                  <th className="p-3 text-center font-semibold border-b border-r border-border/50 w-[100px]">
                    {t('discipline.roles.weight', 'Trọng số')}
                  </th>
                  <th className="p-3 text-center font-semibold border-b border-r border-border/50 w-[110px]">
                    Ban chính
                  </th>
                  <th className="p-3 text-center font-semibold border-b border-border/50 w-[130px]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {roleRows.map((row, idx) => {
                  const bgClass = idx % 2 === 0 ? 'bg-background' : 'bg-muted/10';
                  const isSupplementary = row.indexInMember > 0;
                  return (
                    <tr key={row.rowKey} className={`${bgClass} hover:bg-muted/30 transition-colors`}>
                      <td className={`sticky left-0 z-10 p-3 border-b border-r border-border/50 font-medium ${bgClass} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}>
                        <div className="truncate font-bold">{row.member.name}</div>
                        <div className="text-xs text-secondary">{row.member.mssv}</div>
                        {isSupplementary ? (
                          <div className="mt-1 text-[11px] font-semibold text-indigo-600">Vai trò bổ sung #{row.indexInMember + 1}</div>
                        ) : (
                          <div className="mt-1 text-[11px] font-semibold text-emerald-700">Dòng vai trò chính/đầu tiên</div>
                        )}
                      </td>
                      <td className="p-2 border-b border-r border-border/50">
                        <Select
                          value={getRoleValue(row, edits, 'unitCode') as string}
                          onChange={e => handleInputChange(row.rowKey, 'unitCode', e.target.value)}
                          disabled={isLocked}
                          className="w-full h-8 text-sm bg-transparent border-transparent hover:border-border/50"
                        >
                          <option value="">-- Bỏ trống --</option>
                          {EVALUATION_UNIT_CODES.map(u => (
                            <option key={u.value} value={u.value}>{u.label}</option>
                          ))}
                        </Select>
                      </td>
                      <td className="p-2 border-b border-r border-border/50">
                        <Select
                          value={getRoleValue(row, edits, 'roleType') as string}
                          onChange={e => handleInputChange(row.rowKey, 'roleType', e.target.value)}
                          disabled={isLocked}
                          className="w-full h-8 text-sm bg-transparent border-transparent hover:border-border/50"
                        >
                          <option value="">-- Bỏ trống --</option>
                          {EVALUATION_ROLE_TYPES(t).map((r: { value: string; label: string }) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </Select>
                      </td>
                      <td className="p-2 border-b border-r border-border/50">
                        <Input
                          type="text"
                          value={getRoleValue(row, edits, 'roleTitle') as string}
                          onChange={e => handleInputChange(row.rowKey, 'roleTitle', e.target.value)}
                          disabled={isLocked}
                          className="w-full h-8 text-sm bg-transparent border-transparent hover:border-border/50 px-2"
                        />
                      </td>
                      <td className="p-2 border-b border-r border-border/50 text-center">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={String(getRoleValue(row, edits, 'participationWeight'))}
                          onChange={e => handleInputChange(row.rowKey, 'participationWeight', e.target.value)}
                          disabled={isLocked}
                          className="w-full h-8 text-sm text-center bg-transparent border-transparent hover:border-border/50 px-1"
                        />
                      </td>
                      <td className="p-2 border-b border-r border-border/50 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(getRoleValue(row, edits, 'isPrimary'))}
                          onChange={e => handleInputChange(row.rowKey, 'isPrimary', e.target.checked)}
                          disabled={isLocked}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          aria-label="Đánh dấu là Ban chính"
                        />
                      </td>
                      <td className="p-2 border-b border-border/50 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isLocked && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddRoleRow(row.member)}
                              className="h-8 rounded-lg text-xs px-2 flex items-center gap-1"
                              title="Thêm một vai trò Ban/Tổ khác cho thành viên này"
                            >
                              <Plus size={13} /> Thêm
                            </Button>
                          )}
                          {!isLocked && row.isDraft && !row.isPlaceholder && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveDraftRow(row.rowKey)}
                              className="h-8 rounded-lg text-xs px-2 flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                              title="Xóa dòng vai trò bổ sung chưa lưu"
                            >
                              <Trash2 size={13} /> Xóa
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};