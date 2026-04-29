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
        const currentUserResponse = await getCurrentUser(storedSession.token);
        const responseBody = currentUserResponse.data as any;
        const actualUserData = responseBody?.success && responseBody?.data ? responseBody.data : responseBody;

        const remoteUser = actualUserData
          ? normalizeUserAccount(actualUserData, storedSession.user)
          : storedSession.user;

        setCurrentUser(remoteUser);
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: storedSession.token, user: remoteUser }));
      } catch {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } finally {
        setIsBootstrapping(false);
      }
    };

    void restoreSession();
  }, []);

  const handleLogin = (user: UserAccount, token?: string) => {
    const nextUser = normalizeUserAccount(user);
    setCurrentUser(nextUser);
    if (token) {
      setAuthToken(token);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token, user: nextUser }));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken('');
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setActiveTab('dashboard');
  };

  const renderActiveView = () => {
    if (!currentUser) {
      return null;
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            requests={requests}
            transactions={activeTransactions}
            pendingRequests={pendingRequests}
            currentFund={currentFund}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
          />
        );
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
        return (
          <DashboardView
            requests={requests}
            transactions={activeTransactions}
            pendingRequests={pendingRequests}
            currentFund={currentFund}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
          />
        );
    }
  };

  if (isBootstrapping) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-primary">
        <div className="text-center space-y-2">
          <div className="text-lg font-semibold text-gold">Đang khôi phục phiên đăng nhập...</div>
          <p className="text-sm text-secondary">Vui lòng chờ trong giây lát.</p>
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
