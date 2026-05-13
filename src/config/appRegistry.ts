import React, { type ReactNode } from 'react';
import { BarChart3, Settings, Users, FileText, DollarSign, ShieldCheck, Box, Wand2, History } from 'lucide-react';
import { DashboardView } from '../views/DashboardView';
import { MembersView } from '../views/MembersView';
import { SettingsView } from '../views/SettingsView';
import { RequestsView } from '../views/RequestsView';
import { FinanceView } from '../views/FinanceView';
import { DisciplineView } from '../views/DisciplineView';
import { LogisticsView } from '../views/LogisticsView';
import { GeneratorView } from '../views/GeneratorView';
import { LogsView } from '../views/LogsView';
import { getRequests, reviewRequest as reviewRequestApi, createRequest, updateRequest } from '../services/requests';
import { getTransactions, getPendingTransactions, reviewTransaction as reviewTransactionApi, deleteTransaction as deleteTransactionApi, createTransaction, updateTransaction } from '../services/finance';
import { getDashboardOverview } from '../services/dashboard';
import type { UserAccount, UserRole, AppTab } from '../types/app';
import { hasAnyRole, hasRole } from '../lib/permissions';

import { APP_VERSION } from './appVersion';
export { APP_VERSION };

export const APP_VISIBLE_TABS: AppTab[] = [
  'dashboard', 
  'members', 
  'requests', 
  'finance', 
  'discipline', 
  'logistics', 
  'generator', 
  'settings',
  'logs'
];

export interface AppRenderContext {
  authToken: string;
  currentUser: UserAccount;
}

// Wrapper for views that need operations data
const RequestsWrapper = ({ authToken, currentUser }: { authToken: string; currentUser: UserAccount }) => {
  const [requests, setRequests] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchRequests = React.useCallback(async () => {
    setIsLoading(true);
    const response = await getRequests({}, authToken);
    if (response.data) {
      setRequests(response.data.requests);
    }
    setIsLoading(false);
  }, [authToken]);

  React.useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return React.createElement(RequestsView, {
    requests,
    currentUser,
    onSaveRequest: async (payload) => {
      let response;
      if (payload.id) {
        response = await updateRequest(payload.id, payload, authToken);
      } else {
        response = await createRequest(payload, authToken);
      }
      
      if (response.status >= 200 && response.status < 300) {
        fetchRequests();
        return response.data?.id || "SUCCESS";
      }
      const apiDetail = (response.data as any)?.detail;
      const errorText = response.error || (typeof apiDetail === 'string' ? apiDetail : '') || 'Không thể lưu yêu cầu.';
      throw new Error(errorText);
    },
    onReviewRequest: async (payload) => {
      const apiStatus = payload.status === 'Đã duyệt' ? 'Da duyet' : 'Tu choi';
      const response = await reviewRequestApi(payload.requestId, apiStatus, payload.reviewNote, authToken);
      if (response.status >= 200 && response.status < 300) {
        fetchRequests();
        return "SUCCESS";
      }
      return undefined;
    }
  });
};

