import logoSvg from '../../assets/mtec_logo.svg';
import React, { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, LogOut, Search, Globe, Menu, X } from 'lucide-react';
import { NavItem } from '../shared/Widgets';
import { useTheme } from '../theme-provider';
import { useMediaQuery } from '../../hooks/useMediaQuery';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  React.useEffect(() => {
    if (isDesktop && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isDesktop, isMobileMenuOpen]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleTabChange = (tab: AppTab) => {
    onTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen w-full bg-background text-primary font-sans overflow-hidden relative">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 bg-card flex-col shadow-2xl border-r border-border">
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
                onClick={() => handleTabChange(item.tab)}
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

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-card flex flex-col z-50 transition-transform duration-300 lg:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-border">
          <div className="flex items-center">
            <img src={logoSvg} alt="MTEC Logo" className="w-8 h-8 mr-3 object-contain" />
            <h1 className="text-lg font-bold text-gold tracking-wider">{t('appShell.title')}</h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 hover:bg-border rounded-full transition-colors">
            <X size={20} />
          </button>
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
                onClick={() => handleTabChange(item.tab)}
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
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-border bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 mr-2 text-secondary hover:text-primary transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center bg-card rounded-lg px-3 py-1.5 w-64 lg:w-96 border border-border">
              <Search size={18} className="text-secondary" />
              <input
                type="text"
                placeholder={t('appShell.searchPlaceholder')}
                className="bg-transparent border-none outline-none text-sm text-primary ml-2 w-full placeholder:text-secondary"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-4">
            <button onClick={toggleTheme} className="flex items-center p-2 text-secondary hover:text-primary transition-colors bg-card rounded-lg border border-border">
              {theme === 'dark' ? <span className="text-xs lg:text-sm font-medium">Light</span> : <span className="text-xs lg:text-sm font-medium">Dark</span>}
            </button>
            <button onClick={toggleLanguage} className="flex items-center p-2 text-secondary hover:text-primary transition-colors bg-card rounded-lg border border-border">
              <Globe size={18} className="lg:mr-2" />
              <span className="text-xs lg:text-sm font-medium uppercase">{i18n.language || 'vi'}</span>
            </button>
            <button className="relative p-2 text-secondary hover:text-primary transition-colors hidden sm:block">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger-text rounded-full border-2 border-background" />
            </button>
            <div className="flex items-center pl-2 lg:pl-4 border-l border-border cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleTabChange('settings')}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-brand-gold to-orange-400 flex items-center justify-center text-brand-blue font-bold text-sm">
                {currentUser.avatarInitials}
              </div>
              <div className="ml-3 hidden sm:block text-left">
                <p className="text-sm font-medium leading-none">{currentUser.fullName}</p>
                <p className="text-[10px] text-secondary capitalize mt-1">{t(`roles.${currentUser.role}`)}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
};
