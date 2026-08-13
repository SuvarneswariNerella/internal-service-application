import { create } from "zustand";
import { dashboardApi } from "@/api/dashboard";

export interface SidebarCounts {
  clients: number;
  projects: number;
  servers: number;
  domains: number;
  urls: number;
  qrCodes: number;
  reminders: number;
  financeRecords: number;
  maintenanceRecords: number;
}

interface SidebarStatsState {
  counts: SidebarCounts;
  isLoading: boolean;
  fetchCounts: (workspaceId?: string) => Promise<void>;
}

export const useSidebarStatsStore = create<SidebarStatsState>((set) => ({
  counts: {
    clients: 0,
    projects: 0,
    servers: 0,
    domains: 0,
    urls: 0,
    qrCodes: 0,
    reminders: 0,
    financeRecords: 0,
    maintenanceRecords: 0,
  },
  isLoading: false,

  fetchCounts: async (workspaceId?: string) => {
    try {
      set({ isLoading: true });
      const params = workspaceId && workspaceId !== "all" ? { workspaceId } : undefined;
      const res = await dashboardApi.getStats(params);
      if (res.data.success && res.data.data) {
        const overview = res.data.data.overview;
        set({
          counts: {
            clients: overview.totalClients ?? 0,
            projects: overview.totalProjects ?? overview.activeProjects ?? 0,
            servers: overview.totalServers ?? 0,
            domains: overview.totalDomains ?? 0,
            urls: overview.totalUrls ?? 0,
            qrCodes: overview.totalQrCodes ?? 0,
            reminders: overview.unreadReminders ?? 0,
            financeRecords: overview.totalFinanceRecords ?? 0,
            maintenanceRecords: overview.totalMaintenanceRecords ?? 0,
          },
          isLoading: false,
        });
      }
    } catch (err) {
      console.error("Failed to fetch sidebar counts:", err);
      set({ isLoading: false });
    }
  },
}));
