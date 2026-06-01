import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { HelperCenterView } from './views/HelperCenterView';
import { LoginView } from './views/LoginView';
import { ToastProvider } from './components/ui/toast';
import { Button } from './components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { getCurrentUser, normalizeUser } from './services/auth';
import { getTabFromPath, getTabPath, getVisibleTabDefinitions } from './config/appRegistry';
import type { AppTab, UserAccount } from './types/app';
import { hasAnyRole } from './lib/permissions';

import { useTranslation } from 'react-i18next';

const SESSION_STORAGE_KEY = 'mtec-operations-hub.session';
const PUBLIC_HELPER_CENTER_PATH = '/helper-center';

interface StoredSession {
  token: string;
  user: UserAccount;
}

const App = () => {
  const { t } = useTranslation(); // Khởi tạo hook Translation
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [authToken, setAuthToken] = useState('');
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!rawSession) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const storedSession = JSON.parse(rawSession) as Partial<StoredSession>;
        if (!storedSession.token || !storedSession.user) {
          localStorage.removeItem(SESSION_STORAGE_KEY);
          setIsBootstrapping(false);
          return;
        }

        setAuthToken(storedSession.token);
        localStorage.setItem('authToken', storedSession.token);
        const currentUserResponse = await getCurrentUser(storedSession.token);
        
        if (currentUserResponse.status === 401 || currentUserResponse.status === 403) {
          throw new Error('Token expired or invalid'); 
        }
        
        const responseBody = currentUserResponse.data as any;
        const actualUserData = responseBody?.success && responseBody?.data ? responseBody.data : responseBody;

        const remoteUser = actualUserData
          ? normalizeUser(actualUserData, storedSession.user)
          : storedSession.user as UserAccount;

        setCurrentUser(remoteUser);
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: storedSession.token, user: remoteUser }));
      } catch {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem('authToken');
      } finally {
        setIsBootstrapping(false);
      }
    };

    void restoreSession();
  }, []);

  const pathActiveTab = getTabFromPath(location.pathname);

  const canAccessTab = (tab: AppTab, user: UserAccount) => {
    const definition = getVisibleTabDefinitions().find((item) => item.tab === tab);
    if (!definition) return false;
    if (definition.allowedRoles === 'all') return true;
    return hasAnyRole(user.roles ?? [user.role], definition.allowedRoles);
  };

  const getFallbackTab = (user: UserAccount): AppTab => {
    return getVisibleTabDefinitions().find((item) => canAccessTab(item.tab, user))?.tab ?? 'dashboard';
  };

  const normalizedActiveTab: AppTab = currentUser && pathActiveTab && canAccessTab(pathActiveTab, currentUser)
    ? pathActiveTab
    : currentUser
      ? getFallbackTab(currentUser)
      : 'dashboard';

  useEffect(() => {
    if (isBootstrapping || !currentUser) return;
    if (location.pathname === '/' || location.pathname === PUBLIC_HELPER_CENTER_PATH) {
      navigate(getTabPath(getFallbackTab(currentUser)), { replace: true });
      return;
    }

    if (!pathActiveTab || !canAccessTab(pathActiveTab, currentUser)) {
      navigate(getTabPath(getFallbackTab(currentUser)), { replace: true });
    }
  }, [currentUser, isBootstrapping, location.pathname, navigate, pathActiveTab]);

  useEffect(() => {
    const handleAuthExpired = () => {
      // Chỉ logout nếu thực sự đang có user (tránh logout lặp lại khi bootstrap)
      if (currentUser) {
        console.warn('Auth token expired. Logging out...');
        handleLogout();
      }
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [currentUser]);

  const handleLogin = (user: UserAccount, token?: string) => {
    const nextUser = normalizeUser(user);
    setCurrentUser(nextUser);
    if (location.pathname === '/' || location.pathname === PUBLIC_HELPER_CENTER_PATH || !getTabFromPath(location.pathname)) {
      navigate(getTabPath(getFallbackTab(nextUser)), { replace: true });
    }
    if (token) {
      setAuthToken(token);
      localStorage.setItem('authToken', token);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token, user: nextUser }));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken('');
    setIsBootstrapping(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem(SESSION_STORAGE_KEY);
    navigate('/', { replace: true });
  };

  const handleGlobalSearch = (query: string) => {
    navigate(`${getTabPath('members')}?search=${encodeURIComponent(query)}`);
  };

  const openHelperCenter = () => {
    navigate(PUBLIC_HELPER_CENTER_PATH);
  };

  const closeHelperCenter = () => {
    navigate('/');
  };

  const renderActiveView = () => {
    if (!currentUser) {
      return null;
    }

    const visibleTabs = getVisibleTabDefinitions();
    const matchedTab = visibleTabs.find((item) => item.tab === normalizedActiveTab) ?? visibleTabs[0];

    return matchedTab ? matchedTab.render({ authToken, currentUser }) : null;
  };

  return (
    <ToastProvider>
      {isBootstrapping ? (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground relative overflow-hidden">
          <div className="z-10 text-center space-y-6 max-w-sm px-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 border border-border rounded-full animate-pulse" />
              <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-primary tracking-tight">{t('auth.restoringSession')}</h2>
              <p className="text-secondary text-sm">{t('auth.pleaseWait')}</p>
            </div>

            <div className="pt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="transition-colors duration-200 group"
              >
                <LogOut size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                {t('login.logoutButton') || 'Đăng xuất'}
              </Button>
            </div>
          </div>
        </div>
      ) : !currentUser ? (
        location.pathname === PUBLIC_HELPER_CENTER_PATH ? (
          <HelperCenterView onBackToLogin={closeHelperCenter} />
        ) : (
          <LoginView onLogin={handleLogin} onOpenHelperCenter={openHelperCenter} />
        )
      ) : (
        <AppShell
          activeTab={normalizedActiveTab}
          onTabChange={(tab) => navigate(getTabPath(tab))}
          onLogout={handleLogout}
          onGlobalSearch={handleGlobalSearch}
          currentUser={currentUser}
          authToken={authToken}
        >
          {renderActiveView()}
        </AppShell>
      )}
    </ToastProvider>
  );
};

export default App;
