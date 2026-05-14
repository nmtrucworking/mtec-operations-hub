import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Search, 
  Loader2, 
  Plus, 
  X, 
  Trophy, 
  AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  getDisciplineStats, 
  getDisciplineRecords, 
  createDisciplineRecord,
  updateDisciplineRecord,
  type DisciplineStats, 
  type DisciplineRecord as ApiDisciplineRecord,
  type DisciplineRecordCreate
} from '../services/discipline';

import { 
  getMeetings, 
  createMeeting, 
  updateMeeting,
  updateAttendance, 
  syncAttendanceToDiscipline,
  getMeetingAttendance,
  type Meeting,
  type Attendance
} from '../services/meetings_api';

import { getMembers } from '../services/members';
import { Member } from '../data/members';

import { 
  getCompetitions, 
  createCompetition, 
  updateCompetitionResults, 
  syncCompetitionKPI,
  type Competition 
} from '../services/competitions';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Modal } from '../components/ui/modal';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { UserAccount } from '../types/app';
import { MeetingMinutes } from '../components/MeetingMinutes';

// Custom Hook for Debounce (Prevents API Flooding/500 Errors)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface DisciplineViewProps {
  authToken?: string;
  currentUser: UserAccount;
}

type DisciplineLevel = 'Không' | 'Nhắc nhở' | 'Cảnh cáo Lần 1';
type TabType = 'records' | 'meetings' | 'competitions';

