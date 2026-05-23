import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { UserAccount } from '../../types/app';
import { Member } from '../../data/members';
import {
  EvaluationCycle,
  EvaluationQuickReviewCycle,
  getEvaluationQuickReviewCycle,
} from '../../services/evaluations';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useToast } from '../ui/toast';

interface EvaluationQuickReviewPanelProps {
  authToken?: string;
  currentUser: UserAccount;
  cycleId: string;
  cycle: EvaluationCycle;
  allMembers: Member[];
}

const formatScore = (value?: number) => (Number(value || 0)).toFixed(2);

export const EvaluationQuickReviewPanel = ({
  authToken,
  currentUser,
  cycleId,
  cycle,
  allMembers,
}: EvaluationQuickReviewPanelProps) => {
  const { error } = useToast();
  const [data, setData] = useState<EvaluationQuickReviewCycle | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const memberMap = useMemo(() => {
    return new Map(allMembers.map((member) => [member.id, member]));
  }, [allMembers]);

  const fetchQuickReview = async () => {
    setIsLoading(true);
    try {
      const res = await getEvaluationQuickReviewCycle(
        cycleId,
        { strict: false, evidenceMode: 'draft' },
        authToken
      );

      if (res.error) {
        error(res.error, 'Không tải được Quick Review');
        setData(null);
        return;
      }

      setData(res.data || null);
    } catch (err) {
      console.error(err);
      error('Lỗi hệ thống khi tải Quick Review.', 'Quick Review');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuickReview();
  }, [authToken, cycleId]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-950/20 dark:border-yellow-900 dark:text-yellow-300">
        <div className="flex items-start gap-2">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Quick Review chỉ là dữ liệu tạm thời</div>
            <div>
              Điểm được tính trực tiếp từ dữ liệu hiện tại và không được lưu vào database. Để chốt kết quả, cần chạy Compute tại tab Kết quả.
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Quick Review điểm tạm</h3>
          <p className="text-sm text-secondary">
            Tính nhanh toàn bộ tiêu chí của chu kỳ {cycle.name}.
          </p>
        </div>

        <Button onClick={fetchQuickReview} disabled={isLoading} className="rounded-xl">
          {isLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <RefreshCw size={16} className="mr-2" />}
          Làm mới
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-12 text-secondary">
          <Loader2 size={28} className="animate-spin mr-2" />
          Đang tính điểm tạm...
        </div>
      )}

      {!isLoading && data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border/40 bg-card/50 p-4">
              <div className="text-xs text-secondary uppercase font-bold">Thành viên</div>
              <div className="text-2xl font-black">{data.totalMembers}</div>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 p-4">
              <div className="text-xs text-secondary uppercase font-bold">Điểm trung bình tạm</div>
              <div className="text-2xl font-black">{formatScore(data.averageScore)}</div>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 p-4">
              <div className="text-xs text-secondary uppercase font-bold">Lỗi tính toán</div>
              <div className="text-2xl font-black">{data.errors.length}</div>
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-card/50 p-4">
            <div className="text-xs text-secondary uppercase font-bold mb-3">Phân bố xếp loại tạm</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.classificationDistribution).length === 0 ? (
                <span className="text-sm text-secondary">Chưa có dữ liệu xếp loại.</span>
              ) : (
                Object.entries(data.classificationDistribution).map(([label, count]) => (
                  <Badge key={label} variant="outline" className="bg-background">
                    {label}: {count}
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-card/50 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thành viên</TableHead>
                    <TableHead className="text-right">I</TableHead>
                    <TableHead className="text-right">II</TableHead>
                    <TableHead className="text-right">III-A</TableHead>
                    <TableHead className="text-right">III-B</TableHead>
                    <TableHead className="text-right">Tổng</TableHead>
                    <TableHead>Xếp loại tạm</TableHead>
                    <TableHead>Cảnh báo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item) => {
                    const member = memberMap.get(item.memberId);
                    const warningCount = (item.warnings?.length || 0) + (item.blockers?.length || 0);

                    return (
                      <TableRow key={item.memberId}>
                        <TableCell>
                          <div className="font-semibold">{member?.name || item.memberId}</div>
                          <div className="text-xs text-secondary">{member?.mssv}</div>
                        </TableCell>
                        <TableCell className="text-right">{formatScore(item.componentScores.I)}</TableCell>
                        <TableCell className="text-right">{formatScore(item.componentScores.II)}</TableCell>
                        <TableCell className="text-right">{formatScore(item.componentScores.III_A)}</TableCell>
                        <TableCell className="text-right">{formatScore(item.componentScores.III_B)}</TableCell>
                        <TableCell className="text-right font-bold">{formatScore(item.totalScore)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.finalClassification || 'UNCLASSIFIED'}</Badge>
                        </TableCell>
                        <TableCell>
                          {warningCount > 0 ? (
                            <Badge variant="outline" className="text-yellow-700 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 dark:text-yellow-300">
                              Có cảnh báo
                            </Badge>
                          ) : (
                            <span className="text-xs text-secondary">Không</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {!isLoading && !data && (
        <div className="rounded-xl border border-border/40 bg-card/50 p-8 text-center text-secondary">
          Chưa có dữ liệu Quick Review để hiển thị.
        </div>
      )}
    </div>
  );
};

export default EvaluationQuickReviewPanel;
