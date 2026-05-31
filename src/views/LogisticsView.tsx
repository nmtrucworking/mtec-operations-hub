import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Boxes, Filter, Pencil, Search, ShieldAlert, X, Loader2 } from 'lucide-react';
import { type AssetItem, type AssetStatus } from '../data/logistics';
import { getAssetStats, getAssetCategories, getAssets, type AssetStats } from '../services/logistics';


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
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | AssetStatus>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AssetItem>(defaultAssetForm([]));

  const fetchData = async () => {
    setIsLoading(true);
    const [statsRes, catRes, assetsRes] = await Promise.all([
      getAssetStats(authToken),
      getAssetCategories(authToken),
      getAssets({ 
        search: search || undefined, 
        status: statusFilter === 'All' ? undefined : statusFilter 
      }, authToken)
    ]);

    if (statsRes.data) setStats(statsRes.data);
    if (catRes.data) setCategories(catRes.data);
    if (assetsRes.data) setAssets(assetsRes.data.assets);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [authToken, search, statusFilter]);

  const getStatusName = (status: string) => {
    switch (status) {
      case 'Tốt': return t('logistics.statusGood');
      case 'Mới': return t('logistics.statusNew');
      case 'Đang mượn': return t('logistics.statusBorrowed');
      case 'Cần bảo trì': return t('logistics.statusMaintenance');
      default: return status;
    }
  };

  const borrowedCount = stats?.borrowed ?? assets.filter((item) => item.status === 'Đang mượn').length;
  const maintenanceCount = stats?.maintenance ?? assets.filter((item) => item.status === 'Cần bảo trì').length;

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
          <p className="text-secondary mt-1">{t('logistics.subtitle')}</p>
        </div>
        <button onClick={openCreateModal} className={`px-4 py-2 bg-primary hover:bg-primary-focus text-primary-foreground font-semibold rounded-lg text-sm transition-colors`}>
          + {t('logistics.addBtn')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`bg-card rounded-xl p-4 border border-border`}>
          <p className="text-sm text-secondary">{t('logistics.statTotal')}</p>
          <p className="text-3xl font-bold mt-1">{stats?.total ?? assets.length}</p>
        </div>
        <div className={`bg-card rounded-xl p-4 border border-border`}>
          <p className="text-sm text-secondary">{t('logistics.statBorrowed')}</p>
          <p className="text-3xl font-bold mt-1 text-orange-300">{stats?.borrowed ?? borrowedCount}</p>
        </div>
        <div className={`bg-card rounded-xl p-4 border border-border`}>
          <p className="text-sm text-secondary">{t('logistics.statMaintenance')}</p>
          <p className="text-3xl font-bold mt-1 text-red-300">{stats?.maintenance ?? maintenanceCount}</p>
        </div>
      </div>

      <div className={`bg-card p-4 rounded-xl border border-border flex flex-col lg:flex-row gap-4`}>
        <div className="flex items-center w-full lg:w-1/3 bg-background border border-border rounded-lg px-3 py-2">
          <Search size={16} className="text-secondary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('logistics.searchPlaceholder')}
            className="bg-transparent border-none outline-none text-sm text-primary ml-2 w-full placeholder:text-secondary"
          />
        </div>

        <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2 w-full lg:w-48">
          <Filter size={14} className="text-secondary" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | AssetStatus)}
            className="bg-transparent border-none outline-none text-sm text-primary w-full"
          >
            <option value="All">{t('logistics.filterStatusAll')}</option>
            <option value="Tốt">{t('logistics.statusGood')}</option>
            <option value="Mới">{t('logistics.statusNew')}</option>
            <option value="Đang mượn">{t('logistics.statusBorrowed')}</option>
            <option value="Cần bảo trì">{t('logistics.statusMaintenance')}</option>
          </select>
        </div>
      </div>

      <div className={`bg-card rounded-xl border border-border overflow-hidden`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background text-secondary text-sm">
              <th className="p-4 font-semibold">{t('logistics.thId')}</th>
              <th className="p-4 font-semibold">{t('logistics.thName')}</th>
              <th className="p-4 font-semibold">{t('logistics.thCategory')}</th>
              <th className="p-4 font-semibold">{t('logistics.thQuantity')}</th>
              <th className="p-4 font-semibold">{t('logistics.thStatus')}</th>
              <th className="p-4 font-semibold">{t('logistics.thHolder')}</th>
              <th className="p-4 font-semibold">{t('logistics.thAction')}</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-border relative">
            {isLoading && (
              <tr>
                <td colSpan={7} className="p-8 text-center">
                  <div className="flex items-center justify-center gap-2 text-secondary">
                    <Loader2 size={20} className="animate-spin" />
                    <span>{t('common.loading', 'Đang tải...')}</span>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && assets.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-secondary">
                  {t('common.noData', 'Không có dữ liệu')}
                </td>
              </tr>
            )}
            {!isLoading && assets.map((item) => (
              <tr key={item.id} className="hover:bg-brand-light transition-colors">
                <td className="p-4 font-medium text-primary">{item.id}</td>
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
                  <button onClick={() => openEditModal(item)} className="text-xs px-3 py-1.5 rounded-md bg-brand-light hover:bg-brand-hover transition-colors inline-flex items-center gap-1">
                    <Pencil size={12} />{t('logistics.editBtn')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`bg-card rounded-xl p-5 border border-border`}>
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><ShieldAlert size={18} className="text-orange-300" />{t('logistics.noteTitle1')}</h3>
        <p className="text-sm text-secondary">{t('logistics.noteDesc1')}</p>
      </div>

      <div className={`bg-card rounded-xl p-5 border border-border`}>
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Boxes size={18} className="text-secondary" />{t('logistics.noteTitle2')}</h3>
        <p className="text-sm text-secondary">{t('logistics.noteDesc2')}</p>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className={`bg-card w-full max-w-2xl rounded-xl border border-border overflow-hidden`}>
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-background">
              <h3 className="text-lg font-semibold text-primary">{editingId ? t('logistics.modalUpdate') : t('logistics.modalCreate')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-secondary hover:bg-red-500/20"><X size={18} /></button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={form.id} disabled className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-secondary" />
              <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder={t('logistics.phName')} />
              <input value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} className="bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder={t('logistics.phCategory')} />
              <input value={form.holder} onChange={(e) => setForm((prev) => ({ ...prev, holder: e.target.value }))} className="bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder={t('logistics.phHolder')} />
              <input type="number" min={1} value={form.quantity} onChange={(e) => setForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))} className="bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder={t('logistics.phQuantity')} />
              <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as AssetStatus }))} className="bg-background border border-border rounded-lg px-3 py-2 text-sm">
                <option value="Tốt">{t('logistics.statusGood')}</option>
                <option value="Mới">{t('logistics.statusNew')}</option>
                <option value="Đang mượn">{t('logistics.statusBorrowed')}</option>
                <option value="Cần bảo trì">{t('logistics.statusMaintenance')}</option>
              </select>
            </div>

            <div className="px-6 py-4 border-t border-border bg-background flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-border text-secondary rounded-lg text-sm">{t('logistics.btnCancel')}</button>
              <button onClick={handleSave} className={`px-4 py-2 bg-primary hover:bg-primary-focus text-primary-foreground font-semibold rounded-lg text-sm`}>{t('logistics.btnSave')}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
