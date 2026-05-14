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

import { UserAccount } from '../types/app';


import DisciplineRecordsTab from '../components/Discipline/DisciplineRecordsTab';
import MeetingAttendanceTab from '../components/Discipline/MeetingAttendanceTab';
import CompetitionsTab from '../components/Discipline/CompetitionsTab';

interface DisciplineViewProps {
  authToken?: string;
  currentUser: UserAccount;
}

type TabType = 'records' | 'meetings' | 'competitions';

export const parseListData = <T,>(response: any, fallbackKey?: string): T[] => {
    const directData = response?.data;
    if (Array.isArray(directData)) return directData as T[];

    if (fallbackKey && Array.isArray(directData?.[fallbackKey])) return directData[fallbackKey] as T[];

    if (Array.isArray(response?.data?.data)) return response.data.data as T[];
    return [];
  };

export const handleSyncDiscipline = async (meetingId: string, authToken?: string) => {
    if (!window.confirm("Đồng bộ dữ liệu vắng mặt sang hệ thống Kỷ luật?")) return;
    const res = await syncAttendanceToDiscipline(meetingId, authToken);
    if (res.success) {
      alert(res.data?.message || "Đồng bộ thành công.");
    }
    else alert("Lỗi đồng bộ: " + res.error);
  };

export const DisciplineView = ({ authToken, currentUser }: DisciplineViewProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('records');

  // Data States
  const [allMembers, setAllMembers] = useState<Member[]>([]);

  useEffect(() => {
    
    const fetchMembers = async () => {
      try {
        const res = await getMembers({ pageSize: 1000, status: 'Active' }, authToken);
        if (res?.data) setAllMembers(res.data.members || []);
      } catch (error) {
        console.error("Lỗi tải danh sách thành viên:", error);
      } 
    };

    if (authToken) fetchMembers();

  }, [activeTab, authToken]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* HEADER CHUNG */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl"><Trophy className="text-primary" size={28} /></div>
          {t('discipline.title', 'Kỷ luật & Hiệu suất')}
        </h2>
        <p className="text-secondary text-lg ml-1">{t('discipline.subtitle', 'Quản lý điểm danh, kỷ luật và đánh giá KPI toàn diện')}</p>
      </div>

      {/* THANH ĐIỀU HƯỚNG TABS */}
      <div className="flex space-x-1 border-b border-border/60 w-full overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${activeTab === 'records'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary hover:text-foreground hover:border-border'
            }`}
        >
          <Users size={18} />
          Hồ sơ Kỷ luật
        </button>
        <button
          onClick={() => setActiveTab('meetings')}
          className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${activeTab === 'meetings'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary hover:text-foreground hover:border-border'
            }`}
        >
          <Calendar size={18} />
          Điểm danh Cuộc họp
        </button>
        <button
          onClick={() => setActiveTab('competitions')}
          className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${activeTab === 'competitions'
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
        {activeTab === 'records' && <DisciplineRecordsTab authToken={authToken} allMembers={allMembers} />}
        {activeTab === 'meetings' && <MeetingAttendanceTab authToken={authToken} allMembers={allMembers} />}
        {activeTab === 'competitions' && <CompetitionsTab authToken={authToken} allMembers={allMembers} />}
      </div>
    </div>
  );
};
