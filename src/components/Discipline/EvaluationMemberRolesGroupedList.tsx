import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Edit2, Layers3, Trash2 } from 'lucide-react';
import { Member } from '../../data/members';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { MemberCycleRole } from '../../services/evaluations';
import { EVALUATION_UNIT_CODES } from '../../data/evaluations';

interface EvaluationMemberRolesGroupedListProps {
  roles: MemberCycleRole[];
  allMembers: Member[];
  canManageRoles: boolean;
  onEditRole: (role: MemberCycleRole) => void;
  onAskRemoveRole: (role: MemberCycleRole, memberName: string) => void;
}

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

const SavedBadge = () => (
  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
    <CheckCircle2 size={12} /> Đã lưu
  </span>
);

export const EvaluationMemberRolesGroupedList = ({
  roles,
  allMembers,
  canManageRoles,
  onEditRole,
  onAskRemoveRole
}: EvaluationMemberRolesGroupedListProps) => {
  const memberMap = useMemo(() => new Map(allMembers.map(m => [m.id, m])), [allMembers]);

  const groupedRoleRows = useMemo(() => {
    const map = new Map<string, { member: Member | null; memberId: string; roles: MemberCycleRole[] }>();

    for (const role of roles) {
      const current = map.get(role.memberId) || {
        member: memberMap.get(role.memberId) || null,
        memberId: role.memberId,
        roles: []
      };
      current.roles.push(role);
      map.set(role.memberId, current);
    }

    return Array.from(map.values())
      .map(group => ({
        ...group,
        roles: [...group.roles].sort((a, b) => {
          if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
          return a.unitCode.localeCompare(b.unitCode);
        })
      }))
      .sort((a, b) => {
        const aName = a.member?.name || a.memberId;
        const bName = b.member?.name || b.memberId;
        return aName.localeCompare(bName, 'vi');
      });
  }, [roles, memberMap]);

  const summary = useMemo(() => {
    const multiUnitMembers = groupedRoleRows.filter(group => group.roles.length > 1).length;
    const primaryRoles = roles.filter(role => role.isPrimary).length;
    return { multiUnitMembers, primaryRoles, roleCount: roles.length, memberCount: groupedRoleRows.length };
  }, [roles, groupedRoleRows]);

  if (roles.length === 0) {
    return (
      <div className="text-center p-12 text-secondary font-medium">
        Chưa có thành viên nào được gán vai trò trong chu kỳ này.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/40 bg-card/60 p-3">
          <div className="text-xs text-secondary font-semibold uppercase">Thành viên đã gán</div>
          <div className="text-2xl font-bold text-foreground mt-1">{summary.memberCount}</div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/60 p-3">
          <div className="text-xs text-secondary font-semibold uppercase">Dòng vai trò</div>
          <div className="text-2xl font-bold text-foreground mt-1">{summary.roleCount}</div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/60 p-3">
          <div className="text-xs text-secondary font-semibold uppercase">Thành viên đa ban</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-300 mt-1">{summary.multiUnitMembers}</div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/60 p-3">
          <div className="text-xs text-secondary font-semibold uppercase">Ban chính</div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{summary.primaryRoles}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold min-w-[220px]">Thành viên</TableHead>
              <TableHead className="font-semibold min-w-[420px]">Vai trò theo Ban/Tổ</TableHead>
              <TableHead className="font-semibold text-center min-w-[130px]">Trạng thái</TableHead>
              {canManageRoles && <TableHead className="text-right font-semibold min-w-[160px]">Thao tác</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedRoleRows.map((group) => {
              const memberName = group.member ? group.member.name : 'Không rõ';
              const memberMssv = group.member ? group.member.mssv : group.memberId;
              const isMultiUnit = group.roles.length > 1;
              return (
                <TableRow key={group.memberId} className="align-top hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="font-bold text-foreground">
                      {group.member ? (
                        <Link to={`/members/${group.memberId}`} className="text-primary hover:underline" target="_blank">
                          {memberName}
                        </Link>
                      ) : memberName}
                    </div>
                    <div className="text-xs text-secondary mt-0.5">{memberMssv}</div>
                    {isMultiUnit ? (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300">
                        <Layers3 size={12} /> Thành viên đa ban
                      </div>
                    ) : (
                      <div className="mt-2 inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-semibold text-secondary">
                        Một Ban/Tổ
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {group.roles.map((role) => (
                        <div key={role.id} className="rounded-xl border border-border/50 bg-background/80 p-3 dark:bg-background/60">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-foreground">{getUnitLabel(role.unitCode)}</span>
                                {role.isPrimary ? (
                                  <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold dark:text-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-900">Ban chính</span>
                                ) : (
                                  <span className="text-xs text-secondary bg-muted/50 border border-border/50 px-2 py-0.5 rounded-full font-semibold">Ban phụ</span>
                                )}
                                <SavedBadge />
                              </div>
                              <div className="mt-1 text-sm text-secondary">
                                {getRoleTypeLabel(role.roleType)} · {role.roleTitle || 'Thành viên'}
                              </div>
                              {role.note && <div className="mt-1 text-xs text-secondary">Ghi chú: {role.note}</div>}
                            </div>
                            <div className="text-sm font-bold text-primary md:text-right">
                              Trọng số: {role.participationWeight}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                      Đã có trên hệ thống
                    </div>
                  </TableCell>
                  {canManageRoles && (
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-2">
                        {group.roles.map(role => (
                          <div key={role.id} className="flex justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg shadow-sm text-sm py-1 px-2.5 h-8 flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-300 dark:border-blue-900 dark:hover:bg-blue-950/30"
                              onClick={() => onEditRole(role)}
                            >
                              <Edit2 size={13} /> Sửa
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg shadow-sm text-sm py-1 px-2.5 h-8 flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-300 dark:border-red-900 dark:hover:bg-red-950/30"
                              onClick={() => onAskRemoveRole(role, memberName)}
                            >
                              <Trash2 size={13} /> Xóa
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EvaluationMemberRolesGroupedList;
