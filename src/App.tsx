import React, { useEffect, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { LoginView } from './views/LoginView';
import { ToastProvider } from './components/ui/toast';
import { getCurrentUser, normalizeUser } from './services/auth';
import { APP_VISIBLE_TABS, getVisibleTabDefinitions } from './config/appRegistry';
import type { AppTab, UserAccount, UserRole } from './types/app';

import { useTranslation } from 'react-i18next';

const SESSION_STORAGE_KEY = 'mtec-operations-hub.session';

interface StoredSession {
  token: string;
  user: UserAccount;
}

const App = () => {
  const { t } = useTranslation(); // Khởi tạo hook Translation
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [authToken, setAuthToken] = useState('');
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
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

  const visibleTabSet = new Set(APP_VISIBLE_TABS);

  const normalizedActiveTab: AppTab = visibleTabSet.has(activeTab) ? activeTab : 'dashboard';

  useEffect(() => {
    const handleAuthExpired = () => {
      // Gọi hàm đăng xuất để xóa state và đẩy người dùng về màn hình Login
      handleLogout();
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, []);

  const handleLogin = (user: UserAccount, token?: string) => {
    const nextUser = normalizeUser(user);
    setCurrentUser(nextUser);
    if (token) {
      setAuthToken(token);
      localStorage.setItem('authToken', token);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token, user: nextUser }));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken('');
    localStorage.removeItem('authToken');
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setActiveTab('dashboard');
  };

  const renderActiveView = () => {
    if (!currentUser) {
      return null;
    }

    const visibleTabs = getVisibleTabDefinitions();
    const matchedTab = visibleTabs.find((item) => item.tab === normalizedActiveTab) ?? visibleTabs[0];

    return matchedTab ? matchedTab.render({ authToken, currentUser }) : null;
  };

  if (isBootstrapping) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-primary">
        <div className="text-center space-y-2">
          <div className="text-lg font-semibold text-gold">{t('auth.restoringSession')}</div>
          <p className="text-sm text-secondary">{t('auth.pleaseWait')}</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <ToastProvider>
      <AppShell activeTab={normalizedActiveTab} onTabChange={setActiveTab} onLogout={handleLogout} currentUser={currentUser}>
        {renderActiveView()}
      </AppShell>
    </ToastProvider>
  );
};

export default App;
