import React, { useEffect, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { LoginView } from './views/LoginView';
import { ToastProvider } from './components/ui/toast';
import { Button } from './components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
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

  return (
    <ToastProvider>
      {isBootstrapping ? (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-primary relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="z-10 text-center space-y-6 max-w-sm px-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 border-4 border-gold/20 rounded-full animate-pulse" />
              <div className="absolute inset-0 border-t-4 border-gold rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gold animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gold tracking-tight">{t('auth.restoringSession')}</h2>
              <p className="text-secondary text-sm">{t('auth.pleaseWait')}</p>
            </div>

            <div className="pt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="border-gold/30 text-gold hover:bg-gold/10 transition-all duration-300 group"
              >
                <LogOut size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                {t('login.logoutButton') || 'Đăng xuất'}
              </Button>
            </div>
          </div>
        </div>
      ) : !currentUser ? (
        <LoginView onLogin={handleLogin} />
      ) : (
        <AppShell activeTab={normalizedActiveTab} onTabChange={setActiveTab} onLogout={handleLogout} currentUser={currentUser}>
          {renderActiveView()}
        </AppShell>
      )}
    </ToastProvider>
  );
};

export default App;
