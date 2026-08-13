import api from "./client";
import type { ApiResponse } from "@/types";

export interface Domain {
  id: string;
  domain: string;
  registrar?: string;
  purchaseDate?: string;
  expirationDate?: string;
  sslExpiration?: string;
  renewalCost?: number;
  dnsProvider?: string;
  autoRenewal: boolean;
  clientId?: string;
  client?: { id: string; name: string };
  projectId?: string;
  project?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export const domainsApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string; clientId?: string; projectId?: string; workspaceId?: string }) =>
    api.get<ApiResponse<Domain[]>>("/domains", { params }),

  get: (id: string) => api.get<ApiResponse<Domain>>(`/domains/${id}`),

  create: (data: Partial<Domain>) => api.post<ApiResponse<Domain>>("/domains", data),

  update: (id: string, data: Partial<Domain>) => api.put<ApiResponse<Domain>>(`/domains/${id}`, data),

  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/domains/${id}`),

  getExpiring: (params?: { workspaceId?: string }) => api.get<ApiResponse<Domain[]>>("/domains/expiring", { params }),
};
