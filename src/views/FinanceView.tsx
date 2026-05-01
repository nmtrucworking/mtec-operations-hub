import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, CheckCircle2, DollarSign, Filter, Pencil, ReceiptText, Search, ShieldAlert, Trash2, X, XCircle } from 'lucide-react';
import { StatCard } from '../components/shared/Widgets';
import { formatCurrency, getRequiredApprovalRole, type Transaction, type TransactionStatus, type TxType } from '../data/finance';
import type { UserAccount } from '../types/app';

interface FinanceViewProps {
  transactions: Transaction[];
  pendingTransactions: Transaction[];
  currentUser: UserAccount;
  onSaveTransaction: (payload: {
    id?: string;
    date: string;
    title: string;
    type: TxType;
    amount: number;
    owner: string;
    category: string;
    approvalNote?: string;
    linkedRequest?: Transaction['linkedRequest'];
  }) => Promise<string>;
  onReviewTransaction: (payload: {
    transactionId: string;
    status: Exclude<TransactionStatus, 'Chờ duyệt'>;
    reviewNote?: string;
  }) => Promise<boolean>;
  onSoftDeleteTransaction: (transactionId: string) => Promise<boolean>;
  canReviewTransaction: (transaction: Transaction) => boolean;
  totalIncome: number;
  totalExpense: number;
  currentFund: number;
}

