src/views/DashboardView.tsx
import React, { useEffect, useState } from 'react';
import { getDashboardOverview } from '../services/dashboard';
import type { DashboardOverviewData } from '../types/dashboard';
// Import các widget component hiện có của bạn (StatCard, ActivityList...)
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

interface DashboardViewProps {
  authToken: string;
}

export const DashboardView = ({ authToken }: DashboardViewProps) => {
  const [dashboardData, setDashboardData] = useState<DashboardOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);

      const response = await getDashboardOverview(authToken);

      if (response.status === 200 && response.data?.success && response.data.data) {
        setDashboardData(response.data.data);
      } else {
        setError(response.error || 'Không thể truy xuất dữ liệu từ máy chủ.');
      }
      
      setIsLoading(false);
    };

    if (authToken) {
      void fetchDashboardData();
    }
  }, [authToken]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full w-full p-8 text-primary">
        <span>Đang tải dữ liệu tổng quan hệ thống...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md border border-red-300">
        Lỗi hệ thống: {error}
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tổng quỹ hiện tại</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardData.currentFund.toLocaleString('vi-VN')} ₫</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tổng thu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{dashboardData.totalIncome.toLocaleString('vi-VN')} ₫</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tổng chi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{dashboardData.totalExpense.toLocaleString('vi-VN')} ₫</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tổng thành viên</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardData.totalMembers}</div>
        </CardContent>
      </Card>

      {/* Cấu trúc tương tự cho pendingRequestsCount, recentActivities, và deptDistribution */}
    </div>
  );
};