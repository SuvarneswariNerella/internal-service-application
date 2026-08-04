import api from "./client";
import type { ApiResponse } from "@/types";

export interface AuditLog {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string };
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface LoginLog {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string };
  email: string;
  success: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export const auditLogsApi = {
  list: (params?: { page?: number; pageSize?: number; action?: string; entity?: string; userId?: string }) =>
    api.get<ApiResponse<AuditLog[]>>("/audit-logs", { params }),

  listLogins: (params?: { page?: number; pageSize?: number; userId?: string; success?: string }) =>
    api.get<ApiResponse<LoginLog[]>>("/audit-logs/logins", { params }),
};
