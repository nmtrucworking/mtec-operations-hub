import React from 'react';
import { Trophy, BookOpen, Activity, Users, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DisciplineHeaderProps {
  memberCount: number;
  activeTabLabel: string;
  activeTabIcon: LucideIcon;
}

export const DisciplineHeader: React.FC<DisciplineHeaderProps> = ({
  memberCount,
  activeTabLabel,
  activeTabIcon: ActiveTabIcon,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-8">
      <div className="space-y-4 min-w-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/10 shadow-sm">
            <Trophy className="text-primary" size={28} />
          </div>
          <div className="min-w-0">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              {t('discipline.header.title', 'Kỷ luật & Chuyên cần')}
            </h2>
            <p className="text-secondary text-sm mt-1">
              {t('discipline.header.subtitle', 'Quản lý điểm danh, vai trò, minh chứng và kết quả đánh giá định kỳ.')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 cursor-default">
            <BookOpen size={14} />
            {t('discipline.header.ruleTag', 'Quy định Evaluation')}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/50 px-3.5 py-1.5 text-xs font-medium text-secondary backdrop-blur-sm cursor-default">
            <Activity size={14} />
            {t('discipline.header.sourceTag', 'Evaluation v2 là nguồn tổng hợp chính')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4 rounded-2xl border border-border/40 bg-card/60 px-5 py-3 shadow-sm backdrop-blur-md">
          <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
            <Users size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-secondary uppercase tracking-wider">
              {t('discipline.header.activeMembers', 'Thành viên active')}
            </div>
            <div className="text-xl font-black text-foreground leading-none mt-1">{memberCount}</div>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-4 rounded-2xl border border-border/40 bg-card/60 px-5 py-3 shadow-sm backdrop-blur-md">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <ActiveTabIcon size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-secondary uppercase tracking-wider">
              {t('discipline.header.viewing', 'Đang xem')}
            </div>
            <div className="text-sm font-bold text-foreground mt-1 truncate max-w-[140px]">{activeTabLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
