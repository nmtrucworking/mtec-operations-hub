import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Save, Filter, AlertTriangle } from 'lucide-react';
import { Member } from '../../data/members';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { useToast } from '../ui/toast';
import { 
  MemberCycleRole,
  createMemberCycleRolesBulk,
  getMemberCycleRoles
} from '../../services/evaluations';
import { EVALUATION_UNIT_CODES } from '../../data/evaluations';

const EVALUATION_ROLE_TYPES = [
  { value: 'MEMBER', label: 'Thành viên' },
  { value: 'LEAD', label: 'Trưởng nhóm / Ban' },
  { value: 'CONTRIBUTOR', label: 'Cộng tác viên' }
];

interface EvaluationMemberRolesSpreadsheetProps {
  cycleId: string;
  authToken?: string;
  allMembers: Member[];
  onSaved: () => void;
  isLocked: boolean;
}

export const EvaluationMemberRolesSpreadsheet = ({
  cycleId,
  authToken,
  allMembers,
  onSaved,
  isLocked
}: EvaluationMemberRolesSpreadsheetProps) => {
  const { success, error, warning } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // existing roles
  const [existingRoles, setExistingRoles] = useState<MemberCycleRole[]>([]);
  
  // edits state: key = memberId, value = partial role data
  const [edits, setEdits] = useState<Record<string, any>>({});

  // Filter states
  const [filterDept, setFilterDept] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick fill state
  const [quickUnit, setQuickUnit] = useState('');
  const [quickRole, setQuickRole] = useState('');
  const [quickTitle, setQuickTitle] = useState('Thành viên');
  const [quickWeight, setQuickWeight] = useState('1.0');

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
    const fetchRoles = async () => {
      setIsLoading(true);
      try {
        const res = await getMemberCycleRoles(cycleId, { pageSize: 5000 }, authToken);
        if (res?.data?.items) {
          setExistingRoles(res.data.items);
        }
      } catch (err) {
        console.error(err);
        error('Không thể tải dữ liệu vai trò hiện tại.', 'Lỗi tải dữ liệu');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoles();
  }, [cycleId, authToken]);

  const cellMap = useMemo(() => {
    const map = new Map<string, MemberCycleRole>();
    for (const role of existingRoles) {
      if (role.isPrimary || !map.has(role.memberId)) {
        map.set(role.memberId, role);
      }
    }
    return map;
  }, [existingRoles]);

  const handleInputChange = (memberId: string, field: string, value: any) => {
    if (isLocked) return;
    setEdits(prev => {
      const currentEdit = prev[memberId] || {};
      return {
        ...prev,
        [memberId]: { ...currentEdit, [field]: value }
      };
    });
  };

  const getValue = (memberId: string, field: string, defaultVal: any = '') => {
    if (edits[memberId] !== undefined && edits[memberId][field] !== undefined) {
      return edits[memberId][field];
    }
    const role = cellMap.get(memberId);
    if (role) {
      return (role as any)[field];
    }
    return defaultVal;
  };

  const handleQuickFill = () => {
    setEdits(prev => {
      const newEdits = { ...prev };
      for (const m of filteredMembers) {
        newEdits[m.id] = {
           ...(newEdits[m.id] || {}),
           ...(quickUnit ? { unitCode: quickUnit } : {}),
           ...(quickRole ? { roleType: quickRole } : {}),
           ...(quickTitle ? { roleTitle: quickTitle } : {}),
           ...(quickWeight !== '' ? { participationWeight: parseFloat(quickWeight) || 1.0 } : {})
        };
      }
      return newEdits;
    });
    success(`Đã điền thông tin nhanh cho ${filteredMembers.length} thành viên.`, 'Điền nhanh');
  };

  const handleSaveAll = async () => {
    if (isLocked) {
      warning('Chu kỳ đã khóa.', 'Không hợp lệ');
      return;
    }

    const payloadRoles = [];
    let hasChanges = false;

    for (const m of allMembers) {
      const edit = edits[m.id];
      const role = cellMap.get(m.id);
      
      // If no edit and no role, skip
      if (!edit && !role) continue;
      
      // We send what's in the state (merging edit over existing role over defaults)
      const unitCode = edit?.unitCode !== undefined ? edit.unitCode : (role?.unitCode || '');
      const roleType = edit?.roleType !== undefined ? edit.roleType : (role?.roleType || '');
      const roleTitle = edit?.roleTitle !== undefined ? edit.roleTitle : (role?.roleTitle || 'Thành viên');
      const participationWeight = edit?.participationWeight !== undefined ? edit.participationWeight : (role?.participationWeight ?? 1.0);
      const isPrimary = edit?.isPrimary !== undefined ? edit.isPrimary : (role?.isPrimary ?? true);

      // If they selected a unit code and role type, it's valid
      if (unitCode && roleType) {
        // Did it change?
        const changed = !role || 
                        unitCode !== role.unitCode || 
                        roleType !== role.roleType || 
                        roleTitle !== role.roleTitle || 
                        participationWeight !== role.participationWeight ||
                        isPrimary !== role.isPrimary;
                        
        if (changed) {
          hasChanges = true;
        }

        payloadRoles.push({
          memberId: m.id,
          unitCode,
          roleType,
          roleTitle,
          participationWeight: Number(participationWeight),
          isPrimary
        });
      }
    }

    if (!hasChanges) {
      warning('Không có thay đổi nào để lưu.', 'Chưa có thay đổi');
      return;
    }

    setIsSaving(true);
    try {
      const res = await createMemberCycleRolesBulk(cycleId, payloadRoles, authToken);
      if (!res.error) {
        success(res?.data?.message || 'Đã cập nhật hàng loạt vai trò thành công!', 'Lưu thành công');
        setEdits({});
        onSaved();
      } else {
        error(res.error || 'Lỗi khi lưu dữ liệu vai trò.', 'Lưu thất bại');
      }
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
                  <option value="">-- Bỏ qua --</option>
                  {EVALUATION_ROLE_TYPES.map(r => (
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
                  <th className="sticky left-0 z-30 bg-muted/95 p-3 text-left font-bold border-b border-r border-border/50 w-[200px]">
                    Thành viên
                  </th>
                  <th className="p-3 text-left font-semibold border-b border-r border-border/50 min-w-[150px]">
                    Ban/Tổ (Unit)
                  </th>
                  <th className="p-3 text-left font-semibold border-b border-r border-border/50 min-w-[150px]">
                    Loại Vai trò
                  </th>
                  <th className="p-3 text-left font-semibold border-b border-r border-border/50 min-w-[150px]">
                    Chức danh (Title)
                  </th>
                  <th className="p-3 text-center font-semibold border-b border-r border-border/50 w-[100px]">
                    Trọng số
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m, idx) => (
                  <tr key={m.id} className={`${idx % 2 === 0 ? 'bg-transparent' : 'bg-muted/10'} hover:bg-muted/30 transition-colors`}>
                    <td className="sticky left-0 z-10 bg-inherit p-3 border-b border-r border-border/50 font-medium">
                      <div className="truncate font-bold">{m.name}</div>
                      <div className="text-xs text-secondary">{m.mssv}</div>
                    </td>
                    <td className="p-2 border-b border-r border-border/50">
                      <Select 
                        value={getValue(m.id, 'unitCode')}
                        onChange={e => handleInputChange(m.id, 'unitCode', e.target.value)}
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
                        value={getValue(m.id, 'roleType')}
                        onChange={e => handleInputChange(m.id, 'roleType', e.target.value)}
                        disabled={isLocked}
                        className="w-full h-8 text-sm bg-transparent border-transparent hover:border-border/50"
                      >
                        <option value="">-- Bỏ trống --</option>
                        {EVALUATION_ROLE_TYPES.map((r: { value: string; label: string }) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </Select>
                    </td>
                    <td className="p-2 border-b border-r border-border/50">
                      <Input
                        type="text"
                        value={getValue(m.id, 'roleTitle', 'Thành viên')}
                        onChange={e => handleInputChange(m.id, 'roleTitle', e.target.value)}
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
                        value={getValue(m.id, 'participationWeight', 1.0)}
                        onChange={e => handleInputChange(m.id, 'participationWeight', e.target.value)}
                        disabled={isLocked}
                        className="w-full h-8 text-sm text-center bg-transparent border-transparent hover:border-border/50 px-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