export const DisciplineView = ({ authToken, currentUser }: DisciplineViewProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('records');
  
  // Data States
  const [stats, setStats] = useState<DisciplineStats | null>(null);
  const [records, setRecords] = useState<ApiDisciplineRecord[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);

  // Cache flags to avoid refetching whole tabs unnecessarily
  const [hasLoadedRecords, setHasLoadedRecords] = useState(false);
  const [hasLoadedMeetings, setHasLoadedMeetings] = useState(false);
  const [hasLoadedMembers, setHasLoadedMembers] = useState(false);
  const [hasLoadedCompetitions, setHasLoadedCompetitions] = useState(false);
  
  // Loading & Filter States
  const [isLoadingDiscipline, setIsLoadingDiscipline] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [disciplineFilter, setDisciplineFilter] = useState<'All' | DisciplineLevel>('All');

  // Form States (Create/Edit Record)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<DisciplineRecordCreate & { id?: string }>({
    mssv: '', name: '', committee: '', absents: 0, kpi: 100, disciplineLevel: 'Không', note: ''
  });

  const [isAddMeetingModalOpen, setIsAddMeetingModalOpen] = useState(false);
  const [isEditMeetingModalOpen, setIsEditMeetingModalOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: '', date: '', meetingType: 'Họp định kỳ', description: '', minutesUrl: '' });
  const [editMeetingData, setEditMeetingData] = useState<Meeting | null>(null);
  
  const [attendanceModalMeeting, setAttendanceModalMeeting] = useState<Meeting | null>(null);
  const [attendanceData, setAttendanceData] = useState<Record<string, Attendance>>({});
  
  const [isAddCompetitionModalOpen, setIsAddCompetitionModalOpen] = useState(false);
  const [newCompetition, setNewCompetition] = useState({ title: '', date: '', scale: 'Cấp CLB' });
  const [resultModalCompetition, setResultModalCompetition] = useState<any | null>(null);
  const [resultData, setResultData] = useState<Record<string, { achievement: string, bonusKpi: number }>>({});

  const parseListData = <T,>(response: any, fallbackKey?: string): T[] => {
    const directData = response?.data;
    if (Array.isArray(directData)) return directData as T[];

    if (fallbackKey && Array.isArray(directData?.[fallbackKey])) return directData[fallbackKey] as T[];

    if (Array.isArray(response?.data?.data)) return response.data.data as T[];
    return [];
  };

  const fetchRecordsTabData = async () => {
    setIsLoadingDiscipline(true);
    try {
      const statsRes = await getDisciplineStats(authToken);
      if (statsRes?.data) setStats(statsRes.data);

      const recordsRes = await getDisciplineRecords({
        search: debouncedSearch || undefined,
        disciplineLevel: disciplineFilter === 'All' ? undefined : disciplineFilter,
      }, authToken);
      if (recordsRes?.data) setRecords(parseListData<ApiDisciplineRecord>(recordsRes));

      setHasLoadedRecords(true);
    } catch (error) {
      console.error("Lỗi truy xuất dữ liệu kỷ luật:", error);
    } finally {
      setIsLoadingDiscipline(false);
    }
  };

  const fetchMeetingsTabData = async () => {
    setIsLoadingInitial(true);
    try {
      const meetingsRes = await getMeetings(authToken);
      const parsedMeetings = parseListData<Meeting>(meetingsRes);
      setMeetings(parsedMeetings);
      setHasLoadedMeetings(true);
    } catch (error) {
      console.error("Lỗi truy xuất dữ liệu cuộc họp:", error);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  const fetchCompetitionsTabData = async () => {
    setIsLoadingInitial(true);
    try {
      const competitionsRes = await getCompetitions(authToken);
      const parsedComps = parseListData<Competition>(competitionsRes);
      setCompetitions(parsedComps);
      setHasLoadedCompetitions(true);
    } catch (error) {
      console.error("Lỗi truy xuất dữ liệu thi đua:", error);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  const fetchMembersForRecords = async () => {
    const membersRes = await getMembers({ pageSize: 1000, status: 'Active' }, authToken);
    const parsedMembers = parseListData<Member>(membersRes, 'members');
    setAllMembers(parsedMembers);
    setHasLoadedMembers(true);
  };

  const ensureMembersLoaded = async () => {
    if (hasLoadedMembers) {
      return;
    }

    setIsLoadingInitial(true);
    try {
      await fetchMembersForRecords();
    } catch (error) {
      console.error("Lỗi truy xuất danh sách thành viên:", error);
      throw error;
    } finally {
      setIsLoadingInitial(false);
    }
  };

  useEffect(() => {
    const localToken = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!authToken && !localToken) return;
    if (activeTab === 'records') {
      void (async () => {
        await fetchRecordsTabData();
      })();
      return;
    }

    if (activeTab === 'meetings' && !hasLoadedMeetings) {
      void fetchMeetingsTabData();
      return;
    }

    if (activeTab === 'competitions' && !hasLoadedCompetitions) {
      void fetchCompetitionsTabData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, authToken]);

  useEffect(() => {
    const localToken = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!authToken && !localToken) return;
    if (activeTab !== 'records') return;
    void fetchRecordsTabData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, disciplineFilter, authToken]);

  const handleSelectMember = (memberId: string) => {
    const selected = allMembers.find(m => m.id === memberId);
    if (selected) {
      setFormData({
        ...formData,
        memberId: selected.id,
        mssv: selected.mssv,
        name: selected.name,
        committee: selected.ban && selected.ban.length > 0 ? selected.ban.join(', ') : '' 
      });
    } else {
      setFormData({ ...formData, memberId: undefined, mssv: '', name: '', committee: '' });
    }
  };

  const openAddRecordModal = async () => {
    try {
      await ensureMembersLoaded();
      setIsAddModalOpen(true);
    } catch {
      alert('Không tải được danh sách thành viên. Vui lòng thử lại.');
    }
  };

  const openAttendanceModal = async (meeting: Meeting) => {
    try {
      await ensureMembersLoaded();
      const initialAttendance: Record<string, Attendance> = {};
      allMembers.forEach(m => {
        initialAttendance[m.id] = { memberId: m.id, status: 'Absent', note: '' };
      });
      
      try {
        const response = await getMeetingAttendance(meeting.id, authToken);
        if (response.success && response.data) {
          response.data.forEach((att: Attendance) => {
            if (initialAttendance[att.memberId]) {
              initialAttendance[att.memberId].status = att.status;
              initialAttendance[att.memberId].note = att.note;
            }
          });
        }
      } catch (err) {
        console.warn("Could not fetch old attendance", err);
      }

      setAttendanceData(initialAttendance);
      setAttendanceModalMeeting(meeting);
    } catch {
      alert('Không tải được danh sách thành viên cho điểm danh.');
    }
  };

  const openResultModal = async (competition: Competition) => {
    try {
      await ensureMembersLoaded();
      setResultModalCompetition(competition);
      setResultData({});
    } catch {
      alert('Không tải được danh sách thành viên cho kết quả thi đua.');
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId) return alert('Vui lòng chọn thành viên hợp lệ.');
    setIsSubmitting(true);
    try {
      const response = await createDisciplineRecord(formData, authToken);
      if (response.success) {
        setIsAddModalOpen(false);
        setFormData({ mssv: '', name: '', committee: '', absents: 0, kpi: 100, disciplineLevel: 'Không', note: '' });
        await fetchRecordsTabData();
      } else {
        alert(response.error || 'Đã xảy ra lỗi khi tạo bản ghi.');
      }
    } catch (error) {
      alert('Lỗi hệ thống khi tạo bản ghi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id) return;
    setIsSubmitting(true);
    try {
      const response = await updateDisciplineRecord(formData.id, formData, authToken);
      if (response.success) {
        setIsEditModalOpen(false);
        setFormData({ mssv: '', name: '', committee: '', absents: 0, kpi: 100, disciplineLevel: 'Không', note: '' });
        await fetchRecordsTabData();
      } else {
        alert(response.error || 'Đã xảy ra lỗi khi cập nhật bản ghi.');
      }
    } catch (error) {
      alert('Lỗi hệ thống khi cập nhật bản ghi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await createMeeting(newMeeting, authToken);
    if (res.success) {
      setIsAddMeetingModalOpen(false);
      setNewMeeting({ title: '', date: '', meetingType: 'Họp định kỳ', description: '', minutesUrl: '' });
      await fetchMeetingsTabData();
    } else {
      alert("Lỗi khi tạo cuộc họp: " + res.error);
    }
    setIsSubmitting(false);
  };

  const handleUpdateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMeetingData) return;
    setIsSubmitting(true);
    const payload = {
      title: editMeetingData.title,
      date: editMeetingData.date,
      meetingType: editMeetingData.meetingType,
      description: editMeetingData.description,
      status: editMeetingData.status,
      minutesUrl: editMeetingData.minutesUrl
    };
    const res = await updateMeeting(editMeetingData.id, payload, authToken);
    if (res.success) {
      setIsEditMeetingModalOpen(false);
      setEditMeetingData(null);
      await fetchMeetingsTabData();
    } else {
      alert("Lỗi khi cập nhật cuộc họp: " + res.error);
    }
    setIsSubmitting(false);
  };

  const handleAttendanceChange = (memberId: string, status: 'Present' | 'Absent' | 'Excused') => {
    setAttendanceData(prev => ({ ...prev, [memberId]: { ...prev[memberId], status } }));
  };

  const handleSaveAttendance = async () => {
    if (!attendanceModalMeeting) return;
    setIsSubmitting(true);
    const payload = Object.values(attendanceData);
    const res = await updateAttendance(attendanceModalMeeting.id, payload, authToken);
    if (res.success) {
      alert("Lưu kết quả điểm danh thành công.");
      setAttendanceModalMeeting(null);
    } else {
      alert("Lỗi khi lưu điểm danh: " + res.error);
    }
    setIsSubmitting(false);
  };

  const handleSyncDiscipline = async (meetingId: string) => {
    if (!window.confirm("Đồng bộ dữ liệu vắng mặt sang hệ thống Kỷ luật?")) return;
    const res = await syncAttendanceToDiscipline(meetingId, authToken);
    if (res.success) {
      alert(res.data?.message || "Đồng bộ thành công.");
      await fetchRecordsTabData();
    }
    else alert("Lỗi đồng bộ: " + res.error);
  };

  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await createCompetition(newCompetition as any, authToken);
    if (res.status === 200 || res.success) {
      setIsAddCompetitionModalOpen(false);
      setNewCompetition({ title: '', date: '', scale: 'Cấp CLB' });
      await fetchCompetitionsTabData();
    } else {
      alert("Lỗi khi tạo sự kiện: " + res.error);
    }
    setIsSubmitting(false);
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
      await fetchRecordsTabData();
    } else {
      alert("Lỗi đồng bộ KPI: " + res.error);
    }
  };

  const renderRecordsTab = () => (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* 1. THẺ THỐNG KÊ NHANH (Upgraded UI) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Users size={64}/></div>
          <p className="text-sm font-medium text-secondary">Tổng số hồ sơ</p>
          <p className="text-4xl font-extrabold mt-2 text-primary tracking-tight">{stats?.totalMembers ?? 0}</p>
        </div>
        <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle size={64} className="text-orange-500"/></div>
          <p className="text-sm font-medium text-secondary">Ca cảnh cáo</p>
          <p className="text-4xl font-extrabold mt-2 text-orange-500 tracking-tight">{stats?.warnedCases ?? 0}</p>
        </div>
        <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={64} className="text-green-500"/></div>
          <p className="text-sm font-medium text-secondary">KPI trung bình</p>
          <div className="flex items-baseline mt-2">
            <p className="text-4xl font-extrabold text-green-500 tracking-tight">{stats?.averageKPI ?? 0}</p>
            <span className="text-lg text-secondary ml-1 font-medium">/100</span>
          </div>
        </div>
      </div>

      {/* 2. BỘ LỌC VÀ TÌM KIẾM */}
      <div className="bg-card/80 backdrop-blur-md p-4 rounded-2xl border border-border/50 shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="flex items-center w-full lg:w-1/3 relative">
          <Search size={16} className="absolute left-4 text-secondary/70" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm MSSV hoặc tên..."
            className="pl-10 w-full bg-background/50 border-border/50 focus:bg-background transition-colors rounded-xl"
          />
        </div>
        <div className="flex items-center gap-2 w-full lg:w-64 relative">
          <Select
            value={disciplineFilter}
            onChange={(e) => setDisciplineFilter(e.target.value as any)}
            className="w-full bg-background/50 border-border/50 focus:bg-background rounded-xl"
          >
            <option value="All">Tất cả mức độ</option>
            <option value="Không">Không kỷ luật</option>
            <option value="Nhắc nhở">Nhắc nhở</option>
            <option value="Cảnh cáo Lần 1">Cảnh cáo Lần 1</option>
          </Select>
        </div>
        <Button 
          onClick={() => { void openAddRecordModal(); }}
          className="lg:ml-auto flex items-center justify-center gap-2 rounded-xl px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform active:scale-95"
        >
          <Plus size={18} /> Thêm bản ghi
        </Button>
      </div>

      {/* 3. BẢNG DỮ LIỆU */}
      <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">MSSV</TableHead>
                <TableHead className="font-semibold">Họ và tên</TableHead>
                <TableHead className="font-semibold">Ban</TableHead>
                <TableHead className="font-semibold">Vắng</TableHead>
                <TableHead className="font-semibold">Mức độ</TableHead>
                <TableHead className="font-semibold text-right">KPI</TableHead>
                <TableHead className="font-semibold text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingDiscipline ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-secondary">
                      <Loader2 size={32} className="animate-spin mb-4 text-primary"/>
                      <p className="font-medium animate-pulse">Đang tải dữ liệu hồ sơ...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-secondary/70">
                      <Users size={48} className="mb-4 opacity-20"/>
                      <p className="font-medium">Không tìm thấy bản ghi nào.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : records.map((item) => (
                <TableRow key={item.id} className="group transition-colors hover:bg-muted/40 cursor-default">
                  <TableCell className="font-medium text-secondary-foreground">{item.mssv}</TableCell>
                  <TableCell className="font-semibold">{item.name}</TableCell>
                  <TableCell><span className="text-sm px-2 py-1 bg-muted rounded-md border border-border/50">{item.committee || 'N/A'}</span></TableCell>
                  <TableCell>
                    {item.absents > 0 
                      ? <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-bold">{item.absents}</span>
                      : <span className="text-secondary">0</span>}
                  </TableCell>
                  <TableCell>
                    {item.disciplineLevel === 'Không' ? (
                      <Badge variant="outline" className="text-secondary border-secondary/30 bg-secondary/5 font-medium">Không</Badge>
                    ) : item.disciplineLevel === 'Nhắc nhở' ? (
                      <Badge variant="outline" className="text-yellow-700 border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-500 font-medium shadow-sm">Nhắc nhở</Badge>
                    ) : (
                      <Badge variant="danger" className="shadow-sm font-medium">Cảnh cáo Lần 1</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-end font-bold">
                      <span className={`text-lg ${item.kpi >= 85 ? 'text-green-600 dark:text-green-400' : item.kpi >= 65 ? 'text-yellow-600 dark:text-yellow-500' : 'text-red-600 dark:text-red-500'}`}>
                        {item.kpi}
                      </span>
                      <span className="text-xs text-secondary ml-0.5">/100</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setFormData(item as any); setIsEditModalOpen(true); }} className="hover:text-primary text-secondary">
                      Chỉnh sửa
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 4. MODAL THÊM BẢN GHI */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Thêm bản ghi kỷ luật mới">
        <form onSubmit={handleCreateRecord} className="space-y-5 pt-2">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Chọn thành viên <span className="text-red-500">*</span></label>
            <Select required value={formData.memberId || ''} onChange={(e) => handleSelectMember(e.target.value)} className="w-full rounded-xl">
              <option value="" disabled>-- Chọn thành viên từ CLB --</option>
              {allMembers.map(m => (
                <option key={m.id} value={m.id}>{m.mssv} - {m.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">MSSV</label>
              <Input readOnly disabled value={formData.mssv} className="bg-muted/50 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Họ tên</label>
              <Input readOnly disabled value={formData.name} className="bg-muted/50 rounded-xl" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Ban/Bộ phận</label>
            <Input value={formData.committee} onChange={e => setFormData({...formData, committee: e.target.value})} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Số ngày vắng</label>
              <Input type="number" min="0" value={formData.absents} onChange={e => setFormData({...formData, absents: parseInt(e.target.value) || 0})} className="rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Điểm KPI (Gốc: 100)</label>
              <Input type="number" min="0" max="150" value={formData.kpi} onChange={e => setFormData({...formData, kpi: parseFloat(e.target.value) || 0})} className="rounded-xl" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Mức kỷ luật hiện tại</label>
            <Select value={formData.disciplineLevel} onChange={e => setFormData({...formData, disciplineLevel: e.target.value})} className="w-full rounded-xl">
              <option value="Không">Không</option>
              <option value="Nhắc nhở">Nhắc nhở</option>
              <option value="Cảnh cáo Lần 1">Cảnh cáo Lần 1</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl">
              {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <CheckCircle size={16} className="mr-2" />} Xác nhận lưu
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. MODAL CHỈNH SỬA BẢN GHI */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Chỉnh sửa bản ghi kỷ luật">
        <form onSubmit={handleUpdateRecord} className="space-y-5 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">MSSV</label>
              <Input readOnly disabled value={formData.mssv} className="bg-muted/50 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Họ tên</label>
              <Input readOnly disabled value={formData.name} className="bg-muted/50 rounded-xl" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Ban/Bộ phận</label>
            <Input value={formData.committee || ''} onChange={e => setFormData({...formData, committee: e.target.value})} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Số ngày vắng</label>
              <Input type="number" min="0" value={formData.absents} onChange={e => setFormData({...formData, absents: parseInt(e.target.value) || 0})} className="rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Điểm KPI</label>
              <Input type="number" min="0" max="150" value={formData.kpi} onChange={e => setFormData({...formData, kpi: parseFloat(e.target.value) || 0})} className="rounded-xl" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Mức kỷ luật hiện tại</label>
            <Select value={formData.disciplineLevel} onChange={e => setFormData({...formData, disciplineLevel: e.target.value})} className="w-full rounded-xl">
              <option value="Không">Không</option>
              <option value="Nhắc nhở">Nhắc nhở</option>
              <option value="Cảnh cáo Lần 1">Cảnh cáo Lần 1</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsEditModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl">
              {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <CheckCircle size={16} className="mr-2" />} Lưu thay đổi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );

  const renderMeetingsTab = () => (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card/80 backdrop-blur-md border border-border/50 shadow-sm p-5 rounded-2xl gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Điểm danh Cuộc họp</h3>
          <p className="text-sm text-secondary mt-1">Quản lý lịch họp, điểm danh và đồng bộ dữ liệu vắng mặt tự động.</p>
        </div>
        <Button onClick={() => { void (async () => { await ensureMembersLoaded(); setIsAddMeetingModalOpen(true); })(); }} className="flex items-center gap-2 rounded-xl shadow-md whitespace-nowrap">
          <Plus size={16} /> Tạo cuộc họp
        </Button>
      </div>

      <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Tiêu đề</TableHead>
                <TableHead className="font-semibold">Thời gian</TableHead>
                <TableHead className="font-semibold">Loại hình</TableHead>
                <TableHead className="font-semibold">Trạng thái</TableHead>
                <TableHead className="text-right font-semibold">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingInitial ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-secondary">
                    <Loader2 size={24} className="animate-spin inline mr-2 text-primary"/> Đang tải lịch họp...
                  </TableCell>
                </TableRow>
              ) : !hasLoadedMeetings ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-secondary font-medium">
                    Chưa tải dữ liệu cuộc họp.
                  </TableCell>
                </TableRow>
              ) : meetings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-secondary font-medium">
                    Chưa có dữ liệu cuộc họp.
                  </TableCell>
                </TableRow>
              ) : meetings.map((meeting) => (
                <TableRow key={meeting.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-bold text-foreground">{meeting.title}</TableCell>
                  <TableCell className="text-secondary-foreground">{new Date(meeting.date).toLocaleString('vi-VN')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-background">{meeting.meetingType}</Badge>
                  </TableCell>
                  <TableCell>
                    {meeting.status === 'Completed' 
                      ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-semibold text-xs"><CheckCircle size={12}/> Đã kết thúc</span> 
                      : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-semibold text-xs"><Calendar size={12}/> Theo kế hoạch</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="rounded-lg shadow-sm bg-background hover:bg-muted" onClick={() => { void openAttendanceModal(meeting); }}>
                        <Users size={14} className="mr-1.5" /> Điểm danh
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-lg shadow-sm text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-900/20 dark:border-orange-900/50" onClick={() => handleSyncDiscipline(meeting.id)}>
                        <AlertCircle size={14} className="mr-1.5" /> Đồng bộ
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal isOpen={isAddMeetingModalOpen} onClose={() => setIsAddMeetingModalOpen(false)} title="Tạo cuộc họp mới">
        <form onSubmit={handleCreateMeeting} className="space-y-5 pt-2">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Tiêu đề cuộc họp <span className="text-red-500">*</span></label>
            <Input required value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} className="rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Thời gian <span className="text-red-500">*</span></label>
            <Input type="datetime-local" required value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} className="rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Loại hình</label>
            <Select value={newMeeting.meetingType} onChange={e => setNewMeeting({...newMeeting, meetingType: e.target.value})} className="w-full rounded-xl">
              <option value="Họp định kỳ">Họp định kỳ toàn CLB</option>
              <option value="Họp Ban">Họp Ban chuyên môn</option>
              <option value="Họp dự án">Họp dự án cụ thể</option>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">URL biên bản (không bắt buộc)</label>
                        <Input type="url" value={newMeeting.minutesUrl} onChange={e => setNewMeeting({...newMeeting, minutesUrl: e.target.value})} placeholder="https://docs.google.com/document/d/... hoặc URL Google Drive" className="rounded-xl" />
                        <p className="text-xs text-secondary mt-1.5">Hỗ trợ: Google Docs, Google Sheet, Google Slides hoặc Google Drive</p>
                      </div>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsAddMeetingModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl">
              {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : 'Xác nhận'}
            </Button>
          </div>
        </form>
      </Modal>

      {attendanceModalMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/50 rounded-2xl w-full max-w-4xl flex flex-col h-[85vh] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-border/50">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2"><Users className="text-primary"/> Điểm danh: <span className="text-primary">{attendanceModalMeeting.title}</span></h3>
                <p className="text-sm text-secondary mt-1">Trạng thái mặc định: "Vắng không phép". Cần chọn "Có mặt" cho các thành viên tham gia.</p>
              </div>
              <button onClick={() => setAttendanceModalMeeting(null)} className="text-secondary hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted"><X size={24} /></button>
            </div>
            <div className="overflow-y-auto p-0 flex-1">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="font-semibold">MSSV</TableHead>
                    <TableHead className="font-semibold">Họ và tên</TableHead>
                    <TableHead className="font-semibold">Ban</TableHead>
                    <TableHead className="text-center font-semibold text-green-600">Có mặt</TableHead>
                    <TableHead className="text-center font-semibold text-red-600">Vắng (Không phép)</TableHead>
                    <TableHead className="text-center font-semibold text-yellow-600">Vắng (Có phép)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allMembers.map(member => {
                    const status = attendanceData[member.id]?.status || 'Absent';
                    return (
                      <TableRow key={member.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-secondary-foreground">{member.mssv}</TableCell>
                        <TableCell className="font-semibold">{member.name}</TableCell>
                        <TableCell><span className="text-xs px-2 py-1 bg-muted rounded border border-border/30">{member.ban && member.ban.length > 0 ? member.ban.join(', ') : ''}</span></TableCell>
                        <TableCell className="text-center">
                          <input type="radio" checked={status === 'Present'} onChange={() => handleAttendanceChange(member.id, 'Present')} className="w-5 h-5 accent-green-600 cursor-pointer" />
                        </TableCell>
                        <TableCell className="text-center">
                          <input type="radio" checked={status === 'Absent'} onChange={() => handleAttendanceChange(member.id, 'Absent')} className="w-5 h-5 accent-red-600 cursor-pointer" />
                        </TableCell>
                        <TableCell className="text-center">
                          <input type="radio" checked={status === 'Excused'} onChange={() => handleAttendanceChange(member.id, 'Excused')} className="w-5 h-5 accent-yellow-500 cursor-pointer" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="p-5 border-t border-border/50 flex justify-end gap-3 bg-muted/20 rounded-b-2xl">
              <Button variant="outline" className="rounded-xl" onClick={() => setAttendanceModalMeeting(null)}>Đóng</Button>
              <Button onClick={handleSaveAttendance} disabled={isSubmitting} className="rounded-xl shadow-md">
                {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <CheckCircle size={16} className="mr-2" />} Lưu kết quả
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCompetitionsTab = () => (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card/80 backdrop-blur-md border border-border/50 p-5 rounded-2xl shadow-sm gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Hiệu suất & Thi đua</h3>
          <p className="text-sm text-secondary mt-1">Ghi nhận thành tích từ các cuộc thi/sự kiện và đồng bộ điểm cộng vào KPI.</p>
        </div>
        <Button onClick={() => setIsAddCompetitionModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-md border-0">
          <Plus size={16} /> Thêm hoạt động
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
                      ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-100 text-green-700 font-semibold text-xs"><CheckCircle size={12}/> Đã kết thúc</span> 
                      : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-100 text-yellow-700 font-semibold text-xs"><AlertCircle size={12}/> Đang diễn ra</span>}
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
            <Input required value={newCompetition.title} onChange={e => setNewCompetition({...newCompetition, title: e.target.value})} className="rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Ngày tổ chức <span className="text-red-500">*</span></label>
            <Input type="date" required value={newCompetition.date} onChange={e => setNewCompetition({...newCompetition, date: e.target.value})} className="rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Quy mô</label>
            <Select value={newCompetition.scale} onChange={e => setNewCompetition({...newCompetition, scale: e.target.value})} className="w-full rounded-xl">
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
                <h3 className="text-xl font-bold flex items-center gap-2"><Trophy className="text-yellow-500"/> Ghi nhận KPI: <span className="text-primary">{resultModalCompetition.title}</span></h3>
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
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* HEADER CHUNG */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl"><Trophy className="text-primary" size={28}/></div>
          {t('discipline.title', 'Kỷ luật & Hiệu suất')}
        </h2>
        <p className="text-secondary text-lg ml-1">{t('discipline.subtitle', 'Quản lý điểm danh, kỷ luật và đánh giá KPI toàn diện')}</p>
      </div>

      {/* THANH ĐIỀU HƯỚNG TABS */}
      <div className="flex space-x-1 border-b border-border/60 w-full overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
            activeTab === 'records' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-secondary hover:text-foreground hover:border-border'
          }`}
        >
          <Users size={18} />
          Hồ sơ Kỷ luật
        </button>
        <button
          onClick={() => setActiveTab('meetings')}
          className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
            activeTab === 'meetings' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-secondary hover:text-foreground hover:border-border'
          }`}
        >
          <Calendar size={18} />
          Điểm danh Cuộc họp
        </button>
        <button
          onClick={() => setActiveTab('competitions')}
          className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
            activeTab === 'competitions' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-secondary hover:text-foreground hover:border-border'
          }`}
        >
          <Trophy size={18} />
          Hiệu suất (Thi đua)
        </button>
      </div>

      {/* RENDER NỘI DUNG THEO TAB TRẠNG THÁI */}
      <div className="mt-6">
        {activeTab === 'records' && renderRecordsTab()}
        {activeTab === 'meetings' && renderMeetingsTab()}
        {activeTab === 'competitions' && renderCompetitionsTab()}
      </div>
    </div>
  );
};
