import React from 'react';
import { EvaluationCriterion } from '../../services/evaluations';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  criterion?: EvaluationCriterion | null;
}

export const EvaluationCriteriaModal: React.FC<Props> = ({ isOpen, onClose, criterion }) => {
  if (!criterion) return null;

  const rules = Array.isArray(criterion.metadata?.rules) ? criterion.metadata!.rules : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Tiêu chí ${criterion.code} — ${criterion.name}`} className="max-w-2xl">
      <div className="space-y-4">
        {criterion.description && (
          <div>
            <h4 className="text-sm font-semibold text-secondary uppercase">Mô tả</h4>
            <p className="mt-1 text-sm text-foreground">{criterion.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-secondary uppercase">Phần đánh giá</h4>
            <div className="mt-1 text-sm">{criterion.component}</div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-secondary uppercase">Phạm vi</h4>
            <div className="mt-1 text-sm">{criterion.unitCode ?? 'Tất cả các ban'}</div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-secondary uppercase">Điểm tối đa</h4>
            <div className="mt-1 text-sm font-bold">{criterion.maxScore}</div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-secondary uppercase">Yêu cầu minh chứng</h4>
            <div className="mt-1 text-sm">{criterion.requiresEvidence ? 'Bắt buộc' : 'Không'}</div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-secondary uppercase">Quy tắc / Dòng tính</h4>
          {rules.length === 0 ? (
            <div className="text-sm text-secondary mt-2">Không có quy tắc nào được cấu hình.</div>
          ) : (
            <div className="space-y-3 mt-2">
              {rules.map((r, idx) => (
                <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="text-sm font-semibold">{r.itemCode ?? `Dòng ${idx + 1}`}</div>
                  {r.detail && <div className="text-sm text-secondary mt-1">{r.detail}</div>}
                  <div className="flex gap-4 mt-2 text-xs text-secondary">
                    {r.scoreDelta !== undefined && <div><strong>Điểm:</strong> {r.scoreDelta}</div>}
                    {r.calculationNote && <div><strong>Công thức:</strong> {r.calculationNote}</div>}
                    {r.recordingUnit && <div><strong>Đơn vị ghi:</strong> {r.recordingUnit}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
      <div />
      <div className="mt-4" />
      <div className="flex justify-end">
        <Button onClick={onClose}>Đóng</Button>
      </div>
    </Modal>
  );
};

export default EvaluationCriteriaModal;
