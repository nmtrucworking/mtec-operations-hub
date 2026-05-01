import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Boxes, Filter, Pencil, Search, ShieldAlert, X } from 'lucide-react';
import { assetSeedData, type AssetItem, type AssetStatus } from '../data/logistics';
import { getAssetStats, getAssetCategories, type AssetStats } from '../services/logistics';


interface LogisticsViewProps {
  authToken?: string;
}

const nextAssetId = (list: AssetItem[]) => {
  const maxId = list.reduce((max, item) => {
    const n = Number(item.id.replace('TS-', ''));
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0);
  return `TS-${String(maxId + 1).padStart(3, '0')}`;
};

const defaultAssetForm = (list: AssetItem[]): AssetItem => ({
  id: nextAssetId(list),
  name: '',
  quantity: 1,
  status: 'Tốt',
  holder: '',
  category: ''
});

export const LogisticsView = ({ authToken }: LogisticsViewProps) => {
  const { t } = useTranslation();
  const [assets, setAssets] = useState<AssetItem[]>(assetSeedData);
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | AssetStatus>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AssetItem>(defaultAssetForm(assetSeedData));

  useEffect(() => {
    const fetchData = async () => {
      const statsRes = await getAssetStats(authToken);
      if (statsRes.data) setStats(statsRes.data);

      const catRes = await getAssetCategories(authToken);
      if (catRes.data) setCategories(catRes.data);
    };
    fetchData();
  }, [authToken]);

  const getStatusName = (status: string) => {
    switch (status) {
      case 'Tốt': return t('logistics.statusGood');
      case 'Mới': return t('logistics.statusNew');
      case 'Đang mượn': return t('logistics.statusBorrowed');
      case 'Cần bảo trì': return t('logistics.statusMaintenance');
      default: return status;
    }
  };

  const filteredAssets = useMemo(
    () =>
      assets.filter((item) => {
        const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.id.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'All' || item.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [assets, search, statusFilter]
  );

  const borrowedCount = assets.filter((item) => item.status === 'Đang mượn').length;
  const maintenanceCount = assets.filter((item) => item.status === 'Cần bảo trì').length;

  const openCreateModal = () => {
    setEditingId(null);
    setForm(defaultAssetForm(assets));
    setIsModalOpen(true);
  };

  const openEditModal = (item: AssetItem) => {
    setEditingId(item.id);
    setForm(item);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.category.trim() || !form.holder.trim() || form.quantity <= 0) {
      return;
    }

    if (editingId) {
      setAssets((prev) => prev.map((item) => (item.id === editingId ? form : item)));
    } else {
      setAssets((prev) => [...prev, form]);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">{t('logistics.title')}</h2>
          <p className="text-blue-300 mt-1">{t('logistics.subtitle')}</p>
        </div>
        <button onClick={openCreateModal} className={`px-4 py-2 bg-gold hover:bg-gold-hover text-[#061932] font-semibold rounded-lg text-sm transition-colors`}>
          + {t('logistics.addBtn')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`bg-card rounded-xl p-4 border border-[#2a4d85]`}>
          <p className="text-sm text-blue-300">{t('logistics.statTotal')}</p>
          <p className="text-3xl font-bold mt-1">{stats?.total ?? assets.length}</p>
        </div>
        <div className={`bg-card rounded-xl p-4 border border-[#2a4d85]`}>
          <p className="text-sm text-blue-300">{t('logistics.statBorrowed')}</p>
          <p className="text-3xl font-bold mt-1 text-orange-300">{stats?.borrowed ?? borrowedCount}</p>
        </div>
        <div className={`bg-card rounded-xl p-4 border border-[#2a4d85]`}>
          <p className="text-sm text-blue-300">{t('logistics.statMaintenance')}</p>
          <p className="text-3xl font-bold mt-1 text-red-300">{stats?.maintenance ?? maintenanceCount}</p>
        </div>
      </div>

      <div className={`bg-card p-4 rounded-xl border border-[#2a4d85] flex flex-col lg:flex-row gap-4`}>
        <div className="flex items-center w-full lg:w-1/3 bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2">
          <Search size={16} className="text-blue-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('logistics.searchPlaceholder')}
            className="bg-transparent border-none outline-none text-sm text-white ml-2 w-full placeholder-blue-400"
          />
        </div>

        <div className="flex items-center gap-2 bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 w-full lg:w-48">
          <Filter size={14} className="text-blue-300" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | AssetStatus)}
            className="bg-transparent border-none outline-none text-sm text-white w-full"
          >
            <option value="All">{t('logistics.filterStatusAll')}</option>
            <option value="Tốt">{t('logistics.statusGood')}</option>
            <option value="Mới">{t('logistics.statusNew')}</option>
            <option value="Đang mượn">{t('logistics.statusBorrowed')}</option>
            <option value="Cần bảo trì">{t('logistics.statusMaintenance')}</option>
          </select>
        </div>
      </div>

      <div className={`bg-card rounded-xl border border-[#2a4d85] overflow-hidden`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0a1f3f] text-blue-300 text-sm">
              <th className="p-4 font-semibold">{t('logistics.thId')}</th>
              <th className="p-4 font-semibold">{t('logistics.thName')}</th>
              <th className="p-4 font-semibold">{t('logistics.thCategory')}</th>
              <th className="p-4 font-semibold">{t('logistics.thQuantity')}</th>
              <th className="p-4 font-semibold">{t('logistics.thStatus')}</th>
              <th className="p-4 font-semibold">{t('logistics.thHolder')}</th>
              <th className="p-4 font-semibold">{t('logistics.thAction')}</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-[#2a4d85]">
            {filteredAssets.map((item) => (
              <tr key={item.id} className="hover:bg-[#2a4d85]/30 transition-colors">
                <td className="p-4 font-medium text-[#ffc20e]">{item.id}</td>
                <td className="p-4 font-medium">{item.name}</td>
                <td className="p-4">{item.category}</td>
                <td className="p-4">{item.quantity}</td>
                <td className="p-4">
                  <span
                    className={
                      item.status === 'Cần bảo trì'
                        ? 'text-red-300 font-semibold'
                        : item.status === 'Đang mượn'
                          ? 'text-orange-300 font-semibold'
                          : 'text-green-300'
                    }
                  >
                    {getStatusName(item.status)}
                  </span>
                </td>
                <td className="p-4">{item.holder}</td>
                <td className="p-4">
                  <button onClick={() => openEditModal(item)} className="text-xs px-3 py-1.5 rounded-md bg-[#1a3c6d] hover:bg-[#2a4d85] transition-colors inline-flex items-center gap-1">
                    <Pencil size={12} />{t('logistics.editBtn')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`bg-card rounded-xl p-5 border border-[#2a4d85]`}>
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><ShieldAlert size={18} className="text-orange-300" />{t('logistics.noteTitle1')}</h3>
        <p className="text-sm text-blue-100">{t('logistics.noteDesc1')}</p>
      </div>

      <div className={`bg-card rounded-xl p-5 border border-[#2a4d85]`}>
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Boxes size={18} className="text-blue-300" />{t('logistics.noteTitle2')}</h3>
        <p className="text-sm text-blue-100">{t('logistics.noteDesc2')}</p>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className={`bg-card w-full max-w-2xl rounded-xl border border-[#2a4d85] overflow-hidden`}>
            <div className="px-6 py-4 border-b border-[#2a4d85] flex justify-between items-center bg-[#0a1f3f]">
              <h3 className="text-lg font-bold text-white">{editingId ? t('logistics.modalUpdate') : t('logistics.modalCreate')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-blue-300 hover:bg-red-500/20"><X size={18} /></button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={form.id} disabled className="bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 text-sm text-blue-200" />
              <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 text-sm" placeholder={t('logistics.phName')} />
              <input value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} className="bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 text-sm" placeholder={t('logistics.phCategory')} />
              <input value={form.holder} onChange={(e) => setForm((prev) => ({ ...prev, holder: e.target.value }))} className="bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 text-sm" placeholder={t('logistics.phHolder')} />
              <input type="number" min={1} value={form.quantity} onChange={(e) => setForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))} className="bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 text-sm" placeholder={t('logistics.phQuantity')} />
              <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as AssetStatus }))} className="bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 text-sm">
                <option value="Tốt">{t('logistics.statusGood')}</option>
                <option value="Mới">{t('logistics.statusNew')}</option>
                <option value="Đang mượn">{t('logistics.statusBorrowed')}</option>
                <option value="Cần bảo trì">{t('logistics.statusMaintenance')}</option>
              </select>
            </div>

            <div className="px-6 py-4 border-t border-[#2a4d85] bg-[#0a1f3f] flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-[#2a4d85] text-blue-200 rounded-lg text-sm">{t('logistics.btnCancel')}</button>
              <button onClick={handleSave} className={`px-4 py-2 bg-gold hover:bg-gold-hover text-[#061932] font-semibold rounded-lg text-sm`}>{t('logistics.btnSave')}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
