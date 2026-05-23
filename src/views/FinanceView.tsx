import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, CheckCircle2, DollarSign, Filter, Pencil, ReceiptText, Search, ShieldAlert, Trash2, X, XCircle, Plus } from 'lucide-react';
import { StatCard } from '../components/shared/Widgets';
import { formatCurrency, getRequiredApprovalRole, type Transaction, type TransactionStatus, type TxType } from '../data/finance';
import type { UserAccount } from '../types/app';
import { hasAnyRole } from '../lib/permissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Modal } from '../components/ui/modal';
import { DatePicker } from '../components/ui/date-picker';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { formatDate } from '../lib/helpers';
import { getMembers } from '../services/members';
import type { Member } from '../data/members';

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
  date: new Date().toISOString().split('T')[0],
  title: '',
  type: 'Thu',
  amount: 0,
  owner: '',
  category: '',
  status: 'Đã duyệt',
  approvalNote: ''
});

const toComparableDate = (value: string) => {
  if (!value) return 0;
  if (value.includes('/')) {
    const [dd, mm, yyyy] = value.split('/').map(Number);
    return new Date(yyyy, mm - 1, dd).getTime();
  }
  return new Date(value).getTime();
};

const canManageTransaction = (roles: readonly UserAccount['role'][] | undefined) => hasAnyRole(roles ?? [], ['bcn', 'bvh_finance', 'bvh_logistics', 'bcm']);
const canDeleteTransaction = (roles: readonly UserAccount['role'][] | undefined) => hasAnyRole(roles ?? [], ['bcn', 'bvh_finance']);

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
  const [allMembers, setAllMembers] = useState<Member[]>([]);

  useEffect(() => {
    const fetchClubMembers = async () => {
      try {
        const res = await getMembers({ pageSize: 1000, status: 'Active' });
        if (res.data && Array.isArray(res.data.members)) {
          setAllMembers(res.data.members);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchClubMembers();
  }, []);

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
    // If tx.date is dd/mm/yyyy, convert to yyyy-mm-dd for input
    let formDate = tx.date;
    if (tx.date && tx.date.includes('/')) {
      const [dd, mm, yyyy] = tx.date.split('/');
      formDate = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    setForm({ ...tx, date: formDate });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.owner.trim() || !form.category.trim() || form.amount <= 0) {
      setFormError(t('finance.validationRequired'));
      return;
    }

    if (form.type === 'Chi' && !form.approvalNote?.trim()) {
      setFormError('Vui lòng nhập lý do đề xuất chi để được duyệt.');
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

  const handleApprove = async (tx: Transaction) => {
    const note = reviewNotes[tx.id] || '';
    if (tx.type === 'Chi' && !note.trim()) {
      alert('Vui lòng nhập ghi chú (Lý do duyệt/từ chối) đối với khoản chi.');
      return;
    }
    const success = await onReviewTransaction({ transactionId: tx.id, status: 'Đã duyệt', reviewNote: note });
    if (!success) {
      alert('Đã xảy ra lỗi khi duyệt giao dịch.');
    }
  };

  const handleReject = async (tx: Transaction) => {
    const note = reviewNotes[tx.id] || '';
    if (tx.type === 'Chi' && !note.trim()) {
      alert('Vui lòng nhập ghi chú (Lý do duyệt/từ chối) đối với khoản chi.');
      return;
    }
    const success = await onReviewTransaction({ transactionId: tx.id, status: 'Từ chối', reviewNote: note });
    if (!success) {
      alert('Đã xảy ra lỗi khi từ chối giao dịch.');
    }
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

  const userRoles = currentUser.roles ?? [currentUser.role];
  const isFinanceManager = canManageTransaction(userRoles);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('finance.title')}</h2>
          <p className="text-secondary mt-1">{t('finance.subtitle')}</p>
        </div>
        <Button
          onClick={openCreateModal}
          disabled={!isFinanceManager}
          className="flex items-center gap-2 shadow-lg shadow-gold/20"
        >
          <Plus size={16} />
          {t('finance.addBtn')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('finance.statFund')} value={formatCurrency(currentFund)} icon={<DollarSign size={24} />} trend="+430k" trendUp color="text-green-500" />
        <StatCard title={t('finance.statIncome')} value={formatCurrency(totalIncome)} icon={<Calendar size={24} />} color="text-blue-500" />
        <StatCard title={t('finance.statExpense')} value={formatCurrency(totalExpense)} icon={<ReceiptText size={24} />} color="text-red-500" />
        <StatCard title={t('finance.statPending')} value={pendingTransactions.length.toString()} icon={<ShieldAlert size={24} />} color="text-orange-500" />
      </div>

      <div className="bg-card p-4 rounded-xl border border-border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('finance.searchPlaceholder')}
            className="pl-9 w-full"
          />
        </div>

        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as 'All' | TxType)}
          className="w-full"
        >
          <option value="All">{t('finance.filterTypeAll')}</option>
          <option value="Thu">{t('finance.typeIncome')}</option>
          <option value="Chi">{t('finance.typeExpense')}</option>
        </Select>

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'All' | TransactionStatus)}
          className="w-full"
        >
          <option value="All">{t('finance.filterStatusAll')}</option>
          <option value="Chờ duyệt">{t('finance.statusPending')}</option>
          <option value="Đã duyệt">{t('finance.statusApproved')}</option>
          <option value="Từ chối">{t('finance.statusRejected')}</option>
        </Select>

        <DatePicker value={fromDate} onChange={val => setFromDate(val || '')} placeholder={t('finance.filterFromDate')} className="w-full text-secondary" />
        <DatePicker value={toDate} onChange={val => setToDate(val || '')} placeholder={t('finance.filterToDate')} className="w-full text-secondary" />
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
          <ShieldAlert size={18} className="text-orange-500" />
          {t('finance.pendingTitle')}
        </h3>
        {pendingTransactions.length === 0 ? (
          <p className="text-sm text-secondary italic">{t('finance.pendingEmpty')}</p>
        ) : (
          <div className="space-y-3">
            {pendingTransactions.map((tx) => (
              <div key={tx.id} className="border border-border rounded-lg p-4 bg-background/50 hover:bg-brand-light/30 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-primary mb-1">{tx.id} - {tx.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-secondary mb-2">
                      <span className="font-medium bg-secondary/10 px-2 py-1 rounded">{formatDate(tx.date)}</span>
                      <Badge variant="outline" className="px-1.5 py-0 text-[10px]">{getTxTypeName(tx.type)}</Badge>
                      <span className="font-medium text-primary">{formatCurrency(tx.amount)}</span>
                      <span>•</span>
                      <span>{t('finance.requiredApprover')}: <span className="font-medium text-primary">{getRequiredRoleName(tx)}</span></span>
                      <span>•</span>
                      <span>Người tạo: <span className="font-medium text-primary">{tx.owner}</span></span>
                    </div>
                    {tx.approvalNote && (
                      <p className="text-sm text-secondary bg-brand-light p-2 rounded-md border border-border-highlight mt-2">
                        <span className="font-medium text-primary">Lý do/Ghi chú:</span> {tx.approvalNote}
                      </p>
                    )}
                  </div>
                  {canReviewTransaction(tx) ? (
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <div className="flex gap-2 w-full">
                        <Button onClick={() => handleApprove(tx)} variant="outline" size="sm" className="flex-1 text-success-text border-success-border bg-success-bg hover:bg-success-bg/80 hover:text-success-text">
                          <CheckCircle2 size={14} className="mr-1" />{t('finance.approveBtn')}
                        </Button>
                        <Button onClick={() => handleReject(tx)} variant="outline" size="sm" className="flex-1 text-danger-text border-danger-border bg-danger-bg hover:bg-danger-bg/80 hover:text-danger-text">
                          <XCircle size={14} className="mr-1" />{t('finance.rejectBtn')}
                        </Button>
                      </div>
                      <Input
                        value={reviewNotes[tx.id] || ''}
                        onChange={(e) => setReviewNotes((prev) => ({ ...prev, [tx.id]: e.target.value }))}
                        placeholder="Ghi chú duyệt (Không bắt buộc)..."
                        className="text-sm w-full"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden mt-6 overflow-x-auto">
        <Table className="w-full text-left border-collapse min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-brand-light text-secondary text-sm">
              <TableHead className="p-4 font-semibold">{t('finance.thId')}</TableHead>
              <TableHead className="p-4 font-semibold">{t('finance.thDate')}</TableHead>
              <TableHead className="p-4 font-semibold">{t('finance.thContent')}</TableHead>
              <TableHead className="p-4 font-semibold">{t('finance.thType')}</TableHead>
              <TableHead className="p-4 font-semibold">{t('finance.thStatus')}</TableHead>
              <TableHead className="p-4 font-semibold">{t('finance.thAmount')}</TableHead>
              <TableHead className="p-4 font-semibold">{t('finance.thOwner')}</TableHead>
              <TableHead className="p-4 font-semibold text-center">{t('finance.thAction')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-sm divide-y divide-border">
            {filtered.map((tx) => (
              <TableRow key={tx.id} className="hover:bg-brand-light/30 transition-colors">
                <TableCell className="p-4 font-medium text-gold">{tx.id}</TableCell>
                <TableCell className="p-4">{formatDate(tx.date)}</TableCell>
                <TableCell className="p-4">
                  <p className="font-medium text-primary">{tx.title}</p>
                  <p className="text-xs text-secondary mt-0.5">{tx.category}</p>
                </TableCell>
                <TableCell className="p-4">
                  <Badge variant={tx.type === 'Thu' ? 'success' : 'danger'}>
                    {getTxTypeName(tx.type)}
                  </Badge>
                </TableCell>
                <TableCell className="p-4">
                  <Badge
                    variant={
                      tx.status === 'Đã duyệt' ? 'success' : tx.status === 'Từ chối' ? 'danger' : 'warning'
                    }
                  >
                    {getStatusName(tx.status)}
                  </Badge>
                </TableCell>
                <TableCell className={`p-4 font-medium ${tx.type === 'Thu' ? 'text-success-text' : 'text-danger-text'}`}>
                  {tx.type === 'Thu' ? '+' : '-'} {formatCurrency(tx.amount)}
                </TableCell>
                <TableCell className="p-4 text-primary">{tx.owner}</TableCell>
                <TableCell className="p-4">
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(tx)}
                      disabled={!isFinanceManager}
                      className="text-xs px-2 py-1 h-auto"
                    >
                      <Pencil size={12} className="mr-1" />{t('finance.editBtn')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onSoftDeleteTransaction(tx.id)}
                      disabled={!canDeleteTransaction(userRoles)}
                      className="text-xs px-2 py-1 h-auto"
                    >
                      <Trash2 size={12} className="mr-1" />{t('finance.deleteBtn')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? t('finance.modalUpdate') : t('finance.modalCreate')}
        className="max-w-2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t('finance.btnCancel')}</Button>
            <Button onClick={handleSave} variant="default">{t('finance.btnSave')}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
             <label className="text-sm font-medium text-secondary">Mã giao dịch</label>
             <Input value={form.id} disabled className="bg-brand-light cursor-not-allowed" />
          </div>
          <div className="space-y-1.5">
             <label className="block text-sm font-semibold text-foreground mb-1.5">{t('finance.phDate')} *</label>
             <DatePicker value={form.date} onChange={val => setForm((prev) => ({ ...prev, date: val || '' }))} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
             <label className="text-sm font-medium text-secondary">Tên khoản thu / chi *</label>
             <Input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="VD: Thu quỹ tháng 5, Mua văn phòng phẩm..." required />
          </div>
          <div className="space-y-1.5">
             <label className="text-sm font-medium text-secondary">Loại giao dịch *</label>
             <Select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as TxType }))}>
               <option value="Thu">Khoản Thu</option>
               <option value="Chi">Khoản Chi</option>
             </Select>
          </div>
          <div className="space-y-1.5">
             <label className="text-sm font-medium text-secondary">Số tiền (VNĐ) *</label>
             <Input type="number" min={0} value={form.amount || ''} onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value) }))} placeholder="VD: 100000" required />
          </div>
          <div className="space-y-1.5">
             <label className="text-sm font-medium text-secondary">Người đề xuất / Phụ trách *</label>
             <Select value={form.owner} onChange={(e) => setForm((prev) => ({ ...prev, owner: e.target.value }))} required>
               <option value="" disabled>-- Chọn người phụ trách --</option>
               {form.owner && !allMembers.some(m => `${m.mssv} - ${m.name}` === form.owner) && (
                 <option value={form.owner}>{form.owner} (Dữ liệu cũ)</option>
               )}
               {allMembers.map(m => (
                 <option key={m.id} value={`${m.mssv} - ${m.name}`}>{m.mssv} - {m.name}</option>
               ))}
             </Select>
          </div>
          <div className="space-y-1.5">
             <label className="text-sm font-medium text-secondary">Hạng mục (Category) *</label>
             <Select value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} required>
               <option value="" disabled>-- Chọn hạng mục --</option>
               <option value="Quỹ CLB">Quỹ CLB</option>
               <option value="Sự kiện">Sự kiện</option>
               <option value="Vật tư">Vật tư</option>
               <option value="Truyền thông">Truyền thông</option>
               <option value="Chuyên môn">Chuyên môn</option>
               <option value="Tài trợ">Tài trợ</option>
               <option value="Khác">Khác</option>
               {form.category && !['Quỹ CLB', 'Sự kiện', 'Vật tư', 'Truyền thông', 'Chuyên môn', 'Tài trợ', 'Khác'].includes(form.category) && (
                 <option value={form.category}>{form.category} (Dữ liệu cũ)</option>
               )}
             </Select>
          </div>
          
          <div className="space-y-1.5 md:col-span-2">
             <label className="text-sm font-medium text-secondary">{form.type === 'Chi' ? 'Lý do đề xuất chi *' : 'Ghi chú thêm'}</label>
             <textarea 
               value={form.approvalNote || ''} 
               onChange={(e) => setForm((prev) => ({ ...prev, approvalNote: e.target.value }))} 
               className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold min-h-[80px]" 
               placeholder={form.type === 'Chi' ? "Nhập chi tiết mục đích chi để Ban Chủ nhiệm xét duyệt..." : "Ghi chú không bắt buộc..."} 
             />
          </div>
          
          {formError ? <p className="text-sm text-danger-text md:col-span-2 font-medium">{formError}</p> : null}
        </div>
      </Modal>
    </div>
  );
};
