import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Filter, Search, Loader2 } from 'lucide-react';
import { getDisciplineStats, getDisciplineRecords, type DisciplineStats, type DisciplineRecord as ApiDisciplineRecord } from '../services/discipline';


interface DisciplineViewProps {
  authToken?: string;
}

type DisciplineLevel = 'Không' | 'Nhắc nhở' | 'Cảnh cáo Lần 1';

export const DisciplineView = ({ authToken }: DisciplineViewProps) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DisciplineStats | null>(null);
  const [records, setRecords] = useState<ApiDisciplineRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<'All' | DisciplineLevel>('All');

  useEffect(() => {
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
    };
    fetchData();
  }, [authToken, search, disciplineFilter]);

  const getDisciplineName = (level: string) => {
    switch (level) {
      case 'Không': return t('discipline.levelNone');
      case 'Nhắc nhở': return t('discipline.levelRemind');
      case 'Cảnh cáo Lần 1': return t('discipline.levelWarning');
      default: return level;
    }
  };

  const riskCount = stats?.warnedCases ?? records.filter((item) => item.disciplineLevel !== 'Không').length;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">{t('discipline.title')}</h2>
          <p className="text-blue-300 mt-1">{t('discipline.subtitle')}</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors">
          {t('discipline.exportBtn')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`bg-card rounded-xl p-4 border border-[#2a4d85]`}>
          <p className="text-sm text-blue-300">{t('discipline.statTotal')}</p>
          <p className="text-3xl font-bold mt-1">{stats?.totalMembers ?? records.length}</p>
        </div>
        <div className={`bg-card rounded-xl p-4 border border-[#2a4d85]`}>
          <p className="text-sm text-blue-300">{t('discipline.statWarning')}</p>
          <p className="text-3xl font-bold mt-1 text-orange-300">{stats?.warnedCases ?? riskCount}</p>
        </div>
        <div className={`bg-card rounded-xl p-4 border border-[#2a4d85]`}>
          <p className="text-sm text-blue-300">{t('discipline.statAvgKpi')}</p>
          <p className="text-3xl font-bold mt-1 text-green-300">{stats?.averageKPI ?? Math.round(records.reduce((sum, item) => sum + item.kpi, 0) / records.length)}/100</p>
        </div>
      </div>

      <div className={`bg-card p-4 rounded-xl border border-[#2a4d85] flex flex-col lg:flex-row gap-4`}>
        <div className="flex items-center w-full lg:w-1/3 bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2">
          <Search size={16} className="text-blue-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('discipline.searchPlaceholder')}
            className="bg-transparent border-none outline-none text-sm text-white ml-2 w-full placeholder-blue-400"
          />
        </div>

        <div className="flex items-center gap-2 bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 w-full lg:w-56">
          <Filter size={14} className="text-blue-300" />
          <select
            value={disciplineFilter}
            onChange={(e) => setDisciplineFilter(e.target.value as 'All' | DisciplineLevel)}
            className="bg-transparent border-none outline-none text-sm text-white w-full"
          >
            <option value="All">{t('discipline.filterLevelAll')}</option>
            <option value="Không">{t('discipline.levelNone')}</option>
            <option value="Nhắc nhở">{t('discipline.levelRemind')}</option>
            <option value="Cảnh cáo Lần 1">{t('discipline.levelWarning')}</option>
          </select>
        </div>
      </div>

      <div className={`bg-card rounded-xl border border-[#2a4d85] overflow-hidden`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0a1f3f] text-blue-300 text-sm">
              <th className="p-4 font-semibold">{t('discipline.thMssv')}</th>
              <th className="p-4 font-semibold">{t('discipline.thName')}</th>
              <th className="p-4 font-semibold">{t('discipline.thDept')}</th>
              <th className="p-4 font-semibold">{t('discipline.thAbsent')}</th>
              <th className="p-4 font-semibold">{t('discipline.thLevel')}</th>
              <th className="p-4 font-semibold">{t('discipline.thKpi')}</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-[#2a4d85] relative">
            {isLoading && (
              <tr>
                <td colSpan={6} className="p-8 text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-300">
                    <Loader2 size={20} className="animate-spin" />
                    <span>{t('common.loading', 'Đang tải...')}</span>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && records.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-blue-300">
                  {t('common.noData', 'Không có dữ liệu')}
                </td>
              </tr>
            )}
            {!isLoading && records.map((item) => (
              <tr key={item.mssv} className="hover:bg-[#2a4d85]/30 transition-colors">
                <td className="p-4">{item.mssv}</td>
                <td className="p-4 font-medium">{item.name}</td>
                <td className="p-4">{item.committee}</td>
                <td className={`p-4 ${item.absents > 0 ? 'text-orange-300 font-semibold' : ''}`}>{item.absents}</td>
                <td className="p-4">
                  <span className={item.disciplineLevel === 'Không' ? 'text-gray-300' : 'text-orange-300 font-semibold'}>{getDisciplineName(item.disciplineLevel)}</span>
                </td>
                <td className={`p-4 font-semibold ${item.kpi >= 85 ? 'text-green-400' : item.kpi >= 65 ? 'text-yellow-300' : 'text-red-400'}`}>{item.kpi}/100</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`bg-card rounded-xl p-5 border border-[#2a4d85]`}>
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><AlertTriangle size={18} className="text-orange-300" />{t('discipline.noteTitle')}</h3>
        <p className="text-sm text-blue-100">{t('discipline.noteDesc')}</p>
      </div>
    </div>
  );
};
