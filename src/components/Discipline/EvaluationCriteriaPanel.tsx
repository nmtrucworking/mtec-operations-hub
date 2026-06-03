import React, { useEffect, useState } from 'react';
import { CheckCircle2, ListChecks, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import { UserAccount, UserRole } from '../../types/app';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useToast } from '../ui/toast';
import {
  EvaluationCriterion,
  getEvaluationCriteria,
  seedEvaluationCriteria,
} from '../../services/evaluations';
import EvaluationCriteriaModal from './EvaluationCriteriaModal';
import { EVALUATION_COMPONENTS, EVALUATION_UNIT_CODES } from '../../data/evaluations';
import { ConfirmModal } from '../ui/ConfirmModal';

interface EvaluationCriteriaPanelProps {
  authToken?: string;
  currentUser: UserAccount;
  cycleId?: string | null;
}

export const EvaluationCriteriaPanel = ({ authToken, currentUser, cycleId }: EvaluationCriteriaPanelProps) => {
  const { success, error } = useToast();
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [filterComponent, setFilterComponent] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterActive, setFilterActive] = useState('true');
  const [selectedCriterion, setSelectedCriterion] = useState<EvaluationCriterion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmSeedOpen, setIsConfirmSeedOpen] = useState(false);
  const criteriaRequestSeqRef = React.useRef(0);

  const fetchCriteriaList = async () => {
    const requestSeq = ++criteriaRequestSeqRef.current;
    setIsLoading(true);
    try {
      const params: {
        component?: string;
        unitCode?: string;
        isActive?: boolean;
        cycleId?: string;
        pageSize?: number;
      } = { pageSize: 1000 };
      if (filterComponent) params.component = filterComponent;
      if (filterUnit) params.unitCode = filterUnit;
      if (filterActive !== '') params.isActive = filterActive === 'true';
      if (cycleId) params.cycleId = cycleId;

      const res = await getEvaluationCriteria(params, authToken);
      if (requestSeq !== criteriaRequestSeqRef.current) {
        return;
      }

      if (res?.data?.items) {
        setCriteria(res.data.items);
      } else if (res?.error) {
        error(res.error, 'Lỗi tải tiêu chí');
      }
    } catch (err) {
      if (requestSeq !== criteriaRequestSeqRef.current) {
        return;
      }
      console.error(err);
      error('Đã xảy ra lỗi khi tải danh sách tiêu chí.', 'Lỗi tải tiêu chí');
    } finally {
      if (requestSeq === criteriaRequestSeqRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    setCriteria([]);
    fetchCriteriaList();
  }, [authToken, filterComponent, filterUnit, filterActive, cycleId]);

  const hasRole = (allowedRoles: UserRole[]) => {
    if (currentUser.roles && currentUser.roles.length > 0) {
      return currentUser.roles.some(role => allowedRoles.includes(role));
    }
    return allowedRoles.includes(currentUser.role);
  };

  const canManageCriteria = hasRole(['bcn', 'bvh_discipline']);

  const performSeedCriteria = async () => {
    setIsSeeding(true);
    try {
      const res = await seedEvaluationCriteria({ version: '2026', overwrite: true }, authToken);
      if (!res?.error) {
        const inserted = res.data?.insertedCount ?? 0;
        const updated = res.data?.updatedCount ?? 0;
        success(`Đã seed tiêu chí: thêm ${inserted}, cập nhật ${updated}.`, 'Seed tiêu chí');
        fetchCriteriaList();
      } else {
        error(res?.error || 'Lỗi không xác định khi khởi tạo tiêu chí.', 'Seed thất bại');
      }
    } catch (err) {
      console.error(err);
      error('Lỗi khi kết nối đến backend để seed tiêu chí.', 'Lỗi hệ thống');
    } finally {
      setIsSeeding(false);
    }
  };

  const getComponentLabel = (value: string) => {
    const found = EVALUATION_COMPONENTS.find(component => component.value === value);
    return found ? found.label : value;
  };

  const getUnitLabel = (value?: string | null) => {
    if (!value) return 'Tất cả các ban';
    const found = EVALUATION_UNIT_CODES.find(unit => unit.value === value);
    return found ? found.label : value;
  };

  const getRuleCount = (criterion: EvaluationCriterion) => (
    Array.isArray(criterion.metadata?.rules) ? criterion.metadata.rules.length : 0
  );

  const getRawMaxScore = (criterion: EvaluationCriterion) => {
    const raw = criterion.metadata?.rawMaxScore;
    return typeof raw === 'number' ? raw : null;
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card/85 backdrop-blur-md border border-border/50 p-5 rounded-2xl shadow-sm gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Tiêu chí đánh giá định kỳ</h3>
          <p className="text-sm text-secondary mt-1">Bộ tiêu chí MTEC 2026 gồm tiêu chí chung và tiêu chí đặc thù theo từng Ban/Tổ.</p>
        </div>
        {canManageCriteria && (
          <Button
            onClick={() => setIsConfirmSeedOpen(true)}
            disabled={isSeeding}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white rounded-xl shadow-md border-0"
          >
            {isSeeding ? <Loader2 size={16} className="animate-spin mr-1" /> : <RefreshCw size={16} />}
            Khởi tạo đầy đủ tiêu chí 2026
          </Button>
        )}
      </div>

      <div className="bg-card/85 backdrop-blur-md p-4 rounded-2xl border border-border/50 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Lọc theo nhóm tiêu chí</label>
          <Select value={filterComponent} onChange={event => setFilterComponent(event.target.value)} className="w-full rounded-xl">
            <option value="">-- Tất cả nhóm tiêu chí --</option>
            {EVALUATION_COMPONENTS.map(component => (
              <option key={component.value} value={component.value}>{component.label}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Lọc theo Ban/Tổ</label>
          <Select value={filterUnit} onChange={event => setFilterUnit(event.target.value)} className="w-full rounded-xl">
            <option value="">-- Tất cả Ban/Tổ --</option>
            {EVALUATION_UNIT_CODES.map(unit => (
              <option key={unit.value} value={unit.value}>{unit.label}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Trạng thái hoạt động</label>
          <Select value={filterActive} onChange={event => setFilterActive(event.target.value)} className="w-full rounded-xl">
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang kích hoạt</option>
            <option value="false">Tạm ẩn</option>
          </Select>
        </div>
      </div>

      <div className="bg-card/85 backdrop-blur-md rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 size={32} className="animate-spin text-primary mr-2" />
            <span className="text-secondary font-medium">Đang tải danh sách tiêu chí...</span>
          </div>
        ) : criteria.length === 0 ? (
          <div className="text-center p-12 text-secondary font-medium">
            Chưa có tiêu chí nào. Vui lòng bấm "Khởi tạo đầy đủ tiêu chí 2026" để thiết lập mặc định.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Mã tiêu chí</TableHead>
                  <TableHead className="font-semibold">Tên tiêu chí</TableHead>
                  <TableHead className="font-semibold">Phần đánh giá</TableHead>
                  <TableHead className="font-semibold">Phạm vi áp dụng</TableHead>
                  <TableHead className="font-semibold">Điểm tối đa</TableHead>
                  <TableHead className="font-semibold">Chi tiết</TableHead>
                  <TableHead className="font-semibold">Minh chứng</TableHead>
                  <TableHead className="font-semibold">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criteria.map(criterion => {
                  const ruleCount = getRuleCount(criterion);
                  const rawMaxScore = getRawMaxScore(criterion);
                  return (
                    <TableRow key={criterion.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-bold text-foreground">{criterion.code}</TableCell>
                      <TableCell>
                        <div className="font-semibold">{criterion.name}</div>
                        {criterion.description && (
                          <div className="text-xs text-secondary mt-0.5 line-clamp-1">{criterion.description}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{getComponentLabel(criterion.component)}</TableCell>
                      <TableCell className="text-sm">{getUnitLabel(criterion.unitCode)}</TableCell>
                      <TableCell>
                        <div className="font-bold text-primary">{criterion.maxScore}</div>
                        {rawMaxScore !== null && rawMaxScore !== criterion.maxScore && (
                          <div className="text-xs text-secondary mt-0.5">Thô {rawMaxScore}/100</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCriterion(criterion);
                            setIsModalOpen(true);
                          }}
                        >
                          {ruleCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs text-primary font-semibold bg-primary/10 px-2.5 py-1 rounded-md">
                              <ListChecks size={12} /> {ruleCount} dòng
                            </span>
                          ) : (
                            <span className="text-xs text-secondary">Xem</span>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {criterion.requiresEvidence ? (
                          <span className="inline-flex items-center gap-1 text-xs text-yellow-600 font-semibold bg-yellow-50 px-2.5 py-1 rounded-md border border-yellow-200">
                            <ShieldAlert size={12} /> Bắt buộc
                          </span>
                        ) : (
                          <span className="text-xs text-secondary">Không</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {criterion.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700 font-semibold bg-green-50 px-2.5 py-1 rounded-md">
                            <CheckCircle2 size={12} /> Hoạt động
                          </span>
                        ) : (
                          <span className="text-xs text-secondary font-medium">Đang ẩn</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <EvaluationCriteriaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        criterion={selectedCriterion}
      />
      <ConfirmModal
        isOpen={isConfirmSeedOpen}
        onClose={() => setIsConfirmSeedOpen(false)}
        onConfirm={performSeedCriteria}
        title="Khởi tạo tiêu chí"
        message="Khởi tạo đầy đủ 41 tiêu chí đánh giá thành viên MTEC 2026? Các tiêu chí cùng mã hiện có sẽ được cập nhật theo bộ mới."
      />
    </div>
  );
};

export default EvaluationCriteriaPanel;
