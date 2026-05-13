import React, { useMemo, useState, useEffect } from 'react';
import { 
  Users, 
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Filter, Search, Loader2, Plus, X, Trophy } from 'lucide-react';
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

interface DisciplineViewProps {
  authToken?: string;
}

type DisciplineLevel = 'Không' | 'Nhắc nhở' | 'Cảnh cáo Lần 1';
type TabType = 'records' | 'meetings' | 'competitions';

export const DisciplineView = ({ authToken }: DisciplineViewProps) => {
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
      case 'Không': return t('discipline.levelNone');
      case 'Nhắc nhở': return t('discipline.levelRemind');
      case 'Cảnh cáo Lần 1': return t('discipline.levelWarning');
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

  // State form điểm danh
  const [attendanceData, setAttendanceData] = useState<Record<string, Attendance>>({});
  
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

  const riskCount = stats?.warnedCases ?? records.filter((item) => item.disciplineLevel !== 'Không').length;

  const renderRecordsTab = () => {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        {/* 1. THẺ THỐNG KÊ NHANH */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-4 border border-[#2a4d85]">
            <p className="text-sm text-blue-300">Tổng số hồ sơ</p>
            <p className="text-3xl font-bold mt-1">{stats?.totalMembers ?? 0}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-[#2a4d85]">
            <p className="text-sm text-blue-300">Ca cảnh cáo</p>
            <p className="text-3xl font-bold mt-1 text-orange-300">{stats?.warnedCases ?? 0}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-[#2a4d85]">
            <p className="text-sm text-blue-300">KPI trung bình</p>
            <p className="text-3xl font-bold mt-1 text-green-300">{stats?.averageKPI ?? 0}/100</p>
          </div>
        </div>

        {/* 2. BỘ LỌC VÀ TÌM KIẾM */}
        <div className="bg-card p-4 rounded-xl border border-[#2a4d85] flex flex-col lg:flex-row gap-4">
          <div className="flex items-center w-full lg:w-1/3 bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2">
            <Search size={16} className="text-blue-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm MSSV hoặc tên..."
              className="bg-transparent border-none outline-none text-sm text-white ml-2 w-full placeholder-blue-400"
            />
          </div>

          <div className="flex items-center gap-2 bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 w-full lg:w-56">
            <Filter size={14} className="text-blue-300" />
            <select
              value={disciplineFilter}
              onChange={(e) => setDisciplineFilter(e.target.value as any)}
              className="bg-transparent border-none outline-none text-sm text-white w-full"
            >
              <option value="All">Tất cả mức độ</option>
              <option value="Không">Không kỷ luật</option>
              <option value="Nhắc nhở">Nhắc nhở</option>
              <option value="Cảnh cáo Lần 1">Cảnh cáo Lần 1</option>
            </select>
          </div>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="lg:ml-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            <Plus size={16} /> Thêm bản ghi
          </button>
        </div>

        {/* 3. BẢNG DỮ LIỆU */}
        <div className="bg-card rounded-xl border border-[#2a4d85] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a1f3f] text-blue-300 text-sm">
                <th className="p-4 font-semibold">MSSV</th>
                <th className="p-4 font-semibold">Họ và tên</th>
                <th className="p-4 font-semibold">Ban</th>
                <th className="p-4 font-semibold">Vắng</th>
                <th className="p-4 font-semibold">Mức độ</th>
                <th className="p-4 font-semibold">KPI</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-[#2a4d85]">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-blue-300"><Loader2 size={20} className="animate-spin inline mr-2"/> Đang tải dữ liệu...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-blue-300">Không tìm thấy bản ghi nào</td></tr>
              ) : records.map((item) => (
                <tr key={item.id} className="hover:bg-[#2a4d85]/30 transition-colors">
                  <td className="p-4">{item.mssv}</td>
                  <td className="p-4 font-medium">{item.name}</td>
                  <td className="p-4">{item.committee}</td>
                  <td className={`p-4 ${item.absents > 0 ? 'text-orange-300 font-semibold' : ''}`}>{item.absents}</td>
                  <td className="p-4">
                    <span className={item.disciplineLevel === 'Không' ? 'text-gray-300' : 'text-orange-300 font-semibold'}>
                      {item.disciplineLevel}
                    </span>
                  </td>
                  <td className={`p-4 font-semibold ${item.kpi >= 85 ? 'text-green-400' : item.kpi >= 65 ? 'text-yellow-300' : 'text-red-400'}`}>
                    {item.kpi}/100
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. MODAL THÊM BẢN GHI (TÍCH HỢP FETCH DATA THÀNH VIÊN) */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[#0a1f3f] border border-[#2a4d85] rounded-xl w-full max-w-lg p-6 shadow-xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4 border-b border-[#2a4d85] pb-2">
                <h3 className="text-lg font-semibold">Thêm bản ghi kỷ luật mới</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreateRecord} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-300 mb-1">Chọn thành viên <span className="text-red-500">*</span></label>
                  <select 
                    required
                    value={formData.memberId || ''}
                    onChange={(e) => handleSelectMember(e.target.value)}
                    className="w-full bg-[#1e3a66] border border-[#2a4d85] rounded-lg px-3 py-2 text-white outline-none"
                  >
                    <option value="" disabled>-- Chọn thành viên từ CLB --</option>
                    {allMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.mssv} - {m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-300 mb-1">MSSV</label>
                    <input readOnly disabled value={formData.mssv} className="w-full bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 text-gray-400 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-300 mb-1">Họ tên</label>
                    <input readOnly disabled value={formData.name} className="w-full bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 text-gray-400 cursor-not-allowed" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-300 mb-1">Ban/Bộ phận</label>
                  <input readOnly disabled value={formData.committee} className="w-full bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 text-gray-400 cursor-not-allowed" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-300 mb-1">Số ngày vắng</label>
                    <input type="number" min="0" value={formData.absents} onChange={e => setFormData({...formData, absents: parseInt(e.target.value) || 0})} className="w-full bg-[#1e3a66] border border-[#2a4d85] rounded-lg px-3 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-300 mb-1">Điểm KPI (Gốc: 100)</label>
                    <input type="number" min="0" max="150" value={formData.kpi} onChange={e => setFormData({...formData, kpi: parseFloat(e.target.value) || 0})} className="w-full bg-[#1e3a66] border border-[#2a4d85] rounded-lg px-3 py-2 text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-300 mb-1">Mức kỷ luật hiện tại</label>
                  <select value={formData.disciplineLevel} onChange={e => setFormData({...formData, disciplineLevel: e.target.value})} className="w-full bg-[#1e3a66] border border-[#2a4d85] rounded-lg px-3 py-2 text-white">
                    <option value="Không">Không</option>
                    <option value="Nhắc nhở">Nhắc nhở</option>
                    <option value="Cảnh cáo Lần 1">Cảnh cáo Lần 1</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#2a4d85]">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border border-[#2a4d85] text-white rounded-lg hover:bg-[#2a4d85]">Hủy</button>
                  <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />} Xác nhận lưu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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
        <div className="flex justify-between items-center bg-[#0a1f3f] border border-[#2a4d85] p-4 rounded-xl">
          <p className="text-sm text-blue-300">
            Quản lý lịch họp, điểm danh và đồng bộ tự động dữ liệu vắng mặt vào hồ sơ kỷ luật.
          </p>
          <button 
            onClick={() => setIsAddMeetingModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm flex items-center gap-2 transition-colors"
          >
            <Plus size={16} /> Tạo cuộc họp
          </button>
        </div>

        {/* 2. BẢNG DANH SÁCH CUỘC HỌP */}
        <div className="bg-card rounded-xl border border-[#2a4d85] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a1f3f] text-blue-300 text-sm">
                <th className="p-4 font-semibold">Tiêu đề</th>
                <th className="p-4 font-semibold">Thời gian</th>
                <th className="p-4 font-semibold">Loại hình</th>
                <th className="p-4 font-semibold">Trạng thái</th>
                <th className="p-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-[#2a4d85]">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-blue-300"><Loader2 size={20} className="animate-spin inline mr-2"/> Đang tải dữ liệu...</td></tr>
              ) : meetings.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-blue-300">Chưa có dữ liệu cuộc họp</td></tr>
              ) : meetings.map((meeting) => (
                <tr key={meeting.id} className="hover:bg-[#2a4d85]/30 transition-colors">
                  <td className="p-4 font-medium">{meeting.title}</td>
                  <td className="p-4">{new Date(meeting.date).toLocaleString('vi-VN')}</td>
                  <td className="p-4"><span className="bg-[#1e3a66] px-2 py-1 rounded text-xs">{meeting.meetingType}</span></td>
                  <td className="p-4">
                    {meeting.status === 'Completed' 
                      ? <span className="text-green-400">Đã kết thúc</span> 
                      : <span className="text-yellow-400">Theo kế hoạch</span>}
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => openAttendanceModal(meeting)} 
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white transition-colors"
                    >
                      <Users size={14} /> Điểm danh
                    </button>
                    <button 
                      onClick={() => handleSyncDiscipline(meeting.id)} 
                      className="flex items-center gap-1 px-3 py-1.5 border border-orange-500 text-orange-400 hover:bg-orange-500/20 rounded text-xs transition-colors"
                    >
                      <AlertCircle size={14} /> Đồng bộ Kỷ luật
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. MODAL TẠO CUỘC HỌP MỚI */}
        {isAddMeetingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#0a1f3f] border border-[#2a4d85] rounded-xl w-full max-w-md p-6 shadow-xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4 border-b border-[#2a4d85] pb-2">
                <h3 className="text-lg font-semibold">Tạo cuộc họp mới</h3>
                <button onClick={() => setIsAddMeetingModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateMeeting} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-300 mb-1">Tiêu đề cuộc họp <span className="text-red-500">*</span></label>
                  <input required value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} className="w-full bg-[#1e3a66] border border-[#2a4d85] rounded-lg px-3 py-2 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-300 mb-1">Thời gian <span className="text-red-500">*</span></label>
                  <input type="datetime-local" required value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} className="w-full bg-[#1e3a66] border border-[#2a4d85] rounded-lg px-3 py-2 text-white outline-none [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-300 mb-1">Loại hình</label>
                  <select value={newMeeting.meetingType} onChange={e => setNewMeeting({...newMeeting, meetingType: e.target.value})} className="w-full bg-[#1e3a66] border border-[#2a4d85] rounded-lg px-3 py-2 text-white outline-none">
                    <option value="Họp định kỳ">Họp định kỳ toàn CLB</option>
                    <option value="Họp Ban">Họp Ban chuyên môn</option>
                    <option value="Họp dự án">Họp dự án cụ thể</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#2a4d85]">
                  <button type="button" onClick={() => setIsAddMeetingModalOpen(false)} className="px-4 py-2 border border-[#2a4d85] text-white rounded-lg hover:bg-[#2a4d85]">Hủy</button>
                  <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />} Xác nhận
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. MODAL ĐIỂM DANH */}
        {attendanceModalMeeting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#0a1f3f] border border-[#2a4d85] rounded-xl w-full max-w-4xl flex flex-col h-[85vh] shadow-xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-4 border-b border-[#2a4d85]">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Users size={20}/> Điểm danh: {attendanceModalMeeting.title}</h3>
                  <p className="text-sm text-blue-300 mt-1">Ghi chú: Trạng thái mặc định là "Vắng không phép". Cần chọn "Có mặt" cho các thành viên tham gia để cập nhật dữ liệu.</p>
                </div>
                <button onClick={() => setAttendanceModalMeeting(null)} className="text-gray-400 hover:text-white"><X size={24} /></button>
              </div>
              
              <div className="overflow-y-auto p-4 flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-blue-300 text-sm border-b border-[#2a4d85] sticky top-0 bg-[#0a1f3f] z-10">
                      <th className="pb-2">MSSV</th>
                      <th className="pb-2">Họ và tên</th>
                      <th className="pb-2">Ban</th>
                      <th className="pb-2 text-center">Có mặt</th>
                      <th className="pb-2 text-center">Vắng (Không phép)</th>
                      <th className="pb-2 text-center">Vắng (Có phép)</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-[#2a4d85]/50">
                    {allMembers.map(member => {
                      const status = attendanceData[member.id]?.status || 'Absent';
                      return (
                        <tr key={member.id} className="hover:bg-[#1e3a66]/30 transition-colors">
                          <td className="py-3">{member.mssv}</td>
                          <td className="py-3 font-medium">{member.name}</td>
                          <td className="py-3 text-xs">{member.ban && member.ban.length > 0 ? member.ban.join(', ') : ''}</td>
                          <td className="py-3 text-center">
                            <input 
                              type="radio" 
                              checked={status === 'Present'} 
                              onChange={() => handleAttendanceChange(member.id, 'Present')} 
                              className="w-4 h-4 accent-green-500 cursor-pointer" 
                            />
                          </td>
                          <td className="py-3 text-center">
                            <input 
                              type="radio" 
                              checked={status === 'Absent'} 
                              onChange={() => handleAttendanceChange(member.id, 'Absent')} 
                              className="w-4 h-4 accent-red-500 cursor-pointer" 
                            />
                          </td>
                          <td className="py-3 text-center">
                            <input 
                              type="radio" 
                              checked={status === 'Excused'} 
                              onChange={() => handleAttendanceChange(member.id, 'Excused')} 
                              className="w-4 h-4 accent-yellow-500 cursor-pointer" 
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-[#2a4d85] flex justify-end gap-3 bg-[#0a1f3f] rounded-b-xl">
                <button onClick={() => setAttendanceModalMeeting(null)} className="px-4 py-2 border border-[#2a4d85] text-white rounded-lg hover:bg-[#2a4d85] transition-colors">Đóng</button>
                <button onClick={handleSaveAttendance} disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Lưu kết quả
                </button>
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
        <div className="flex justify-between items-center bg-[#0a1f3f] border border-[#2a4d85] p-4 rounded-xl">
          <p className="text-sm text-blue-300">
            Ghi nhận thành tích từ các cuộc thi/sự kiện và đồng bộ điểm cộng vào KPI cá nhân.
          </p>
          <button 
            onClick={() => setIsAddCompetitionModalOpen(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-sm flex items-center gap-2 transition-colors"
          >
            <Plus size={16} /> Thêm hoạt động
          </button>
        </div>

        {/* 2. BẢNG DANH SÁCH CUỘC THI */}
        <div className="bg-card rounded-xl border border-[#2a4d85] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a1f3f] text-blue-300 text-sm">
                <th className="p-4 font-semibold">Tên sự kiện / Cuộc thi</th>
                <th className="p-4 font-semibold">Thời gian</th>
                <th className="p-4 font-semibold">Quy mô</th>
                <th className="p-4 font-semibold">Trạng thái</th>
                <th className="p-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-[#2a4d85]">
              {/* Giả định biến competitions đã được fetch tương tự meetings */}
              {competitions.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-blue-300">Chưa có dữ liệu cuộc thi</td></tr>
              ) : competitions.map((comp) => (
                <tr key={comp.id} className="hover:bg-[#2a4d85]/30 transition-colors">
                  <td className="p-4 font-medium">{comp.title}</td>
                  <td className="p-4">{new Date(comp.date).toLocaleDateString('vi-VN')}</td>
                  <td className="p-4"><span className="bg-[#1e3a66] text-purple-300 px-2 py-1 rounded text-xs">{comp.scale}</span></td>
                  <td className="p-4">
                    {comp.status === 'Completed' 
                      ? <span className="text-green-400">Đã kết thúc</span> 
                      : <span className="text-yellow-400">Đang diễn ra</span>}
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => {
                        setResultModalCompetition(comp);
                        setResultData({}); // Reset data form
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-xs text-white transition-colors"
                    >
                      <Trophy size={14} /> Cập nhật kết quả
                    </button>
                    <button 
                      onClick={async () => {
                        if(window.confirm("Xác nhận đồng bộ điểm cộng KPI cho các thành viên đạt giải? Hệ thống sẽ bỏ qua những bản ghi đã đồng bộ trước đó.")) {
                          // Lệnh gọi API syncCompetitionKPI
                          alert("Đã gửi yêu cầu đồng bộ KPI.");
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 border border-green-500 text-green-400 hover:bg-green-500/20 rounded text-xs transition-colors"
                    >
                      <CheckCircle size={14} /> Đồng bộ KPI
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. MODAL THÊM CUỘC THI MỚI */}
        {isAddCompetitionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#0a1f3f] border border-[#2a4d85] rounded-xl w-full max-w-md p-6 shadow-xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-4 border-b border-[#2a4d85] pb-2">
                <h3 className="text-lg font-semibold">Tạo sự kiện thi đua mới</h3>
                <button onClick={() => setIsAddCompetitionModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-300 mb-1">Tên sự kiện / Cuộc thi <span className="text-red-500">*</span></label>
                  <input required value={newCompetition.title} onChange={e => setNewCompetition({...newCompetition, title: e.target.value})} className="w-full bg-[#1e3a66] border border-[#2a4d85] rounded-lg px-3 py-2 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-300 mb-1">Ngày tổ chức <span className="text-red-500">*</span></label>
                  <input type="date" required value={newCompetition.date} onChange={e => setNewCompetition({...newCompetition, date: e.target.value})} className="w-full bg-[#1e3a66] border border-[#2a4d85] rounded-lg px-3 py-2 text-white outline-none [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-300 mb-1">Quy mô</label>
                  <select value={newCompetition.scale} onChange={e => setNewCompetition({...newCompetition, scale: e.target.value})} className="w-full bg-[#1e3a66] border border-[#2a4d85] rounded-lg px-3 py-2 text-white outline-none">
                    <option value="Cấp CLB">Cấp Câu lạc bộ</option>
                    <option value="Cấp Khoa">Cấp Khoa</option>
                    <option value="Cấp Trường">Cấp Trường</option>
                    <option value="Quốc gia">Quy mô Toàn quốc / Mở rộng</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#2a4d85]">
                  <button type="button" onClick={() => setIsAddCompetitionModalOpen(false)} className="px-4 py-2 border border-[#2a4d85] text-white rounded-lg hover:bg-[#2a4d85]">Hủy</button>
                  <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Lưu thông tin</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. MODAL NHẬP KẾT QUẢ & KPI */}
        {resultModalCompetition && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#0a1f3f] border border-[#2a4d85] rounded-xl w-full max-w-4xl flex flex-col h-[85vh] shadow-xl animate-in zoom-in-95">
              <div className="flex justify-between items-center p-4 border-b border-[#2a4d85]">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Trophy size={20} className="text-yellow-400"/> Ghi nhận KPI: {resultModalCompetition.title}</h3>
                  <p className="text-sm text-blue-300 mt-1">Chỉ cần nhập Thành tích và Điểm cộng cho những cá nhân có tham gia/đạt giải. Bỏ trống nếu không tham gia.</p>
                </div>
                <button onClick={() => setResultModalCompetition(null)} className="text-gray-400 hover:text-white"><X size={24} /></button>
              </div>
              
              <div className="overflow-y-auto p-4 flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-blue-300 text-sm border-b border-[#2a4d85] sticky top-0 bg-[#0a1f3f] z-10">
                      <th className="pb-2">MSSV</th>
                      <th className="pb-2">Họ và tên</th>
                      <th className="pb-2">Thành tích (Giải thưởng)</th>
                      <th className="pb-2 w-32">Điểm KPI Cộng</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-[#2a4d85]/50">
                    {allMembers.map(member => {
                      const currentResult = resultData[member.id] || { achievement: '', bonusKpi: 0 };
                      return (
                        <tr key={member.id} className="hover:bg-[#1e3a66]/30 transition-colors">
                          <td className="py-3">{member.mssv}</td>
                          <td className="py-3 font-medium">{member.name}</td>
                          <td className="py-3 pr-4">
                            <input 
                              type="text" 
                              placeholder="VD: Giải Nhất, Top 5..."
                              value={currentResult.achievement}
                              onChange={(e) => setResultData(prev => ({ ...prev, [member.id]: { ...currentResult, achievement: e.target.value } }))}
                              className="w-full bg-[#1e3a66] border border-[#2a4d85] rounded px-2 py-1.5 text-white outline-none focus:border-purple-500"
                            />
                          </td>
                          <td className="py-3">
                            <input 
                              type="number" 
                              min="0"
                              placeholder="0"
                              value={currentResult.bonusKpi || ''}
                              onChange={(e) => setResultData(prev => ({ ...prev, [member.id]: { ...currentResult, bonusKpi: parseFloat(e.target.value) || 0 } }))}
                              className="w-full bg-[#1e3a66] border border-[#2a4d85] rounded px-2 py-1.5 text-green-400 font-bold outline-none focus:border-purple-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-[#2a4d85] flex justify-end gap-3 bg-[#0a1f3f] rounded-b-xl">
                <button onClick={() => setResultModalCompetition(null)} className="px-4 py-2 border border-[#2a4d85] text-white rounded-lg hover:bg-[#2a4d85]">Đóng</button>
                <button 
                  onClick={() => {
                    // Logic gửi payload (chỉ gửi những user có bonusKpi > 0)
                    console.log("Saving results:", Object.entries(resultData).filter(([_, v]) => v.bonusKpi > 0));
                    alert("Đã lưu kết quả thành công!");
                    setResultModalCompetition(null);
                  }} 
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <CheckCircle size={16} /> Lưu kết quả
                </button>
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
        <h2 className="text-2xl font-bold">{t('discipline.title')}</h2>
        <p className="text-blue-300 mt-1">{t('discipline.subtitle')}</p>
      </div>

      {/* THANH ĐIỀU HƯỚNG TABS */}
      <div className="flex space-x-1 bg-[#0a1f3f] p-1 rounded-xl border border-[#2a4d85] w-fit">
        <button
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'records' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-blue-300 hover:text-white hover:bg-[#1e3a66]'
          }`}
        >
          <Users size={16} />
          Hồ sơ Kỷ luật
        </button>
        <button
          onClick={() => setActiveTab('meetings')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'meetings' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-blue-300 hover:text-white hover:bg-[#1e3a66]'
          }`}
        >
          <Calendar size={16} />
          Điểm danh
        </button>
        <button
          onClick={() => setActiveTab('competitions')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'competitions' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-blue-300 hover:text-white hover:bg-[#1e3a66]'
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

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#0a1f3f] border border-[#2a4d85] rounded-xl w-full max-w-lg p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{t('discipline.createTitle', 'Thêm bản ghi kỷ luật mới')}</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateRecord} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-300 mb-1">
                  Chọn thành viên <span className="text-red-500">*</span>
                </label>
                <select 
                  required
                  value={formData.memberId || ''}
                  onChange={(e) => handleSelectMember(e.target.value)}
                  className="w-full bg-[#1e3a66] border border-[#2a4d85] rounded-lg px-3 py-2 text-white outline-none"
                >
                  <option value="">-- Tìm hoặc chọn thành viên --</option>
                  {allMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.mssv} - {m.name} ({m.ban})
                    </option>
                  ))}
                </select>
                {isFetchingMembers && <p className="text-xs text-blue-400 mt-1 italic">Đang tải danh sách thành viên...</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* MSSV và Họ tên giờ là Read-only (Chỉ đọc) */}
                <div>
                  <label className="block text-sm font-medium text-blue-300 mb-1">MSSV</label>
                  <input 
                    readOnly 
                    disabled
                    value={formData.mssv} 
                    className="w-full bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 text-gray-400 cursor-not-allowed" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-300 mb-1">Họ và tên</label>
                  <input 
                    readOnly 
                    disabled
                    value={formData.name} 
                    className="w-full bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 text-gray-400 cursor-not-allowed" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-300 mb-1">Ban/Ban Chuyên môn</label>
                <input value={formData.committee} onChange={e => setFormData({...formData, committee: e.target.value})} className="w-full bg-[#1e3a66] border border-[#2a4d85] rounded-lg px-3 py-2 text-white outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-300 mb-1">Số ngày vắng</label>
                  <input type="number" min="0" value={formData.absents} onChange={e => setFormData({...formData, absents: parseInt(e.target.value) || 0})} className="w-full bg-[#1e3a66] border border-[#2a4d85] rounded-lg px-3 py-2 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-300 mb-1">KPI</label>
                  <input type="number" min="0" max="100" value={formData.kpi} onChange={e => setFormData({...formData, kpi: parseFloat(e.target.value) || 0})} className="w-full bg-[#1e3a66] border border-[#2a4d85] rounded-lg px-3 py-2 text-white outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-300 mb-1">Mức kỷ luật</label>
                <select value={formData.disciplineLevel} onChange={e => setFormData({...formData, disciplineLevel: e.target.value})} className="w-full bg-[#1e3a66] border border-[#2a4d85] rounded-lg px-3 py-2 text-white outline-none">
                  <option value="Không">{t('discipline.levelNone')}</option>
                  <option value="Nhắc nhở">{t('discipline.levelRemind')}</option>
                  <option value="Cảnh cáo Lần 1">{t('discipline.levelWarning')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-300 mb-1">Ghi chú</label>
                <textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} rows={2} className="w-full bg-[#1e3a66] border border-[#2a4d85] rounded-lg px-3 py-2 text-white outline-none"></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#2a4d85]">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-transparent border border-[#2a4d85] text-white rounded-lg hover:bg-[#2a4d85] transition-colors">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  Xác nhận lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
