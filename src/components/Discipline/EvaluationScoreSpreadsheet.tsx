import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Save, Filter, AlertTriangle } from 'lucide-react';
import { Member } from '../../data/members';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { useToast } from '../ui/toast';
import { 
  EvaluationCriterion, 
  EvaluationScoreEvent, 
  MemberCycleRole,
  getEvaluationScoreEvents,
  createEvaluationScoreEventBulk
} from '../../services/evaluations';
import { EVALUATION_COMPONENTS } from '../../data/evaluations';

interface EvaluationScoreSpreadsheetProps {
  cycleId: string;
  authToken?: string;
  cycleMembers: Member[];
  criteria: EvaluationCriterion[];
  cycleRoles: MemberCycleRole[];
  onSaved: () => void;
  isLocked: boolean;
}

export const EvaluationScoreSpreadsheet = ({
  cycleId,
  authToken,
  cycleMembers,
  criteria,
  cycleRoles,
  onSaved,
  isLocked
}: EvaluationScoreSpreadsheetProps) => {
  const { success, error, warning } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Filter states
  const [filterDept, setFilterDept] = useState('');
  const [filterComponent, setFilterComponent] = useState('');
  
  // Quick fill state
  const [quickFillCriterion, setQuickFillCriterion] = useState('');
  const [quickFillScore, setQuickFillScore] = useState('');
  
  // Data states
  const [events, setEvents] = useState<EvaluationScoreEvent[]>([]);
  
  // Edits state: key = `${memberId}_${criterionCode}`, value = string (to allow empty)
  const [edits, setEdits] = useState<Record<string, string>>({});

  // Fetch all events for the cycle
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

  // Derived filtered data
  const filteredMembers = useMemo(() => {
    if (!filterDept) return cycleMembers;
    const deptMemberIds = new Set(cycleRoles.filter(r => r.unitCode === filterDept).map(r => r.memberId));
    return cycleMembers.filter(m => deptMemberIds.has(m.id));
  }, [cycleMembers, cycleRoles, filterDept]);

  const filteredCriteria = useMemo(() => {
    let list = criteria.filter(c => c.isActive);
    if (filterComponent) {
      list = list.filter(c => c.component === filterComponent);
    }
    return list;
  }, [criteria, filterComponent]);

  // Cell Data Mapping
  // cellMap[`${memberId}_${criterionCode}`] = { totalOtherScores: number, spreadsheetScore: number | null }
  const cellMap = useMemo(() => {
    const map = new Map<string, { totalOther: number, spreadsheetVal: number | null }>();
    
    // Initialize
    for (const m of cycleMembers) {
      for (const c of criteria) {
        map.set(`${m.id}_${c.code}`, { totalOther: 0, spreadsheetVal: null });
      }
    }

    // Populate from events
    for (const ev of events) {
      if (ev.isVoid) continue;
      
      const key = `${ev.memberId}_${ev.criterionCode}`;
      const cell = map.get(key);
      if (!cell) continue;

      if (ev.sourceType === 'SPREADSHEET') {
        cell.spreadsheetVal = ev.scoreDelta;
      } else {
        cell.totalOther += ev.scoreDelta;
      }
    }
    
    return map;
  }, [events, cycleMembers, criteria]);

  // Handle cell input change
  const handleInputChange = (memberId: string, criterionCode: string, value: string) => {
    if (isLocked) return;
    const key = `${memberId}_${criterionCode}`;
    setEdits(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveAll = async () => {
    if (isLocked) {
      warning('Chu kỳ đã khóa, không thể ghi điểm.', 'Không hợp lệ');
      return;
    }

    // Build the bulk payload
    const payloadEvents = [];
    let hasChanges = false;

    for (const m of filteredMembers) {
      const role = cycleRoles.find(r => r.memberId === m.id);
      const unitCode = role ? role.unitCode : undefined;

      for (const c of filteredCriteria) {
        const key = `${m.id}_${c.code}`;
        const editValStr = edits[key];
        const cellInfo = cellMap.get(key);
        
        // If user hasn't typed anything for this cell in this session
        if (editValStr === undefined) continue;
        
        // Check if value actually changed from original spreadsheet value
        const originalVal = cellInfo?.spreadsheetVal;
        
        // If edit is empty, it means they cleared it. 
        // We can't delete easily via this bulk API right now (it expects a scoreDelta).
        // If they enter 0, it means 0 delta.
        if (editValStr.trim() === '') {
           // Skip clearing for now, or treat as 0
           continue; 
        }

        const numVal = parseFloat(editValStr);
        if (isNaN(numVal)) continue;

        if (numVal > c.maxScore) {
          warning(`Điểm của ${m.name} cho ${c.code} vượt quá tối đa (${c.maxScore}).`, 'Vượt quá điểm');
          return;
        }

        if (numVal !== originalVal) {
          hasChanges = true;
          payloadEvents.push({
            memberId: m.id,
            criterionCode: c.code,
            unitCode: unitCode,
            eventType: 'MANUAL_SCORE',
            sourceType: 'SPREADSHEET',
            sourceId: 'BULK',
            scoreDelta: numVal,
            note: 'Nhập từ Bảng tính (Spreadsheet)'
          });
        }
      }
    }

    if (!hasChanges || payloadEvents.length === 0) {
      warning('Không có thay đổi nào mới để lưu.', 'Chưa có thay đổi');
      return;
    }

    setIsSaving(true);
    try {
      const res = await createEvaluationScoreEventBulk(cycleId, payloadEvents, authToken);
      if (!res.error) {
        const createdCount = res?.data?.createdCount ?? payloadEvents.length;
        success(`Đã lưu thành công ${createdCount} điểm đánh giá!`, 'Lưu thành công');
        setEdits({}); // clear edits
        onSaved(); // trigger refresh
      } else {
        error(res?.error || 'Lỗi khi lưu dữ liệu bảng tính.', 'Lưu thất bại');
      }
    } catch (err) {
      console.error(err);
      error('Đã xảy ra lỗi hệ thống.', 'Lỗi hệ thống');
    } finally {
      setIsSaving(false);
    }
  };

  // Get display value for input
  const getInputValue = (memberId: string, criterionCode: string) => {
    const key = `${memberId}_${criterionCode}`;
    if (edits[key] !== undefined) {
      return edits[key];
    }
    const cell = cellMap.get(key);
    return cell?.spreadsheetVal !== null && cell?.spreadsheetVal !== undefined 
      ? cell.spreadsheetVal.toString() 
      : '';
  };

  const handleQuickFill = () => {
    if (!quickFillCriterion || quickFillScore === '') {
      warning('Vui lòng chọn tiêu chí và nhập số điểm cần điền nhanh.', 'Thiếu thông tin');
      return;
    }
    
    const numScore = parseFloat(quickFillScore);
    if (isNaN(numScore)) return;
    
    const c = filteredCriteria.find(c => c.code === quickFillCriterion);
    if (c && numScore > c.maxScore) {
      warning(`Điểm không được vượt quá tối đa của tiêu chí (${c.maxScore}).`, 'Vượt quá điểm');
      return;
    }

    setEdits(prev => {
      const newEdits = { ...prev };
      for (const m of filteredMembers) {
        newEdits[`${m.id}_${quickFillCriterion}`] = quickFillScore;
      }
      return newEdits;
    });
    success(`Đã điền điểm ${quickFillScore} cho ${filteredMembers.length} thành viên. Vui lòng bấm "Lưu tất cả" để xác nhận.`, 'Điền nhanh thành công');
  };

  return (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
      {isLocked && (
        <div className="bg-purple-50 border border-purple-200 text-purple-700 p-4 rounded-xl flex items-start gap-2.5">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Chu kỳ đã khóa</h4>
            <p className="text-sm mt-0.5">Dữ liệu điểm đã khóa. Không thể sửa điểm trong bảng tính.</p>
          </div>
        </div>
      )}

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-card/45 p-4 rounded-xl border border-border/30">
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
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
              {Array.from(new Set(cycleRoles.map(r => r.unitCode))).filter(Boolean).map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </Select>
          </div>
          
          <div className="w-full sm:w-56">
            <label className="block text-xs font-bold text-secondary uppercase mb-1.5">Lọc Nhóm Tiêu chí</label>
            <Select 
              value={filterComponent} 
              onChange={e => setFilterComponent(e.target.value)}
              className="w-full rounded-lg text-sm"
            >
              <option value="">-- Tất cả nhóm --</option>
              {EVALUATION_COMPONENTS.map(comp => (
                <option key={comp.value} value={comp.value}>{comp.label}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-end gap-3 mt-4 sm:mt-0">
          {!isLocked && (
            <div className="flex items-end gap-2 p-2.5 bg-background/50 rounded-lg border border-border/40">
              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase mb-1">Điền nhanh Tiêu chí</label>
                <Select
                  value={quickFillCriterion}
                  onChange={e => setQuickFillCriterion(e.target.value)}
                  className="w-32 h-8 text-xs rounded-md"
                >
                  <option value="">-- Chọn --</option>
                  {filteredCriteria.map(c => (
                    <option key={c.id} value={c.code}>{c.code}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase mb-1">Điểm</label>
                <Input
                  type="number"
                  step="0.5"
                  value={quickFillScore}
                  onChange={e => setQuickFillScore(e.target.value)}
                  placeholder="0"
                  className="w-16 h-8 text-xs rounded-md"
                />
              </div>
              <Button
                onClick={handleQuickFill}
                variant="secondary"
                className="h-8 px-3 text-xs bg-primary/10 text-primary hover:bg-primary/20 border-0"
              >
                Điền
              </Button>
            </div>
          )}

          {!isLocked && (
            <Button 
              onClick={handleSaveAll}
              disabled={isSaving || isLoading}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white rounded-lg shadow-sm border-0 h-10 px-4"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Lưu tất cả thay đổi
            </Button>
          )}
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="bg-white dark:bg-card border border-border/50 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <Loader2 size={32} className="animate-spin text-primary mb-4" />
            <span className="text-secondary font-medium">Đang tải dữ liệu điểm...</span>
          </div>
        ) : filteredCriteria.length === 0 || filteredMembers.length === 0 ? (
          <div className="text-center p-12 text-secondary font-medium">
            Không có dữ liệu phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[65vh] relative custom-scrollbar">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur shadow-sm">
                <tr>
                  <th className="sticky left-0 z-30 bg-muted/95 p-3 text-left font-bold border-b border-r border-border/50 min-w-[200px]">
                    Thành viên
                  </th>
                  {filteredCriteria.map(c => (
                    <th key={c.id} className="p-3 text-center font-semibold border-b border-r border-border/50 min-w-[120px] max-w-[150px]">
                      <div className="truncate" title={c.name}>{c.code}</div>
                      <div className="text-[10px] text-secondary font-normal mt-0.5">Tối đa: {c.maxScore}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m, idx) => (
                  <tr key={m.id} className={`${idx % 2 === 0 ? 'bg-transparent' : 'bg-muted/10'} hover:bg-muted/30 transition-colors`}>
                    <td className="sticky left-0 z-10 bg-inherit p-3 border-b border-r border-border/50 font-medium">
                      <div className="truncate font-bold">{m.name}</div>
                      <div className="text-xs text-secondary">{m.mssv}</div>
                    </td>
                    
                    {filteredCriteria.map(c => {
                      const cell = cellMap.get(`${m.id}_${c.code}`);
                      const totalOther = cell?.totalOther || 0;
                      
                      return (
                        <td key={c.id} className="p-2 border-b border-r border-border/50 text-center relative group">
                          <Input
                            type="number"
                            disabled={isLocked}
                            value={getInputValue(m.id, c.code)}
                            onChange={(e) => handleInputChange(m.id, c.code, e.target.value)}
                            className="w-full h-8 px-2 text-center text-sm font-semibold focus-visible:ring-1 bg-transparent border-transparent hover:border-border/50 transition-all"
                            placeholder="-"
                          />
                          {totalOther !== 0 && (
                            <div 
                              className="absolute bottom-0 right-1 text-[9px] font-medium opacity-60 pointer-events-none"
                              title={`Điểm khác từ hệ thống: ${totalOther}`}
                            >
                              Khác: {totalOther > 0 ? `+${totalOther}` : totalOther}
                            </div>
                          )}
                        </td>
                      );
                    })}
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
