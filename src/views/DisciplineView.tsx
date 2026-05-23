import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Trophy,
  ClipboardCheck,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getMembers } from '../services/members';
import { Member } from '../data/members';

import { UserAccount } from '../types/app';


import DisciplineRecordsTab from '../components/Discipline/DisciplineRecordsTab';
import MeetingAttendanceTab from '../components/Discipline/MeetingAttendanceTab';
import CompetitionsTab from '../components/Discipline/CompetitionsTab';
import EvaluationTab from '../components/Discipline/EvaluationTab';

import { DisciplineHeader } from '../components/Discipline/DisciplineHeader';
import { DisciplineTabsNav, type TabConfig, type TabType } from '../components/Discipline/DisciplineTabsNav';

interface DisciplineViewProps {
  authToken?: string;
  currentUser: UserAccount;
}


const disciplineTabs = (t: any): TabConfig[] => [
  {
    id: 'evaluations',
    label: t('discipline.tabs.evaluations.label', 'Đánh giá định kỳ'),
    shortLabel: t('discipline.tabs.evaluations.short', 'Evaluation v2'),
    description: t('discipline.tabs.evaluations.desc', 'Chu kỳ, tiêu chí, minh chứng, khiếu nại và kết quả xếp loại.'),
    icon: ClipboardCheck,
    tone: 'text-primary bg-primary/10 border-primary/20',
    colorClass: 'text-primary',
  },
  {
    id: 'meetings',
    label: t('discipline.tabs.meetings.label', 'Điểm danh cuộc họp'),
    shortLabel: t('discipline.tabs.meetings.short', 'Attendance'),
    description: t('discipline.tabs.meetings.desc', 'Ghi nhận có mặt, vắng có phép, vắng không phép và chưa ghi nhận.'),
    icon: Calendar,
    tone: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900',
    colorClass: 'text-blue-600 dark:text-blue-500',
  },
  {
    id: 'records',
    label: t('discipline.tabs.records.label', 'Hồ sơ kỷ luật'),
    shortLabel: t('discipline.tabs.records.short', 'Legacy'),
    description: t('discipline.tabs.records.desc', 'Dữ liệu tóm tắt cũ, dùng để đối chiếu trong giai đoạn chuyển đổi.'),
    icon: ShieldCheck,
    tone: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900',
    colorClass: 'text-orange-600 dark:text-orange-500',
  },
  {
    id: 'competitions',
    label: t('discipline.tabs.competitions.label', 'Hiệu suất thi đua'),
    shortLabel: t('discipline.tabs.competitions.short', 'Competition'),
    description: t('discipline.tabs.competitions.desc', 'Kết quả thi đua và điểm thưởng đồng bộ sang đánh giá.'),
    icon: Trophy,
    tone: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900',
    colorClass: 'text-green-600 dark:text-green-500',
  },
];

export const parseListData = <T,>(response: any, fallbackKey?: string): T[] => {
    const directData = response?.data;
    if (Array.isArray(directData)) return directData as T[];

    if (fallbackKey && Array.isArray(directData?.[fallbackKey])) return directData[fallbackKey] as T[];

    if (Array.isArray(response?.data?.data)) return response.data.data as T[];
    return [];
  };

export const DisciplineView = ({ authToken, currentUser }: DisciplineViewProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('evaluations');
  const tabs = disciplineTabs(t);

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

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) || tabs[0];
  const ActiveTabIcon = activeTabMeta.icon;

  return (
    <div className="space-y-6 w-full px-4 sm:px-6 md:px-8 pb-10 overflow-x-hidden min-h-screen bg-background text-foreground transition-colors">
      <DisciplineHeader 
        memberCount={allMembers.length} 
        activeTabLabel={activeTabMeta.label} 
        activeTabIcon={ActiveTabIcon} 
      />

      <DisciplineTabsNav 
        tabs={tabs} 
        activeTab={activeTab} 
        onChangeTab={setActiveTab} 
      />

      <div className="mt-4 sm:mt-6 transition-all duration-300">
        {activeTab === 'records' && <DisciplineRecordsTab authToken={authToken} allMembers={allMembers} />}
        {activeTab === 'meetings' && <MeetingAttendanceTab authToken={authToken} allMembers={allMembers} />}
        {activeTab === 'competitions' && <CompetitionsTab authToken={authToken} allMembers={allMembers} />}
        {activeTab === 'evaluations' && <EvaluationTab authToken={authToken} currentUser={currentUser} allMembers={allMembers} />}
      </div>
    </div>
  );
};
