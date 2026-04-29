export interface DashboardActivity {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
}

export interface DashboardRequest {
  id: string;
  name: string;
  type: string;
  date: string;
  status: string;
}

export interface DashboardOverviewData {
  totalMembers: number;
  currentFund: number;
  totalIncome: number;
  totalExpense: number;
  maintenanceCount: number;
  pendingRequestsCount: number;
  deptDistribution: { ban: string; count: number }[];
  recentActivities: DashboardActivity[];
  urgentRequests: DashboardRequest[];
}

export interface DashboardApiResponse {
  success: boolean;
  data: DashboardOverviewData;
}