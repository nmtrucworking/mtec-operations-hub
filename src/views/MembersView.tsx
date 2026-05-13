import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Briefcase,
  Calendar,
  Compass,
  Download,
  Edit,
  Eye,
  Filter,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Star,
  Target,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  FileText,
  RefreshCw,
  ArrowUpDown,
  Upload,
  type LucideIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/ui/toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Modal } from '../components/ui/modal';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { createMember, getMembers, updateMember, deleteMember, exportMembers, exportMemberProfileUrl, importMembers, membersImportTemplateUrl, type MembersImportResult } from '../services/members';
import { formatDate, toDateInputFormat, downloadFileWithAuth, copyToClipboard } from '../lib/helpers';
import type { ApiResponse } from '../services/api';
import type { UserAccount } from '../types/app';
import { getLogs, type ActivityLog } from '../services/logs';
import {
  FACULTY_MAJOR_MAP,
  type Member,
  type MemberSkill,
  type SkillLevel,
  DEPARTMENTS,
  banListMatches,
  compareBanLists,
  formatBanList,
  normalizeBanList
} from '../data/members';
import { Copy, Check } from 'lucide-react';
import { hasAnyRole } from '../lib/permissions';

const ITEMS_PER_PAGE = 10;

interface MembersViewProps {
  authToken?: string;
  currentUser?: UserAccount;
}

type SortField = keyof Member | 'stt';
type SortOrder = 'asc' | 'desc';

