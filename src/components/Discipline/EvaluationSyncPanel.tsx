import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  AlertTriangle,
  RefreshCw,
  Calendar,
  Trophy,
  CheckCircle2
} from 'lucide-react';
import { UserAccount, UserRole } from '../../types/app';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { useToast } from '../ui/toast';
import { 
  EvaluationCycle, 
  syncEvaluationAttendance, 
  syncEvaluationCompetition 
} from '../../services/evaluations';
import { getMeetings, Meeting } from '../../services/meetings_api';
import { getCompetitions, Competition } from '../../services/competitions';
import { ConfirmModal } from '../ui/ConfirmModal';

interface EvaluationSyncPanelProps {
  authToken?: string;
  currentUser: UserAccount;
  cycleId: string;
  cycle: EvaluationCycle;
}

export const EvaluationSyncPanel = ({ 
  authToken, 
  currentUser, 
  cycleId, 
  cycle 
}: EvaluationSyncPanelProps) => {
  const { success, error, warning } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [selectedCompetitionId, setSelectedCompetitionId] = useState('');
  
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);
  const [isLoadingCompetitions, setIsLoadingCompetitions] = useState(false);
  const [isSyncingAttendance, setIsSyncingAttendance] = useState(false);
  const [isSyncingCompetition, setIsSyncingCompetition] = useState(false);

  const [confirmSyncAction, setConfirmSyncAction] = useState<{ type: 'attendance' | 'competition', msg: string } | null>(null);

  const fetchMeetingsList = async () => {
    setIsLoadingMeetings(true);
    try {
      const res = await getMeetings(authToken);
      if (res.error) {
        error(res.error, 'Không tải được danh sách cuộc họp');
        setMeetings([]);
        setSelectedMeetingId('');
        return;
      }

      const data = Array.isArray(res.data) ? res.data : [];
      setMeetings(data);
      setSelectedMeetingId(data[0]?.id || '');
    } catch (err) {
      console.error(err);
      error('Lỗi hệ thống khi tải danh sách cuộc họp.', 'Đồng bộ');
    } finally {
      setIsLoadingMeetings(false);
    }
  };

  const fetchCompetitionsList = async () => {
    setIsLoadingCompetitions(true);
    try {
      const res = await getCompetitions(authToken);
      if (res.error) {
        error(res.error, 'Không tải được danh sách cuộc thi');
        setCompetitions([]);
        setSelectedCompetitionId('');
        return;
      }

      const data = Array.isArray(res.data) ? res.data : [];
      setCompetitions(data);
      setSelectedCompetitionId(data[0]?.id || '');
    } catch (err) {
      console.error(err);
      error('Lỗi hệ thống khi tải danh sách cuộc thi.', 'Đồng bộ');
    } finally {
      setIsLoadingCompetitions(false);
    }
  };

  useEffect(() => {
    fetchMeetingsList();
    fetchCompetitionsList();
  }, [authToken]);

  // Helper check roles
  const hasRole = (allowedRoles: UserRole[]) => {
    if (currentUser.roles && currentUser.roles.length > 0) {
      return currentUser.roles.some(r => allowedRoles.includes(r));
    }
    return allowedRoles.includes(currentUser.role);
  };

  const isLocked = cycle.status === 'LOCKED';
  const canSyncAttendance = hasRole(['bcn', 'bvh_discipline']) && !isLocked;
  const canSyncCompetition = hasRole(['bcn', 'bvh_discipline', 'bcm']) && !isLocked;

  const executeSyncAttendance = async () => {
    setIsSyncingAttendance(true);
    try {
      const res = await syncEvaluationAttendance(cycleId, selectedMeetingId, authToken);
      if (!res?.error) {
        const data: any = res?.data || {};
        const createdCount = data?.createdCount ?? 0;
        const skippedCount = data?.skippedCount ?? 0;
        const msg = data?.message || `Đồng bộ thành công! Tạo mới: ${createdCount}, Bỏ qua: ${skippedCount}`;
        success(msg, 'Đồng bộ điểm chuyên cần');
      } else {
        error(res?.error || 'Lỗi không xác định khi đồng bộ chuyên cần.', 'Đồng bộ thất bại');
      }
    } catch (err) {
      console.error(err);
      error('Lỗi khi thực hiện đồng bộ.', 'Lỗi hệ thống');
    } finally {
      setIsSyncingAttendance(false);
    }
  };

  const executeSyncCompetition = async () => {
    setIsSyncingCompetition(true);
    try {
      const res = await syncEvaluationCompetition(cycleId, selectedCompetitionId, authToken);
      if (!res?.error) {
        const data: any = res?.data || {};
        const createdCount = data?.createdCount ?? 0;
        const skippedCount = data?.skippedCount ?? 0;
        const msg = data?.message || `Đồng bộ thành công! Tạo mới: ${createdCount}, Bỏ qua: ${skippedCount}`;
        success(msg, 'Đồng bộ điểm thi đua');
      } else {
        error(res?.error || 'Lỗi không xác định khi đồng bộ thi đua.', 'Đồng bộ thất bại');
      }
    } catch (err) {
      console.error(err);
      error('Lỗi khi thực hiện đồng bộ.', 'Lỗi hệ thống');
    } finally {
      setIsSyncingCompetition(false);
    }
  };

  const handleSyncAttendance = () => {
    if (!selectedMeetingId) {
      warning('Vui lòng chọn một cuộc họp để đồng bộ.', 'Chưa chọn cuộc họp');
      return;
    }
    setConfirmSyncAction({
      type: 'attendance',
      msg: 'Xác nhận đồng bộ chuyên cần cuộc họp này sang hệ thống điểm v2? Cần bấm Compute lại sau khi đồng bộ.'
    });
  };

  const handleSyncCompetition = () => {
    if (!selectedCompetitionId) {
      warning('Vui lòng chọn một cuộc thi/sự kiện thi đua để đồng bộ.', 'Chưa chọn cuộc thi');
      return;
    }
    setConfirmSyncAction({
      type: 'competition',
      msg: 'Xác nhận đồng bộ điểm thi đua này sang hệ thống điểm v2? Cần bấm Compute lại sau khi đồng bộ.'
    });
  };

  const executeSync = async () => {
    if (!confirmSyncAction) return;
    const type = confirmSyncAction.type;
    setConfirmSyncAction(null);
    if (type === 'attendance') {
      await executeSyncAttendance();
    } else {
      await executeSyncCompetition();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {isLocked && (
        <div className="bg-purple-50 border border-purple-200 text-purple-700 dark:bg-purple-950/20 dark:border-purple-900 dark:text-purple-400 p-4 rounded-xl flex items-start gap-2.5">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Chu kỳ đã khóa</h4>
            <p className="text-sm mt-0.5">Mọi thao tác đồng bộ dữ liệu đã khóa cố định. Bạn không thể đồng bộ thêm.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1 bg-transparent border-0 py-1">
        <h3 className="text-lg font-bold text-foreground">Đồng bộ Dữ liệu nguồn</h3>
        <p className="text-sm text-secondary">
          Lấy dữ liệu từ các phân hệ khác (Điểm danh cuộc họp, Thành tích cuộc thi) để tự động quy đổi thành các sự kiện điểm v2.
        </p>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-300">
        Dữ liệu sau khi đồng bộ sẽ được ghi thành sự kiện điểm tạm trong Evaluation v2. Sau khi đồng bộ, có thể xem Quick Review để kiểm tra điểm tạm hoặc chạy Compute để lưu kết quả chính thức.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sync Attendance */}
        <div className="bg-card/45 border border-border/30 rounded-xl p-5 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                <Calendar size={24} />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Đồng bộ Điểm chuyên cần</h4>
                <p className="text-xs text-secondary mt-0.5">Tự động quy đổi trạng thái điểm danh cuộc họp thành sự kiện điểm v2.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Chọn cuộc họp nguồn:</label>
              {isLoadingMeetings ? (
                <div className="flex items-center gap-2 text-sm text-secondary py-2">
                  <Loader2 size={16} className="animate-spin text-primary" /> Đang tải cuộc họp...
                </div>
              ) : meetings.length === 0 ? (
                <div className="text-xs text-secondary py-2 italic">Không tìm thấy cuộc họp nào.</div>
              ) : (
                <Select
                  value={selectedMeetingId}
                  onChange={e => setSelectedMeetingId(e.target.value)}
                  className="w-full rounded-xl border border-border/40"
                >
                  {meetings.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({new Date(m.date).toLocaleDateString('vi-VN')})
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border/40">
            <Button
              onClick={handleSyncAttendance}
              disabled={isSyncingAttendance || !canSyncAttendance || meetings.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold rounded-xl shadow-md border-0 flex items-center justify-center gap-2"
            >
              {isSyncingAttendance ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Đồng bộ chuyên cần
            </Button>
          </div>
        </div>

        {/* Sync Competition */}
        <div className="bg-card/45 border border-border/30 rounded-xl p-5 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 rounded-xl">
                <Trophy size={24} />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Đồng bộ Điểm thi đua</h4>
                <p className="text-xs text-secondary mt-0.5">Lấy kết quả giải thưởng cuộc thi để cộng điểm thi đua cho thành viên.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Chọn cuộc thi / sự kiện nguồn:</label>
              {isLoadingCompetitions ? (
                <div className="flex items-center gap-2 text-sm text-secondary py-2">
                  <Loader2 size={16} className="animate-spin text-primary" /> Đang tải sự kiện thi đua...
                </div>
              ) : competitions.length === 0 ? (
                <div className="text-xs text-secondary py-2 italic">Không tìm thấy cuộc thi nào.</div>
              ) : (
                <Select
                  value={selectedCompetitionId}
                  onChange={e => setSelectedCompetitionId(e.target.value)}
                  className="w-full rounded-xl border border-border/40"
                >
                  {competitions.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({new Date(c.date).toLocaleDateString('vi-VN')} - {c.scale})
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border/40">
            <Button
              onClick={handleSyncCompetition}
              disabled={isSyncingCompetition || !canSyncCompetition || competitions.length === 0}
              className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:opacity-95 text-white font-bold rounded-xl shadow-md border-0 flex items-center justify-center gap-2"
            >
              {isSyncingCompetition ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Đồng bộ thi đua
            </Button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmSyncAction}
        onClose={() => setConfirmSyncAction(null)}
        onConfirm={executeSync}
        title="Xác nhận đồng bộ"
        message={confirmSyncAction?.msg || ''}
      />
    </div>
  );
};

export default EvaluationSyncPanel;
