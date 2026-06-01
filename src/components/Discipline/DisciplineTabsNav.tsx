import React from 'react';
import { type LucideIcon, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type TabType = 'records' | 'meetings' | 'competitions' | 'evaluations';

export interface TabConfig {
  id: TabType;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  tone: string;
  colorClass: string;
}

interface DisciplineTabsNavProps {
  tabs: TabConfig[];
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const DisciplineTabsNav: React.FC<DisciplineTabsNavProps> = ({
  tabs,
  activeTab,
  onChangeTab,
}) => {
  const { t } = useTranslation();
  const activeTabMeta = tabs.find(tab => tab.id === activeTab);

  const getDescription = (tabId: TabType) => {
    if (tabId === 'evaluations') return t('discipline.tabsNav.evaluationsDesc', 'Chu kỳ, tiêu chí, minh chứng, khiếu nại và kết quả xếp loại.');
    if (tabId === 'meetings') return t('discipline.tabsNav.meetingsDesc', 'Ghi nhận có mặt, vắng có phép, vắng không phép và chưa ghi nhận.');
    if (tabId === 'competitions') return t('discipline.tabsNav.competitionsDesc', 'Kết quả thi đua và điểm thưởng đồng bộ sang đánh giá.');
    return t('discipline.tabsNav.recordsDesc', 'Dữ liệu tóm tắt cũ, dùng để đối chiếu trong giai đoạn chuyển đổi.');
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex bg-card/50 border border-border/40 rounded-2xl p-1.5 shadow-sm backdrop-blur-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? `bg-background shadow-sm ring-1 ring-border/50 ${tab.colorClass}`
                    : 'text-secondary hover:text-foreground hover:bg-background/40'
                }`}
              >
                <Icon size={16} className={isActive ? '' : 'opacity-70'} />
                <span className="whitespace-nowrap">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTabMeta && (
        <div className="flex items-start gap-3 rounded-xl border border-border/35 bg-card/30 px-4 py-3 text-secondary shadow-sm">
          <Info size={18} className="mt-0.5 shrink-0 text-primary/70" />
          <div className="text-sm leading-relaxed">
            <span className="font-semibold text-foreground mr-2">{activeTabMeta.label}:</span>
            {getDescription(activeTabMeta.id)}
          </div>
        </div>
      )}
    </div>
  );
};
