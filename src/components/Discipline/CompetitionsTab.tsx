import React, { useState, useEffect } from 'react';
import { Plus, Loader2, CheckCircle, Trophy, AlertCircle, X } from 'lucide-react';
import {
  getCompetitions,
  createCompetition,
  updateCompetitionResults,
  syncCompetitionKPI,
  type Competition
} from '../../services/competitions';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Modal } from '../../components/ui/modal';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

import { useTranslation } from 'react-i18next';

interface Props {
  authToken?: string;
  allMembers: any[];
}

interface ResultDataState {
  achievement: string;
  bonusKpi: number;
}

interface NewCompetitionState {
  title: string;
  date: string;
  scale: string;
}


const CompetitionsTab = ({ authToken, allMembers }: Props) => {
  const { t } = useTranslation()

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAddCompetitionModalOpen, setIsAddCompetitionModalOpen] = useState(false);

  const [hasLoadedCompetitions, setHasLoadedCompetitions] = useState(false);
  const [resultModalCompetition, setResultModalCompetition] = useState<any | null>(null);
  const [resultData, setResultData] = useState<Record<string, { achievement: string, bonusKpi: number }>>({});


  const [newCompetition, setNewCompetition] = useState<NewCompetitionState>({
    title: '',
    date: '',
    scale: 'Cấp CLB'
  });

  const fetchCompetitions = async () => {
    setIsLoading(true);
    try {
      const res = await getCompetitions(authToken);
      const data = res?.data || [];
      setCompetitions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi truy xuất dữ liệu thi đua:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openResultModal = async (competition: Competition) => {
    try {
      setResultModalCompetition(competition);
      setResultData({});
    } catch {
      alert('Không tải được danh sách thành viên cho kết quả thi đua.');
    }
  };

  const handleUpdateCompetitionResults = async () => {
    if (!resultModalCompetition) return;
    setIsSubmitting(true);
    const payload = Object.entries(resultData)
      .filter(([_, data]) => data.bonusKpi > 0)
      .map(([memberId, data]) => ({ memberId, ...data }));

    if (payload.length === 0) {
      alert("Chưa có thành tích nào được ghi nhận.");
      setIsSubmitting(false);
      return;
    }

    const res = await updateCompetitionResults(resultModalCompetition.id, payload, authToken);
    if (res.status === 200 || res.success) {
      alert("Đã lưu kết quả thành công!");
      setResultModalCompetition(null);
      setResultData({});
    } else {
      alert("Lỗi khi lưu kết quả: " + res.error);
    }
    setIsSubmitting(false);
  };

  const handleSyncCompetitionKPI = async (competitionId: string) => {
    if (!window.confirm("Xác nhận đồng bộ điểm cộng KPI cho các thành viên đạt giải?")) return;
    const res = await syncCompetitionKPI(competitionId, authToken);
    if (res.status === 200 || res.success) {
      alert(res.data?.message || "Đã đồng bộ điểm KPI thành công!");
      // await fetchRecordsTabData();
    } else {
      alert("Lỗi đồng bộ KPI: " + res.error);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, [authToken]);

  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await createCompetition(newCompetition as any, authToken);
    if (res.status === 200 || res.success) {
      setIsAddCompetitionModalOpen(false);
      setNewCompetition({ title: '', date: '', scale: 'Cấp CLB' });
      await fetchCompetitions();
    } else {
      alert("Lỗi khi tạo sự kiện: " + res.error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card/80 backdrop-blur-md border border-border/50 p-5 rounded-2xl shadow-sm gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Hiệu suất & Thi đua</h3>
          <p className="text-sm text-secondary mt-1">Ghi nhận thành tích từ các cuộc thi/sự kiện và đồng bộ điểm cộng vào KPI.</p>
        </div>
        <Button onClick={() => setIsAddCompetitionModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-md border-0">
          <Plus size={16} /> {t('common.addActivity')}
        </Button>
      </div>

      <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Tên sự kiện / Cuộc thi</TableHead>
                <TableHead className="font-semibold">Thời gian</TableHead>
                <TableHead className="font-semibold">Quy mô</TableHead>
                <TableHead className="font-semibold">Trạng thái</TableHead>
                <TableHead className="text-right font-semibold">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!hasLoadedCompetitions ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-secondary font-medium">
                    Chưa tải dữ liệu cuộc thi / sự kiện.
                  </TableCell>
                </TableRow>
              ) : competitions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-secondary font-medium">
                    Chưa có dữ liệu cuộc thi / sự kiện.
                  </TableCell>
                </TableRow>
              ) : competitions.map((comp) => (
                <TableRow key={comp.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-bold text-foreground">{comp.title}</TableCell>
                  <TableCell className="text-secondary-foreground">{new Date(comp.date).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800 font-medium">{comp.scale}</Badge>
                  </TableCell>
                  <TableCell>
                    {comp.status === 'Completed'
                      ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-100 text-green-700 font-semibold text-xs"><CheckCircle size={12} /> Đã kết thúc</span>
                      : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-100 text-yellow-700 font-semibold text-xs"><AlertCircle size={12} /> Đang diễn ra</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="rounded-lg shadow-sm text-purple-700 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800/50 dark:hover:bg-purple-900/30" onClick={() => { void openResultModal(comp); }}>
                        <Trophy size={14} className="mr-1.5" /> Cập nhật KQ
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-lg shadow-sm text-green-700 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800/50 dark:hover:bg-green-900/30" onClick={() => handleSyncCompetitionKPI(comp.id)}>
                        <CheckCircle size={14} className="mr-1.5" /> Đồng bộ
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal isOpen={isAddCompetitionModalOpen} onClose={() => setIsAddCompetitionModalOpen(false)} title="Tạo sự kiện thi đua mới">
        <form onSubmit={handleCreateCompetition} className="space-y-5 pt-2">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Tên sự kiện / Cuộc thi <span className="text-red-500">*</span></label>
            <Input required value={newCompetition.title} onChange={e => setNewCompetition({ ...newCompetition, title: e.target.value })} className="rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Ngày tổ chức <span className="text-red-500">*</span></label>
            <Input type="date" required value={newCompetition.date} onChange={e => setNewCompetition({ ...newCompetition, date: e.target.value })} className="rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Quy mô</label>
            <Select value={newCompetition.scale} onChange={e => setNewCompetition({ ...newCompetition, scale: e.target.value })} className="w-full rounded-xl">
              <option value="Cấp CLB">Cấp Câu lạc bộ</option>
              <option value="Cấp Khoa">Cấp Khoa</option>
              <option value="Cấp Trường">Cấp Trường</option>
              <option value="Quốc gia">Quy mô Toàn quốc / Mở rộng</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsAddCompetitionModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md border-0">
              {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : 'Lưu thông tin'}
            </Button>
          </div>
        </form>
      </Modal>

      {resultModalCompetition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/50 rounded-2xl w-full max-w-4xl flex flex-col h-[85vh] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-border/50">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2"><Trophy className="text-yellow-500" /> Ghi nhận KPI: <span className="text-primary">{resultModalCompetition.title}</span></h3>
                <p className="text-sm text-secondary mt-1">Chỉ cần nhập Thành tích và Điểm cộng cho những cá nhân có tham gia/đạt giải.</p>
              </div>
              <button onClick={() => setResultModalCompetition(null)} className="text-secondary hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted"><X size={24} /></button>
            </div>
            <div className="overflow-y-auto p-0 flex-1">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="font-semibold">MSSV</TableHead>
                    <TableHead className="font-semibold">Họ và tên</TableHead>
                    <TableHead className="font-semibold">Thành tích (Giải thưởng)</TableHead>
                    <TableHead className="w-40 font-semibold">Điểm KPI Cộng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allMembers.map(member => {
                    const currentResult = resultData[member.id] || { achievement: '', bonusKpi: 0 };
                    return (
                      <TableRow key={member.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium text-secondary-foreground">{member.mssv}</TableCell>
                        <TableCell className="font-semibold">{member.name}</TableCell>
                        <TableCell className="pr-6">
                          <Input type="text" placeholder="VD: Giải Nhất, Top 5..." value={currentResult.achievement} onChange={(e) => setResultData(prev => ({ ...prev, [member.id]: { ...currentResult, achievement: e.target.value } }))} className="rounded-lg bg-background/50 focus:bg-background" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" min="0" placeholder="0" value={currentResult.bonusKpi || ''} onChange={(e) => setResultData(prev => ({ ...prev, [member.id]: { ...currentResult, bonusKpi: parseFloat(e.target.value) || 0 } }))} className="rounded-lg bg-background/50 focus:bg-background text-green-600 font-bold" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="p-5 border-t border-border/50 flex justify-end gap-3 bg-muted/20 rounded-b-2xl">
              <Button variant="outline" className="rounded-xl" onClick={() => setResultModalCompetition(null)}>Đóng</Button>
              <Button onClick={handleUpdateCompetitionResults} disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md border-0">
                {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <CheckCircle size={16} className="mr-2" />} Lưu kết quả
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
};

export default CompetitionsTab;