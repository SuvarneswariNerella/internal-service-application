import api from "./client";
import type { ApiResponse } from "@/types";

export interface Server {
  id: string;
  name: string;
  provider: string;
  ipAddress?: string;
  purchaseDate?: string;
  expiryDate?: string;
  renewalCost?: number;
  renewalFrequency?: string;
  status: string;
  clientId?: string;
  client?: { id: string; name: string };
  projectId?: string;
  project?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export const serversApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string; status?: string; clientId?: string; projectId?: string }) =>
    api.get<ApiResponse<Server[]>>("/servers", { params }),

  get: (id: string) => api.get<ApiResponse<Server>>(`/servers/${id}`),

  create: (data: Partial<Server>) => api.post<ApiResponse<Server>>("/servers", data),

  update: (id: string, data: Partial<Server>) => api.put<ApiResponse<Server>>(`/servers/${id}`, data),

  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/servers/${id}`),

  getExpiring: () => api.get<ApiResponse<Server[]>>("/servers/expiring"),
};
