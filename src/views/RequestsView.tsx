import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock3, FileArchive, Filter, Link2, Pencil, Search, X, XCircle } from 'lucide-react';
import type { RequestItem, RequestStatus, RequestType } from '../data/requests';
import type { UserAccount } from '../types/app';
import { hasAnyRole } from '../lib/permissions';


interface RequestsViewProps {
  requests: RequestItem[];
  currentUser: UserAccount;
  onSaveRequest: (payload: {
    id?: string;
    mssv: string;
    name: string;
    type: RequestType;
    date: string;
    reason: string;
    financeDraft?: RequestItem['financeDraft'];
  }) => Promise<string>;
  onReviewRequest: (payload: {
    requestId: string;
    status: Exclude<RequestStatus, 'Chờ duyệt'>;
    reviewNote?: string;
  }) => Promise<string | undefined>;
}

const nextRequestId = (list: RequestItem[]) => {
  const maxId = list.reduce((max, item) => {
    const n = Number(item.id.replace('REQ-', ''));
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0);
  return `REQ-${String(maxId + 1).padStart(3, '0')}`;
};

const defaultRequestForm = (list: RequestItem[]): RequestItem => ({
  id: nextRequestId(list),
  mssv: '',
  name: '',
  type: 'Rút khỏi CLB',
  date: '27/04/2026',
  reason: '',
  status: 'Chờ duyệt',
  reviewer: '',
  reviewNote: '',
  financeDraft: {
    enabled: false,
    title: '',
    amount: 0,
    type: 'Chi',
    category: 'Sự kiện'
  }
});

const canReviewRequest = (roles: readonly UserAccount['role'][] | undefined) => hasAnyRole(roles ?? [], ['bcn', 'bvh_hr']);

export const RequestsView = ({ requests, currentUser, onSaveRequest, onReviewRequest }: RequestsViewProps) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | RequestType>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | RequestStatus>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RequestItem>(defaultRequestForm(requests));
  const [formError, setFormError] = useState('');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  // Mapping function for types
  const getRequestTypeName = (type: string) => {
    switch (type) {
      case 'Rút khỏi CLB': return t('requests.typeLeave');
      case 'Cam kết trách nhiệm': return t('requests.typeCommit');
      case 'Bảo lưu sinh hoạt': return t('requests.typePause');
      default: return type;
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'Chờ duyệt': return t('requests.statusPending');
      case 'Đã duyệt': return t('requests.statusApproved');
      case 'Từ chối': return t('requests.statusRejected');
      default: return status;
    }
  };

  const filteredRequests = useMemo(
    () =>
      requests.filter((item) => {
        const matchSearch =
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.mssv.includes(search) ||
          item.id.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === 'All' || item.type === typeFilter;
        const matchStatus = statusFilter === 'All' || item.status === statusFilter;
        return matchSearch && matchType && matchStatus;
      }),
    [requests, search, statusFilter, typeFilter]
  );

  const openCreateModal = () => {
    setEditingId(null);
    setForm(defaultRequestForm(requests));
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: RequestItem) => {
    setEditingId(item.id);
    setForm({
      ...item,
      financeDraft: {
        enabled: Boolean(item.financeDraft?.enabled),
        title: item.financeDraft?.title || '',
        amount: item.financeDraft?.amount || 0,
        type: item.financeDraft?.type || 'Chi',
        category: item.financeDraft?.category || 'Sự kiện'
      }
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.mssv.trim() || !form.name.trim() || !form.reason.trim()) {
      setFormError(t('requests.validationRequired'));
      return;
    }

    if (form.financeDraft?.enabled) {
      if (!form.financeDraft.title?.trim() || !form.financeDraft.category?.trim() || !form.financeDraft.amount || form.financeDraft.amount <= 0) {
        setFormError(t('requests.validationFinanceDraft'));
        return;
      }
    }

    setFormError('');

    try {
      await onSaveRequest({
        id: editingId ?? undefined,
        mssv: form.mssv,
        name: form.name,
        type: form.type,
        date: form.date,
        reason: form.reason,
        financeDraft: form.financeDraft
      });
      setIsModalOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể lưu yêu cầu.';
      setFormError(message);
    }
  };

  const handleApprove = (item: RequestItem) => {
    const note = reviewNotes[item.id] || '';
    onReviewRequest({ requestId: item.id, status: 'Đã duyệt', reviewNote: note });
  };

  const handleReject = (item: RequestItem) => {
    const note = reviewNotes[item.id] || '';
    onReviewRequest({ requestId: item.id, status: 'Từ chối', reviewNote: note });
  };

  const reviewerAllowed = canReviewRequest(currentUser.roles ?? [currentUser.role]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">{t('requests.title')}</h2>
          <p className="text-secondary mt-1">{t('requests.subtitle')}</p>
        </div>
        <button onClick={openCreateModal} className={`px-4 py-2 bg-primary hover:bg-primary-focus text-primary-foreground font-semibold rounded-lg text-sm transition-colors`}>
          + {t('requests.createBtn')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`bg-card rounded-xl p-4 border border-border`}>
          <p className="text-sm text-secondary">{t('requests.statTotal')}</p>
          <p className="text-3xl font-bold mt-1">{requests.length}</p>
        </div>
        <div className={`bg-card rounded-xl p-4 border border-border`}>
          <p className="text-sm text-secondary">{t('requests.statPending')}</p>
          <p className="text-3xl font-bold mt-1 text-orange-300">{requests.filter((item) => item.status === 'Chờ duyệt').length}</p>
        </div>
        <div className={`bg-card rounded-xl p-4 border border-border`}>
          <p className="text-sm text-secondary">{t('requests.statApproved')}</p>
          <p className="text-3xl font-bold mt-1 text-green-300">{requests.filter((item) => item.status === 'Đã duyệt').length}</p>
        </div>
      </div>

      <div className={`bg-card p-4 rounded-xl border border-border flex flex-col lg:flex-row gap-4`}>
        <div className="flex items-center w-full lg:w-1/3 bg-background border border-border rounded-lg px-3 py-2">
          <Search size={16} className="text-secondary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('requests.searchPlaceholder')}
            className="bg-transparent border-none outline-none text-sm text-primary ml-2 w-full placeholder:text-secondary"
          />
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2 w-full lg:w-56">
            <Filter size={14} className="text-secondary" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'All' | RequestType)}
              className="bg-transparent border-none outline-none text-sm text-primary w-full"
            >
              <option value="All">{t('requests.filterTypeAll')}</option>
              <option value="Rút khỏi CLB">{t('requests.typeLeave')}</option>
              <option value="Cam kết trách nhiệm">{t('requests.typeCommit')}</option>
              <option value="Bảo lưu sinh hoạt">{t('requests.typePause')}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2 w-full lg:w-44">
            <Filter size={14} className="text-secondary" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | RequestStatus)}
              className="bg-transparent border-none outline-none text-sm text-primary w-full"
            >
              <option value="All">{t('requests.filterStatusAll')}</option>
              <option value="Chờ duyệt">{t('requests.statusPending')}</option>
              <option value="Đã duyệt">{t('requests.statusApproved')}</option>
              <option value="Từ chối">{t('requests.statusRejected')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className={`bg-card rounded-xl border border-border overflow-hidden`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background text-secondary text-sm">
              <th className="p-4 font-semibold">{t('requests.thId')}</th>
              <th className="p-4 font-semibold">{t('requests.thName')}</th>
              <th className="p-4 font-semibold">{t('requests.thType')}</th>
              <th className="p-4 font-semibold">{t('requests.thDate')}</th>
              <th className="p-4 font-semibold">{t('requests.thStatus')}</th>
              <th className="p-4 font-semibold">{t('requests.thAction')}</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-border">
            {filteredRequests.map((item) => (
              <tr key={item.id} className="hover:bg-brand-light transition-colors">
                <td className="p-4 font-medium text-primary">{item.id}</td>
                <td className="p-4">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-secondary">{item.mssv}</p>
                </td>
                <td className="p-4">{getRequestTypeName(item.type)}</td>
                <td className="p-4">{item.date}</td>
                <td className="p-4">
                  {item.status === 'Đã duyệt' ? <span className="inline-flex items-center gap-1 text-green-300"><CheckCircle2 size={14} />{getStatusName(item.status)}</span> : null}
                  {item.status === 'Chờ duyệt' ? <span className="inline-flex items-center gap-1 text-orange-300"><Clock3 size={14} />{getStatusName(item.status)}</span> : null}
                  {item.status === 'Từ chối' ? <span className="inline-flex items-center gap-1 text-red-300"><XCircle size={14} />{getStatusName(item.status)}</span> : null}
                  {item.linkedTransactionId ? (
                    <p className="text-xs text-secondary mt-1 inline-flex items-center gap-1"><Link2 size={12} />{item.linkedTransactionId}</p>
                  ) : null}
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => openEditModal(item)} className="text-xs px-3 py-1.5 rounded-md bg-brand-light hover:bg-brand-hover transition-colors inline-flex items-center gap-1">
                      <Pencil size={12} />{t('requests.editBtn')}
                    </button>
                    {item.status === 'Chờ duyệt' && reviewerAllowed ? (
                      <>
                        <button onClick={() => handleApprove(item)} className="text-xs px-3 py-1.5 rounded-md bg-green-600/20 text-green-300 hover:bg-green-600/30 inline-flex items-center gap-1">
                          <CheckCircle2 size={12} />{t('requests.approveBtn')}
                        </button>
                        <button onClick={() => handleReject(item)} className="text-xs px-3 py-1.5 rounded-md bg-red-600/20 text-red-300 hover:bg-red-600/30 inline-flex items-center gap-1">
                          <XCircle size={12} />{t('requests.rejectBtn')}
                        </button>
                      </>
                    ) : null}
                  </div>
                  {item.status === 'Chờ duyệt' ? (
                    <input
                      value={reviewNotes[item.id] || ''}
                      onChange={(e) => setReviewNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      placeholder={t('requests.reviewNotePlaceholder')}
                      className="mt-2 bg-background border border-border rounded-lg px-2 py-1 text-xs w-full"
                    />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`bg-card rounded-xl p-5 border border-border`}>
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <FileArchive size={18} className="text-secondary" />
          {t('requests.noteTitle')}
        </h3>
        <p className="text-sm text-secondary">{t('requests.noteDesc')}</p>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className={`bg-card w-full max-w-2xl rounded-xl border border-border overflow-hidden`}>
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-background">
              <h3 className="text-lg font-semibold text-primary">{editingId ? t('requests.modalUpdate') : t('requests.modalCreate')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-secondary hover:bg-red-500/20"><X size={18} /></button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={form.id} disabled className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-secondary" />
              <input value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} className="bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder={t('requests.phDate')} />
              <input value={form.mssv} onChange={(e) => setForm((prev) => ({ ...prev, mssv: e.target.value }))} className="bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder={t('requests.phMssv')} />
              <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder={t('requests.phName')} />
              <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as RequestType }))} className="bg-background border border-border rounded-lg px-3 py-2 text-sm">
                <option value="Rút khỏi CLB">{t('requests.typeLeave')}</option>
                <option value="Cam kết trách nhiệm">{t('requests.typeCommit')}</option>
                <option value="Bảo lưu sinh hoạt">{t('requests.typePause')}</option>
              </select>
              <textarea value={form.reason} onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))} className="bg-background border border-border rounded-lg px-3 py-2 text-sm md:col-span-2 min-h-24" placeholder={t('requests.phReason')} />

              <label className="flex items-center gap-2 text-sm md:col-span-2">
                <input
                  type="checkbox"
                  checked={Boolean(form.financeDraft?.enabled)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      financeDraft: {
                        enabled: e.target.checked,
                        title: prev.financeDraft?.title || '',
                        amount: prev.financeDraft?.amount || 0,
                        type: prev.financeDraft?.type || 'Chi',
                        category: prev.financeDraft?.category || 'Sự kiện'
                      }
                    }))
                  }
                />
                {t('requests.financeDraftToggle')}
              </label>

              {form.financeDraft?.enabled ? (
                <>
                  <input
                    value={form.financeDraft.title || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, financeDraft: { ...prev.financeDraft!, title: e.target.value } }))}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm md:col-span-2"
                    placeholder={t('requests.phFinanceTitle')}
                  />
                  <select
                    value={form.financeDraft.type || 'Chi'}
                    onChange={(e) => setForm((prev) => ({ ...prev, financeDraft: { ...prev.financeDraft!, type: e.target.value as 'Thu' | 'Chi' } }))}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="Thu">Thu</option>
                    <option value="Chi">Chi</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    value={form.financeDraft.amount || 0}
                    onChange={(e) => setForm((prev) => ({ ...prev, financeDraft: { ...prev.financeDraft!, amount: Number(e.target.value) } }))}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm"
                    placeholder={t('requests.phFinanceAmount')}
                  />
                  <input
                    value={form.financeDraft.category || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, financeDraft: { ...prev.financeDraft!, category: e.target.value } }))}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm md:col-span-2"
                    placeholder={t('requests.phFinanceCategory')}
                  />
                </>
              ) : null}

              {formError ? <p className="text-sm text-red-300 md:col-span-2">{formError}</p> : null}
            </div>

            <div className="px-6 py-4 border-t border-border bg-background flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-border text-secondary rounded-lg text-sm">{t('requests.btnCancel')}</button>
              <button onClick={handleSave} className={`px-4 py-2 bg-primary hover:bg-primary-focus text-primary-foreground font-semibold rounded-lg text-sm`}>{t('requests.btnSave')}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
