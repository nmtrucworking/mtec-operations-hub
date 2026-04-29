import React, { type ReactNode } from 'react';
import { BarChart3, Settings, Users, FileText, DollarSign, ShieldCheck, Box, Wand2 } from 'lucide-react';
import { DashboardView } from '../views/DashboardView';
import { MembersView } from '../views/MembersView';
import { SettingsView } from '../views/SettingsView';
import { RequestsView } from '../views/RequestsView';
import { FinanceView } from '../views/FinanceView';
import { DisciplineView } from '../views/DisciplineView';
import { LogisticsView } from '../views/LogisticsView';
import { GeneratorView } from '../views/GeneratorView';
import { useOperationsData, todayViDate } from '../hooks/useOperationsData';
import type { UserAccount, UserRole, AppTab } from '../types/app';

export const APP_VERSION = '1.0.0';

export const APP_VISIBLE_TABS: AppTab[] = [
  'dashboard', 
  'members', 
  'requests', 
  'finance', 
  'discipline', 
  'logistics', 
  'generator', 
  'settings'
];

export interface AppRenderContext {
  authToken: string;
  currentUser: UserAccount;
}

// Wrapper for views that need operations data
const RequestsWrapper = ({ currentUser }: { currentUser: UserAccount }) => {
  const { requests, upsertRequest, reviewRequest } = useOperationsData();
  return React.createElement(RequestsView, {
    requests,
    currentUser,
    onSaveRequest: (payload) => upsertRequest(payload),
    onReviewRequest: (payload) => reviewRequest({
      ...payload,
      reviewerLabel: currentUser.fullName,
      reviewedAt: todayViDate()
    }, currentUser)
  });
};

const FinanceWrapper = ({ currentUser }: { currentUser: UserAccount }) => {
  const { 
    activeTransactions, 
    pendingTransactions, 
    upsertTransaction, 
    reviewTransaction, 
    softDeleteTransaction,
    totalIncome,
    totalExpense,
    currentFund
  } = useOperationsData();

  return React.createElement(FinanceView, {
    transactions: activeTransactions,
    pendingTransactions,
    currentUser,
    onSaveTransaction: (payload) => upsertTransaction(payload, currentUser),
    onReviewTransaction: (payload) => reviewTransaction({
      ...payload,
      reviewerLabel: currentUser.fullName,
      reviewedAt: todayViDate()
    }, currentUser),
    onSoftDeleteTransaction: (id) => softDeleteTransaction(id, currentUser),
    canReviewTransaction: () => true, // Simplified for now
    totalIncome,
    totalExpense,
    currentFund
  });
};

export interface AppTabDefinition {
  tab: AppTab;
  labelKey: string;
  icon: ReactNode;
  minVersion: string;
  allowedRoles: UserRole[] | 'all';
  render: (context: AppRenderContext) => ReactNode;
}

const isVersionEnabled = (minVersion: string) => APP_VERSION >= minVersion;

export const APP_TAB_DEFINITIONS: AppTabDefinition[] = [
  {
    tab: 'dashboard',
    labelKey: 'appShell.navDashboard',
    icon: React.createElement(BarChart3, { size: 20 }),
    minVersion: '1.0.0',
    allowedRoles: 'all',
    render: ({ authToken }) => React.createElement(DashboardView, { authToken })
  },
  {
    tab: 'members',
    labelKey: 'appShell.navMembers',
    icon: React.createElement(Users, { size: 20 }),
    minVersion: '1.0.0',
    allowedRoles: 'all',
    render: ({ authToken }) => React.createElement(MembersView, { authToken })
  },
  {
    tab: 'requests',
    labelKey: 'appShell.navRequests',
    icon: React.createElement(FileText, { size: 20 }),
    minVersion: '1.0.0',
    allowedRoles: 'all',
    render: ({ currentUser }) => React.createElement(RequestsWrapper, { currentUser })
  },
  {
    tab: 'finance',
    labelKey: 'appShell.navFinance',
    icon: React.createElement(DollarSign, { size: 20 }),
    minVersion: '1.0.0',
    allowedRoles: ['bcn', 'bvh_finance'],
    render: ({ currentUser }) => React.createElement(FinanceWrapper, { currentUser })
  },
  {
    tab: 'discipline',
    labelKey: 'appShell.navDiscipline',
    icon: React.createElement(ShieldCheck, { size: 20 }),
    minVersion: '1.0.0',
    allowedRoles: 'all',
    render: () => React.createElement(DisciplineView)
  },
  {
    tab: 'logistics',
    labelKey: 'appShell.navLogistics',
    icon: React.createElement(Box, { size: 20 }),
    minVersion: '1.0.0',
    allowedRoles: 'all',
    render: () => React.createElement(LogisticsView)
  },
  {
    tab: 'generator',
    labelKey: 'appShell.navGenerator',
    icon: React.createElement(Wand2, { size: 20 }),
    minVersion: '1.0.0',
    allowedRoles: 'all',
    render: () => React.createElement(GeneratorView)
  },
  {
    tab: 'settings',
    labelKey: 'appShell.navSettings',
    icon: React.createElement(Settings, { size: 20 }),
    minVersion: '1.0.0',
    allowedRoles: 'all',
    render: ({ authToken, currentUser }) => React.createElement(SettingsView, { currentUser, authToken })
  }
];

export const getVisibleTabDefinitions = () => APP_TAB_DEFINITIONS.filter((item) => isVersionEnabled(item.minVersion) && APP_VISIBLE_TABS.includes(item.tab));

export const isTabVisible = (tab: AppTab) => APP_VISIBLE_TABS.includes(tab) && getVisibleTabDefinitions().some((item) => item.tab === tab);
