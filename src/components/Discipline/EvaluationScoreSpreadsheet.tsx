import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Filter,
  Layers,
  Loader2,
  Save,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { Member } from '../../data/members';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { useToast } from '../ui/toast';
import {
  EvaluationCriterion,
  EvaluationScoreEvent,
  MemberCycleRole,
  createEvaluationScoreEventBulk,
  getEvaluationScoreEvents,
} from '../../services/evaluations';
import { EVALUATION_COMPONENTS } from '../../data/evaluations';
import { useTranslation } from 'react-i18next';

interface EvaluationScoreSpreadsheetProps {
  cycleId: string;
  authToken?: string;
  cycleMembers: Member[];
  criteria: EvaluationCriterion[];
  cycleRoles: MemberCycleRole[];
  onSaved: () => void;
  isLocked: boolean;
}

interface CellInfo {
  totalOther: number;
  spreadsheetVal: number | null;
}

interface VisibleMemberRow {
  member: Member;
  roles: MemberCycleRole[];
  criteria: EvaluationCriterion[];
}

const buildCellKey = (memberId: string, criterionCode: string) => `${memberId}::${criterionCode}`;

const parseCellKey = (key: string) => {
  const separatorIndex = key.indexOf('::');
  if (separatorIndex === -1) return null;
  return {
    memberId: key.slice(0, separatorIndex),
    criterionCode: key.slice(separatorIndex + 2),
  };
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const formatScore = (value: number) => Number(value.toFixed(2)).toString();

export const EvaluationScoreSpreadsheet = ({
  cycleId,
  authToken,
  cycleMembers,
  criteria,
  cycleRoles,
  onSaved,
  isLocked,
}: EvaluationScoreSpreadsheetProps) => {
  const { success, error, warning } = useToast();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filterDept, setFilterDept] = useState('');
  const [filterComponent, setFilterComponent] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [criterionSearch, setCriterionSearch] = useState('');
  const [quickFillCriterion, setQuickFillCriterion] = useState('');
  const [quickFillScore, setQuickFillScore] = useState('');
  const [quickFillSearch, setQuickFillSearch] = useState('');
  const [multiFillText, setMultiFillText] = useState('');
  const [expandedMemberIds, setExpandedMemberIds] = useState<Set<string>>(() => new Set());
  const [events, setEvents] = useState<EvaluationScoreEvent[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchAllEvents = async () => {
      setIsLoading(true);
      try {
        const res = await getEvaluationScoreEvents(cycleId, { pageSize: 5000 }, authToken);
        if (res?.data?.items) {
          setEvents(res.data.items);
        }
      } catch (err) {
        console.error(err);
        error('Không thể tải dữ liệu điểm hiện tại.', 'Lỗi tải dữ liệu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllEvents();
  }, [cycleId, authToken]);

  const rolesByMember = useMemo(() => {
    const map = new Map<string, MemberCycleRole[]>();
    for (const role of cycleRoles) {
      const current = map.get(role.memberId) ?? [];
      current.push(role);
      map.set(role.memberId, current);
    }

    for (const roles of map.values()) {
      roles.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.unitCode.localeCompare(b.unitCode));
    }

    return map;
  }, [cycleRoles]);

  const memberById = useMemo(() => new Map(cycleMembers.map(member => [member.id, member])), [cycleMembers]);

  const criterionByCode = useMemo(
    () => new Map(criteria.map(criterion => [criterion.code, criterion])),
    [criteria]
  );

  const unitOptions = useMemo(
    () => Array.from(new Set(cycleRoles.map(role => role.unitCode).filter(Boolean))).sort(),
    [cycleRoles]
  );

  const activeCriteria = useMemo(
    () =>
      criteria
        .filter(criterion => criterion.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code)),
    [criteria]
  );

  const getComponentLabel = (component: string) =>
    EVALUATION_COMPONENTS.find(item => item.value === component)?.label ?? component;

  const isUnitScopedCriterion = (criterion: EvaluationCriterion) => {
    const unitScope = normalizeText(criterion.unitScope || '');
    return Boolean(criterion.unitCode) || criterion.component === 'III_B' || unitScope.includes('unit');
  };

  const criterionAppliesToMember = (criterion: EvaluationCriterion, memberId: string) => {
    if (!criterion.isActive) return false;

    const memberRoles = rolesByMember.get(memberId) ?? [];
    if (!isUnitScopedCriterion(criterion)) return true;

    if (criterion.unitCode) {
      return memberRoles.some(role => role.unitCode === criterion.unitCode);
    }

    return criterion.component !== 'III_B' && memberRoles.length > 0;
  };

  const getEventUnitCode = (memberId: string, criterion: EvaluationCriterion) => {
    if (criterion.unitCode) return criterion.unitCode;
    if (!isUnitScopedCriterion(criterion)) return undefined;

    const roles = rolesByMember.get(memberId) ?? [];
    return roles.find(role => role.isPrimary)?.unitCode ?? roles[0]?.unitCode;
  };

  const filteredMembers = useMemo(() => {
    const query = normalizeText(memberSearch);
    const deptMemberIds = filterDept
      ? new Set(cycleRoles.filter(role => role.unitCode === filterDept).map(role => role.memberId))
      : null;

    return cycleMembers.filter(member => {
      if (deptMemberIds && !deptMemberIds.has(member.id)) return false;
      if (!query) return true;

      return [member.name, member.mssv, member.email, member.phone]
        .filter(Boolean)
        .some(value => normalizeText(String(value)).includes(query));
    });
  }, [cycleMembers, cycleRoles, filterDept, memberSearch]);

  const filteredCriteria = useMemo(() => {
    const query = normalizeText(criterionSearch);

    return activeCriteria.filter(criterion => {
      if (filterComponent && criterion.component !== filterComponent) return false;
      if (!query) return true;

      return [criterion.code, criterion.name, criterion.component, criterion.unitCode, criterion.unitScope]
        .filter(Boolean)
        .some(value => normalizeText(String(value)).includes(query));
    });
  }, [activeCriteria, criterionSearch, filterComponent]);

  const visibleRows = useMemo<VisibleMemberRow[]>(() => {
    return filteredMembers
      .map(member => {
        const memberCriteria = filteredCriteria.filter(criterion => criterionAppliesToMember(criterion, member.id));
        return {
          member,
          roles: rolesByMember.get(member.id) ?? [],
          criteria: memberCriteria,
        };
      })
      .filter(row => row.criteria.length > 0 || !criterionSearch.trim());
  }, [filteredMembers, filteredCriteria, rolesByMember, criterionSearch]);

  const cellMap = useMemo(() => {
    const map = new Map<string, CellInfo>();

    for (const event of events) {
      if (event.isVoid) continue;

      const key = buildCellKey(event.memberId, event.criterionCode);
      const cell = map.get(key) ?? { totalOther: 0, spreadsheetVal: null };

      if (event.sourceType === 'SPREADSHEET') {
        cell.spreadsheetVal = event.scoreDelta;
      } else {
        cell.totalOther += event.scoreDelta;
      }

      map.set(key, cell);
    }

    return map;
  }, [events]);

  const normalizedQuickFillSearch = useDeferredValue(quickFillSearch.trim());

  const quickFillCriteria = useMemo(() => {
    const query = normalizeText(normalizedQuickFillSearch);
    const scopedCriteria = filteredCriteria.filter(criterion =>
      visibleRows.some(row => row.criteria.some(item => item.code === criterion.code))
    );

    if (!query) return scopedCriteria.slice(0, 12);

    return scopedCriteria
      .filter(criterion => {
        const searchable = [criterion.code, criterion.name, criterion.component, criterion.unitCode]
          .filter(Boolean)
          .map(value => normalizeText(String(value)))
          .join(' ');
        return searchable.includes(query);
      })
      .sort((a, b) => {
        const aCodeRank = normalizeText(a.code).startsWith(query) ? 0 : 1;
        const bCodeRank = normalizeText(b.code).startsWith(query) ? 0 : 1;
        if (aCodeRank !== bCodeRank) return aCodeRank - bCodeRank;
        return a.code.localeCompare(b.code);
      })
      .slice(0, 12);
  }, [filteredCriteria, normalizedQuickFillSearch, visibleRows]);

  const selectedQuickFillCriterion = useMemo(
    () => activeCriteria.find(criterion => criterion.code === quickFillCriterion) ?? null,
    [activeCriteria, quickFillCriterion]
  );

  const totalApplicableCells = visibleRows.reduce((total, row) => total + row.criteria.length, 0);
  const editedCellCount = Object.keys(edits).length;

  const getInputValue = (memberId: string, criterionCode: string) => {
    const key = buildCellKey(memberId, criterionCode);
    if (edits[key] !== undefined) return edits[key];

    const cell = cellMap.get(key);
    return cell?.spreadsheetVal !== null && cell?.spreadsheetVal !== undefined
      ? formatScore(cell.spreadsheetVal)
      : '';
  };

  const getMemberRoleSummary = (roles: MemberCycleRole[]) => {
    if (roles.length === 0) return 'Chưa có vai trò trong chu kỳ';

    return roles
      .map(role => `${role.unitCode}${role.isPrimary ? ' chính' : ''}${role.participationWeight ? ` ${formatScore(role.participationWeight * 100)}%` : ''}`)
      .join(' · ');
  };

  const toggleMember = (memberId: string) => {
    setExpandedMemberIds(prev => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const setAllVisibleExpanded = (expanded: boolean) => {
    setExpandedMemberIds(expanded ? new Set(visibleRows.map(row => row.member.id)) : new Set());
  };

  const handleInputChange = (memberId: string, criterionCode: string, value: string) => {
    if (isLocked) return;

    const key = buildCellKey(memberId, criterionCode);
    setEdits(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyScoreToRows = (criterion: EvaluationCriterion, scoreText: string) => {
    const eligibleRows = visibleRows.filter(row => row.criteria.some(item => item.code === criterion.code));
    if (eligibleRows.length === 0) {
      warning('Không có thành viên nào trong bộ lọc hiện tại phù hợp với tiêu chí này.', 'Không có đối tượng áp dụng');
      return;
    }

    setEdits(prev => {
      const next = { ...prev };
      for (const row of eligibleRows) {
        next[buildCellKey(row.member.id, criterion.code)] = scoreText;
      }
      return next;
    });

    success(
      `Đã điền ${scoreText} cho ${eligibleRows.length} thành viên phù hợp với ${criterion.code}.`,
      'Điền nhanh thành công'
    );
  };

  const handleQuickFill = () => {
    const resolvedCriterionCode =
      quickFillCriterion || (quickFillCriteria.length === 1 ? quickFillCriteria[0].code : '');

    if (!resolvedCriterionCode || quickFillScore.trim() === '') {
      warning('Vui lòng chọn tiêu chí và nhập số điểm cần điền nhanh.', 'Thiếu thông tin');
      return;
    }

    const criterion = activeCriteria.find(item => item.code === resolvedCriterionCode);
    if (!criterion) {
      warning('Tiêu chí đã chọn không tồn tại hoặc không còn hoạt động.', 'Tiêu chí không hợp lệ');
      return;
    }

    const score = Number(quickFillScore);
    if (Number.isNaN(score)) {
      warning('Điểm cần điền nhanh không hợp lệ.', 'Điểm không hợp lệ');
      return;
    }

    if (score > criterion.maxScore) {
      warning(`Điểm không được vượt quá tối đa của tiêu chí (${criterion.maxScore}).`, 'Vượt quá điểm');
      return;
    }

    setQuickFillCriterion(resolvedCriterionCode);
    applyScoreToRows(criterion, quickFillScore);
  };

  const handleQuickFillSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;

    if (!quickFillCriterion && quickFillCriteria.length > 0) {
      setQuickFillCriterion(quickFillCriteria[0].code);
      setQuickFillSearch(`${quickFillCriteria[0].code} ${quickFillCriteria[0].name}`);
      return;
    }

    handleQuickFill();
  };

  const handleApplyMultiFill = () => {
    if (!multiFillText.trim()) {
      warning('Vui lòng dán danh sách tiêu chí và điểm.', 'Thiếu dữ liệu');
      return;
    }

    const lines = multiFillText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const parsedRows: Array<{ criterion: EvaluationCriterion; scoreText: string; score: number }> = [];

    for (const line of lines) {
      const parts = line.split(/[,;:\t ]+/).filter(Boolean);
      if (parts.length < 2) continue;

      const [code, scoreText] = parts;
      const criterion = activeCriteria.find(item => item.code === code);
      const score = Number(scoreText);

      if (!criterion) {
        warning(`Tiêu chí ${code} không tồn tại hoặc không còn hoạt động.`, 'Tiêu chí không hợp lệ');
        return;
      }

      if (Number.isNaN(score)) {
        warning(`Điểm ${scoreText} cho ${code} không hợp lệ.`, 'Điểm không hợp lệ');
        return;
      }

      if (score > criterion.maxScore) {
        warning(`Điểm ${score} cho ${code} vượt quá tối đa (${criterion.maxScore}).`, 'Vượt quá điểm');
        return;
      }

      parsedRows.push({ criterion, scoreText, score });
    }

    if (parsedRows.length === 0) {
      warning('Không tìm thấy cặp tiêu chí và điểm hợp lệ trong dữ liệu đã dán.', 'Dữ liệu không hợp lệ');
      return;
    }

    const entriesToApply: Array<{ memberId: string; criterionCode: string; scoreText: string }> = [];
    for (const row of visibleRows) {
      for (const item of parsedRows) {
        if (!row.criteria.some(criterion => criterion.code === item.criterion.code)) continue;
        entriesToApply.push({
          memberId: row.member.id,
          criterionCode: item.criterion.code,
          scoreText: item.scoreText,
        });
      }
    }

    if (entriesToApply.length === 0) {
      warning('Các tiêu chí đã dán không áp dụng cho thành viên nào trong bộ lọc hiện tại.', 'Không có dữ liệu áp dụng');
      return;
    }

    setEdits(prev => {
      const next = { ...prev };
      for (const entry of entriesToApply) {
        next[buildCellKey(entry.memberId, entry.criterionCode)] = entry.scoreText;
      }
      return next;
    });

    success(`Đã áp dụng ${parsedRows.length} tiêu chí cho ${entriesToApply.length} ô phù hợp.`, 'Áp dụng thành công');
    setMultiFillText('');
  };

  const handleSaveAll = async () => {
    if (isLocked) {
      warning('Chu kỳ đã khóa, không thể ghi điểm.', 'Không hợp lệ');
      return;
    }

    const payloadEvents = [];

    for (const [key, editValue] of Object.entries(edits)) {
      const parsedKey = parseCellKey(key);
      if (!parsedKey || editValue.trim() === '') continue;

      const member = memberById.get(parsedKey.memberId);
      const criterion = criterionByCode.get(parsedKey.criterionCode);
      if (!member || !criterion || !criterionAppliesToMember(criterion, member.id)) continue;

      const score = Number(editValue);
      if (Number.isNaN(score)) continue;

      if (score > criterion.maxScore) {
        warning(`Điểm của ${member.name} cho ${criterion.code} vượt quá tối đa (${criterion.maxScore}).`, 'Vượt quá điểm');
        return;
      }

      const originalVal = cellMap.get(key)?.spreadsheetVal;
      if (score === originalVal) continue;

      payloadEvents.push({
        memberId: member.id,
        criterionCode: criterion.code,
        unitCode: getEventUnitCode(member.id, criterion),
        eventType: 'MANUAL_SCORE',
        sourceType: 'SPREADSHEET',
        sourceId: 'BULK',
        scoreDelta: score,
        note: 'Nhập từ bảng điểm đánh giá',
      });
    }

    if (payloadEvents.length === 0) {
      warning('Không có thay đổi mới để lưu.', 'Chưa có thay đổi');
      return;
    }

    setIsSaving(true);
    try {
      const res = await createEvaluationScoreEventBulk(cycleId, payloadEvents, authToken);
      if (!res.error) {
        const createdCount = res?.data?.createdCount ?? payloadEvents.length;
        success(`Đã lưu thành công ${createdCount} điểm đánh giá.`, 'Lưu thành công');
        setEdits({});
        onSaved();
      } else {
        error(res?.error || 'Lỗi khi lưu dữ liệu bảng điểm.', 'Lưu thất bại');
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
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-purple-700 flex items-start gap-2.5">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Chu kỳ đã khóa</h4>
            <p className="text-sm mt-0.5">Dữ liệu điểm đã khóa. Không thể sửa điểm trong bảng nhập.</p>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 flex items-start gap-2.5">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold">Chỉ hiển thị tiêu chí phù hợp theo vai trò/ban của từng thành viên.</p>
          <p className="mt-1">
            Tiêu chí đặc thù III-B được lọc theo <span className="font-semibold">unitCode</span> và vai trò trong chu kỳ,
            tránh áp toàn bộ tiêu chí của mọi ban cho mọi thành viên.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border/40 bg-card/60 p-4 space-y-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-bold uppercase text-secondary">
              <Filter size={12} /> {t('discipline.filterDept', 'Lọc Ban/Tổ')}
            </label>
            <Select value={filterDept} onChange={event => setFilterDept(event.target.value)} className="rounded-lg">
              <option value="">-- {t('common.all', 'Tất cả')} --</option>
              {unitOptions.map(unitCode => (
                <option key={unitCode} value={unitCode}>{unitCode}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-bold uppercase text-secondary">
              <Layers size={12} /> {t('discipline.filterGroup', 'Lọc nhóm tiêu chí')}
            </label>
            <Select value={filterComponent} onChange={event => setFilterComponent(event.target.value)} className="rounded-lg">
              <option value="">-- {t('common.allGroups', 'Tất cả nhóm')} --</option>
              {EVALUATION_COMPONENTS.map(component => (
                <option key={component.value} value={component.value}>{component.label}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-bold uppercase text-secondary">
              <Search size={12} /> Tìm thành viên
            </label>
            <Input
              value={memberSearch}
              onChange={event => setMemberSearch(event.target.value)}
              placeholder="Tên, MSSV, email..."
              className="rounded-lg"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-bold uppercase text-secondary">
              <Search size={12} /> Tìm tiêu chí
            </label>
            <Input
              value={criterionSearch}
              onChange={event => setCriterionSearch(event.target.value)}
              placeholder="Mã, tên, ban..."
              className="rounded-lg"
            />
          </div>
        </div>

        {!isLocked && (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="rounded-lg border border-border/40 bg-background/70 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase text-secondary">
                    <Sparkles size={12} /> Điền nhanh một tiêu chí
                  </label>
                  <Input
                    value={quickFillSearch}
                    onChange={event => {
                      setQuickFillSearch(event.target.value);
                      setQuickFillCriterion('');
                    }}
                    onKeyDown={handleQuickFillSearchKeyDown}
                    placeholder="Gõ mã, tên hoặc nhóm tiêu chí..."
                    className="h-9 rounded-md text-sm"
                  />
                </div>
                <div className="w-full sm:w-24">
                  <label className="mb-1 block text-[11px] font-bold uppercase text-secondary">
                    {t('discipline.score', 'Điểm')}
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    value={quickFillScore}
                    onChange={event => setQuickFillScore(event.target.value)}
                    onKeyDown={handleQuickFillSearchKeyDown}
                    placeholder="0"
                    className="h-9 rounded-md text-sm"
                  />
                </div>
                <Button onClick={handleQuickFill} variant="secondary" className="h-9 px-4">
                  Điền
                </Button>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-secondary">
                <span className="min-w-0 truncate">
                  {selectedQuickFillCriterion
                    ? `Đang chọn: ${selectedQuickFillCriterion.code} - ${selectedQuickFillCriterion.name}`
                    : quickFillSearch.trim()
                      ? `Tìm thấy ${quickFillCriteria.length} tiêu chí phù hợp trong phạm vi đang lọc`
                      : `Gợi ý ${quickFillCriteria.length} tiêu chí đang áp dụng`}
                </span>
                {(quickFillSearch || quickFillCriterion || quickFillScore) && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuickFillSearch('');
                      setQuickFillCriterion('');
                      setQuickFillScore('');
                    }}
                    className="inline-flex shrink-0 items-center gap-1 text-secondary transition-colors hover:text-foreground"
                  >
                    <X size={12} /> Xóa
                  </button>
                )}
              </div>

              {quickFillCriteria.length > 0 && (
                <div className="mt-2 max-h-40 overflow-auto rounded-md border border-border/50 bg-background/80 p-1 custom-scrollbar">
                  {quickFillCriteria.map(criterion => {
                    const isSelected = criterion.code === quickFillCriterion;
                    return (
                      <button
                        key={`${criterion.id}-${criterion.unitCode ?? 'all'}`}
                        type="button"
                        onClick={() => {
                          setQuickFillCriterion(criterion.code);
                          setQuickFillSearch(`${criterion.code} ${criterion.name}`);
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                          isSelected
                            ? 'border border-primary/20 bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-muted/70'
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="font-semibold">{criterion.code}</span>
                          <span className="mx-1 text-secondary">-</span>
                          <span className="inline-block max-w-[240px] truncate align-bottom" title={criterion.name}>
                            {criterion.name}
                          </span>
                        </span>
                        <span className="shrink-0 text-[10px] text-secondary">
                          {criterion.unitCode ?? criterion.component} · Max {criterion.maxScore}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border/40 bg-background/70 p-3">
              <label className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase text-secondary">
                <ClipboardList size={12} /> Dán nhiều tiêu chí
              </label>
              <textarea
                value={multiFillText}
                onChange={event => setMultiFillText(event.target.value)}
                placeholder={`VD:\nIII-B.BCNg.01, 4\nII.02 1.5\nIII-B.BTT.03:2`}
                className="min-h-[94px] w-full resize-y rounded-md border border-border bg-card p-2 text-sm text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-highlight/20"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button onClick={handleApplyMultiFill} variant="secondary" size="sm">Áp dụng nhiều</Button>
                <Button onClick={() => setMultiFillText('')} variant="ghost" size="sm">Xóa nội dung</Button>
                <span className="text-xs text-secondary">Mỗi dòng: mã tiêu chí, điểm. Chỉ áp dụng ô hợp lệ theo vai trò.</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-border/40 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div className="rounded-md bg-background/70 p-2">
              <div className="text-xs text-secondary">Thành viên</div>
              <div className="font-bold">{visibleRows.length}</div>
            </div>
            <div className="rounded-md bg-background/70 p-2">
              <div className="text-xs text-secondary">Tiêu chí lọc</div>
              <div className="font-bold">{filteredCriteria.length}</div>
            </div>
            <div className="rounded-md bg-background/70 p-2">
              <div className="text-xs text-secondary">Ô hợp lệ</div>
              <div className="font-bold">{totalApplicableCells}</div>
            </div>
            <div className="rounded-md bg-background/70 p-2">
              <div className="text-xs text-secondary">Đã sửa</div>
              <div className="font-bold">{editedCellCount}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setAllVisibleExpanded(true)}>
              Mở tất cả đang lọc
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAllVisibleExpanded(false)}>
              Thu gọn
            </Button>
            {!isLocked && (
              <Button
                onClick={handleSaveAll}
                disabled={isSaving || isLoading}
                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Lưu tất cả thay đổi
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/50 bg-white shadow-sm dark:bg-card">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <Loader2 size={32} className="mb-4 animate-spin text-primary" />
            <span className="font-medium text-secondary">Đang tải dữ liệu điểm...</span>
          </div>
        ) : visibleRows.length === 0 ? (
          <div className="p-12 text-center font-medium text-secondary">
            Không có thành viên hoặc tiêu chí phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="max-h-[68vh] space-y-2 overflow-auto p-3 custom-scrollbar">
            {visibleRows.map(row => {
              const isExpanded = expandedMemberIds.has(row.member.id);
              const editedForMember = row.criteria.filter(criterion => edits[buildCellKey(row.member.id, criterion.code)] !== undefined).length;

              return (
                <section key={row.member.id} className="rounded-lg border border-border/50 bg-background">
                  <button
                    type="button"
                    onClick={() => toggleMember(row.member.id)}
                    className="flex w-full flex-col gap-2 p-3 text-left transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-foreground">{row.member.name}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-secondary">{row.member.mssv}</span>
                        {editedForMember > 0 && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            {editedForMember} ô đã sửa
                          </span>
                        )}
                      </div>
                      <div className="mt-1 truncate text-xs text-secondary" title={getMemberRoleSummary(row.roles)}>
                        {getMemberRoleSummary(row.roles)}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 text-sm text-secondary">
                      <span>{row.criteria.length} tiêu chí áp dụng</span>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border/40 p-3">
                      {row.criteria.length === 0 ? (
                        <div className="rounded-md bg-muted/30 p-4 text-sm text-secondary">
                          Thành viên này chưa có tiêu chí phù hợp trong bộ lọc hiện tại.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 2xl:grid-cols-3">
                          {row.criteria.map(criterion => {
                            const key = buildCellKey(row.member.id, criterion.code);
                            const cell = cellMap.get(key);
                            const totalOther = cell?.totalOther ?? 0;
                            const hasEdit = edits[key] !== undefined;

                            return (
                              <div
                                key={`${criterion.id}-${criterion.unitCode ?? 'all'}`}
                                className={`rounded-lg border p-3 transition-colors ${
                                  hasEdit ? 'border-blue-300 bg-blue-50/70 dark:bg-blue-950/20' : 'border-border/50 bg-card'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="font-semibold text-foreground">{criterion.code}</span>
                                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-secondary">
                                        {criterion.unitCode ?? getComponentLabel(criterion.component)}
                                      </span>
                                    </div>
                                    <p className="mt-1 line-clamp-2 text-xs text-secondary" title={criterion.name}>
                                      {criterion.name}
                                    </p>
                                  </div>
                                  <div className="shrink-0 text-right text-[11px] text-secondary">
                                    <div>Max</div>
                                    <div className="font-bold text-foreground">{criterion.maxScore}</div>
                                  </div>
                                </div>

                                <div className="mt-3 flex items-end gap-2">
                                  <div className="min-w-0 flex-1">
                                    <label className="mb-1 block text-[10px] font-bold uppercase text-secondary">
                                      Điểm nhập
                                    </label>
                                    <Input
                                      type="number"
                                      disabled={isLocked}
                                      value={getInputValue(row.member.id, criterion.code)}
                                      onChange={event => handleInputChange(row.member.id, criterion.code, event.target.value)}
                                      className="h-9 rounded-md text-center text-sm font-semibold"
                                      placeholder="-"
                                    />
                                  </div>
                                  {totalOther !== 0 && (
                                    <div
                                      className="mb-1 rounded-md bg-muted px-2 py-1 text-[11px] text-secondary"
                                      title={`Điểm khác từ hệ thống: ${totalOther}`}
                                    >
                                      Khác {totalOther > 0 ? `+${formatScore(totalOther)}` : formatScore(totalOther)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
