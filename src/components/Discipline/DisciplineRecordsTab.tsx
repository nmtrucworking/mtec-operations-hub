import React, { useState, useEffect } from 'react';
import { Modal } from "../ui/modal";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Button } from "../ui/button";
import { Users, Calendar, CheckCircle, AlertCircle, Search, Loader2, Plus, X, Trophy, AlertTriangle } from "lucide-react";
import { Badge } from "../ui/badge";

import {
  getDisciplineStats,
  getDisciplineRecords,
  createDisciplineRecord,
  updateDisciplineRecord,
  type DisciplineStats,
  type DisciplineRecord,
  type DisciplineRecordCreate
} from '../../services/discipline';

import { getMembers } from '../../services/members';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Member } from '../../data/members';


type DisciplineLevel = 'Không' | 'Nhắc nhở' | 'Cảnh cáo Lần 1';
type FormDataState = DisciplineRecordCreate & { id?: string };

// Custom Hook for Debounce (Prevents API Flooding/500 Errors)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface Props {
  authToken?: string;
  allMembers: any[];
}


const DisciplineRecordsTab = ({ authToken, allMembers }: Props) => {
  const [records, setRecords] = useState<DisciplineRecord[]>([]);

  const [stats, setStats] = useState<DisciplineStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  
  const [isLoadingDiscipline, setIsLoadingDiscipline] = useState(false);
  const [hasLoadedRecords, setHasLoadedRecords] = useState(false);
  
  // Modal State Management
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultFormState: FormDataState = {
    mssv: '', name: '', committee: '', absents: 0, kpi: 100, disciplineLevel: 'Không', note: ''
  };
  const [formData, setFormData] = useState<FormDataState>(defaultFormState);
  
  const debouncedSearch = useDebounce(search, 500);
  const [disciplineFilter, setDisciplineFilter] = useState<'All' | DisciplineLevel>('All');

  const [hasLoadedMembers, setHasLoadedMembers] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  
  
  const parseListData = <T,>(response: any, fallbackKey?: string): T[] => {
    const directData = response?.data;
    if (Array.isArray(directData)) return directData as T[];

    if (fallbackKey && Array.isArray(directData?.[fallbackKey])) return directData[fallbackKey] as T[];

    if (Array.isArray(response?.data?.data)) return response.data.data as T[];
    return [];
  };

  const fetchMembersForRecords = async () => {
      const membersRes = await getMembers({ pageSize: 1000, status: 'Active' }, authToken);
      const parsedMembers = parseListData<Member>(membersRes, 'members');
      // setAllMembers(parsedMembers);
      setHasLoadedMembers(true);
    };

  const ensureMembersLoaded = async () => {
    if (hasLoadedMembers) {
      return;
    }

    setIsLoadingInitial(true);
    try {
      await fetchMembersForRecords();
    } catch (error) {
      console.error("Lỗi truy xuất danh sách thành viên:", error);
      throw error;
    } finally {
      setIsLoadingInitial(false);
    }
  };  

  const openAddRecordModal = async () => {
      try {
        await ensureMembersLoaded();
        setIsAddModalOpen(true);
      } catch {
        alert('Không tải được danh sách thành viên. Vui lòng thử lại.');
      }
    };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const statsRes = await getDisciplineStats(authToken);
      if (statsRes?.data) setStats(statsRes.data);
      
      const recordsRes = await getDisciplineRecords({ 
        search: search || undefined,
        disciplineLevel: filter === 'All' ? undefined : filter 
      }, authToken);
      setRecords(recordsRes?.data?.records || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [search, filter]);

  const handleCreateRecord = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.memberId) return alert('Vui lòng chọn thành viên hợp lệ.');
      setIsSubmitting(true);
      try {
        const response = await createDisciplineRecord(formData, authToken);
        if (response.success) {
          setIsAddModalOpen(false);
          setFormData({ mssv: '', name: '', committee: '', absents: 0, kpi: 100, disciplineLevel: 'Không', note: '' });
          await fetchData();
        } else {
          alert(response.error || 'Đã xảy ra lỗi khi tạo bản ghi.');
        }
      } catch (error) {
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
          committee: selected.ban && selected.ban.length > 0 ? selected.ban.join(', ') : ''
        });
      } else {
        setFormData({ ...formData, memberId: undefined, mssv: '', name: '', committee: '' });
      }
    };

  const handleUpdateRecord = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.id) return;
      setIsSubmitting(true);
      try {
        const response = await updateDisciplineRecord(formData.id, formData, authToken);
        if (response.success) {
          setIsEditModalOpen(false);
          setFormData({ mssv: '', name: '', committee: '', absents: 0, kpi: 100, disciplineLevel: 'Không', note: '' });
          await fetchData();
        } else {
          alert(response.error || 'Đã xảy ra lỗi khi cập nhật bản ghi.');
        }
      } catch (error) {
        alert('Lỗi hệ thống khi cập nhật bản ghi.');
      } finally {
        setIsSubmitting(false);
      }
    };
  
  const openEditModal = (record: DisciplineRecord) => {
    setFormData(record as any); 
    setIsEditModalOpen(true);
  };

  

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* 1. THẺ THỐNG KÊ NHANH (Upgraded UI) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Users size={64} /></div>
          <p className="text-sm font-medium text-secondary">Tổng số hồ sơ</p>
          <p className="text-4xl font-extrabold mt-2 text-primary tracking-tight">{stats?.totalMembers ?? 0}</p>
        </div>
        <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle size={64} className="text-orange-500" /></div>
          <p className="text-sm font-medium text-secondary">Ca cảnh cáo</p>
          <p className="text-4xl font-extrabold mt-2 text-orange-500 tracking-tight">{stats?.warnedCases ?? 0}</p>
        </div>
        <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={64} className="text-green-500" /></div>
          <p className="text-sm font-medium text-secondary">KPI trung bình</p>
          <div className="flex items-baseline mt-2">
            <p className="text-4xl font-extrabold text-green-500 tracking-tight">{stats?.averageKPI ?? 0}</p>
            <span className="text-lg text-secondary ml-1 font-medium">/100</span>
          </div>
        </div>
      </div>

      {/* 2. BỘ LỌC VÀ TÌM KIẾM */}
      <div className="bg-card/80 backdrop-blur-md p-4 rounded-2xl border border-border/50 shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="flex items-center w-full lg:w-1/3 relative">
          <Search size={16} className="absolute left-4 text-secondary/70" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm MSSV hoặc tên..."
            className="pl-10 w-full bg-background/50 border-border/50 focus:bg-background transition-colors rounded-xl"
          />
        </div>
        <div className="flex items-center gap-2 w-full lg:w-64 relative">
          <Select
            value={disciplineFilter}
            onChange={(e) => setDisciplineFilter(e.target.value as any)}
            className="w-full bg-background/50 border-border/50 focus:bg-background rounded-xl"
          >
            <option value="All">Tất cả mức độ</option>
            <option value="Không">Không kỷ luật</option>
            <option value="Nhắc nhở">Nhắc nhở</option>
            <option value="Cảnh cáo Lần 1">Cảnh cáo Lần 1</option>
          </Select>
        </div>
        <Button
          onClick={() => { void openAddRecordModal(); }}
          className="lg:ml-auto flex items-center justify-center gap-2 rounded-xl px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform active:scale-95"
        >
          <Plus size={18} /> Thêm bản ghi
        </Button>
      </div>

      {/* 3. BẢNG DỮ LIỆU */}
      <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">MSSV</TableHead>
                <TableHead className="font-semibold">Họ và tên</TableHead>
                <TableHead className="font-semibold">Ban</TableHead>
                <TableHead className="font-semibold">Vắng</TableHead>
                <TableHead className="font-semibold">Mức độ</TableHead>
                <TableHead className="font-semibold text-right">KPI</TableHead>
                <TableHead className="font-semibold text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingDiscipline ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-secondary">
                      <Loader2 size={32} className="animate-spin mb-4 text-primary" />
                      <p className="font-medium animate-pulse">Đang tải dữ liệu hồ sơ...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-secondary/70">
                      <Users size={48} className="mb-4 opacity-20" />
                      <p className="font-medium">Không tìm thấy bản ghi nào.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : records.map((item) => (
                <TableRow key={item.id} className="group transition-colors hover:bg-muted/40 cursor-default">
                  <TableCell className="font-medium text-secondary-foreground">{item.mssv}</TableCell>
                  <TableCell className="font-semibold">{item.name}</TableCell>
                  <TableCell><span className="text-sm px-2 py-1 bg-muted rounded-md border border-border/50">{item.committee || 'N/A'}</span></TableCell>
                  <TableCell>
                    {item.absents > 0
                      ? <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-bold">{item.absents}</span>
                      : <span className="text-secondary">0</span>}
                  </TableCell>
                  <TableCell>
                    {item.disciplineLevel === 'Không' ? (
                      <Badge variant="outline" className="text-secondary border-secondary/30 bg-secondary/5 font-medium">Không</Badge>
                    ) : item.disciplineLevel === 'Nhắc nhở' ? (
                      <Badge variant="outline" className="text-yellow-700 border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-500 font-medium shadow-sm">Nhắc nhở</Badge>
                    ) : (
                      <Badge variant="danger" className="shadow-sm font-medium">Cảnh cáo Lần 1</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-end font-bold">
                      <span className={`text-lg ${item.kpi >= 85 ? 'text-green-600 dark:text-green-400' : item.kpi >= 65 ? 'text-yellow-600 dark:text-yellow-500' : 'text-red-600 dark:text-red-500'}`}>
                        {item.kpi}
                      </span>
                      <span className="text-xs text-secondary ml-0.5">/100</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setFormData(item as any); setIsEditModalOpen(true); }} className="hover:text-primary text-secondary">
                      Chỉnh sửa
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 4. MODAL THÊM BẢN GHI */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Thêm bản ghi kỷ luật mới">
        <form onSubmit={handleCreateRecord} className="space-y-5 pt-2">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Chọn thành viên <span className="text-red-500">*</span></label>
            <Select required value={formData.memberId || ''} onChange={(e) => handleSelectMember(e.target.value)} className="w-full rounded-xl">
              <option value="" disabled>-- Chọn thành viên từ CLB --</option>
              {allMembers.map(m => (
                <option key={m.id} value={m.id}>{m.mssv} - {m.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">MSSV</label>
              <Input readOnly disabled value={formData.mssv} className="bg-muted/50 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Họ tên</label>
              <Input readOnly disabled value={formData.name} className="bg-muted/50 rounded-xl" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Ban/Bộ phận</label>
            <Input value={formData.committee} onChange={e => setFormData({ ...formData, committee: e.target.value })} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Số ngày vắng</label>
              <Input type="number" min="0" value={formData.absents} onChange={e => setFormData({ ...formData, absents: parseInt(e.target.value) || 0 })} className="rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Điểm KPI (Gốc: 100)</label>
              <Input type="number" min="0" max="150" value={formData.kpi} onChange={e => setFormData({ ...formData, kpi: parseFloat(e.target.value) || 0 })} className="rounded-xl" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Mức kỷ luật hiện tại</label>
            <Select value={formData.disciplineLevel} onChange={e => setFormData({ ...formData, disciplineLevel: e.target.value })} className="w-full rounded-xl">
              <option value="Không">Không</option>
              <option value="Nhắc nhở">Nhắc nhở</option>
              <option value="Cảnh cáo Lần 1">Cảnh cáo Lần 1</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl">
              {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <CheckCircle size={16} className="mr-2" />} Xác nhận lưu
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. MODAL CHỈNH SỬA BẢN GHI */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Chỉnh sửa bản ghi kỷ luật">
        <form onSubmit={handleUpdateRecord} className="space-y-5 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">MSSV</label>
              <Input readOnly disabled value={formData.mssv} className="bg-muted/50 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Họ tên</label>
              <Input readOnly disabled value={formData.name} className="bg-muted/50 rounded-xl" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Ban/Bộ phận</label>
            <Input value={formData.committee || ''} onChange={e => setFormData({ ...formData, committee: e.target.value })} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Số ngày vắng</label>
              <Input type="number" min="0" value={formData.absents} onChange={e => setFormData({ ...formData, absents: parseInt(e.target.value) || 0 })} className="rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Điểm KPI</label>
              <Input type="number" min="0" max="150" value={formData.kpi} onChange={e => setFormData({ ...formData, kpi: parseFloat(e.target.value) || 0 })} className="rounded-xl" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Mức kỷ luật hiện tại</label>
            <Select value={formData.disciplineLevel} onChange={e => setFormData({ ...formData, disciplineLevel: e.target.value })} className="w-full rounded-xl">
              <option value="Không">Không</option>
              <option value="Nhắc nhở">Nhắc nhở</option>
              <option value="Cảnh cáo Lần 1">Cảnh cáo Lần 1</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsEditModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl">
              {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <CheckCircle size={16} className="mr-2" />} Lưu thay đổi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
};

export default DisciplineRecordsTab;