import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Key, Save, Shield, User, Users, Search, Filter, Pencil, RefreshCw, X, CheckCircle, Trash2, Plus, Clock } from 'lucide-react';
import {
  changePassword,
  getProfile,
  updateProfile,
  getNotificationSettings,
  updateNotificationSettings
} from '../services/auth';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser
} from '../services/users';
import { VERSION_HISTORY } from '../config/versionHistory';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Modal } from '../components/ui/modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import type { UserAccount, UserRole } from '../types/app';
import { getPrimaryRole, hasAnyRole, normalizeRoles } from '../lib/permissions';

interface SettingsViewProps {
  currentUser: UserAccount;
  authToken?: string;
}

type NotificationSettings = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
};

export const SettingsView = ({ currentUser, authToken }: SettingsViewProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'accounts' | 'version'>('profile');

  // Generic states
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Profile states
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phone: ''
  });

  // 2. Security states
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');

  // 3. Notifications states
  const [notis, setNotis] = useState<NotificationSettings>({
    emailNotifications: false,
    pushNotifications: false,
    smsNotifications: false
  });
  const [notiError, setNotiError] = useState('');

  // 4. Accounts Admin states
  const [accountsList, setAccountsList] = useState<UserAccount[]>([]);
  const [searchAccount, setSearchAccount] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | UserRole>('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Partial<UserAccount> | null>(null);
  const userRoles = currentUser.roles ?? [currentUser.role];
  const availableRoles: UserRole[] = ['bcn', 'bvh_hr', 'bvh_finance', 'bvh_discipline', 'bvh_logistics', 'bcm', 'member'];

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      if (!authToken) return;
      setIsLoading(true);
      try {
        // 1. Fetch profile
        const profileRes = await getProfile(authToken);
        if (profileRes.status === 200 && profileRes.data) {
          const data = profileRes.data;
          setProfileForm({
            fullName: data.fullName || '',
            email: data.email || '',
            phone: data.phone || ''
          });
        }

        // 2. Fetch notifications
        const notiRes = await getNotificationSettings(authToken);
        if (notiRes.status === 200 && notiRes.data) {
          const data = (notiRes.data as any).data || notiRes.data;
          setNotis({
            emailNotifications: Boolean(data?.emailNotifications),
            pushNotifications: Boolean(data?.pushNotifications),
            smsNotifications: Boolean(data?.smsNotifications)
          });
        }

        // 3. Fetch Accounts if Admin
        if (hasAnyRole(userRoles, ['bcn'])) {
          const accRes = await getUsers({}, authToken);
          if (accRes.status === 200 && accRes.data) {
            setAccountsList(accRes.data.users);
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        setErrorMsg("Không thể tải cài đặt");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [authToken, userRoles]);

  const handleToggleEditingRole = (role: UserRole) => {
    setEditingAcc((prev) => {
      if (!prev) return prev;
      const currentRoles = normalizeRoles(prev.roles, prev.role);
      const nextRoles = currentRoles.includes(role)
        ? currentRoles.filter((item) => item !== role)
        : [...currentRoles, role];
      const resolvedRoles = (nextRoles.length > 0 ? nextRoles : ['member']) as UserRole[];
      return {
        ...prev,
        roles: resolvedRoles,
        role: getPrimaryRole(resolvedRoles, (prev.role || 'member') as UserRole)
      };
    });
  };

  const handleSaveProfile = async () => {
    if (!authToken) return;
    setIsSaving(true);
    setErrorMsg('');
    try {
      const response = await updateProfile(profileForm, authToken);
      if (response.status === 200 && response.data) {
        setSuccessMsg(t('common.success'));
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(response.error || "Không thể cập nhật hồ sơ");
      }
    } catch (error) {
      setErrorMsg("Lỗi kết nối");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!authToken) return;
    setPwdError('');
    if (!pwdForm.current || !pwdForm.new || !pwdForm.confirm) {
      setPwdError(t('login.errorEmpty'));
      return;
    }
    if (pwdForm.new !== pwdForm.confirm) {
      setPwdError(t('auth.passwordMismatch'));
      return;
    }
    if (pwdForm.new.length < 8) {
      setPwdError(t('auth.passwordWeak'));
      return;
    }

    setIsSaving(true);
    try {
      const response = await changePassword(pwdForm.current, pwdForm.new, authToken);
      if (response.status === 200) {
        setPwdForm({ current: '', new: '', confirm: '' });
        setSuccessMsg(t('common.success'));
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setPwdError(t('auth.passwordChangeFailed'));
      }
    } catch (error) {
      setPwdError("Lỗi kết nối");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotiChange = async (id: keyof NotificationSettings, checked: boolean) => {
    if (!authToken) return;
    setNotiError('');
    const previous = notis;
    const updatedNotis = { ...notis, [id]: checked } as NotificationSettings;
    setNotis(updatedNotis);
    try {
      const res = await updateNotificationSettings({ [id]: checked }, authToken);
      if (res.status < 200 || res.status >= 300) {
        setNotis(previous);
        setNotiError(res.error || t('common.error'));
      }
    } catch (error) {
      console.error("Error updating notifications:", error);
      setNotis(previous);
      setNotiError(t('common.error'));
    }
  };

  const handleSaveAccount = async () => {
    if (!authToken || !editingAcc) return;
    setIsSaving(true);
    try {
      const normalizedRoles = normalizeRoles(editingAcc.roles, editingAcc.role) as UserRole[];
      const payload: Partial<UserAccount> = {
        ...editingAcc,
        roles: normalizedRoles,
        role: getPrimaryRole(normalizedRoles, (editingAcc.role || 'member') as UserRole)
      };
      let response;
      if (editingAcc.id) {
        // Update
        response = await updateUser(editingAcc.id, payload, authToken);
      } else {
        // Create
        response = await createUser(payload, authToken);
      }

      // Show Error toast with response.status is 400
      if (response.status === 400 && response.data) {
        setErrorMsg(String(response.data));
        setTimeout(() => setErrorMsg(''), 3000);
        return;
      }

      if (response.status === 200 && response.data) {
        // Refresh list
        const accRes = await getUsers({}, authToken);
        if (accRes.status === 200 && accRes.data) {
          setAccountsList(accRes.data.users);
        }
        setIsModalOpen(false);
        setSuccessMsg(t('common.success'));
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(response.error || "Thao tác thất bại");
      }
    } catch (error) {
      setErrorMsg("Lỗi kết nối");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!authToken || !window.confirm(t('admin.deleteAccountConfirm'))) return;
    try {
      const response = await deleteUser(id, authToken);
      if (response.status >= 200 && response.status < 300) {
        setAccountsList(prev => prev.filter(a => a.id !== id));
        setSuccessMsg(t('common.success'));
        setTimeout(() => setSuccessMsg(''), 3000);
        setErrorMsg('');
      } else {
        setErrorMsg(response.error || t('common.error'));
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      setErrorMsg("Lỗi kết nối");
    }
  };

  // Filter accounts
  const filteredAccounts = accountsList.filter(acc => {
    const matchSearch = acc.fullName.toLowerCase().includes(searchAccount.toLowerCase()) ||
      acc.username.toLowerCase().includes(searchAccount.toLowerCase());
    const matchRole = roleFilter === 'All' || hasAnyRole(acc.roles ?? [acc.role], [roleFilter]);
    return matchSearch && matchRole;
  });

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
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile'
              ? `bg-[#1a3c6d] text-[#ffc20e] border border-[#2a4d85]`
              : 'text-blue-200 hover:bg-[#1a3c6d]/50 hover:text-white'
              }`}
          >
            <User size={18} className="mr-3" />
            {t('settings.tabProfile')}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security'
              ? `bg-[#1a3c6d] text-[#ffc20e] border border-[#2a4d85]`
              : 'text-blue-200 hover:bg-[#1a3c6d]/50 hover:text-white'
              }`}
          >
            <Shield size={18} className="mr-3" />
            {t('settings.tabSecurity')}
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifications'
              ? `bg-[#1a3c6d] text-[#ffc20e] border border-[#2a4d85]`
              : 'text-blue-200 hover:bg-[#1a3c6d]/50 hover:text-white'
              }`}
          >
            <Bell size={18} className="mr-3" />
            {t('settings.tabNotifications')}
          </button>

          {hasAnyRole(userRoles, ['bcn']) && (
            <button
              onClick={() => setActiveTab('accounts')}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'accounts'
                ? `bg-[#1a3c6d] text-[#ffc20e] border border-[#2a4d85]`
                : 'text-blue-200 hover:bg-[#1a3c6d]/50 hover:text-white'
                }`}
            >
              <Users size={18} className="mr-3" />
              {t('admin.tabAccounts')}
            </button>
          )}

          <button
            onClick={() => setActiveTab('version')}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'version'
              ? `bg-[#1a3c6d] text-[#ffc20e] border border-[#2a4d85]`
              : 'text-blue-200 hover:bg-[#1a3c6d]/50 hover:text-white'
              }`}
          >
            <Clock size={18} className="mr-3" />
            Lịch sử cập nhật
          </button>
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
                  <Input type="text" value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">{t('settings.role')}</label>
                  <Input type="text" value={t(`roles.${currentUser.role}`)} disabled className="opacity-70 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">{t('settings.email')}</label>
                  <Input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">{t('settings.phone')}</label>
                  <Input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
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
                  <Input type="password" value={pwdForm.current} onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })} placeholder={t('settings.currentPasswordPlaceholder')} icon={<Key size={16} />} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">{t('settings.newPassword')}</label>
                  <Input type="password" value={pwdForm.new} onChange={(e) => setPwdForm({ ...pwdForm, new: e.target.value })} placeholder={t('settings.newPasswordPlaceholder')} icon={<Key size={16} />} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">{t('settings.confirmPassword')}</label>
                  <Input type="password" value={pwdForm.confirm} onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })} placeholder={t('settings.confirmPasswordPlaceholder')} icon={<Key size={16} />} />
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
              <h3 className="text-lg font-bold border-b border-border pb-4">{t('settings.notiTitle')}</h3>

              <div className="space-y-4">
                {[
                  { id: 'emailNotifications', labelKey: 'settings.noti1Label', descKey: 'settings.noti1Desc' },
                  { id: 'pushNotifications', labelKey: 'settings.noti2Label', descKey: 'settings.noti2Desc' },
                  { id: 'smsNotifications', labelKey: 'settings.noti3Label', descKey: 'settings.noti3Desc' }
                ].map((item) => (
                  <div key={item.id} className="flex items-start justify-between p-4 bg-background border border-border rounded-lg">
                    <div>
                      <h4 className="text-sm font-semibold text-primary">{t(item.labelKey)}</h4>
                      <p className="text-xs text-secondary mt-1">{t(item.descKey)}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={notis[item.id as keyof NotificationSettings] || false}
                        onChange={(e) => handleNotiChange(item.id as keyof NotificationSettings, e.target.checked)}
                        disabled={isLoading}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
                    </label>
                  </div>
                ))}
                {notiError && <p className="text-danger-text text-sm">{notiError}</p>}
                {isLoading && <p className="text-secondary text-sm">{t('common.loading')}</p>}
              </div>
            </div>
          )}

          {activeTab === 'accounts' && hasAnyRole(userRoles, ['bcn']) && (
            <div className="p-5 space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center border-b border-border pb-4">
                <h3 className="text-lg font-bold">{t('admin.accountsTitle')}</h3>
                <Button onClick={() => { setEditingAcc({ role: 'member', roles: ['member'] }); setIsModalOpen(true); }}>
                  <Plus size={16} className="mr-2" />
                  {t('admin.addAccountBtn')}
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
                    <TableHead className="text-right">{t('admin.thAction')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((acc) => (
                    <TableRow key={acc.id}>
                      <TableCell className="font-medium">{acc.username}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                            {acc.avatarInitials}
                          </div>
                          {acc.fullName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(acc.roles?.length ? acc.roles : [acc.role]).map((role) => (
                            <Badge key={role} variant="secondary">
                              {t(`roles.${role}`)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-secondary hover:text-gold"
                            onClick={() => { setEditingAcc(acc); setIsModalOpen(true); }}
                            title={t('admin.editBtn')}>
                            <Pencil size={14} />
                          </Button>
                          <Button variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-secondary hover:text-danger-text"
                            onClick={() => handleDeleteAccount(acc.id)}
                            title={t('admin.deleteBtn')}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {activeTab === 'version' && (
            <div className="p-6 space-y-6 animate-in fade-in duration-300 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-lg font-bold">Lịch sử cập nhật hệ thống</h3>
                <Badge variant="outline" className="border-gold text-gold">v{VERSION_HISTORY[0].version}</Badge>
              </div>

              <div className="space-y-8">
                {VERSION_HISTORY.map((entry, idx) => (
                  <div key={entry.version} className="relative pl-6 border-l-2 border-border pb-2">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gold border-4 border-card" />
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-primary">Phiên bản {entry.version}</h4>
                      <span className="text-xs text-secondary">{entry.date}</span>
                    </div>
                    <ul className="space-y-2">
                      {entry.changes.map((change, cIdx) => (
                        <li key={cIdx} className="flex items-start text-sm">
                          <span className={cn(
                            "mt-1 mr-2 w-1.5 h-1.5 rounded-full shrink-0",
                            change.type === 'feature' ? "bg-success-text" :
                              change.type === 'fix' ? "bg-danger-text" :
                                change.type === 'security' ? "bg-warning-text" : "bg-blue-400"
                          )} />
                          <span className="text-secondary leading-relaxed">
                            <strong className="text-primary mr-1 capitalize">{change.type}:</strong>
                            {change.description}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
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
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Hủy bỏ</Button>
              <Button onClick={handleSaveAccount} isLoading={isSaving}>Lưu thông tin</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Tên đăng nhập</label>
              <Input
                type="text"
                value={editingAcc.username || ''}
                onChange={e => setEditingAcc({ ...editingAcc, username: e.target.value })}
                disabled={!!editingAcc.id}
              />
            </div>
            {!editingAcc.id && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Mật khẩu</label>
                <Input
                  type="password"
                  placeholder="Nhập mật khẩu cho tài khoản mới"
                  onChange={e => setEditingAcc({ ...editingAcc, password: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Họ và tên</label>
              <Input
                type="text"
                value={editingAcc.fullName || ''}
                onChange={e => setEditingAcc({ ...editingAcc, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Chức vụ (Phân quyền)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border border-border bg-background p-3">
                {availableRoles.map((role) => {
                  const selectedRoles = normalizeRoles(editingAcc.roles, editingAcc.role);
                  const checked = selectedRoles.includes(role);
                  return (
                    <label key={role} className="flex items-center gap-2 text-sm text-primary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleEditingRole(role)}
                        className="h-4 w-4 rounded border-border text-gold focus:ring-gold"
                      />
                      <span>{t(`roles.${role}`)}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-secondary">Role chính sẽ được tự động chọn theo mức ưu tiên khi lưu.</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
