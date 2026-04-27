import React, { useState } from 'react';
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
import { todayViDate, useOperationsData } from './hooks/useOperationsData';
import type { AppTab, UserAccount } from './types/app';

const App = () => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
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
        return <MembersView />;
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
        return <SettingsView currentUser={currentUser!} />;
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

  if (!currentUser) {
    return <LoginView onLogin={(user) => setCurrentUser(user)} />;
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab} onLogout={() => setCurrentUser(null)} currentUser={currentUser}>
      {renderActiveView()}
    </AppShell>
  );
};

export default App;