const FinanceWrapper = ({ authToken, currentUser }: { authToken: string; currentUser: UserAccount }) => {
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [pendingTransactions, setPendingTransactions] = React.useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    const [txRes, pendingRes, dashboardRes] = await Promise.all([
      getTransactions({}, authToken),
      getPendingTransactions(authToken),
      getDashboardOverview(authToken)
    ]);
    
    if (txRes.data) setTransactions(txRes.data.transactions);
    if (pendingRes.data) setPendingTransactions(pendingRes.data);
    if (dashboardRes.data) setDashboardStats(dashboardRes.data);
    setIsLoading(false);
  }, [authToken]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalIncome = dashboardStats?.totalIncome ?? transactions
    .filter((item) => item.type === 'Thu' && item.status === 'Đã duyệt')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalExpense = dashboardStats?.totalExpense ?? transactions
    .filter((item) => item.type === 'Chi' && item.status === 'Đã duyệt')
    .reduce((sum, item) => sum + item.amount, 0);

  const currentFund = dashboardStats?.currentFund ?? (totalIncome - totalExpense);

  return React.createElement(FinanceView, {
    transactions,
    pendingTransactions,
    currentUser,
    onSaveTransaction: async (payload) => {
      let response;
      if (payload.id) {
        response = await updateTransaction(payload.id, payload, authToken);
      } else {
        response = await createTransaction(payload, authToken);
      }
      
      if (response.status >= 200 && response.status < 300) {
        fetchData();
        return response.data?.id || "SUCCESS";
      }
      return "";
    },
    onReviewTransaction: async (payload) => {
      const apiStatus = payload.status === 'Đã duyệt' ? 'Da duyet' : 'Tu choi';
      const response = await reviewTransactionApi(payload.transactionId, apiStatus, payload.reviewNote, authToken);
      if (response.status >= 200 && response.status < 300) {
        fetchData();
        return true;
      }
      return false;
    },
    onSoftDeleteTransaction: async (id) => {
      const response = await deleteTransactionApi(id, authToken);
      if (response.status >= 200 && response.status < 300) {
        fetchData();
        return true;
      }
      return false;
    },
    canReviewTransaction: (tx: any) => {
      const userRoles = currentUser.roles ?? [currentUser.role];
      if (hasRole(userRoles, 'bcn')) return true;
      return tx.requiredApprovalRole ? hasRole(userRoles, tx.requiredApprovalRole) : true;
    },
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
    render: ({ authToken, currentUser }) => React.createElement(DashboardView, { authToken, currentUser })
  },
  {
    tab: 'members',
    labelKey: 'appShell.navMembers',
    icon: React.createElement(Users, { size: 20 }),
    minVersion: '1.0.0',
    allowedRoles: 'all',
    render: ({ authToken, currentUser }) => React.createElement(MembersView, { authToken, currentUser })
  },
  {
    tab: 'requests',
    labelKey: 'appShell.navRequests',
    icon: React.createElement(FileText, { size: 20 }),
    minVersion: '1.0.0',
    allowedRoles: ['bcn'],
    render: ({ authToken, currentUser }) => React.createElement(RequestsWrapper, { authToken, currentUser })
  },
  {
    tab: 'finance',
    labelKey: 'appShell.navFinance',
    icon: React.createElement(DollarSign, { size: 20 }),
    minVersion: '1.0.0',
    allowedRoles: ['bcn', 'bvh_finance', 'bvh_hr', 'bvh_logistics', 'bcm'],
    render: ({ authToken, currentUser }) => React.createElement(FinanceWrapper, { authToken, currentUser })
  },
  {
    tab: 'discipline',
    labelKey: 'appShell.navDiscipline',
    icon: React.createElement(ShieldCheck, { size: 20 }),
    minVersion: '1.0.0',
    allowedRoles: ['bcn', 'bvh_hr', 'bvh_discipline', 'bcm', 'member'],
    render: ({ authToken }) => React.createElement(DisciplineView, { authToken })
  },
  {
    tab: 'logistics',
    labelKey: 'appShell.navLogistics',
    icon: React.createElement(Box, { size: 20 }),
    minVersion: '1.0.0',
    allowedRoles: ['bcn', 'bvh_finance', 'bvh_logistics', 'bcm'],
    render: ({ authToken }) => React.createElement(LogisticsView, { authToken })
  },
  {
    tab: 'generator',
    labelKey: 'appShell.navGenerator',
    icon: React.createElement(Wand2, { size: 20 }),
    minVersion: '1.0.0',
    allowedRoles: ['bcn'],
    render: ({ authToken }) => React.createElement(GeneratorView, { authToken })
  },
  {
    tab: 'logs',
    labelKey: 'appShell.navLogs',
    icon: React.createElement(History, { size: 20 }),
    minVersion: '1.0.0',
    allowedRoles: ['bcn'], // Only board and committee members can see logs
    render: ({ authToken }) => React.createElement(LogsView, { authToken })
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
