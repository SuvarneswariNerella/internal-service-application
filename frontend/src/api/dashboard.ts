import api from "./client";
import type { ApiResponse } from "@/types";

export interface DashboardStats {
  overview: {
    totalClients: number;
    totalProjects: number;
    activeProjects: number;
    totalServers: number;
    totalDomains: number;
    totalUrls: number;
    totalQrCodes: number;
    unreadReminders: number;
    totalFinanceRecords: number;
    totalMaintenanceRecords: number;
  };
  expiringServers: {
    within30Days: number;
    within60Days: number;
    within90Days: number;
  };
  expiringDomains: {
    within30Days: number;
    within60Days: number;
    within90Days: number;
  };
  pendingBilling: {
    totalAmount: number;
    count: number;
  };
  topUrls: {
    id: string;
    shortCode: string;
    originalUrl: string;
    clickCount: number;
    alias?: string | null;
  }[];
  recentActivity: {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  }[];
  projectsByStatus: {
    status: string;
    count: number;
  }[];
}

export const dashboardApi = {
  getStats: (params?: { workspaceId?: string }) => api.get<ApiResponse<DashboardStats>>("/dashboard/stats", { params }),
};
