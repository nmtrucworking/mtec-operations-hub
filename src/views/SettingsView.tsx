import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Key, Save, Shield, User, Users, Search, Filter, Pencil, RefreshCw, X, CheckCircle } from 'lucide-react';
import { mockAccounts as initialAccounts } from '../data/accounts';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Modal } from '../components/ui/modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import type { UserAccount, UserRole } from '../types/app';

interface SettingsViewProps {
  currentUser: UserAccount;
}

export const SettingsView = ({ currentUser }: SettingsViewProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'accounts'>('profile');
  
  // Generic states
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Profile states
  const [profileForm, setProfileForm] = useState({
    fullName: currentUser.fullName,
    email: 'admin@mtec.edu.vn',
    phone: '0123456789'
  });

  // Security states
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');

  // Notifications states
  const [notis, setNotis] = useState({
    'noti-1': true,
    'noti-2': true,
    'noti-3': false,
    'noti-4': true
  });

  // Accounts Admin states
  const [accountsList, setAccountsList] = useState<UserAccount[]>(initialAccounts);
  const [searchAccount, setSearchAccount] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | UserRole>('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Partial<UserAccount> | null>(null);

  const handleSaveProfile = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSuccessMsg(t('settings.saveSuccess', 'Đã lưu thông tin hồ sơ thành công!'));
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 800);
  };

  const handleUpdatePassword = () => {
    setPwdError('');
    if (!pwdForm.current || !pwdForm.new || !pwdForm.confirm) {
      setPwdError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (pwdForm.new !== pwdForm.confirm) {
      setPwdError('Mật khẩu mới không khớp.');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setPwdForm({ current: '', new: '', confirm: '' });
      setSuccessMsg(t('settings.pwdSuccess', 'Cập nhật mật khẩu thành công!'));
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 800);
  };

  const handleSaveAccount = () => {
    if (editingAcc?.id) {
      // Edit
      setAccountsList(prev => prev.map(a => a.id === editingAcc.id ? { ...a, ...editingAcc } as UserAccount : a));
    } else {
      // Add
      const newAcc: UserAccount = {
        id: `ACC-00${accountsList.length + 1}`,
        username: editingAcc?.username || '',
        fullName: editingAcc?.fullName || '',
        role: editingAcc?.role || 'member',
        avatarInitials: editingAcc?.fullName?.substring(0, 2).toUpperCase() || 'UN'
      };
      setAccountsList([...accountsList, newAcc]);
    }
    setIsModalOpen(false);
    setSuccessMsg('Đã cập nhật danh sách tài khoản!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('settings.title')}</h2>
          <p className="text-blue-300 mt-1">{t('settings.subtitle')}</p>
        </div>
        {successMsg && (
          <div className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg flex items-center animate-in slide-in-from-right-4">
            <CheckCircle size={18} className="mr-2" />
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Settings Navigation */}
        <div className="md:col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? `bg-[#1a3c6d] text-[#ffc20e] border border-[#2a4d85]`
                : 'text-blue-200 hover:bg-[#1a3c6d]/50 hover:text-white'
            }`}
          >
            <User size={18} className="mr-3" />
            {t('settings.tabProfile')}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'security'
                ? `bg-[#1a3c6d] text-[#ffc20e] border border-[#2a4d85]`
                : 'text-blue-200 hover:bg-[#1a3c6d]/50 hover:text-white'
            }`}
          >
            <Shield size={18} className="mr-3" />
            {t('settings.tabSecurity')}
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'notifications'
                ? `bg-[#1a3c6d] text-[#ffc20e] border border-[#2a4d85]`
                : 'text-blue-200 hover:bg-[#1a3c6d]/50 hover:text-white'
            }`}
          >
            <Bell size={18} className="mr-3" />
            {t('settings.tabNotifications')}
          </button>
          
          {currentUser.role === 'bcn' && (
            <button
              onClick={() => setActiveTab('accounts')}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'accounts'
                  ? `bg-[#1a3c6d] text-[#ffc20e] border border-[#2a4d85]`
                  : 'text-blue-200 hover:bg-[#1a3c6d]/50 hover:text-white'
              }`}
            >
              <Users size={18} className="mr-3" />
              {t('admin.tabAccounts')}
            </button>
          )}
        </div>

        {/* Settings Content */}
        <div className="md:col-span-3 bg-card rounded-xl border border-border overflow-hidden">
          {activeTab === 'profile' && (
            <div className="p-5 space-y-4 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold border-b border-border pb-4">{t('settings.profileTitle')}</h3>
              
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-brand-gold to-orange-400 flex items-center justify-center text-brand-blue font-bold text-3xl shadow-lg">
                  {currentUser.avatarInitials}
                </div>
                <div>
                  <Button variant="outline">{t('settings.changeAvatar')}</Button>
                  <p className="text-xs text-secondary mt-2">{t('settings.avatarHint')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">{t('settings.fullName')}</label>
                  <Input type="text" value={profileForm.fullName} onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">{t('settings.role')}</label>
                  <Input type="text" value={t(`roles.${currentUser.role}`)} disabled className="opacity-70 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">{t('settings.email')}</label>
                  <Input type="email" value={profileForm.email} onChange={(e) => setProfileForm({...profileForm, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">{t('settings.phone')}</label>
                  <Input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} />
                </div>
              </div>

              <div className="pt-6 border-t border-border flex justify-end">
                <Button 
                  onClick={handleSaveProfile}
                  isLoading={isSaving}
                >
                  {!isSaving && <Save size={16} className="mr-2" />}
                  {t('settings.saveChanges')}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-5 space-y-4 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold border-b border-border pb-4">{t('settings.securityTitle')}</h3>
              
              <div className="space-y-5 max-w-md">
                {pwdError && <p className="text-danger-text text-sm">{pwdError}</p>}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">{t('settings.currentPassword')}</label>
                  <Input type="password" value={pwdForm.current} onChange={(e) => setPwdForm({...pwdForm, current: e.target.value})} placeholder={t('settings.currentPasswordPlaceholder')} icon={<Key size={16} />} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">{t('settings.newPassword')}</label>
                  <Input type="password" value={pwdForm.new} onChange={(e) => setPwdForm({...pwdForm, new: e.target.value})} placeholder={t('settings.newPasswordPlaceholder')} icon={<Key size={16} />} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">{t('settings.confirmPassword')}</label>
                  <Input type="password" value={pwdForm.confirm} onChange={(e) => setPwdForm({...pwdForm, confirm: e.target.value})} placeholder={t('settings.confirmPasswordPlaceholder')} icon={<Key size={16} />} />
                </div>
                <Button 
                  onClick={handleUpdatePassword}
                  isLoading={isSaving}
                  className="w-full mt-4"
                >
                  {t('settings.updatePasswordBtn')}
                </Button>
              </div>

              <h3 className="text-lg font-bold border-b border-border pb-4 mt-8 pt-4">{t('settings.rolesTitle')}</h3>
              <div className="p-4 bg-background border border-border rounded-lg">
                <p className="text-sm text-secondary mb-2">{t('settings.rolesDesc1')} <strong className="text-gold">Super Admin</strong></p>
                <p className="text-xs text-secondary/70">{t('settings.rolesDesc2')}</p>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="p-5 space-y-4 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold border-b border-[#2a4d85] pb-4">{t('settings.notiTitle')}</h3>
              
              <div className="space-y-4">
                {[
                  { id: 'noti-1', labelKey: 'settings.noti1Label', descKey: 'settings.noti1Desc' },
                  { id: 'noti-2', labelKey: 'settings.noti2Label', descKey: 'settings.noti2Desc' },
                  { id: 'noti-3', labelKey: 'settings.noti3Label', descKey: 'settings.noti3Desc' },
                  { id: 'noti-4', labelKey: 'settings.noti4Label', descKey: 'settings.noti4Desc' }
                ].map((item) => (
                  <div key={item.id} className="flex items-start justify-between p-4 bg-[#0a1f3f] border border-[#2a4d85] rounded-lg">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{t(item.labelKey)}</h4>
                      <p className="text-xs text-blue-300 mt-1">{t(item.descKey)}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer mt-1">
                      <input 
                        type="checkbox" 
                        checked={notis[item.id as keyof typeof notis]} 
                        onChange={(e) => setNotis({...notis, [item.id]: e.target.checked})}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'accounts' && currentUser.role === 'bcn' && (
            <div className="p-5 space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center border-b border-border pb-4">
                <h3 className="text-lg font-bold">{t('admin.accountsTitle')}</h3>
                <Button onClick={() => { setEditingAcc({ role: 'member' }); setIsModalOpen(true); }}>
                  + {t('admin.addAccountBtn')}
                </Button>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <Input
                  type="text"
                  value={searchAccount}
                  onChange={(e) => setSearchAccount(e.target.value)}
                  placeholder={t('admin.searchPlaceholder')}
                  icon={<Search size={18} />}
                  className="w-full md:w-64"
                />
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as 'All' | UserRole)}
                  icon={<Filter size={18} />}
                >
                  <option value="All">{t('admin.filterRoleAll')}</option>
                  <option value="bcn">{t('roles.bcn')}</option>
                  <option value="bvh_hr">{t('roles.bvh_hr')}</option>
                  <option value="bvh_finance">{t('roles.bvh_finance')}</option>
                  <option value="bvh_discipline">{t('roles.bvh_discipline')}</option>
                  <option value="bvh_logistics">{t('roles.bvh_logistics')}</option>
                  <option value="bcm">{t('roles.bcm')}</option>
                  <option value="member">{t('roles.member')}</option>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.thUsername')}</TableHead>
                    <TableHead>{t('admin.thFullName')}</TableHead>
                    <TableHead>{t('admin.thRole')}</TableHead>
                    <TableHead>{t('admin.thAction')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountsList
                    .filter(acc => roleFilter === 'All' || acc.role === roleFilter)
                    .filter(acc => 
                      acc.username.toLowerCase().includes(searchAccount.toLowerCase()) || 
                      acc.fullName.toLowerCase().includes(searchAccount.toLowerCase())
                    )
                    .map((acc) => (
                    <TableRow key={acc.id}>
                      <TableCell className="font-medium">{acc.username}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                            {acc.avatarInitials}
                          </div>
                          {acc.fullName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {t(`roles.${acc.role}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8 text-blue-500" onClick={() => { setEditingAcc(acc); setIsModalOpen(true); }} title={t('admin.editBtn')}>
                            <Pencil size={14} />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-orange-500" title={t('admin.resetPwdBtn')}>
                            <RefreshCw size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Account Modal overlay */}
      {editingAcc && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={editingAcc.id ? 'Sửa thông tin tài khoản' : 'Thêm tài khoản mới'}
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Hủy bỏ</Button>
              <Button onClick={handleSaveAccount}>Lưu thông tin</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Tên đăng nhập</label>
              <Input 
                type="text" 
                value={editingAcc.username || ''}
                onChange={e => setEditingAcc({...editingAcc, username: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Họ và tên</label>
              <Input 
                type="text" 
                value={editingAcc.fullName || ''}
                onChange={e => setEditingAcc({...editingAcc, fullName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Quyền truy cập</label>
              <Select 
                value={editingAcc.role || 'member'}
                onChange={e => setEditingAcc({...editingAcc, role: e.target.value as UserRole})}
              >
                <option value="bcn">{t('roles.bcn')}</option>
                <option value="bvh_hr">{t('roles.bvh_hr')}</option>
                <option value="bvh_finance">{t('roles.bvh_finance')}</option>
                <option value="bvh_discipline">{t('roles.bvh_discipline')}</option>
                <option value="bvh_logistics">{t('roles.bvh_logistics')}</option>
                <option value="bcm">{t('roles.bcm')}</option>
                <option value="member">{t('roles.member')}</option>
              </Select>
            </div>
            {!editingAcc.id && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Mật khẩu khởi tạo</label>
                <Input 
                  type="text" 
                  defaultValue="123456"
                  disabled
                />
                <p className="text-xs text-secondary/70">Mật khẩu mặc định là 123456.</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
