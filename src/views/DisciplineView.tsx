import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Filter, Search, Loader2, Plus, X } from 'lucide-react';
import { formatDate } from '../lib/helpers';
import { 
  getDisciplineStats, 
  getDisciplineRecords, 
  createDisciplineRecord,
  type DisciplineStats, 
  type DisciplineRecord as ApiDisciplineRecord,
  type DisciplineRecordCreate
} from '../services/discipline';

import { getMembers} from '../services/members';
import { Member } from '../data/members';

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

  const riskCount = stats?.warnedCases ?? records.filter((item) => item.disciplineLevel !== 'Không').length;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">{t('discipline.title')}</h2>
          <p className="text-blue-300 mt-1">{t('discipline.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            <Plus size={16} />
            {t('discipline.addBtn', 'Thêm bản ghi')}
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors">
            {t('discipline.exportBtn')}
          </button>
        </div>
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
    
    {/* Add Modal */}
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
