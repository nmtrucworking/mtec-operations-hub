import React, { type ReactNode } from 'react';
import { BarChart3, Settings, Users } from 'lucide-react';
import { DashboardView } from '../views/DashboardView';
import { MembersView } from '../views/MembersView';
import { SettingsView } from '../views/SettingsView';
import type { UserAccount, UserRole, AppTab } from '../types/app';

export const APP_VERSION = '1.0.0';

export const APP_VISIBLE_TABS: AppTab[] = ['dashboard', 'members', 'settings'];

export interface AppRenderContext {
  authToken: string;
  currentUser: UserAccount;
}

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
