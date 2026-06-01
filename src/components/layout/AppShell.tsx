import logoSvg from '../../assets/mtec_logo.svg';
import React, { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, LogOut, Search, Globe, Menu, X, Sun, Moon } from 'lucide-react';
import { NavItem } from '../shared/Widgets';
import { useTheme } from '../theme-provider';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import type { AppTab, UserAccount, UserRole } from '../../types/app';
import { APP_VERSION, getVisibleTabDefinitions } from '../../config/appRegistry';
import { hasAnyRole } from '../../lib/permissions';
import { NotificationBell } from './NotificationBell';

interface AppShellProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onLogout: () => void;
  onGlobalSearch: (query: string) => void;
  currentUser: UserAccount;
  authToken?: string;
  children: ReactNode;
}

const checkTabAccess = (tab: AppTab, roles: readonly UserRole[] | undefined, fallbackRole?: UserRole): boolean => {
  const definition = getVisibleTabDefinitions().find((item) => item.tab === tab);
  if (!definition) {
    return false;
  }

  if (definition.allowedRoles === 'all') return true;
  const resolvedRoles = roles && roles.length > 0 ? roles : fallbackRole ? [fallbackRole] : [];
  return hasAnyRole(resolvedRoles, definition.allowedRoles);
};

export const AppShell = ({ activeTab, onTabChange, onLogout, onGlobalSearch, currentUser, authToken, children }: AppShellProps) => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const currentLang = (i18n.resolvedLanguage || i18n.language || 'vi').split('-')[0];
  const canReadActivityNotifications = hasAnyRole(currentUser.roles ?? [currentUser.role], ['bcn', 'bcm']);
  const canOpenLogsTab = checkTabAccess('logs', currentUser.roles, currentUser.role);

  React.useEffect(() => {
    if (isDesktop && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isDesktop, isMobileMenuOpen]);

  const toggleLanguage = () => {
    i18n.changeLanguage(currentLang === 'vi' ? 'en' : 'vi');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleTabChange = (tab: AppTab) => {
    onTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  const handleGlobalSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = globalSearch.trim();
    if (!query) return;
    onGlobalSearch(query);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground font-sans overflow-hidden relative">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 bg-card flex-col border-r border-border">
        <div className="p-5 flex items-center justify-center border-b border-border">
          <div className="text-center flex flex-col items-center">
            <img src={logoSvg} alt="MTEC Logo" className="w-12 h-12 mb-3 object-contain" />
            <h1 className="text-xl font-semibold text-foreground">{t('appShell.title')}</h1>
            <p className="text-xs text-secondary mt-1">{t('appShell.subtitle')}</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-secondary mt-2">v{APP_VERSION}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {getVisibleTabDefinitions()
            .filter((item) => checkTabAccess(item.tab, currentUser.roles, currentUser.role))
            .map((item) => (
              <NavItem
                key={item.tab}
                icon={item.icon}
                label={t(item.labelKey)}
                isActive={activeTab === item.tab}
                onClick={() => handleTabChange(item.tab)}
              />
            ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button onClick={onLogout} className="flex items-center w-full px-4 py-2 text-sm text-danger-text hover:bg-danger-bg rounded-md transition-colors">
            <LogOut size={20} className="mr-3" />
            {t('appShell.logout')}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-card flex flex-col z-50 border-r border-border transition-transform duration-300 lg:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 flex items-center justify-between border-b border-border">
          <div className="flex items-center">
            <img src={logoSvg} alt="MTEC Logo" className="w-8 h-8 mr-3 object-contain" />
            <h1 className="text-lg font-semibold text-foreground">{t('appShell.title')}</h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 hover:bg-brand-light rounded-md transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {getVisibleTabDefinitions()
            .filter((item) => checkTabAccess(item.tab, currentUser.roles, currentUser.role))
            .map((item) => (
              <NavItem
                key={item.tab}
                icon={item.icon}
                label={t(item.labelKey)}
                isActive={activeTab === item.tab}
                onClick={() => handleTabChange(item.tab)}
              />
            ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button onClick={onLogout} className="flex items-center w-full px-4 py-2 text-sm text-danger-text hover:bg-danger-bg rounded-md transition-colors">
            <LogOut size={20} className="mr-3" />
            {t('appShell.logout')}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-border bg-card z-10">
          <div className="flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 mr-2 text-secondary hover:text-primary transition-colors"
            >
              <Menu size={24} />
            </button>
            <form
              onSubmit={handleGlobalSearchSubmit}
              className="hidden md:flex items-center bg-background rounded-md px-3 py-1.5 w-64 lg:w-96 border border-border focus-within:border-border-highlight focus-within:ring-2 focus-within:ring-border-highlight/20 transition-colors"
              role="search"
            >
              <Search size={18} className="text-secondary" />
              <input
                type="text"
                placeholder={t('appShell.searchPlaceholder')}
                value={globalSearch}
                onChange={(event) => setGlobalSearch(event.target.value)}
                className="bg-transparent border-none outline-none text-sm text-foreground ml-2 w-full placeholder:text-secondary"
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => setGlobalSearch('')}
                  className="rounded-md p-1 text-secondary transition-colors hover:bg-brand-light hover:text-foreground"
                  aria-label={t('common.clear', 'Xóa')}
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="submit"
                className="ml-1 rounded-md p-1 text-secondary transition-colors hover:bg-brand-light hover:text-foreground"
                aria-label={t('common.search', 'Tìm kiếm')}
                title={t('common.search', 'Tìm kiếm')}
              >
                <ArrowRight size={15} />
              </button>
            </form>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-3">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 p-2 text-secondary hover:text-foreground transition-colors bg-card rounded-md border border-border"
              title={theme === 'dark' ? t('common.switchToLight') : t('common.switchToDark')}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span className="text-xs lg:text-sm font-medium">
                {theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
              </span>
            </button>
            <button
              onClick={toggleLanguage}
              className="flex items-center p-2 text-secondary hover:text-foreground transition-colors bg-card rounded-md border border-border"
              title={t('common.changeLanguage')}
            >
              <Globe size={18} className="lg:mr-2" />
              <span className="text-xs lg:text-sm font-medium uppercase">{currentLang}</span>
            </button>
            <NotificationBell
              authToken={authToken ?? ''}
              userId={currentUser.id}
              canReadActivity={canReadActivityNotifications}
              onOpenLogs={canOpenLogsTab ? () => handleTabChange('logs') : undefined}
            />
            <div className="flex items-center pl-2 lg:pl-4 border-l border-border cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleTabChange('settings')}>
              <div className="w-8 h-8 rounded-md bg-brand-light border border-border flex items-center justify-center text-foreground font-semibold text-sm">
                {currentUser.avatarInitials}
              </div>
              <div className="ml-3 hidden sm:block text-left">
                <p className="text-sm font-medium leading-none">{currentUser.fullName}</p>
                <p className="text-[10px] text-secondary capitalize mt-1">{t(`roles.${currentUser.role}`)}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
};
