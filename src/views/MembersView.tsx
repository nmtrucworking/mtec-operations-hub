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
  type LucideIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Modal } from '../components/ui/modal';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { createMember, getMembers, updateMember, deleteMember, exportMembers, exportMemberProfileUrl } from '../services/members';
import { formatDate, toDateInputFormat } from '../lib/helpers';
import type { ApiResponse } from '../services/api';
import { FACULTY_MAJOR_MAP, type Member, type MemberSkill, type SkillLevel, DEPARTMENTS } from '../data/members';

const ITEMS_PER_PAGE = 10;

interface MembersViewProps {
  authToken?: string;
}

type SortField = keyof Member | 'stt';
type SortOrder = 'asc' | 'desc';

export const MembersView = ({ authToken }: MembersViewProps) => {
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
  const [loadError, setLoadError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [sortConfig, setSortConfig] = useState<{ field: SortField; order: SortOrder }>({
    field: 'id',
    order: 'asc'
  });

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
        setLoadError('Thiếu token đăng nhập để tải danh sách thành viên.');
        setIsLoadingMembers(false);
        return;
      }

      setIsLoadingMembers(true);
      setLoadError('');
      const response = await getMembers({ pageSize: 1000 }, authToken);
      if (response.status >= 200 && response.status < 300 && response.data) {
        setMembers(response.data.members);
      } else {
        setLoadError(response.error || 'Không tải được danh sách thành viên từ backend.');
      }
      setIsLoadingMembers(false);
    };

    void loadMembers();
  }, [authToken]);

  const refreshMembers = async (preserveSelectionId?: number) => {
    if (!authToken) {
      return false;
    }

    const response = await getMembers({ pageSize: 1000 }, authToken);
    if (response.status >= 200 && response.status < 300 && response.data) {
      setMembers(response.data.members);
      if (preserveSelectionId) {
        setSelectedMember(response.data.members.find((member) => member.id === preserveSelectionId) ?? null);
      }
      setLoadError('');
      return true;
    }

    setLoadError(response.error || 'Không tải được danh sách thành viên từ backend.');
    return false;
  };

  // Lọc dữ liệu
  const filteredMembers = members.filter((member) => {
    const matchSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) || member.mssv.includes(searchTerm);
    const matchBan = filterBan === 'All' || member.ban.includes(filterBan);
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
    } else if (Array.isArray(aValue) && Array.isArray(bValue)) {
      comparison = aValue.join(', ').localeCompare(bValue.join(', '));
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

  const handleExport = (format: 'csv' | 'zip') => {
    const exportUrl = exportMembers({ 
      format,
      ban: filterBan === 'All' ? undefined : filterBan,
      status: filterStatus === 'All' ? undefined : filterStatus
    }, authToken);
    
    window.open(exportUrl, '_blank');
  };

  const handleDeleteMember = async (memberId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thành viên này?')) {
      return;
    }

    setIsSavingMember(true);
    const response = await deleteMember(memberId, authToken);
    if (response.status >= 200 && response.status < 300) {
      await refreshMembers();
      setSelectedMember(null);
      setSaveSuccess('Xóa thành viên thành công!');
      setTimeout(() => setSaveSuccess(''), 2000);
    } else {
      setLoadError(response.error || 'Không thể xóa thành viên.');
    }
    setIsSavingMember(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'khoa') {
      const firstMajor = FACULTY_MAJOR_MAP[value]?.[0] || '';
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
    setIsSavingMember(true);
    setLoadError('');
    setSaveSuccess('');
    const payload = {
      ...formData,
      dob: formatDate(formData.dob),
      joinDate: formatDate(formData.joinDate),
      hardSkills: sanitizeSkills(formData.hardSkills),
      softSkills: sanitizeSkills(formData.softSkills)
    };

    const response = await createMember(payload, authToken);
    if (response.status >= 200 && response.status < 300) {
      await refreshMembers();
      setSaveSuccess('Thêm thành viên mới thành công!');
      setTimeout(() => {
        setIsAddModalOpen(false);
        setFormData(initialFormState);
        setSelectedMember(null);
        setSaveSuccess('');
      }, 1500);
    } else {
      setLoadError(response.error || 'Không thể tạo thành viên mới.');
    }
    setIsSavingMember(false);
  };

  const openEditModal = (member: Member) => {
    const { id, ...memberData } = member;
    setSelectedMember(member);
    setFormData({
      ...memberData,
      dob: toDateInputFormat(member.dob),
      joinDate: toDateInputFormat(member.joinDate),
      hardSkills: member.hardSkills.map(skill => ({ ...skill })),
      softSkills: member.softSkills.map(skill => ({ ...skill }))
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedMember) {
      return;
    }

    setIsSavingMember(true);
    setLoadError('');
    setSaveSuccess('');
    const payload = {
      ...formData,
      dob: formatDate(formData.dob),
      joinDate: formatDate(formData.joinDate),
      hardSkills: sanitizeSkills(formData.hardSkills),
      softSkills: sanitizeSkills(formData.softSkills)
    };

    const response = await updateMember(selectedMember.id, payload, authToken);
    if (response.status >= 200 && response.status < 300) {
      await refreshMembers(selectedMember.id);
      setSaveSuccess('Cập nhật thông tin thành viên thành công!');
      setTimeout(() => {
        setIsEditModalOpen(false);
        if (response.data) {
          setSelectedMember(response.data);
        }
        setSaveSuccess('');
      }, 1500);
    } else {
      setLoadError(response.error || 'Không thể cập nhật thành viên.');
    }
    setIsSavingMember(false);
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
            {member.ban.map((b) => (
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
          <Button variant="outline" onClick={() => handleExport('csv')} className="hidden sm:flex items-center gap-2 border-border-highlight">
            <Download size={16} />
            CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('zip')} className="hidden sm:flex items-center gap-2 border-border-highlight">
            <Download size={16} />
            ZIP
          </Button>
          <Button onClick={() => { setFormData(initialFormState); setIsAddModalOpen(true); }} className="flex items-center gap-2 shadow-lg shadow-gold/20">
            <Plus size={16} />
            {t('members.addBtn')}
          </Button>
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
              <TableHead className="w-12 cursor-pointer" onClick={() => handleSort('id')}>{t('members.thStt')}</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>{t('members.thName')}</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('mssv')}>{t('members.thMssv')}</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('ban')}>{t('members.thDept')}</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('role')}>{t('members.thRole')}</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>{t('members.thStatus')}</TableHead>
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
        onClose={() => setSelectedMember(null)}
        title={t('members.profileTitle')}
        className="max-w-3xl"
        footer={
          <>
            <Button 
              variant="outline" 
              onClick={() => {
                const url = exportMemberProfileUrl(selectedMember!.id);
                window.open(url, '_blank');
              }}
              className="mr-auto"
            >
              <FileText size={16} className="mr-2" />
              Tải hồ sơ (DOCX)
            </Button>
            <Button variant="outline" onClick={() => setSelectedMember(null)} className="hover:bg-secondary/10 transition-colors">
              {t('members.close')}
            </Button>
            <Button onClick={() => openEditModal(selectedMember!)} className="transition-transform active:scale-95">
              <Edit size={16} className="mr-2" />
              {t('members.update')}
            </Button>
          </>
        }
      >
        {selectedMember && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-brand-light p-5 rounded-xl border border-border shadow-inner">
              <InfoItem Icon={Users} label={t('members.lblGender')} value={selectedMember.gender} />
              <InfoItem Icon={Calendar} label={t('members.lblDob')} value={formatDate(selectedMember.dob)} />
              <InfoItem Icon={Phone} label={t('members.lblPhone')} value={selectedMember.phone} />
              <InfoItem Icon={Mail} label={t('members.lblEmail')} value={selectedMember.email} />
              <InfoItem Icon={MapPin} label={t('members.lblAddress')} value={selectedMember.address} />
              <InfoItem Icon={GraduationCap} label={t('members.lblMajor')} value={selectedMember.chuyenNganh} />
              <InfoItem Icon={Calendar} label="Ngày tham gia" value={formatDate(selectedMember.joinDate)} />
              <div className="md:col-span-2">
                <span className="flex items-center text-xs text-secondary mb-2">
                  <span className="mr-1.5 opacity-70">
                    <Briefcase size={16} />
                  </span>
                  Ban Chuyên môn
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedMember.ban.map(b => (
                    <Badge key={b} variant="secondary" className="px-3 py-1">{b}</Badge>
                  ))}
                  {selectedMember.ban.length === 0 && <span className="text-sm text-secondary italic">Chưa tham gia ban nào</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-brand-light p-5 rounded-xl border border-border">
                <h5 className="text-sm font-bold text-gold uppercase tracking-wider flex items-center mb-3">
                  <Star size={16} className="mr-2" />
                  {t('members.skills')}
                </h5>
                <div className="flex flex-wrap gap-2">
                  {[...selectedMember.hardSkills, ...selectedMember.softSkills].map((skill, idx) => (
                    <SkillBadge key={`${skill.name}-${idx}`} name={skill.name} level={skill.level} />
                  ))}
                </div>
              </div>
              <div className="bg-brand-light p-5 rounded-xl border border-border space-y-3">
                <h5 className="text-sm font-bold text-gold uppercase tracking-wider flex items-center">
                  <Target size={16} className="mr-2" />
                  {t('members.goals')}
                </h5>
                <p className="text-sm text-primary leading-relaxed">{selectedMember.goal || t('members.notUpdated')}</p>
                <p className="text-sm text-secondary leading-relaxed flex items-start">
                  <Compass size={14} className="mr-2 mt-1 shrink-0" />
                  {selectedMember.orientation || t('members.notUpdated')}
                </p>
              </div>
            </div>

            <div className="bg-brand-light p-5 rounded-xl border border-border">
              <h5 className="text-sm font-bold text-gold uppercase tracking-wider flex items-center mb-3">
                <BookOpen size={16} className="mr-2" />
                {t('members.experience')}
              </h5>
              <p className="text-sm text-secondary italic">{selectedMember.experience || t('members.noExperience')}</p>
            </div>
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
          {saveSuccess && (
            <div className="bg-success-bg text-success-text p-3 rounded-lg text-sm border border-success-border animate-in fade-in slide-in-from-top-2">
              {saveSuccess}
            </div>
          )}
          {loadError && (
            <div className="bg-danger-bg text-danger-text p-3 rounded-lg text-sm border border-danger-border animate-in fade-in slide-in-from-top-2">
              {loadError}
            </div>
          )}
          
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
                        checked={formData.ban.includes(dept)} 
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
                <Select name="chuyenNganh" value={formData.chuyenNganh} onChange={handleFormChange} required>
                  {FACULTY_MAJOR_MAP[formData.khoa]?.map(major => (
                    <option key={major} value={major}>{major}</option>
                  ))}
                </Select>
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
