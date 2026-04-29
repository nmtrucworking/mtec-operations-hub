import React, { useEffect, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { DashboardView } from './views/DashboardView';
import { DisciplineView } from './views/DisciplineView';
import { FinanceView } from './views/FinanceView';
import { GeneratorView } from './views/GeneratorView';
import { LoginView } from './views/LoginView';
import { LogisticsView } from './views/LogisticsView';
import { MembersView } from './views/MembersView';
import { RequestsView } from './views/RequestsView';
import { SettingsView } from './views/SettingsView';
import { getCurrentUser } from './services/api';
import { todayViDate, useOperationsData } from './hooks/useOperationsData';
import type { AppTab, UserAccount, UserRole } from './types/app';

import { useTranslation } from 'react-i18next';

const SESSION_STORAGE_KEY = 'mtec-operations-hub.session';

interface StoredSession {
  token: string;
  user: UserAccount;
}

const normalizeUserAccount = (payload: unknown, fallback?: Partial<UserAccount>): UserAccount => {
  const record = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
  const fullName = String(record.fullName ?? record.full_name ?? record.name ?? fallback?.fullName ?? '').trim();
  const username = String(record.username ?? fallback?.username ?? '').trim();
  const role = String(record.role ?? fallback?.role ?? 'member') as UserRole;
  const initials = String(
    record.avatarInitials ??
      record.avatar_initials ??
      fallback?.avatarInitials ??
      (fullName
        ? fullName
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join('')
        : username.slice(0, 2).toUpperCase())
  );

  return {
    id: String(record.id ?? fallback?.id ?? username),
    username,
    password: typeof record.password === 'string' ? record.password : fallback?.password,
    fullName: fullName || username,
    role,
    avatarInitials: initials || username.slice(0, 2).toUpperCase()
  };
};

const App = () => {
  const { t } = useTranslation(); // Khởi tạo hook Translation
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [authToken, setAuthToken] = useState('');
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const {
    requests,
    activeTransactions,
    pendingTransactions,
    pendingRequests,
    totalIncome,
    totalExpense,
    currentFund,
    upsertTransaction,
    reviewTransaction,
    softDeleteTransaction,
    upsertRequest,
    reviewRequest,
    canReviewFinanceTransaction
  } = useOperationsData();

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
          ? normalizeUserAccount(actualUserData, storedSession.user)
          : storedSession.user;

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
    const nextUser = normalizeUserAccount(user);
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

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView authToken={authToken} />;
      case 'members':
        return <MembersView authToken={authToken} />;
      case 'requests':
        return (
          <RequestsView
            requests={requests}
            currentUser={currentUser}
            onSaveRequest={upsertRequest}
            onReviewRequest={(payload) =>
              reviewRequest(
                {
                  ...payload,
                  reviewerLabel: currentUser.fullName,
                  reviewedAt: todayViDate()
                },
                currentUser
              )
            }
          />
        );
      case 'finance':
        return (
          <FinanceView
            transactions={activeTransactions}
            pendingTransactions={pendingTransactions}
            currentUser={currentUser}
            onSaveTransaction={(payload) => upsertTransaction(payload, currentUser)}
            onReviewTransaction={(payload) =>
              reviewTransaction(
                {
                  ...payload,
                  reviewerLabel: currentUser.fullName,
                  reviewedAt: todayViDate()
                },
                currentUser
              )
            }
            onSoftDeleteTransaction={(transactionId) => softDeleteTransaction(transactionId, currentUser)}
            canReviewTransaction={(tx) => canReviewFinanceTransaction(currentUser, tx)}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            currentFund={currentFund}
          />
        );
      case 'discipline':
        return <DisciplineView />;
      case 'logistics':
        return <LogisticsView />;
      case 'generator':
        return <GeneratorView />;
      case 'settings':
        return <SettingsView currentUser={currentUser!} authToken={authToken} />;
      default:
        return <DashboardView authToken={authToken} />;
    }
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
    <AppShell activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} currentUser={currentUser}>
      {renderActiveView()}
    </AppShell>
  );
};

export default App;