export const MembersView = ({ authToken, currentUser }: MembersViewProps) => {
  const { t } = useTranslation();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBan, setFilterBan] = useState('All');
  const [filterStatus, setFilterStatus] = useState<'All' | Member['status']>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isSavingMember, setIsSavingMember] = useState(false);
  const toast = useToast();
  const canManageMembers = hasAnyRole(currentUser?.roles ?? (currentUser?.role ? [currentUser.role] : []), ['bcn', 'bvh_hr']);
  const [sortConfig, setSortConfig] = useState<{ field: SortField; order: SortOrder }>({
    field: 'id',
    order: 'asc'
  });
  const [memberLogs, setMemberLogs] = useState<ActivityLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'history' | 'performance'>('info');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importOnDuplicate, setImportOnDuplicate] = useState<'skip' | 'update'>('skip');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<MembersImportResult | null>(null);

  const handleImportSubmit = async () => {
    if (!canManageMembers) {
      toast.error('Bạn chỉ có quyền xem danh sách thành viên.');
      return;
    }

    if (!importFile) {
      toast.error('Vui lòng chọn file cần tải lên');
      return;
    }
    setIsImporting(true);
    setImportResult(null);
    const response = await importMembers(importFile, { onDuplicate: importOnDuplicate }, authToken);
    setIsImporting(false);
    
    if (response.status >= 200 && response.status < 300 && response.data) {
      const resultData = (response.data as any).data || response.data;
      setImportResult(resultData);
      toast.success(t('members.importSuccess'));
      if (resultData.created > 0 || resultData.updated > 0) {
        await refreshMembers();
      }
    } else {
      toast.error(response.error || t('members.importFailed'));
    }
  };

  useEffect(() => {
    if (selectedMember && activeDetailTab === 'history') {
      const fetchMemberLogs = async () => {
        setIsLoadingLogs(true);
        const res = await getLogs({ search: selectedMember.id }, authToken);
        if (res.data) setMemberLogs(res.data.logs);
        setIsLoadingLogs(false);
      };
      fetchMemberLogs();
    }
  }, [selectedMember, activeDetailTab, authToken]);

  type MemberFormData = Omit<Member, 'id'>;

  const initialFormState: MemberFormData = {
    mssv: '',
    name: '',
    gender: 'Nam',
    dob: '',
    ban: [],
    role: 'Thanh vien',
    status: 'Active',
    phone: '',
    email: '',
    joinDate: '',
    lop: '',
    khoa: 'Công nghệ Thông tin',
    chuyenNganh: 'Khoa học Dữ liệu',
    address: '',
    experience: '',
    goal: '',
    orientation: '',
    hardSkills: [],
    softSkills: []
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    const loadMembers = async () => {
      if (!authToken) {
        setMembers([]);
        toast.error('Thiếu token đăng nhập để tải danh sách thành viên.');
        setIsLoadingMembers(false);
        return;
      }
      setIsLoadingMembers(true);
      const response = await getMembers({ pageSize: 1000 }, authToken);
      if (response.status >= 200 && response.status < 300 && response.data) {
        setMembers(response.data.members);
      } else {
        toast.error(response.error || 'Không tải được danh sách thành viên từ backend.');
      }
      setIsLoadingMembers(false);
    };

    void loadMembers();
  }, [authToken]);

  const refreshMembers = async (preserveSelectionId?: string) => {
    if (!authToken) {
      return false;
    }

    const response = await getMembers({ pageSize: 1000 }, authToken);
    if (response.status >= 200 && response.status < 300 && response.data) {
      setMembers(response.data.members);
      if (preserveSelectionId != null) {
        setSelectedMember(response.data.members.find((member) => member.id === preserveSelectionId) ?? null);
      }
      // success - nothing to show here, callers may display toast
      return true;
    }
    toast.error(response.error || 'Không tải được danh sách thành viên từ backend.');
    return false;
  };

  // Lọc dữ liệu
  const filteredMembers = members.filter((member) => {
    const matchSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) || member.mssv.includes(searchTerm);
    const matchBan = filterBan === 'All' || banListMatches(member.ban, filterBan);
    const matchStatus = filterStatus === 'All' || member.status === filterStatus;
    return matchSearch && matchBan && matchStatus;
  });

  // Sắp xếp dữ liệu
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const field = sortConfig?.field ?? 'id';
    const order = sortConfig?.order ?? 'asc';
    if (field === 'stt') return 0; // STT is calculated based on current page

    const aValue = a[field];
    const bValue = b[field];

    if (aValue === bValue) return 0;

    let comparison = 0;
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue);
    } else if (Array.isArray(aValue) || Array.isArray(bValue)) {
      comparison = compareBanLists(aValue, bValue);
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    }

    return order === 'asc' ? comparison : -comparison;
  });

  // Phân trang
  const totalPages = Math.ceil(sortedMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = sortedMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExport = async (format: 'csv' | 'zip') => {
    const exportUrl = exportMembers({ 
      format,
      ban: filterBan === 'All' ? undefined : filterBan,
      status: filterStatus === 'All' ? undefined : filterStatus
    }, authToken);
    
    if (authToken) {
      const filename = `members_export_${new Date().getTime()}.${format === 'csv' ? 'csv' : 'zip'}`;
      const success = await downloadFileWithAuth(exportUrl, authToken, filename);
      if (!success) {
        toast.error('Không thể tải tệp xuất. Vui lòng kiểm tra lại quyền truy cập.');
      }
    } else {
      window.open(exportUrl, '_blank');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!canManageMembers) {
      toast.error('Bạn chỉ có quyền xem danh sách thành viên.');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn xóa thành viên này?')) {
      return;
    }

    setIsSavingMember(true);
    const response = await deleteMember(memberId, authToken);
    if (response.status >= 200 && response.status < 300) {
      await refreshMembers();
      setSelectedMember(null);
      toast.success('Xóa thành viên thành công!');
    } else {
      toast.error(response.error || 'Không thể xóa thành viên.');
    }
    setIsSavingMember(false);
  };

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast.success(`Đã sao chép ${field}`);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'khoa') {
      const majors = FACULTY_MAJOR_MAP[value] || [];
      const firstMajor = majors[0] || (value === 'Khác' ? '' : '');
      setFormData(prev => ({ ...prev, khoa: value, chuyenNganh: firstMajor }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBanToggle = (dept: string) => {
    setFormData(prev => {
      const currentBans = prev.ban;
      if (currentBans.includes(dept)) {
        return { ...prev, ban: currentBans.filter(b => b !== dept) };
      } else {
        return { ...prev, ban: [...currentBans, dept] };
      }
    });
  };

  const sanitizeSkills = (skills: MemberSkill[]): MemberSkill[] => {
    return skills
      .map(skill => ({ ...skill, name: skill.name.trim() }))
      .filter(skill => skill.name);
  };

  const handleAddSkill = (type: 'hard' | 'soft') => {
    const newSkill: MemberSkill = { name: '', level: 'Cơ bản' };
    if (type === 'hard') {
      setFormData(prev => ({ ...prev, hardSkills: [...prev.hardSkills, newSkill] }));
      return;
    }
    setFormData(prev => ({ ...prev, softSkills: [...prev.softSkills, newSkill] }));
  };

  const handleRemoveSkill = (type: 'hard' | 'soft', index: number) => {
    if (type === 'hard') {
      setFormData(prev => ({
        ...prev,
        hardSkills: prev.hardSkills.filter((_, idx) => idx !== index)
      }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      softSkills: prev.softSkills.filter((_, idx) => idx !== index)
    }));
  };

  const handleSkillChange = (
    type: 'hard' | 'soft',
    index: number,
    field: 'name' | 'level',
    value: string
  ) => {
    if (type === 'hard') {
      setFormData(prev => ({
        ...prev,
        hardSkills: prev.hardSkills.map((skill, idx) =>
          idx === index ? { ...skill, [field]: value } : skill
        )
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      softSkills: prev.softSkills.map((skill, idx) =>
        idx === index ? { ...skill, [field]: value } : skill
      )
    }));
  };

  const handleAddSubmit = async () => {
    if (!authToken) {
      toast.error('Lỗi: Thiếu token xác thực. Vui lòng đăng nhập lại.');
      return;
    }

    if (!canManageMembers) {
      toast.error('Bạn chỉ có quyền xem danh sách thành viên.');
      return;
    }

    // Validation
    const requiredFields: (keyof MemberFormData)[] = ['mssv', 'name', 'dob', 'phone', 'email', 'joinDate', 'role', 'experience', 'goal', 'orientation'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast.error(`Vui lòng nhập đầy đủ các thông tin bắt buộc: ${missingFields.join(', ')}`);
      return;
    }

    if (formData.ban.length === 0) {
      toast.error('Vui lòng chọn ít nhất một Ban chuyên môn.');
      return;
    }

    setIsSavingMember(true);
    
    const { role, ban, ...rest } = formData;
    const payload = {
      ...rest,
      roleTitle: role,
      ban: formatBanList(ban),
      dob: toDateInputFormat(formData.dob),
      joinDate: toDateInputFormat(formData.joinDate),
      hardSkills: sanitizeSkills(formData.hardSkills),
      softSkills: sanitizeSkills(formData.softSkills)
    };

    try {
      const response = await createMember(payload as any, authToken);
      if (response.status >= 200 && response.status < 300) {
        await refreshMembers();
        toast.success('Thêm thành viên mới thành công!');
        setIsAddModalOpen(false);
        setFormData(initialFormState);
        setSelectedMember(null);
      } else {
        toast.error(response.error || 'Không thể tạo thành viên mới.');
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi khi kết nối với máy chủ.');
    } finally {
      setIsSavingMember(false);
    }
  };

  const openEditModal = (member: Member) => {
    if (!canManageMembers) {
      toast.error('Bạn chỉ có quyền xem danh sách thành viên.');
      return;
    }

    const { id, ...memberData } = member;
    setSelectedMember(member);
    setFormData({
      ...memberData,
      ban: normalizeBanList(member.ban),
      dob: toDateInputFormat(member.dob),
      joinDate: toDateInputFormat(member.joinDate),
      hardSkills: member.hardSkills.map(skill => ({ ...skill })),
      softSkills: member.softSkills.map(skill => ({ ...skill }))
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedMember || !authToken) {
      toast.error('Lỗi: Thiếu dữ liệu hoặc token xác thực.');
      return;
    }

    if (!canManageMembers) {
      toast.error('Bạn chỉ có quyền xem danh sách thành viên.');
      return;
    }

    // Validation
    const requiredFields: (keyof MemberFormData)[] = ['mssv', 'name', 'dob', 'phone', 'email', 'joinDate', 'role', 'experience', 'goal', 'orientation'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast.error(`Vui lòng nhập đầy đủ các thông tin bắt buộc: ${missingFields.join(', ')}`);
      return;
    }

    if (formData.ban.length === 0) {
      toast.error('Vui lòng chọn ít nhất một Ban chuyên môn.');
      return;
    }

    setIsSavingMember(true);

    const { role, ban, ...rest } = formData;
    const payload = {
      ...rest,
      roleTitle: role,
      ban: formatBanList(ban),
      dob: toDateInputFormat(formData.dob),
      joinDate: toDateInputFormat(formData.joinDate),
      hardSkills: sanitizeSkills(formData.hardSkills),
      softSkills: sanitizeSkills(formData.softSkills)
    };

    try {
      const response = await updateMember(selectedMember.id, payload as any, authToken);
      if (response.status >= 200 && response.status < 300) {
        await refreshMembers(selectedMember.id);
        toast.success('Cập nhật thông tin thành viên thành công!');
        setIsEditModalOpen(false);
        if (response.data) {
          setSelectedMember(response.data);
        }
      } else {
        toast.error(response.error || 'Không thể cập nhật thành viên.');
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi khi kết nối với máy chủ.');
    } finally {
      setIsSavingMember(false);
    }
  };

  const renderTableContent = () => {
    if (isLoadingMembers) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-8 w-24 rounded-md" /></TableCell>
        </TableRow>
      ));
    }

    if (paginatedMembers.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-64 text-center">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-4 bg-brand-light rounded-full text-secondary">
                <Users size={48} className="opacity-20" />
              </div>
              <p className="text-secondary font-medium">{t('members.emptyState')}</p>
              {searchTerm && (
                <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')}>
                  Xóa tìm kiếm
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return paginatedMembers.map((member, index) => (
      <TableRow 
        key={member.id} 
        className="cursor-pointer group"
        onClick={() => setSelectedMember(member)}
      >
        <TableCell className="font-medium text-secondary">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
        <TableCell className="font-bold text-primary group-hover:text-gold transition-colors">{member.name}</TableCell>
        <TableCell className="text-secondary">{member.mssv}</TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {normalizeBanList(member.ban).map((b) => (
              <Badge key={b} variant="secondary" className="text-[10px] py-0 px-1.5 bg-brand-light border-border text-secondary">
                {b}
              </Badge>
            ))}
          </div>
        </TableCell>
        <TableCell className="text-sm">{member.role}</TableCell>
        <TableCell>
          <Badge
            variant={member.status === 'Active' ? 'default' : 'danger'}
            className={member.status === 'Active' ? 'bg-success-bg text-success-text border-success-border' : ''}
          >
            {member.status === 'Active' ? t('members.statusActive') : t('members.statusInactive')}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-secondary hover:text-gold hover:bg-gold/10"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMember(member);
              }}
            >
              <Eye size={16} />
            </Button>
            {canManageMembers ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-secondary hover:text-brand-blue-hover hover:bg-brand-light"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(member);
                }}
              >
                <Edit size={16} />
              </Button>
            ) : (
              <span title="Không có quyền" className="inline-flex cursor-not-allowed">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-secondary hover:text-brand-blue-hover hover:bg-brand-light"
                  disabled
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(member);
                  }}
                >
                  <Edit size={16} />
                </Button>
              </span>
            )}

            {canManageMembers ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-secondary hover:text-danger-text hover:bg-danger-bg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteMember(member.id);
                }}
              >
                <Trash2 size={16} />
              </Button>
            ) : (
              <span title="Không có quyền" className="inline-flex cursor-not-allowed">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-secondary hover:text-danger-text hover:bg-danger-bg"
                  disabled
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMember(member.id);
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              </span>
            )}
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('members.title')}</h2>
          <p className="text-secondary text-sm mt-1">
            {t('members.subtitle', { count: filteredMembers.length })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => void refreshMembers()} 
            className="flex items-center gap-2 border-border-highlight"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={16} className={isLoadingMembers ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')} className="hidden sm:flex items-center gap-2 border-border-highlight">
            <Download size={16} />
            CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('zip')} className="hidden sm:flex items-center gap-2 border-border-highlight">
            <Download size={16} />
            ZIP
          </Button>
          {canManageMembers ? (
            <Button
              variant="outline"
              onClick={() => { setIsImportModalOpen(true); setImportResult(null); setImportFile(null); }}
              className="hidden sm:flex items-center gap-2 border-border-highlight"
            >
              <Upload size={16} />
              {t('members.importBtn')}
            </Button>
          ) : (
            <span title="Không có quyền" className="hidden sm:flex cursor-not-allowed">
              <Button
                variant="outline"
                onClick={() => { setIsImportModalOpen(true); setImportResult(null); setImportFile(null); }}
                disabled
                className="flex items-center gap-2 border-border-highlight"
              >
                <Upload size={16} />
                {t('members.importBtn')}
              </Button>
            </span>
          )}

          {canManageMembers ? (
            <Button
              onClick={() => { setFormData(initialFormState); setIsAddModalOpen(true); }}
              className="flex items-center gap-2 shadow-lg shadow-gold/20"
            >
              <Plus size={16} />
              {t('members.addBtn')}
            </Button>
          ) : (
            <span title="Không có quyền" className="inline-flex cursor-not-allowed">
              <Button
                onClick={() => { setFormData(initialFormState); setIsAddModalOpen(true); }}
                disabled
                className="flex items-center gap-2 shadow-lg shadow-gold/20"
              >
                <Plus size={16} />
                {t('members.addBtn')}
              </Button>
            </span>
          )}
        </div>
      </div>

      <div className="bg-card border-border/50 shadow-sm overflow-hidden rounded-xl border">
        <div className="p-4 bg-card/50 border-b border-border/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary h-4 w-4" />
              <Input
                placeholder={t('members.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border focus:border-gold/50 transition-all"
              />
            </div>
            <Select
              value={filterBan}
              onChange={(e) => setFilterBan(e.target.value)}
              className="bg-background border-border"
            >
              <option value="All">{t('members.filterDeptAll')}</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </Select>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-background border-border"
            >
              <option value="All">{t('members.filterStatusAll')}</option>
              <option value="Active">{t('members.statusActive')}</option>
              <option value="Inactive">{t('members.statusInactive')}</option>
            </Select>
            <div className="flex items-center justify-end sm:col-span-1 lg:col-span-1">
              <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setFilterBan('All'); setFilterStatus('All'); }} className="text-secondary hover:text-primary">
                <X size={14} className="mr-2" />
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 cursor-pointer" onClick={() => handleSort('id')}>
                <div className="flex items-center gap-1">
                  {t('members.thStt')}
                  <ArrowUpDown size={12} className="opacity-50" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">
                  {t('members.thName')}
                  <ArrowUpDown size={12} className="opacity-50" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('mssv')}>
                <div className="flex items-center gap-1">
                  {t('members.thMssv')}
                  <ArrowUpDown size={12} className="opacity-50" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('ban')}>
                <div className="flex items-center gap-1">
                  {t('members.thDept')}
                  <ArrowUpDown size={12} className="opacity-50" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('role')}>
                <div className="flex items-center gap-1">
                  {t('members.thRole')}
                  <ArrowUpDown size={12} className="opacity-50" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">
                  {t('members.thStatus')}
                  <ArrowUpDown size={12} className="opacity-50" />
                </div>
              </TableHead>
              <TableHead className="w-24 text-center">{t('members.thAction')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderTableContent()}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="p-4 border-t border-border/50 flex items-center justify-between bg-card/30">
            <p className="text-xs text-secondary">
              Hiển thị <strong>{paginatedMembers.length}</strong> trên <strong>{filteredMembers.length}</strong> thành viên
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft size={16} />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                    className="h-8 w-8 p-0 text-xs"
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Member Detail Modal */}
      <Modal 
        isOpen={!!selectedMember && !isEditModalOpen} 
        onClose={() => { setSelectedMember(null); setActiveDetailTab('info'); }}
        title={selectedMember ? `${t('members.profileTitle')}: ${selectedMember.name}` : t('members.profileTitle')}
        className="max-w-3xl"
        footer={
          <>
            <Button 
              variant="outline" 
              onClick={async () => {
                const url = exportMemberProfileUrl(selectedMember!.id);
                  if (authToken) {
                  const filename = `Ho_so_${selectedMember!.name.replace(/\s+/g, '_')}_${selectedMember!.mssv}.docx`;
                  const success = await downloadFileWithAuth(url, authToken, filename);
                  if (!success) {
                    toast.error('Không thể tải hồ sơ. Vui lòng thử lại sau.');
                  }
                } else {
                  window.open(url, '_blank');
                }
              }}
              className="mr-auto"
            >
              <FileText size={16} className="mr-2" />
              Tải hồ sơ (DOCX)
            </Button>
            <Button variant="outline" onClick={() => { setSelectedMember(null); setActiveDetailTab('info'); }} className="hover:bg-secondary/10 transition-colors">
              Đóng
            </Button>
            {canManageMembers ? (
              <Button
                variant="default"
                onClick={() => selectedMember && openEditModal(selectedMember)}
                className="transition-transform active:scale-95"
              >
                <Edit size={16} className="mr-2" />
                Chỉnh sửa
              </Button>
            ) : (
              <span title="Không có quyền" className="inline-flex cursor-not-allowed">
                <Button
                  variant="default"
                  onClick={() => selectedMember && openEditModal(selectedMember)}
                  disabled
                  className="transition-transform active:scale-95"
                >
                  <Edit size={16} className="mr-2" />
                  Chỉnh sửa
                </Button>
              </span>
            )}
          </>
        }
      >
        {selectedMember && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-24 h-24 rounded-2xl bg-gold/10 border-2 border-gold/20 flex items-center justify-center text-gold text-3xl font-bold shrink-0">
                {selectedMember.name.split(' ').pop()?.[0]}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-2xl font-bold text-primary">{selectedMember.name}</h3>
                  <Badge 
                    variant={selectedMember.status === 'Active' ? 'default' : 'outline'}
                    className={selectedMember.status === 'Active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-secondary/10 text-secondary border-secondary/20'}
                  >
                    {selectedMember.status === 'Active' ? 'Đang hoạt động' : 'Đã nghỉ'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-secondary text-sm">
                  <span className="flex items-center gap-1.5">
                    <Briefcase size={14} />
                    {selectedMember.role}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={14} />
                    {formatBanList(selectedMember.ban)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} />
                    {selectedMember.address}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex border-b border-border overflow-x-auto">
              <button 
                onClick={() => setActiveDetailTab('info')}
                className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${activeDetailTab === 'info' ? 'text-gold' : 'text-secondary hover:text-primary'}`}
              >
                Thông tin chi tiết
                {activeDetailTab === 'info' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />}
              </button>
              <button 
                onClick={() => setActiveDetailTab('performance')}
                className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${activeDetailTab === 'performance' ? 'text-gold' : 'text-secondary hover:text-primary'}`}
              >
                Kỷ luật & KPI
                {activeDetailTab === 'performance' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />}
              </button>
              <button 
                onClick={() => setActiveDetailTab('history')}
                className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${activeDetailTab === 'history' ? 'text-gold' : 'text-secondary hover:text-primary'}`}
              >
                Lịch sử thay đổi
                {activeDetailTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />}
              </button>
            </div>

            {activeDetailTab === 'info' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-secondary/70">Thông tin cá nhân</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem Icon={Calendar} label="Ngày sinh" value={formatDate(selectedMember.dob)} />
                    <InfoItem Icon={Users} label="Giới tính" value={selectedMember.gender} />
                    <div className="flex flex-col group relative">
                      <span className="flex items-center text-xs text-secondary mb-1">
                        <Mail size={16} className="mr-1.5 opacity-70" />
                        Email
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary truncate">{selectedMember.email}</span>
                        <button 
                          onClick={() => handleCopy(selectedMember.email, 'Email')}
                          className="p-1 hover:bg-secondary/10 rounded transition-colors text-secondary hover:text-gold"
                        >
                          {copiedField === 'Email' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col group relative">
                      <span className="flex items-center text-xs text-secondary mb-1">
                        <Phone size={16} className="mr-1.5 opacity-70" />
                        Số điện thoại
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">{selectedMember.phone}</span>
                        <button 
                          onClick={() => handleCopy(selectedMember.phone, 'Số điện thoại')}
                          className="p-1 hover:bg-secondary/10 rounded transition-colors text-secondary hover:text-gold"
                        >
                          {copiedField === 'Số điện thoại' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-secondary/70">Học vấn & CLB</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem Icon={BookOpen} label="MSSV" value={selectedMember.mssv} />
                    <InfoItem Icon={GraduationCap} label="Lớp" value={selectedMember.lop} />
                    <div className="col-span-2">
                      <InfoItem Icon={Compass} label="Khoa" value={selectedMember.khoa} />
                    </div>
                    <div className="col-span-2">
                      <InfoItem Icon={Target} label="Chuyên ngành" value={selectedMember.chuyenNganh} />
                    </div>
                    <InfoItem Icon={Calendar} label="Ngày gia nhập" value={formatDate(selectedMember.joinDate)} />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-secondary/70">Kỹ năng & Kinh nghiệm</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-secondary">Kỹ năng chuyên môn</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedMember.hardSkills.map((skill, i) => (
                          <Badge key={i} variant="outline" className="bg-gold/5 border-gold/20 text-gold-dark py-1">
                            {skill.name} • {skill.level}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-secondary">Kỹ năng mềm</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedMember.softSkills.map((skill, i) => (
                          <Badge key={i} variant="outline" className="bg-blue-500/5 border-blue-500/20 text-blue-600 py-1">
                            {skill.name} • {skill.level}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-secondary flex items-center gap-1.5">
                        <Star size={14} className="text-gold" /> Kinh nghiệm
                      </p>
                      <p className="text-sm text-primary leading-relaxed bg-secondary/5 p-3 rounded-lg border border-border/50">{selectedMember.experience}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-secondary flex items-center gap-1.5">
                        <Target size={14} className="text-gold" /> Định hướng
                      </p>
                      <p className="text-sm text-primary leading-relaxed bg-secondary/5 p-3 rounded-lg border border-border/50">{selectedMember.orientation}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeDetailTab === 'performance' ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card p-5 rounded-xl border border-border flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2">
                      <Target size={24} />
                    </div>
                    <span className="text-sm text-secondary font-medium">Điểm KPI</span>
                    <span className="text-3xl font-bold text-primary">{selectedMember.kpi ?? 100}</span>
                  </div>
                  <div className="bg-card p-5 rounded-xl border border-border flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mb-2">
                      <Calendar size={24} />
                    </div>
                    <span className="text-sm text-secondary font-medium">Số buổi vắng</span>
                    <span className="text-3xl font-bold text-primary">{selectedMember.absents ?? 0}</span>
                  </div>
                  <div className="bg-card p-5 rounded-xl border border-border flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-2">
                      <Star size={24} />
                    </div>
                    <span className="text-sm text-secondary font-medium">Mức kỷ luật</span>
                    <span className="text-xl font-bold text-primary">{selectedMember.disciplineLevel || 'Không'}</span>
                  </div>
                </div>
                <div className="bg-brand-light p-5 rounded-xl border border-border">
                  <h4 className="text-sm font-bold text-gold uppercase tracking-wider mb-2">Ghi chú</h4>
                  <p className="text-sm text-secondary">
                    Dữ liệu kỷ luật và KPI được cập nhật liên tục từ hệ thống điểm danh và quản lý thành tích của CLB.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-brand-light p-5 rounded-xl border border-border min-h-[300px]">
                <h5 className="text-sm font-bold text-gold uppercase tracking-wider flex items-center mb-4">
                  <RefreshCw size={16} className={`mr-2 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                  Nhật ký thay đổi
                </h5>
                <div className="space-y-3">
                  {isLoadingLogs ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : memberLogs.length > 0 ? (
                    memberLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-background/50 rounded-lg border border-border flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold">{log.action}</Badge>
                          <span className="text-[10px] text-secondary">{formatDate(log.timestamp)}</span>
                        </div>
                        <p className="text-sm text-primary">{log.details}</p>
                        <p className="text-[10px] text-secondary italic">Bởi: {log.user}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-secondary italic text-sm">
                      Chưa có lịch sử thay đổi nào được ghi lại cho thành viên này.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add / Edit Member Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
        title={isEditModalOpen ? t('members.update') : t('members.addBtn')}
        className="max-w-4xl"
        footer={
          <>
            <Button variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="hover:bg-secondary/10 transition-colors">
              Hủy
            </Button>
            <Button 
              isLoading={isSavingMember} 
              onClick={() => void (isEditModalOpen ? handleEditSubmit() : handleAddSubmit())}
              className={`transition-all ${isSavingMember ? 'cursor-wait' : 'active:scale-95'}`}
            >
              {isEditModalOpen ? 'Lưu thay đổi' : 'Thêm mới'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Toast messages shown via global toast; removed inline modal banners */}
          
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Thông tin cơ bản */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gold border-b border-border pb-2 flex items-center">
                  <Users size={18} className="mr-2" />
                  Thông tin cơ bản
                </h4>
              <div className="space-y-2">
                <label className="text-sm font-medium">Họ và tên *</label>
                <Input name="name" value={formData.name} onChange={handleFormChange} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">MSSV *</label>
                  <Input name="mssv" value={formData.mssv} onChange={handleFormChange} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Giới tính *</label>
                  <Select name="gender" value={formData.gender} onChange={handleFormChange} required>
                    <option value="Nam">Nam</option>
                    <option value="Nu">Nữ</option>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ngày sinh *</label>
                <Input name="dob" type="date" value={formData.dob} onChange={handleFormChange} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input name="email" type="email" value={formData.email} onChange={handleFormChange} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Số điện thoại *</label>
                <Input name="phone" value={formData.phone} onChange={handleFormChange} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Địa chỉ</label>
                <Input name="address" value={formData.address} onChange={handleFormChange} />
              </div>
            </div>

            {/* Thông tin CLB & Học vấn */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gold border-b border-border pb-2">CLB & Học vấn</h4>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ban * (Checklist)</label>
                <div className="grid grid-cols-2 gap-2 p-3 border border-border rounded-lg bg-background/50">
                  {DEPARTMENTS.map(dept => (
                    <label key={dept} className="flex items-center space-x-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={banListMatches(formData.ban, dept)} 
                        onChange={() => handleBanToggle(dept)}
                        className="rounded border-border text-gold focus:ring-gold transition-colors"
                      />
                      <span className="text-sm group-hover:text-gold transition-colors">{dept}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Chức vụ *</label>
                <Input name="role" value={formData.role} onChange={handleFormChange} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trạng thái *</label>
                  <Select name="status" value={formData.status} onChange={handleFormChange} required>
                    <option value="Active">Hoạt động</option>
                    <option value="Inactive">Tạm nghỉ</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ngày tham gia *</label>
                  <Input name="joinDate" type="date" value={formData.joinDate} onChange={handleFormChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Lớp</label>
                <Input name="lop" value={formData.lop} onChange={handleFormChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Khoa *</label>
                <Select name="khoa" value={formData.khoa} onChange={handleFormChange} required>
                  {Object.keys(FACULTY_MAJOR_MAP).map(khoa => (
                    <option key={khoa} value={khoa}>{khoa}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Chuyên ngành *</label>
                {formData.khoa === 'Khác' ? (
                  <Input 
                    name="chuyenNganh" 
                    value={formData.chuyenNganh} 
                    onChange={handleFormChange} 
                    placeholder="Nhập chuyên ngành..."
                    required 
                  />
                ) : (
                  <Select name="chuyenNganh" value={formData.chuyenNganh} onChange={handleFormChange} required>
                    {FACULTY_MAJOR_MAP[formData.khoa]?.map(major => (
                      <option key={major} value={major}>{major}</option>
                    ))}
                  </Select>
                )}
              </div>
            </div>
          </div>

          {/* Kỹ năng & Định hướng */}
          <div className="space-y-4 pt-4">
            <h4 className="font-semibold text-gold border-b border-border pb-2">Kỹ năng & Định hướng</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium">Kỹ năng chuyên môn *</label>
                    <Button type="button" variant="outline" size="sm" onClick={() => handleAddSkill('hard')}>
                      <Plus size={14} className="mr-1" />
                      Thêm kỹ năng
                    </Button>
                  </div>
                  {formData.hardSkills.length === 0 ? (
                    <p className="text-xs text-secondary border border-dashed border-border rounded-lg px-3 py-2">
                      Chưa có kỹ năng chuyên môn. Nhấn "Thêm kỹ năng" để bắt đầu.
                    </p>
                  ) : null}
                  <div className="space-y-2">
                    {formData.hardSkills.map((skill, index) => (
                      <div key={`hard-${index}`} className="grid grid-cols-[1fr_140px_auto] gap-2 items-center">
                        <Input
                          value={skill.name}
                          onChange={(e) => handleSkillChange('hard', index, 'name', e.target.value)}
                          placeholder="Tên kỹ năng"
                        />
                        <Select
                          value={skill.level}
                          onChange={(e) => handleSkillChange('hard', index, 'level', e.target.value)}
                        >
                          <option value="Tốt">Tốt</option>
                          <option value="Trung bình">Trung bình</option>
                          <option value="Cơ bản">Cơ bản</option>
                        </Select>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => handleRemoveSkill('hard', index)}
                          title="Xóa kỹ năng"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium">Kỹ năng mềm *</label>
                    <Button type="button" variant="outline" size="sm" onClick={() => handleAddSkill('soft')}>
                      <Plus size={14} className="mr-1" />
                      Thêm kỹ năng
                    </Button>
                  </div>
                  {formData.softSkills.length === 0 ? (
                    <p className="text-xs text-secondary border border-dashed border-border rounded-lg px-3 py-2">
                      Chưa có kỹ năng mềm. Nhấn "Thêm kỹ năng" để bắt đầu.
                    </p>
                  ) : null}
                  <div className="space-y-2">
                    {formData.softSkills.map((skill, index) => (
                      <div key={`soft-${index}`} className="grid grid-cols-[1fr_140px_auto] gap-2 items-center">
                        <Input
                          value={skill.name}
                          onChange={(e) => handleSkillChange('soft', index, 'name', e.target.value)}
                          placeholder="Tên kỹ năng"
                        />
                        <Select
                          value={skill.level}
                          onChange={(e) => handleSkillChange('soft', index, 'level', e.target.value)}
                        >
                          <option value="Tốt">Tốt</option>
                          <option value="Trung bình">Trung bình</option>
                          <option value="Cơ bản">Cơ bản</option>
                        </Select>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => handleRemoveSkill('soft', index)}
                          title="Xóa kỹ năng"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mục tiêu trong CLB *</label>
                  <textarea 
                    name="goal" 
                    value={formData.goal} 
                    onChange={handleFormChange} 
                    className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold min-h-[80px]" 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kinh nghiệm trước đây *</label>
                  <textarea 
                    name="experience" 
                    value={formData.experience} 
                    onChange={handleFormChange} 
                    className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold min-h-[80px]" 
                    required
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Định hướng tương lai *</label>
              <Input name="orientation" value={formData.orientation} onChange={handleFormChange} placeholder="Vd: Trở thành Developer trong 3 năm tới..." required />
            </div>
          </div>
        </form>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title={t('members.importTitle')}
        className="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="default"
              onClick={() => void handleImportSubmit()}
              disabled={!importFile || isImporting}
            >
              {isImporting ? t('common.loading') : t('members.importBtn')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">{t('members.importDesc')}</p>
          
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">{t('members.importFile')}</label>
            <Input
              type="file"
              accept=".csv, .xlsx"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="file:bg-brand-light file:text-primary file:border-0 file:mr-4 file:px-4 file:py-2 file:rounded-md file:text-sm file:font-medium hover:file:bg-brand-light/80"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">{t('members.importOnDuplicate')}</label>
            <Select
              value={importOnDuplicate}
              onChange={(e) => setImportOnDuplicate(e.target.value as 'skip' | 'update')}
              className="bg-background border-border"
            >
              <option value="skip">{t('members.importSkip')}</option>
              <option value="update">{t('members.importUpdate')}</option>
            </Select>
          </div>

          <div className="pt-2">
            <a
              href={membersImportTemplateUrl(authToken)}
              className="text-sm text-gold hover:underline flex items-center gap-1 w-max"
            >
              <Download size={14} />
              {t('members.importDownloadTemplate')}
            </a>
          </div>

          {importResult && (
            <div className="mt-4 p-4 border border-border rounded-md bg-card/50 space-y-2">
              <h4 className="font-semibold text-primary">{t('members.importResultTitle')}</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-secondary">{t('members.importTotal')}</span>
                <span className="font-medium">{importResult.total}</span>
                
                <span className="text-secondary">{t('members.importCreated')}</span>
                <span className="font-medium text-success-text">{importResult.created}</span>
                
                <span className="text-secondary">{t('members.importUpdated')}</span>
                <span className="font-medium text-brand-blue">{importResult.updated}</span>
                
                <span className="text-secondary">{t('members.importSkipped')}</span>
                <span className="font-medium text-warning-text">{importResult.skipped}</span>
                
                <span className="text-secondary">{t('members.importErrorCount')}</span>
                <span className="font-medium text-danger-text">{importResult.failed}</span>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-xs text-danger-text mb-1 font-medium">{t('members.importErrorCount')}</p>
                  <ul className="text-xs text-secondary max-h-32 overflow-y-auto space-y-1">
                    {importResult.errors.map((err, idx) => (
                      <li key={idx}>
                        {t('members.importRowError', { row: err.row })} {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

interface InfoItemProps {
  Icon: LucideIcon;
  label: string;
  value: string;
}

const InfoItem = ({ Icon, label, value }: InfoItemProps) => (
  <div className="flex flex-col">
    <span className="flex items-center text-xs text-secondary mb-1">
      <span className="mr-1.5 opacity-70">
        <Icon size={16} />
      </span>
      {label}
    </span>
    <span className="text-sm font-medium text-primary">{value || '---'}</span>
  </div>
);

interface SkillBadgeProps {
  name: string;
  level: SkillLevel;
}

const SkillBadge = ({ name, level }: SkillBadgeProps) => {
  let badgeVariant: 'default' | 'success' | 'warning' | 'secondary' = 'secondary';
  if (level === 'Tốt') badgeVariant = 'success';
  if (level === 'Trung bình') badgeVariant = 'warning';
  
  return (
    <Badge variant={badgeVariant} className="px-2.5 py-1 text-xs flex items-center">
      {name} <span className="ml-1 opacity-70 font-normal">({level})</span>
    </Badge>
  );
};
