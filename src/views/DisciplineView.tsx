import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  AlertCircle,
  Trophy,
  ClipboardCheck,
  ShieldCheck,
  BookOpen,
  Activity,
  type LucideIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';


import {
  syncAttendanceToDiscipline,
} from '../services/meetings_api';

import { getMembers } from '../services/members';
import { Member } from '../data/members';

import { UserAccount } from '../types/app';


import DisciplineRecordsTab from '../components/Discipline/DisciplineRecordsTab';
import MeetingAttendanceTab from '../components/Discipline/MeetingAttendanceTab';
import CompetitionsTab from '../components/Discipline/CompetitionsTab';
import EvaluationTab from '../components/Discipline/EvaluationTab';

interface DisciplineViewProps {
  authToken?: string;
  currentUser: UserAccount;
}

type TabType = 'records' | 'meetings' | 'competitions' | 'evaluations';

const disciplineTabs: Array<{
  id: TabType;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  tone: string;
}> = [
  {
    id: 'evaluations',
    label: 'Đánh giá định kỳ',
    shortLabel: 'Evaluation v2',
    description: 'Chu kỳ, tiêu chí, minh chứng, khiếu nại và kết quả xếp loại.',
    icon: ClipboardCheck,
    tone: 'text-primary bg-primary/10 border-primary/20',
  },
  {
    id: 'meetings',
    label: 'Điểm danh cuộc họp',
    shortLabel: 'Attendance',
    description: 'Ghi nhận có mặt, vắng có phép, vắng không phép và chưa ghi nhận.',
    icon: Calendar,
    tone: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900',
  },
  {
    id: 'records',
    label: 'Hồ sơ kỷ luật',
    shortLabel: 'Legacy',
    description: 'Dữ liệu tóm tắt cũ, dùng để đối chiếu trong giai đoạn chuyển đổi.',
    icon: ShieldCheck,
    tone: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900',
  },
  {
    id: 'competitions',
    label: 'Hiệu suất thi đua',
    shortLabel: 'Competition',
    description: 'Kết quả thi đua và điểm thưởng đồng bộ sang đánh giá.',
    icon: Trophy,
    tone: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900',
  },
];

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
  const [activeTab, setActiveTab] = useState<TabType>('evaluations');

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

  }, [authToken]);

  const activeTabMeta = disciplineTabs.find((tab) => tab.id === activeTab) || disciplineTabs[0];
  const ActiveTabIcon = activeTabMeta.icon;

  return (
    <div className="space-y-6 w-full px-4 sm:px-6 md:px-8 pb-10 overflow-x-hidden">
      <section className="border border-border/40 bg-card/45 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div className="space-y-3 min-w-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <Trophy className="text-primary" size={28} />
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {t('discipline.title', 'Kỷ luật & Hiệu suất')}
                </h2>
                <p className="text-secondary text-sm sm:text-base">
                  {t('discipline.subtitle', 'Quản lý điểm danh, kỷ luật và đánh giá định kỳ toàn diện')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <BookOpen size={14} />
                Quy định Evaluation
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/60 px-3 py-1 text-xs font-semibold text-secondary">
                <Activity size={14} />
                Evaluation v2 là nguồn tổng hợp kết quả chính
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full xl:w-[360px]">
            <div className="rounded-xl border border-border/35 bg-background/55 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-wide">
                <Users size={14} />
                Thành viên active
              </div>
              <div className="mt-1 text-2xl font-black text-foreground">{allMembers.length}</div>
            </div>
            <div className="rounded-xl border border-border/35 bg-background/55 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-wide">
                <ActiveTabIcon size={14} />
                Đang xem
              </div>
              <div className="mt-1 text-sm font-black text-foreground truncate">{activeTabMeta.label}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {disciplineTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`group text-left rounded-xl border p-4 transition-all ${
                isActive
                  ? 'border-primary/45 bg-primary/5 shadow-sm ring-2 ring-primary/15'
                  : 'border-border/40 bg-card/35 hover:border-primary/25 hover:bg-card/60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border ${tab.tone}`}>
                  <Icon size={19} />
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-background text-secondary border border-border/40'
                }`}>
                  {tab.shortLabel}
                </span>
              </div>
              <div className="mt-3 space-y-1">
                <div className="font-black text-foreground">{tab.label}</div>
                <p className="text-sm leading-5 text-secondary">{tab.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
        activeTab === 'records'
          ? 'border-orange-200 bg-orange-50/70 text-orange-800 dark:border-orange-900 dark:bg-orange-950/20 dark:text-orange-300'
          : 'border-border/35 bg-card/35 text-secondary'
      }`}>
        {activeTab === 'records' ? (
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
        ) : (
          <ActiveTabIcon size={18} className="mt-0.5 shrink-0 text-primary" />
        )}
        <div className="text-sm leading-6">
          {activeTab === 'evaluations' && 'Quy định Evaluation bao gồm cách tính điểm, xếp loại, minh chứng, khiếu nại và trạng thái chu kỳ.'}
          {activeTab === 'meetings' && 'Điểm danh cuộc họp là dữ liệu đầu vào quan trọng cho chuyên cần và các lỗi vắng không phép trong evaluation.'}
          {activeTab === 'competitions' && 'Hiệu suất thi đua được dùng như nguồn điểm thưởng/đóng góp khi tính kết quả đánh giá định kỳ.'}
          {activeTab === 'records' && 'Hồ sơ kỷ luật legacy được giữ để đối chiếu trong giai đoạn chuyển đổi; kết quả chính nên xem tại Evaluation v2.'}
        </div>
      </div>

      <div className="mt-2">
        {activeTab === 'records' && <DisciplineRecordsTab authToken={authToken} allMembers={allMembers} />}
        {activeTab === 'meetings' && <MeetingAttendanceTab authToken={authToken} allMembers={allMembers} />}
        {activeTab === 'competitions' && <CompetitionsTab authToken={authToken} allMembers={allMembers} />}
        {activeTab === 'evaluations' && <EvaluationTab authToken={authToken} currentUser={currentUser} allMembers={allMembers} />}
      </div>
    </div>
  );
};
