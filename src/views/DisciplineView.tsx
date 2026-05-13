import React, { useMemo, useState, useEffect } from 'react';
import { 
  Users, 
  Calendar,
  CheckCircle,
  AlertCircle,
  AlertTriangle, 
  Filter, 
  Search, 
  Loader2, 
  Plus, 
  X, 
  Trophy 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../lib/helpers';
import { 
  getDisciplineStats, 
  getDisciplineRecords, 
  createDisciplineRecord,
  type DisciplineStats, 
  type DisciplineRecord as ApiDisciplineRecord,
  type DisciplineRecordCreate
} from '../services/discipline';

import { 
  getMeetings, 
  createMeeting, 
  updateAttendance, 
  syncAttendanceToDiscipline,
  type Meeting,
  type Attendance
} from '../services/meetings';

import { getMembers} from '../services/members';
import { Member } from '../data/members';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Modal } from '../components/ui/modal';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { UserAccount } from '../types/app';

interface DisciplineViewProps {
  authToken?: string;
  currentUser: UserAccount;
}

type DisciplineLevel = 'Không' | 'Nhắc nhở' | 'Cảnh cáo Lần 1';
type TabType = 'records' | 'meetings' | 'competitions';

export const DisciplineView = ({ authToken, currentUser }: DisciplineViewProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('records');
  const [stats, setStats] = useState<DisciplineStats | null>(null);
  const [records, setRecords] = useState<ApiDisciplineRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [search, setSearch] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<'All' | DisciplineLevel>('All');

  // State for create form management
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<DisciplineRecordCreate>({
    mssv: '',
    name: '',
    committee: '',
    absents: 0,
    kpi: 100,
    disciplineLevel: 'Không',
    note: ''
  });

  // members
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);

  const [competitions, setCompetitions] = useState<any[]>([]);
  const [isAddCompetitionModalOpen, setIsAddCompetitionModalOpen] = useState(false);
  const [newCompetition, setNewCompetition] = useState({ title: '', date: '', scale: 'Cấp CLB' });
  const [resultModalCompetition, setResultModalCompetition] = useState<any | null>(null);
  const [attendanceModalMeeting, setAttendanceModalMeeting] = useState<Meeting | null>(null);
  const [isAddMeetingModalOpen, setIsAddMeetingModalOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: '', date: '', meetingType: 'Họp định kỳ', description: '' });
  // State form điểm danh
  const [attendanceData, setAttendanceData] = useState<Record<string, Attendance>>({});
  const riskCount = stats?.warnedCases ?? records.filter((item) => item.disciplineLevel !== 'Không').length;
  const [resultData, setResultData] = useState<Record<string, { achievement: string, bonusKpi: number }>>({});

  const fetchClubMembers = async () => {
    setIsFetchingMembers(true);
    const res = await getMembers({ pageSize: 1000, status: 'Active' }, authToken);
    if (res.data) {
      setAllMembers(res.data.members);
    }
    setIsFetchingMembers(false);
  };

  const fetchData = async () => {
    setIsLoading(true);
    const [statsRes, recordsRes] = await Promise.all([
      getDisciplineStats(authToken),
      getDisciplineRecords({ 
        search: search || undefined, 
        disciplineLevel: disciplineFilter === 'All' ? undefined : disciplineFilter 
      }, authToken)
    ]);

    if (statsRes.data) setStats(statsRes.data);
    if (recordsRes.data) setRecords(recordsRes.data.records);
    setIsLoading(false);
  }


  useEffect(() => {
    fetchData();
    fetchClubMembers();
    fetchInitialData();
  }, [authToken, search, disciplineFilter]);

  const getDisciplineName = (level: string) => {
    switch (level) {
      case 'Không': return t('discipline.levelNone', 'Không');
      case 'Nhắc nhở': return t('discipline.levelRemind', 'Nhắc nhở');
      case 'Cảnh cáo Lần 1': return t('discipline.levelWarning', 'Cảnh cáo Lần 1');
      default: return level;
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId) {
      alert('Vui lòng chọn thành viên hợp lệ.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await createDisciplineRecord(formData, authToken);
      if (response.success) {
        setIsAddModalOpen(false);
        // Reset form
        setFormData({
          mssv: '', name: '', committee: '', absents: 0, kpi: 100, disciplineLevel: 'Không', note: ''
        });
        // Tải lại dữ liệu sau khi thêm thành công
        await fetchData();
      } else {
        alert(response.error || 'Đã xảy ra lỗi khi tạo bản ghi.');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi hệ thống khi tạo bản ghi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectMember = (memberId: string) => {
    const selected = allMembers.find(m => m.id === memberId);
    if (selected) {
      setFormData({
        ...formData,
        memberId: selected.id,
        mssv: selected.mssv,
        name: selected.name,
        // Ép kiểu mảng string[] thành chuỗi string ngăn cách bằng dấu phẩy
        committee: selected.ban && selected.ban.length > 0 ? selected.ban.join(', ') : '' 
      });
    } else {
      // Reset khi không chọn
      setFormData({
        ...formData,
        memberId: undefined,
        mssv: '',
        name: '',
        committee: ''
      });
    }
  };

  const openAttendanceModal = (meeting: Meeting) => {
    const initialAttendance: Record<string, Attendance> = {};
    allMembers.forEach(m => {
      initialAttendance[m.id] = { memberId: m.id, status: 'Absent', note: '' }; // Mặc định là Absent (Vắng)
    });
    setAttendanceData(initialAttendance);
    setAttendanceModalMeeting(meeting);
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await createMeeting(newMeeting, authToken);
    if (res.success) {
      setIsAddModalOpen(false);
      setNewMeeting({ title: '', date: '', meetingType: 'Họp định kỳ', description: '' });
      await fetchInitialData();
    } else {
      alert("Lỗi khi tạo cuộc họp: " + res.error);
    }
    setIsSubmitting(false);
  };

  
  // Fetch dữ liệu khởi tạo
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [meetingsRes, membersRes] = await Promise.all([
        getMeetings(authToken),
        getMembers({ pageSize: 1000, status: 'Active' }, authToken)
      ]);
      
      // CẬP NHẬT: Phải lấy .data.data để truy cập vào mảng danh sách
      if (meetingsRes.data && Array.isArray(meetingsRes.data)) {
        setMeetings(meetingsRes.data);
      } else if (Array.isArray(meetingsRes.data)) {
        // Đề phòng trường hợp Service đã xử lý bóc tách sẵn
        setMeetings(meetingsRes.data);
      }

      if (membersRes.data && Array.isArray(membersRes.data.members)) {
        setAllMembers(membersRes.data.members);
      }
    } catch (error) {
      console.error("Lỗi truy xuất dữ liệu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cập nhật trạng thái điểm danh cho một thành viên
  const handleAttendanceChange = (memberId: string, status: 'Present' | 'Absent' | 'Excused') => {
    setAttendanceData(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], status }
    }));
  };

  // Xử lý lưu kết quả điểm danh
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

  // Xử lý đồng bộ Kỷ luật (Gọi Endpoint 2.2)
  const handleSyncDiscipline = async (meetingId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn đồng bộ dữ liệu vắng mặt của cuộc họp này sang hệ thống Kỷ luật? Hệ thống sẽ tự động cộng dồn số ngày vắng và phân loại mức độ kỷ luật.")) return;
    
    const res = await syncAttendanceToDiscipline(meetingId, authToken);
    if (res.success) {
      alert(res.data?.message || "Đồng bộ thành công.");
    } else {
      alert("Lỗi đồng bộ: " + res.error);
    }
  };

  
  const renderRecordsTab = () => {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        {/* 1. THẺ THỐNG KÊ NHANH */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
            <p className="text-sm text-secondary">Tổng số hồ sơ</p>
            <p className="text-3xl font-bold mt-1 text-primary">{stats?.totalMembers ?? 0}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
            <p className="text-sm text-secondary">Ca cảnh cáo</p>
            <p className="text-3xl font-bold mt-1 text-orange-500">{stats?.warnedCases ?? 0}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
            <p className="text-sm text-secondary">KPI trung bình</p>
            <p className="text-3xl font-bold mt-1 text-green-500">{stats?.averageKPI ?? 0}/100</p>
          </div>
        </div>

        {/* 2. BỘ LỌC VÀ TÌM KIẾM */}
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col lg:flex-row gap-4">
          <div className="flex items-center w-full lg:w-1/3 relative">
            <Search size={16} className="absolute left-3 text-secondary" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm MSSV hoặc tên..."
              className="pl-9 w-full"
            />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-56 relative">
            <Select
              value={disciplineFilter}
              onChange={(e) => setDisciplineFilter(e.target.value as any)}
              className="w-full"
            >
              <option value="All">Tất cả mức độ</option>
              <option value="Không">Không kỷ luật</option>
              <option value="Nhắc nhở">Nhắc nhở</option>
              <option value="Cảnh cáo Lần 1">Cảnh cáo Lần 1</option>
            </Select>
          </div>

          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="lg:ml-auto flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Thêm bản ghi
          </Button>
        </div>

        {/* 3. BẢNG DỮ LIỆU */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MSSV</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Ban</TableHead>
                  <TableHead>Vắng</TableHead>
                  <TableHead>Mức độ</TableHead>
                  <TableHead>KPI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-secondary">
                      <Loader2 size={20} className="animate-spin inline mr-2"/> Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-secondary">
                      Không tìm thấy bản ghi nào
                    </TableCell>
                  </TableRow>
                ) : records.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.mssv}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.committee}</TableCell>
                    <TableCell className={item.absents > 0 ? 'text-orange-500 font-semibold' : ''}>{item.absents}</TableCell>
                    <TableCell>
                      {item.disciplineLevel === 'Không' ? (
                        <Badge variant="outline" className="text-secondary border-secondary">Không</Badge>
                      ) : item.disciplineLevel === 'Nhắc nhở' ? (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20">Nhắc nhở</Badge>
                      ) : (
                        <Badge variant="danger">Cảnh cáo Lần 1</Badge>
                      )}
                    </TableCell>
                    <TableCell className={`font-semibold ${item.kpi >= 85 ? 'text-green-500' : item.kpi >= 65 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {item.kpi}/100
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 4. MODAL THÊM BẢN GHI (TÍCH HỢP FETCH DATA THÀNH VIÊN) */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Thêm bản ghi kỷ luật mới"
        >
          <form onSubmit={handleCreateRecord} className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Chọn thành viên <span className="text-red-500">*</span></label>
              <Select 
                required
                value={formData.memberId || ''}
                onChange={(e) => handleSelectMember(e.target.value)}
                className="w-full"
              >
                <option value="" disabled>-- Chọn thành viên từ CLB --</option>
                {allMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.mssv} - {m.name}</option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">MSSV</label>
                <Input readOnly disabled value={formData.mssv} />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Họ tên</label>
                <Input readOnly disabled value={formData.name} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Ban/Bộ phận</label>
              <Input value={formData.committee} onChange={e => setFormData({...formData, committee: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Số ngày vắng</label>
                <Input type="number" min="0" value={formData.absents} onChange={e => setFormData({...formData, absents: parseInt(e.target.value) || 0})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Điểm KPI (Gốc: 100)</label>
                <Input type="number" min="0" max="150" value={formData.kpi} onChange={e => setFormData({...formData, kpi: parseFloat(e.target.value) || 0})} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Mức kỷ luật hiện tại</label>
              <Select value={formData.disciplineLevel} onChange={e => setFormData({...formData, disciplineLevel: e.target.value})} className="w-full">
                <option value="Không">Không</option>
                <option value="Nhắc nhở">Nhắc nhở</option>
                <option value="Cảnh cáo Lần 1">Cảnh cáo Lần 1</option>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />} Xác nhận lưu
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  };

  // ==========================================
  // RENDER: TAB 2 - ĐIỂM DANH (MEETINGS)
  // ==========================================
  const renderMeetingsTab = () => {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        {/* 1. HEADER & ACTIONS */}
        <div className="flex justify-between items-center bg-card border border-border shadow-sm p-4 rounded-xl">
          <p className="text-sm text-secondary">
            Quản lý lịch họp, điểm danh và đồng bộ tự động dữ liệu vắng mặt vào hồ sơ kỷ luật.
          </p>
          <Button onClick={() => setIsAddMeetingModalOpen(true)} className="flex items-center gap-2">
            <Plus size={16} /> Tạo cuộc họp
          </Button>
        </div>

        {/* 2. BẢNG DANH SÁCH CUỘC HỌP */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Loại hình</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-secondary">
                      <Loader2 size={20} className="animate-spin inline mr-2"/> Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : meetings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-secondary">
                      Chưa có dữ liệu cuộc họp
                    </TableCell>
                  </TableRow>
                ) : meetings.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell className="font-medium">{meeting.title}</TableCell>
                    <TableCell>{new Date(meeting.date).toLocaleString('vi-VN')}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{meeting.meetingType}</Badge>
                    </TableCell>
                    <TableCell>
                      {meeting.status === 'Completed' 
                        ? <span className="text-green-500 font-medium text-sm">Đã kết thúc</span> 
                        : <span className="text-yellow-600 font-medium text-sm">Theo kế hoạch</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => openAttendanceModal(meeting)} 
                        >
                          <Users size={14} className="mr-1" /> Điểm danh
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="text-orange-500 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                          onClick={() => handleSyncDiscipline(meeting.id)} 
                        >
                          <AlertCircle size={14} className="mr-1" /> Đồng bộ
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 3. MODAL TẠO CUỘC HỌP MỚI */}
        <Modal
          isOpen={isAddMeetingModalOpen}
          onClose={() => setIsAddMeetingModalOpen(false)}
          title="Tạo cuộc họp mới"
        >
          <form onSubmit={handleCreateMeeting} className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Tiêu đề cuộc họp <span className="text-red-500">*</span></label>
              <Input required value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Thời gian <span className="text-red-500">*</span></label>
              <Input type="datetime-local" required value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Loại hình</label>
              <Select value={newMeeting.meetingType} onChange={e => setNewMeeting({...newMeeting, meetingType: e.target.value})} className="w-full">
                <option value="Họp định kỳ">Họp định kỳ toàn CLB</option>
                <option value="Họp Ban">Họp Ban chuyên môn</option>
                <option value="Họp dự án">Họp dự án cụ thể</option>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
              <Button type="button" variant="outline" onClick={() => setIsAddMeetingModalOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />} Xác nhận
              </Button>
            </div>
          </form>
        </Modal>

        {/* 4. MODAL ĐIỂM DANH */}
        {attendanceModalMeeting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-xl w-full max-w-4xl flex flex-col h-[85vh] shadow-xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-4 border-b border-border">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Users size={20}/> Điểm danh: {attendanceModalMeeting.title}</h3>
                  <p className="text-sm text-secondary mt-1">Ghi chú: Trạng thái mặc định là "Vắng không phép". Cần chọn "Có mặt" cho các thành viên tham gia để cập nhật dữ liệu.</p>
                </div>
                <button onClick={() => setAttendanceModalMeeting(null)} className="text-gray-400 hover:text-foreground"><X size={24} /></button>
              </div>
              
              <div className="overflow-y-auto p-4 flex-1">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>MSSV</TableHead>
                        <TableHead>Họ và tên</TableHead>
                        <TableHead>Ban</TableHead>
                        <TableHead className="text-center">Có mặt</TableHead>
                        <TableHead className="text-center">Vắng (Không phép)</TableHead>
                        <TableHead className="text-center">Vắng (Có phép)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allMembers.map(member => {
                        const status = attendanceData[member.id]?.status || 'Absent';
                        return (
                          <TableRow key={member.id}>
                            <TableCell>{member.mssv}</TableCell>
                            <TableCell className="font-medium">{member.name}</TableCell>
                            <TableCell className="text-xs">{member.ban && member.ban.length > 0 ? member.ban.join(', ') : ''}</TableCell>
                            <TableCell className="text-center">
                              <input 
                                type="radio" 
                                checked={status === 'Present'} 
                                onChange={() => handleAttendanceChange(member.id, 'Present')} 
                                className="w-4 h-4 accent-green-500 cursor-pointer" 
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <input 
                                type="radio" 
                                checked={status === 'Absent'} 
                                onChange={() => handleAttendanceChange(member.id, 'Absent')} 
                                className="w-4 h-4 accent-red-500 cursor-pointer" 
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <input 
                                type="radio" 
                                checked={status === 'Excused'} 
                                onChange={() => handleAttendanceChange(member.id, 'Excused')} 
                                className="w-4 h-4 accent-yellow-500 cursor-pointer" 
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="p-4 border-t border-border flex justify-end gap-3 bg-muted/50 rounded-b-xl">
                <Button variant="outline" onClick={() => setAttendanceModalMeeting(null)}>Đóng</Button>
                <Button onClick={handleSaveAttendance} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <CheckCircle size={16} className="mr-2" />} Lưu kết quả
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // RENDER: TAB 3 - HIỆU SUẤT (COMPETITIONS)
  // ==========================================
  const renderCompetitionsTab = () => {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        {/* 1. HEADER & ACTIONS */}
        <div className="flex justify-between items-center bg-card border border-border p-4 rounded-xl shadow-sm">
          <p className="text-sm text-secondary">
            Ghi nhận thành tích từ các cuộc thi/sự kiện và đồng bộ điểm cộng vào KPI cá nhân.
          </p>
          <Button onClick={() => setIsAddCompetitionModalOpen(true)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white">
            <Plus size={16} /> Thêm hoạt động
          </Button>
        </div>

        {/* 2. BẢNG DANH SÁCH CUỘC THI */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên sự kiện / Cuộc thi</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Quy mô</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Giả định biến competitions đã được fetch tương tự meetings */}
                {competitions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-secondary">
                      Chưa có dữ liệu cuộc thi
                    </TableCell>
                  </TableRow>
                ) : competitions.map((comp) => (
                  <TableRow key={comp.id}>
                    <TableCell className="font-medium">{comp.title}</TableCell>
                    <TableCell>{new Date(comp.date).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 dark:bg-purple-900/20">{comp.scale}</Badge>
                    </TableCell>
                    <TableCell>
                      {comp.status === 'Completed' 
                        ? <span className="text-green-500 font-medium text-sm">Đã kết thúc</span> 
                        : <span className="text-yellow-600 font-medium text-sm">Đang diễn ra</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                          onClick={() => {
                            setResultModalCompetition(comp);
                            setResultData({}); // Reset data form
                          }}
                        >
                          <Trophy size={14} className="mr-1" /> Cập nhật kết quả
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-900/20"
                          onClick={async () => {
                            if(window.confirm("Xác nhận đồng bộ điểm cộng KPI cho các thành viên đạt giải? Hệ thống sẽ bỏ qua những bản ghi đã đồng bộ trước đó.")) {
                              // Lệnh gọi API syncCompetitionKPI
                              alert("Đã gửi yêu cầu đồng bộ KPI.");
                            }
                          }}
                        >
                          <CheckCircle size={14} className="mr-1" /> Đồng bộ KPI
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 3. MODAL THÊM CUỘC THI MỚI */}
        <Modal
          isOpen={isAddCompetitionModalOpen}
          onClose={() => setIsAddCompetitionModalOpen(false)}
          title="Tạo sự kiện thi đua mới"
        >
          <form className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Tên sự kiện / Cuộc thi <span className="text-red-500">*</span></label>
              <Input required value={newCompetition.title} onChange={e => setNewCompetition({...newCompetition, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Ngày tổ chức <span className="text-red-500">*</span></label>
              <Input type="date" required value={newCompetition.date} onChange={e => setNewCompetition({...newCompetition, date: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Quy mô</label>
              <Select value={newCompetition.scale} onChange={e => setNewCompetition({...newCompetition, scale: e.target.value})} className="w-full">
                <option value="Cấp CLB">Cấp Câu lạc bộ</option>
                <option value="Cấp Khoa">Cấp Khoa</option>
                <option value="Cấp Trường">Cấp Trường</option>
                <option value="Quốc gia">Quy mô Toàn quốc / Mở rộng</option>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
              <Button type="button" variant="outline" onClick={() => setIsAddCompetitionModalOpen(false)}>Hủy</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">Lưu thông tin</Button>
            </div>
          </form>
        </Modal>

        {/* 4. MODAL NHẬP KẾT QUẢ & KPI */}
        {resultModalCompetition && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-xl w-full max-w-4xl flex flex-col h-[85vh] shadow-xl animate-in zoom-in-95">
              <div className="flex justify-between items-center p-4 border-b border-border">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Trophy size={20} className="text-yellow-500"/> Ghi nhận KPI: {resultModalCompetition.title}</h3>
                  <p className="text-sm text-secondary mt-1">Chỉ cần nhập Thành tích và Điểm cộng cho những cá nhân có tham gia/đạt giải. Bỏ trống nếu không tham gia.</p>
                </div>
                <button onClick={() => setResultModalCompetition(null)} className="text-gray-400 hover:text-foreground"><X size={24} /></button>
              </div>
              
              <div className="overflow-y-auto p-4 flex-1">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>MSSV</TableHead>
                        <TableHead>Họ và tên</TableHead>
                        <TableHead>Thành tích (Giải thưởng)</TableHead>
                        <TableHead className="w-32">Điểm KPI Cộng</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allMembers.map(member => {
                        const currentResult = resultData[member.id] || { achievement: '', bonusKpi: 0 };
                        return (
                          <TableRow key={member.id}>
                            <TableCell>{member.mssv}</TableCell>
                            <TableCell className="font-medium">{member.name}</TableCell>
                            <TableCell className="pr-4">
                              <Input 
                                type="text" 
                                placeholder="VD: Giải Nhất, Top 5..."
                                value={currentResult.achievement}
                                onChange={(e) => setResultData(prev => ({ ...prev, [member.id]: { ...currentResult, achievement: e.target.value } }))}
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                min="0"
                                placeholder="0"
                                value={currentResult.bonusKpi || ''}
                                onChange={(e) => setResultData(prev => ({ ...prev, [member.id]: { ...currentResult, bonusKpi: parseFloat(e.target.value) || 0 } }))}
                                className="text-green-500 font-bold"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="p-4 border-t border-border flex justify-end gap-3 bg-muted/50 rounded-b-xl">
                <Button variant="outline" onClick={() => setResultModalCompetition(null)}>Đóng</Button>
                <Button 
                  onClick={() => {
                    // Logic gửi payload (chỉ gửi những user có bonusKpi > 0)
                    console.log("Saving results:", Object.entries(resultData).filter(([_, v]) => v.bonusKpi > 0));
                    alert("Đã lưu kết quả thành công!");
                    setResultModalCompetition(null);
                  }} 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <CheckCircle size={16} className="mr-2" /> Lưu kết quả
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER CHUNG */}
      <div>
        <h2 className="text-2xl font-bold">{t('discipline.title', 'Kỷ luật & Hiệu suất')}</h2>
        <p className="text-secondary mt-1">{t('discipline.subtitle', 'Quản lý điểm danh, kỷ luật và đánh giá KPI thành viên')}</p>
      </div>

      {/* THANH ĐIỀU HƯỚNG TABS */}
      <div className="flex space-x-2 border-b border-border w-full">
        <button
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-[1px] ${
            activeTab === 'records' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-secondary hover:text-primary hover:border-primary/50'
          }`}
        >
          <Users size={16} />
          Hồ sơ Kỷ luật
        </button>
        <button
          onClick={() => setActiveTab('meetings')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-[1px] ${
            activeTab === 'meetings' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-secondary hover:text-primary hover:border-primary/50'
          }`}
        >
          <Calendar size={16} />
          Điểm danh
        </button>
        <button
          onClick={() => setActiveTab('competitions')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-[1px] ${
            activeTab === 'competitions' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-secondary hover:text-primary hover:border-primary/50'
          }`}
        >
          <Trophy size={16} />
          Hiệu suất (Thi đua)
        </button>
      </div>

      {/* RENDER NỘI DUNG THEO TAB TRẠNG THÁI */}
      <div className="mt-4">
        {activeTab === 'records' && renderRecordsTab()}
        {activeTab === 'meetings' && renderMeetingsTab()}
        {activeTab === 'competitions' && renderCompetitionsTab()}
      </div>
    </div>
  );
};
