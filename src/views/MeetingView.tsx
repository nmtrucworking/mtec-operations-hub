import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, Loader2, Plus, X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getMeetings, createMeeting, updateAttendance, syncAttendanceToDiscipline, type Meeting, type Attendance } from '../services/meetings';
import { getMembers } from '../services/members';
import type { Member } from '../data/members';

interface MeetingViewProps {
  authToken?: string;
}

export const MeetingView = ({ authToken }: MeetingViewProps) => {
  const { t } = useTranslation();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State quản lý thành viên cho form điểm danh
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  
  // States quản lý Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [attendanceModalMeeting, setAttendanceModalMeeting] = useState<Meeting | null>(null);
  
  // State form tạo cuộc họp
  const [newMeeting, setNewMeeting] = useState({ title: '', date: '', meetingType: 'Họp định kỳ', description: '' });
  
  // State form điểm danh
  const [attendanceData, setAttendanceData] = useState<Record<string, Attendance>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch dữ liệu khởi tạo
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [meetingsRes, membersRes] = await Promise.all([
        getMeetings(authToken),
        getMembers({ pageSize: 1000, status: 'Active' }, authToken)
      ]);
      
      if (meetingsRes.data) setMeetings(meetingsRes.data);
      if (membersRes.data?.members) setAllMembers(membersRes.data.members);
    } catch (error) {
      console.error("Lỗi truy xuất dữ liệu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [authToken]);

  // Xử lý tạo cuộc họp mới
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

  // Khởi tạo dữ liệu điểm danh mặc định khi mở Modal điểm danh
  const openAttendanceModal = (meeting: Meeting) => {
    const initialAttendance: Record<string, Attendance> = {};
    allMembers.forEach(m => {
      initialAttendance[m.id] = { memberId: m.id, status: 'Absent', note: '' }; // Mặc định là Absent (Vắng)
    });
    setAttendanceData(initialAttendance);
    setAttendanceModalMeeting(meeting);
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

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">Cuộc họp & Điểm danh</h2>
          <p className="text-blue-300 mt-1">Quản lý lịch họp và đồng bộ chuyên cần thành viên</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm transition-colors"
        >
          <Plus size={16} /> Tạo cuộc họp
        </button>
      </div>

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
              <tr><td colSpan={5} className="p-8 text-center text-blue-300"><Loader2 size={20} className="animate-spin inline mr-2"/> Đang tải...</td></tr>
            ) : meetings.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-blue-300">Chưa có dữ liệu cuộc họp</td></tr>
            ) : meetings.map((meeting) => (
              <tr key={meeting.id} className="hover:bg-[#2a4d85]/30">
                <td className="p-4 font-medium">{meeting.title}</td>
                <td className="p-4">{new Date(meeting.date).toLocaleString('vi-VN')}</td>
                <td className="p-4"><span className="bg-[#1e3a66] px-2 py-1 rounded text-xs">{meeting.meetingType}</span></td>
                <td className="p-4">{meeting.status === 'Completed' ? <span className="text-green-400">Đã kết thúc</span> : <span className="text-yellow-400">Theo kế hoạch</span>}</td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button onClick={() => openAttendanceModal(meeting)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white">
                    <Users size={14} /> Điểm danh
                  </button>
                  <button onClick={() => handleSyncDiscipline(meeting.id)} className="flex items-center gap-1 px-3 py-1.5 border border-orange-500 text-orange-400 hover:bg-orange-500/20 rounded text-xs">
                    <AlertCircle size={14} /> Đồng bộ Kỷ luật
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Điểm Danh */}
      {attendanceModalMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0a1f3f] border border-[#2a4d85] rounded-xl w-full max-w-4xl flex flex-col h-[85vh]">
            <div className="flex justify-between items-center p-4 border-b border-[#2a4d85]">
              <div>
                <h3 className="text-lg font-semibold">Điểm danh: {attendanceModalMeeting.title}</h3>
                <p className="text-sm text-blue-300">Mặc định hệ thống đánh dấu "Vắng không phép". Vui lòng chọn "Có mặt" cho các thành viên tham gia.</p>
              </div>
              <button onClick={() => setAttendanceModalMeeting(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="overflow-y-auto p-4 flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-blue-300 text-sm border-b border-[#2a4d85]">
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
                      <tr key={member.id} className="hover:bg-[#1e3a66]/30">
                        <td className="py-3">{member.mssv}</td>
                        <td className="py-3 font-medium">{member.name}</td>
                        <td className="py-3 text-xs">{member.ban?.join(', ')}</td>
                        <td className="py-3 text-center">
                          <input type="radio" checked={status === 'Present'} onChange={() => handleAttendanceChange(member.id, 'Present')} className="w-4 h-4 accent-green-500 cursor-pointer" />
                        </td>
                        <td className="py-3 text-center">
                          <input type="radio" checked={status === 'Absent'} onChange={() => handleAttendanceChange(member.id, 'Absent')} className="w-4 h-4 accent-red-500 cursor-pointer" />
                        </td>
                        <td className="py-3 text-center">
                          <input type="radio" checked={status === 'Excused'} onChange={() => handleAttendanceChange(member.id, 'Excused')} className="w-4 h-4 accent-yellow-500 cursor-pointer" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-[#2a4d85] flex justify-end gap-3 bg-[#0a1f3f]">
              <button onClick={() => setAttendanceModalMeeting(null)} className="px-4 py-2 border border-[#2a4d85] text-white rounded-lg hover:bg-[#2a4d85] transition-colors">Đóng</button>
              <button onClick={handleSaveAttendance} disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Lưu điểm danh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};