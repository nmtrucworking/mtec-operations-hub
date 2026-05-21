import React, { useState, useEffect } from 'react';

import {
  Loader2,
  Plus,
  Users,
  CheckCircle,
  X,
  AlertCircle,
  Calendar,
  CheckCheck
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Modal } from "../ui/modal";
import { Select } from "../ui/select";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

import {
  getMeetings,
  createMeeting,
  updateMeeting,
  updateAttendance,
  syncAttendanceToDiscipline,
  getMeetingAttendance,
  type Meeting,
  type Attendance
} from '../../services/meetings_api';

import { MeetingMinutes } from '../MeetingMinutes';
import { useTranslation } from 'react-i18next';

interface Props {
  authToken?: string;
  allMembers: any[];
}

import { parseListData, handleSyncDiscipline } from "../../views/DisciplineView";

interface NewMeetingState {
  title: string;
  date: string;
  meetingType: string;
  description: string;
  minutesUrl: string;
}

const MeetingAttendanceTab = ({ authToken, allMembers }: Props) => {
  const { t } = useTranslation()
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [hasLoadedMeetings, setHasLoadedMeetings] = useState<boolean>(false);

  // Add Meeting State
  const [isAddMeetingModalOpen, setIsAddMeetingModalOpen] = useState<boolean>(false);

  // Attendance Modal State
  const [attendanceData, setAttendanceData] = useState<Record<string, Attendance>>({});

  const [isEditMeetingModalOpen, setIsEditMeetingModalOpen] = useState(false);
  const [editMeetingData, setEditMeetingData] = useState<Meeting | null>(null);

  const [attendanceModalMeeting, setAttendanceModalMeeting] = useState<Meeting | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);



  const [newMeeting, setNewMeeting] = useState<NewMeetingState>({
    title: '',
    date: '',
    meetingType: 'Họp định kỳ',
    description: '',
    minutesUrl: ''
  });


  // Fetch meetings on mount
  useEffect(() => {
    if (!hasLoadedMeetings) {
      fetchMeetings();
    }
  }, [authToken]);

  /**
   * Fetch danh sách các cuộc họp.
   */
  const fetchMeetings = async () => {
    setIsLoadingInitial(true);
    if (!authToken) return;
    try {
      // 1. Fetch danh sách các cuộc họp
      const meetingsRes = await getMeetings(authToken);
      const parsedMeetings = parseListData<Meeting>(meetingsRes);

      // 2. Stats are now calculated efficiently by the backend in GET /meetings
      const meetingsWithStats = parsedMeetings.map(meeting => {
        if (!meeting.stats) return meeting;
        const recorded = meeting.stats.present + meeting.stats.absent + meeting.stats.excused;
        const unrecordedCount = Math.max(0, allMembers.length - recorded);
        return {
          ...meeting,
          stats: {
            ...meeting.stats,
            absent: meeting.stats.absent + unrecordedCount
          }
        };
      });
      setMeetings(meetingsWithStats);
      setHasLoadedMeetings(true);
    } catch (error) {
      console.error("Lỗi truy xuất dữ liệu cuộc họp:", error);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  /**
   * Mở modal điểm danh
   * 
   * @param meeting - Cuộc họp cần điểm danh
   */
  const openAttendanceModal = async (meeting: Meeting) => {
    // Debug:
    console.log(">> Open Attendace Modal");
    console.log("meeting", meeting);

    const initialAttendance: Record<string, Attendance> = {};

    // Thiết lập trạng thái mặc định cho tất cả thành viên
    allMembers.forEach(m => {
      initialAttendance[m.id] = { memberId: m.id, status: 'Absent', note: '' };
    });

    try {
      const response = await getMeetingAttendance(meeting.id, authToken);
      
      // Sử dụng hàm parseListData có sẵn để trích xuất mảng an toàn tuyệt đối
      const attendanceList = parseListData<any>(response);

      if (attendanceList.length > 0) {
        attendanceList.forEach((att: any) => {
          // Khớp ID theo cả chuẩn snake_case (Backend) và camelCase (Frontend)
          const targetMemberId = att.member_id || att.memberId;
          
          if (targetMemberId && initialAttendance[targetMemberId]) {
            initialAttendance[targetMemberId].status = att.status;
            if (att.note) {
              initialAttendance[targetMemberId].note = att.note;
            }
          }
        });
      } else {
        console.warn("Không tìm thấy mảng dữ liệu điểm danh hợp lệ trong payload.", response);
      }
    } catch (err) {
      console.error("Lỗi quá trình tải dữ liệu điểm danh:", err);
    }

    setAttendanceData(initialAttendance);
    setAttendanceModalMeeting(meeting);
  };

  /**
   * Xử lý tạo cuộc họp
   * @param e - Sự kiện click nút tạo cuộc họp
   */
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await createMeeting(newMeeting, authToken);
    if (res.success) {
      setIsAddMeetingModalOpen(false);
      setNewMeeting({ title: '', date: '', meetingType: 'Họp định kỳ', description: '', minutesUrl: '' });
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
      await fetchMeetings(); // Bổ sung để làm mới dữ liệu bảng
    } else {
      alert("Lỗi khi cập nhật cuộc họp: " + res.error);
    }
    setIsSubmitting(false);
  };

  /**
   * Xử lý thay đổi điểm danh
   * 
   * @param memberId - ID của thành viên
   * @param status - Trạng thái điểm danh, có 3 trạng thái: Present, Absent, Excused
   */
  const handleAttendanceChange = (memberId: string, status: 'Present' | 'Absent' | 'Excused') => {
    setAttendanceData(prev => ({ ...prev, [memberId]: { ...prev[memberId], status } }));
  };

  const handleBulkAttendanceChange = (status: 'Present' | 'Absent' | 'Excused') => {
    setAttendanceData(prev => {
      const newData = { ...prev };
      Object.keys(newData).forEach(key => {
        newData[key] = { ...newData[key], status };
      });
      return newData;
    });
  };

  /**
   * Xử lý lưu điểm danh
   */
  const handleSaveAttendance = async () => {
    if (!attendanceModalMeeting) return;
    setIsSubmitting(true);


    const rawPayload = Object.values(attendanceData).map(att => ({
      memberId: att.memberId,
      status: att.status,
      note: att.note || ""
    }));

    try {
      // 2. GỬI API (Thử gửi mảng trực tiếp trước)
      // Nếu Backend cần wrapper dạng { "records": rawPayload }, bạn đổi rawPayload thành { records: rawPayload }
      const res = await updateAttendance(attendanceModalMeeting.id, rawPayload as any, authToken);

      if (res.success || res.status === 200) {
        // ... (Thay alert bằng toast nếu bạn đã cài đặt)
        alert("Lưu kết quả điểm danh thành công.");
        setAttendanceModalMeeting(null);
        await fetchMeetings();
      } else {
        alert("Lỗi khi lưu điểm danh: " + (res.error || "Dữ liệu không hợp lệ"));
      }
    } catch (error: any) {
      // Bắt lỗi 422 và log ra màn hình để biết chính xác backend đang thiếu trường gì
      console.error("Lỗi 422 Payload:", error.response?.data);
      alert("Hệ thống từ chối dữ liệu (Lỗi 422). Vui lòng kiểm tra console log.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card/80 backdrop-blur-md border border-border/50 shadow-sm p-5 rounded-2xl gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Điểm danh Cuộc họp</h3>
          <p className="text-sm text-secondary mt-1">Quản lý lịch họp, điểm danh và đồng bộ dữ liệu vắng mặt tự động.</p>
        </div>
        <Button onClick={() => setIsAddMeetingModalOpen(true)} className="flex items-center gap-2 rounded-xl shadow-md whitespace-nowrap">
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
                <TableHead className="font-semibold text-center">Thống kê</TableHead>
                <TableHead className="text-right font-semibold">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingInitial ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-secondary">
                    <Loader2 size={24} className="animate-spin inline mr-2 text-primary" /> Đang tải lịch họp...
                  </TableCell>
                </TableRow>
              ) : !hasLoadedMeetings ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-secondary font-medium">
                    Chưa tải dữ liệu cuộc họp.
                  </TableCell>
                </TableRow>
              ) : meetings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-secondary font-medium">
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
                      ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-semibold text-xs"><CheckCircle size={12} /> Đã kết thúc</span>
                      : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-semibold text-xs"><Calendar size={12} /> Theo kế hoạch</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {meeting.stats ? (
                      <div className="flex items-center justify-center gap-1.5 text-xs">
                        <div className="flex items-center gap-1 text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-md font-medium" title="Có mặt">
                          <CheckCircle size={12} /> {meeting.stats.present}
                        </div>
                        <div className="flex items-center gap-1 text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-md font-medium" title="Vắng không phép">
                          <X size={12} /> {meeting.stats.absent}
                        </div>
                        <div className="flex items-center gap-1 text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded-md font-medium" title="Vắng có phép">
                          <AlertCircle size={12} /> {meeting.stats.excused}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-secondary italic">Chưa thống kê</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline" size="sm" className="rounded-lg shadow-sm text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-900/20 dark:border-orange-900/50" onClick={() => handleSyncDiscipline(meeting.id, authToken)}>
                        <AlertCircle size={14} className="mr-1.5" /> Đồng bộ
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg shadow-sm bg-background hover:bg-muted"
                        onClick={() => {
                          setEditMeetingData(meeting);
                          setIsEditMeetingModalOpen(true);
                        }}>
                        Chỉnh sửa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg shadow-sm bg-background hover:bg-muted"
                        onClick={() => { void openAttendanceModal(meeting); }}>
                        <Users size={14} className="mr-1.5" /> Điểm danh
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
            <Input required value={newMeeting.title} onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })} className="rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Thời gian <span className="text-red-500">*</span></label>
            <Input type="datetime-local" required value={newMeeting.date} onChange={e => setNewMeeting({ ...newMeeting, date: e.target.value })} className="rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Loại hình</label>
            <Select value={newMeeting.meetingType} onChange={e => setNewMeeting({ ...newMeeting, meetingType: e.target.value })} className="w-full rounded-xl">
              <option value="Họp định kỳ">Họp định kỳ toàn CLB</option>
              <option value="Họp Ban">Họp Ban chuyên môn</option>
              <option value="Họp dự án">Họp dự án cụ thể</option>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">URL biên bản (không bắt buộc)</label>
                <Input type="url" value={newMeeting.minutesUrl} onChange={e => setNewMeeting({ ...newMeeting, minutesUrl: e.target.value })} placeholder="https://docs.google.com/document/d/... hoặc URL Google Drive" className="rounded-xl" />
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

      <Modal isOpen={isEditMeetingModalOpen} onClose={() => setIsEditMeetingModalOpen(false)} title="Chỉnh sửa cuộc họp">
        {editMeetingData && (
          <form onSubmit={handleUpdateMeeting} className="space-y-5 pt-2">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Tiêu đề cuộc họp <span className="text-red-500">*</span></label>
              <Input required value={editMeetingData.title} onChange={e => setEditMeetingData({ ...editMeetingData, title: e.target.value })} className="rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Thời gian <span className="text-red-500">*</span></label>
              {/* Định dạng lại chuỗi datetime để hiển thị chính xác trong input type="datetime-local" */}
              <Input type="datetime-local" required value={editMeetingData.date.substring(0, 16)} onChange={e => setEditMeetingData({ ...editMeetingData, date: e.target.value })} className="rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Loại hình</label>
              <Select value={editMeetingData.meetingType} onChange={e => setEditMeetingData({ ...editMeetingData, meetingType: e.target.value })} className="w-full rounded-xl">
                <option value="Họp định kỳ">Họp định kỳ toàn CLB</option>
                <option value="Họp Ban">Họp Ban chuyên môn</option>
                <option value="Họp dự án">Họp dự án cụ thể</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">URL biên bản</label>
              <Input type="url" value={editMeetingData.minutesUrl || ''} onChange={e => setEditMeetingData({ ...editMeetingData, minutesUrl: e.target.value })} className="rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Trạng thái</label>
              <Select value={editMeetingData.status} onChange={e => setEditMeetingData({ ...editMeetingData, status: e.target.value })} className="w-full rounded-xl">
                <option value="Scheduled">Theo kế hoạch</option>
                <option value="Completed">Đã kết thúc</option>
                <option value="Cancelled">Đã hủy</option>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsEditMeetingModalOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl">
                {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : 'Cập nhật'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {attendanceModalMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/50 rounded-2xl w-full max-w-4xl flex flex-col h-[85vh] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-border/50">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2"><Users className="text-primary" /> Điểm danh: <span className="text-primary">{attendanceModalMeeting.title}</span></h3>
                <p className="text-sm text-secondary mt-1">Trạng thái mặc định: "Vắng không phép". Cần chọn "Có mặt" cho các thành viên tham gia.</p>
              </div>
              <button onClick={() => setAttendanceModalMeeting(null)} className="text-secondary hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted"><X size={24} /></button>
            </div>

            <div className="px-5 py-3 bg-muted/20 border-b border-border/50 flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-foreground/80 flex items-center">
                Thao tác nhanh:
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAttendanceChange('Present')}
                className="rounded-lg text-green-600 border-green-200 bg-green-50 hover:bg-green-100 dark:bg-green-900/10 dark:border-green-900/50 dark:hover:bg-green-900/30 transition-colors"
              >
                <CheckCheck size={14} className="mr-1.5" /> Tất cả có mặt
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAttendanceChange('Absent')}
                className="rounded-lg text-red-600 border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:border-red-900/50 dark:hover:bg-red-900/30 transition-colors"
              >
                <X size={14} className="mr-1.5" /> Tất cả vắng (Không phép)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAttendanceChange('Excused')}
                className="rounded-lg text-yellow-600 border-yellow-200 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/10 dark:border-yellow-900/50 dark:hover:bg-yellow-900/30 transition-colors"
              >
                <AlertCircle size={14} className="mr-1.5" /> Tất cả vắng (Có phép)
              </Button>
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
                          <input
                            type="radio"
                            name={`status-${member.id}`}
                            checked={status === 'Present'}
                            onChange={() => handleAttendanceChange(member.id, 'Present')}
                            className="w-5 h-5 accent-green-600 cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <input
                            type="radio"
                            name={`status-${member.id}`}
                            checked={status === 'Absent'}
                            onChange={() => handleAttendanceChange(member.id, 'Absent')}
                            className="w-5 h-5 accent-red-600 cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <input
                            type="radio"
                            name={`status-${member.id}`}
                            checked={status === 'Excused'}
                            onChange={() => handleAttendanceChange(member.id, 'Excused')}
                            className="w-5 h-5 accent-yellow-500 cursor-pointer"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="p-5 border-t border-border/50 flex justify-end gap-3 bg-muted/20 rounded-b-2xl">
              <Button variant="outline" className="rounded-xl" onClick={() => setAttendanceModalMeeting(null)}>{t('common.close')}</Button>
              <Button onClick={handleSaveAttendance} disabled={isSubmitting} className="rounded-xl shadow-md">
                {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <CheckCircle size={16} className="mr-2" />} {t('common.saveResult')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MeetingAttendanceTab;