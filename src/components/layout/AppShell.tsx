import logoSvg from '../../assets/mtec_logo.svg';
import React, { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, LogOut, Search, Globe } from 'lucide-react';
import { NavItem } from '../shared/Widgets';
import { useTheme } from '../theme-provider';
import type { AppTab, UserAccount, UserRole } from '../../types/app';
import { APP_VERSION, getVisibleTabDefinitions } from '../../config/appRegistry';

interface AppShellProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onLogout: () => void;
  currentUser: UserAccount;
  children: ReactNode;
}

const checkTabAccess = (tab: AppTab, role: UserRole): boolean => {
  const definition = getVisibleTabDefinitions().find((item) => item.tab === tab);
  if (!definition) {
    return false;
  }

  return definition.allowedRoles === 'all' || definition.allowedRoles.includes(role);
};

export const AppShell = ({ activeTab, onTabChange, onLogout, currentUser, children }: AppShellProps) => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex h-screen w-full bg-background text-primary font-sans overflow-hidden">
      <aside className="w-64 bg-card flex flex-col shadow-2xl border-r border-border">
        <div className="p-6 flex items-center justify-center border-b border-border">
          <div className="text-center flex flex-col items-center">
            <img src={logoSvg} alt="MTEC Logo" className="w-16 h-16 mb-3 object-contain" />
            <h1 className="text-2xl font-bold text-gold tracking-wider">{t('appShell.title')}</h1>
            <p className="text-xs text-secondary mt-1">{t('appShell.subtitle')}</p>
            <p className="text-[11px] uppercase tracking-[0.25em] text-secondary mt-2">v{APP_VERSION}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {getVisibleTabDefinitions()
            .filter((item) => checkTabAccess(item.tab, currentUser.role))
            .map((item) => (
              <NavItem
                key={item.tab}
                icon={item.icon}
                label={t(item.labelKey)}
                isActive={activeTab === item.tab}
                onClick={() => onTabChange(item.tab)}
              />
            ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button onClick={onLogout} className="flex items-center w-full px-4 py-2 text-sm text-danger-text hover:bg-danger-bg rounded-lg transition-colors">
            <LogOut size={20} className="mr-3" />
            {t('appShell.logout')}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 border-b border-border bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center bg-card rounded-lg px-3 py-1.5 w-96 border border-border">
            <Search size={18} className="text-secondary" />
            <input
              type="text"
              placeholder={t('appShell.searchPlaceholder')}
              className="bg-transparent border-none outline-none text-sm text-primary ml-2 w-full placeholder:text-secondary"
            />
          </div>

          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="flex items-center p-2 text-secondary hover:text-primary transition-colors bg-card rounded-lg border border-border">
              {theme === 'dark' ? <span className="text-sm font-medium">Light</span> : <span className="text-sm font-medium">Dark</span>}
            </button>
            <button onClick={toggleLanguage} className="flex items-center p-2 text-secondary hover:text-primary transition-colors bg-card rounded-lg border border-border">
              <Globe size={18} className="mr-2" />
              <span className="text-sm font-medium uppercase">{i18n.language || 'vi'}</span>
            </button>
            <button className="relative p-2 text-secondary hover:text-primary transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger-text rounded-full border-2 border-background" />
            </button>
            <div className="flex items-center pl-4 border-l border-border cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onTabChange('settings')}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-brand-gold to-orange-400 flex items-center justify-center text-brand-blue font-bold text-sm">
                {currentUser.avatarInitials}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{currentUser.fullName}</p>
                <p className="text-xs text-secondary capitalize">{t(`roles.${currentUser.role}`)}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
};
