export interface DashboardOverview {
    totalMembers: number;
    currentFund: number;
    totalIncome: number;
    totalExpense: number;
    maintenanceCount: number;
    pendingRequestsCount: number;
    deptDistribution: { ban: string; count: number }[];
    recentActivities: any[];
    urgentRequests: any[];
}