const nextTransactionId = (list: Transaction[]) => {
  const maxId = list.reduce((max, item) => {
    const n = Number(item.id.replace('TX-', ''));
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0);
  return `TX-${maxId + 1}`;
};

const defaultTxForm = (list: Transaction[]): Transaction => ({
  id: nextTransactionId(list),
  date: new Date().toLocaleDateString('vi-VN'),
  title: '',
  type: 'Thu',
  amount: 0,
  owner: '',
  category: '',
  status: 'Đã duyệt',
  approvalNote: ''
});

const toComparableDate = (value: string) => {
  const [dd, mm, yyyy] = value.split('/').map(Number);
  return new Date(yyyy, mm - 1, dd).getTime();
};

const canManageTransaction = (role: UserAccount['role']) => ['bcn', 'bvh_finance', 'bvh_logistics', 'bcm'].includes(role);
const canDeleteTransaction = (role: UserAccount['role']) => ['bcn', 'bvh_finance'].includes(role);

export const FinanceView = ({
  transactions,
  pendingTransactions,
  currentUser,
  onSaveTransaction,
  onReviewTransaction,
  onSoftDeleteTransaction,
  canReviewTransaction,
  totalIncome,
  totalExpense,
  currentFund
}: FinanceViewProps) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | TxType>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | TransactionStatus>('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Transaction>(defaultTxForm(transactions));
  const [formError, setFormError] = useState<string>('');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const getTxTypeName = (type: string) => {
    switch (type) {
      case 'Thu': return t('finance.typeIncome');
      case 'Chi': return t('finance.typeExpense');
      default: return type;
    }
  };

  const filtered = useMemo(
    () =>
      transactions.filter((tx) => {
        const matchSearch = tx.title.toLowerCase().includes(search.toLowerCase()) || tx.id.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === 'All' || tx.type === typeFilter;
        const matchStatus = statusFilter === 'All' || tx.status === statusFilter;
        const matchFromDate = fromDate ? toComparableDate(tx.date) >= toComparableDate(fromDate) : true;
        const matchToDate = toDate ? toComparableDate(tx.date) <= toComparableDate(toDate) : true;
        return matchSearch && matchType && matchStatus && matchFromDate && matchToDate;
      }),
    [transactions, search, typeFilter, statusFilter, fromDate, toDate]
  );

  const openCreateModal = () => {
    setEditingId(null);
    setForm(defaultTxForm(transactions));
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingId(tx.id);
    setForm({ ...tx });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.owner.trim() || !form.category.trim() || form.amount <= 0) {
      setFormError(t('finance.validationRequired'));
      return;
    }

    if (form.type === 'Chi' && !form.approvalNote?.trim()) {
      setFormError(t('finance.validationApprovalNote'));
      return;
    }

    setFormError('');

    onSaveTransaction({
      id: editingId ?? undefined,
      date: form.date,
      title: form.title,
      type: form.type,
      amount: form.amount,
      owner: form.owner,
      category: form.category,
      approvalNote: form.approvalNote,
      linkedRequest: form.linkedRequest
    });

    setIsModalOpen(false);
  };

  const handleApprove = (tx: Transaction) => {
    const note = reviewNotes[tx.id] || '';
    onReviewTransaction({ transactionId: tx.id, status: 'Đã duyệt', reviewNote: note });
  };

  const handleReject = (tx: Transaction) => {
    const note = reviewNotes[tx.id] || '';
    onReviewTransaction({ transactionId: tx.id, status: 'Từ chối', reviewNote: note });
  };

  const getStatusName = (status: TransactionStatus) => {
    switch (status) {
      case 'Chờ duyệt':
        return t('finance.statusPending');
      case 'Đã duyệt':
        return t('finance.statusApproved');
      case 'Từ chối':
        return t('finance.statusRejected');
      default:
        return status;
    }
  };

  const getRequiredRoleName = (tx: Transaction) => {
    const role = tx.requiredApprovalRole ?? getRequiredApprovalRole(tx.type, tx.category);
    if (!role) {
      return '-';
    }
    return role === 'bcn' ? t('finance.approverBCN') : t('finance.approverFinance');
  };

  const isFinanceManager = canManageTransaction(currentUser.role);


  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">{t('finance.title')}</h2>
          <p className="text-blue-300 mt-1">{t('finance.subtitle')}</p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={!isFinanceManager}
          className="px-4 py-2 bg-gold hover:bg-gold-hover disabled:opacity-40 disabled:cursor-not-allowed text-[#061932] font-semibold rounded-lg text-sm transition-colors"
        >
          + {t('finance.addBtn')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title={t('finance.statFund')} value={formatCurrency(currentFund)} icon={<DollarSign size={24} />} trend="+430k" trendUp color="text-green-400" />
        <StatCard title={t('finance.statIncome')} value={formatCurrency(totalIncome)} icon={<Calendar size={24} />} color="text-blue-400" />
        <StatCard title={t('finance.statExpense')} value={formatCurrency(totalExpense)} icon={<ReceiptText size={24} />} color="text-red-400" />
        <StatCard title={t('finance.statPending')} value={pendingTransactions.length.toString()} icon={<ShieldAlert size={24} />} color="text-orange-300" />
      </div>

      <div className={`bg-card p-4 rounded-xl border border-[#2a4d85] flex flex-col lg:flex-row gap-4`}>
        <div className="flex items-center w-full lg:w-1/3 bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2">
          <Search size={16} className="text-blue-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('finance.searchPlaceholder')}
            className="bg-transparent border-none outline-none text-sm text-white ml-2 w-full placeholder-blue-400"
          />
        </div>

        <div className="flex items-center gap-2 bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 w-full lg:w-48">
          <Filter size={14} className="text-blue-300" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'All' | TxType)}
            className="bg-transparent border-none outline-none text-sm text-white w-full"
          >
            <option value="All">{t('finance.filterTypeAll')}</option>
            <option value="Thu">{t('finance.typeIncome')}</option>
            <option value="Chi">{t('finance.typeExpense')}</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 w-full lg:w-52">
          <Filter size={14} className="text-blue-300" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | TransactionStatus)}
            className="bg-transparent border-none outline-none text-sm text-white w-full"
          >
            <option value="All">{t('finance.filterStatusAll')}</option>
            <option value="Chờ duyệt">{t('finance.statusPending')}</option>
            <option value="Đã duyệt">{t('finance.statusApproved')}</option>
            <option value="Từ chối">{t('finance.statusRejected')}</option>
          </select>
        </div>

        <input value={fromDate} onChange={(e) => setFromDate(e.target.value)} placeholder={t('finance.filterFromDate')} className="bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 text-sm w-full lg:w-36" />
        <input value={toDate} onChange={(e) => setToDate(e.target.value)} placeholder={t('finance.filterToDate')} className="bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 text-sm w-full lg:w-36" />
      </div>

      <div className="bg-card rounded-xl border border-[#2a4d85] p-4">
        <h3 className="font-semibold text-white mb-3">{t('finance.pendingTitle')}</h3>
        {pendingTransactions.length === 0 ? (
          <p className="text-sm text-blue-300">{t('finance.pendingEmpty')}</p>
        ) : (
          <div className="space-y-3">
            {pendingTransactions.map((tx) => (
              <div key={tx.id} className="border border-[#2a4d85] rounded-lg p-3 bg-[#0a1f3f]">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gold">{tx.id} - {tx.title}</p>
                    <p className="text-xs text-blue-300">
                      {tx.date} - {getTxTypeName(tx.type)} - {formatCurrency(tx.amount)} - {t('finance.requiredApprover')}: {getRequiredRoleName(tx)}
                    </p>
                  </div>
                  {canReviewTransaction(tx) ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(tx)} className="text-xs px-3 py-1.5 rounded-md bg-green-600/20 text-green-300 hover:bg-green-600/30 inline-flex items-center gap-1">
                        <CheckCircle2 size={14} />{t('finance.approveBtn')}
                      </button>
                      <button onClick={() => handleReject(tx)} className="text-xs px-3 py-1.5 rounded-md bg-red-600/20 text-red-300 hover:bg-red-600/30 inline-flex items-center gap-1">
                        <XCircle size={14} />{t('finance.rejectBtn')}
                      </button>
                    </div>
                  ) : null}
                </div>
                <input
                  value={reviewNotes[tx.id] || ''}
                  onChange={(e) => setReviewNotes((prev) => ({ ...prev, [tx.id]: e.target.value }))}
                  placeholder={t('finance.reviewNotePlaceholder')}
                  className="mt-2 bg-[#081a36] border border-[#2a4d85] rounded-lg px-3 py-2 text-sm w-full"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`bg-card rounded-xl border border-[#2a4d85] overflow-hidden mt-6`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0a1f3f] text-blue-300 text-sm">
              <th className="p-4 font-semibold">{t('finance.thId')}</th>
              <th className="p-4 font-semibold">{t('finance.thDate')}</th>
              <th className="p-4 font-semibold">{t('finance.thContent')}</th>
              <th className="p-4 font-semibold">{t('finance.thType')}</th>
              <th className="p-4 font-semibold">{t('finance.thStatus')}</th>
              <th className="p-4 font-semibold">{t('finance.thAmount')}</th>
              <th className="p-4 font-semibold">{t('finance.thOwner')}</th>
              <th className="p-4 font-semibold">{t('finance.thAction')}</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-[#2a4d85]">
            {filtered.map((tx) => (
              <tr key={tx.id} className="hover:bg-[#2a4d85]/30 transition-colors">
                <td className="p-4 font-medium text-[#ffc20e]">{tx.id}</td>
                <td className="p-4">{tx.date}</td>
                <td className="p-4">
                  <p className="font-medium">{tx.title}</p>
                  <p className="text-xs text-blue-300">{tx.category}</p>
                </td>
                <td className="p-4">
                  <span className={tx.type === 'Thu' ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>{getTxTypeName(tx.type)}</span>
                </td>
                <td className="p-4">
                  <span
                    className={`font-semibold ${
                      tx.status === 'Đã duyệt' ? 'text-green-300' : tx.status === 'Từ chối' ? 'text-red-300' : 'text-orange-300'
                    }`}
                  >
                    {getStatusName(tx.status)}
                  </span>
                </td>
                <td className={`p-4 font-medium ${tx.type === 'Thu' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type === 'Thu' ? '+' : '-'} {formatCurrency(tx.amount)}
                </td>
                <td className="p-4">{tx.owner}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(tx)}
                      disabled={!isFinanceManager}
                      className="text-xs px-3 py-1.5 rounded-md bg-[#1a3c6d] hover:bg-[#2a4d85] disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                    >
                      <Pencil size={12} />{t('finance.editBtn')}
                    </button>
                    <button
                      onClick={() => onSoftDeleteTransaction(tx.id)}
                      disabled={!canDeleteTransaction(currentUser.role)}
                      className="text-xs px-3 py-1.5 rounded-md bg-red-600/20 text-red-300 hover:bg-red-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                    >
                      <Trash2 size={12} />{t('finance.deleteBtn')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className={`bg-card w-full max-w-2xl rounded-xl border border-[#2a4d85] overflow-hidden`}>
            <div className="px-6 py-4 border-b border-[#2a4d85] flex justify-between items-center bg-[#0a1f3f]">
              <h3 className="text-lg font-bold text-white">{editingId ? t('finance.modalUpdate') : t('finance.modalCreate')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-blue-300 hover:bg-red-500/20"><X size={18} /></button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={form.id} disabled className="bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 text-sm text-blue-200" />
              <input value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} className="bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 text-sm" placeholder={t('finance.phDate')} />
              <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 text-sm md:col-span-2" placeholder={t('finance.phTitle')} />
              <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as TxType }))} className="bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 text-sm">
                <option value="Thu">{t('finance.typeIncome')}</option>
                <option value="Chi">{t('finance.typeExpense')}</option>
              </select>
              <input type="number" min={0} value={form.amount} onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value) }))} className="bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 text-sm" placeholder={t('finance.phAmount')} />
              <input value={form.owner} onChange={(e) => setForm((prev) => ({ ...prev, owner: e.target.value }))} className="bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 text-sm" placeholder={t('finance.phOwner')} />
              <input value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} className="bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 text-sm" placeholder={t('finance.phCategory')} />
              {form.type === 'Chi' ? (
                <textarea value={form.approvalNote || ''} onChange={(e) => setForm((prev) => ({ ...prev, approvalNote: e.target.value }))} className="bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-3 py-2 text-sm md:col-span-2 min-h-24" placeholder={t('finance.phApprovalNote')} />
              ) : null}
              {formError ? <p className="text-sm text-red-300 md:col-span-2">{formError}</p> : null}
            </div>

            <div className="px-6 py-4 border-t border-[#2a4d85] bg-[#0a1f3f] flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-[#2a4d85] text-blue-200 rounded-lg text-sm">{t('finance.btnCancel')}</button>
              <button onClick={handleSave} className={`px-4 py-2 bg-gold hover:bg-gold-hover text-[#061932] font-semibold rounded-lg text-sm`}>{t('finance.btnSave')}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
