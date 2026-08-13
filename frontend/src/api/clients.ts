import api from "./client";
import type { ApiResponse, PaginationMeta } from "@/types";

export interface Client {
  id: string;
  name: string;
  company: string;
  workspaceId?: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { projects: number; servers: number; domains: number; shortUrls?: number; qrCodes?: number };
  technologies?: string[];
  daysUntilRenewal?: number | null;
  totalBilling?: number;
  retainer?: number;
  accountManagerLead?: string;
  assetCount?: number;
  activeServices?: number;
  projects?: Project[];
  servers?: Server[];
  domains?: Domain[];
  shortUrls?: { id: string; shortCode?: string; originalUrl?: string; alias?: string; clickCount?: number; category?: string; status?: string; expiryDate?: string; createdAt?: string }[];
  urls?: { id: string; shortCode?: string; originalUrl?: string; alias?: string; clickCount?: number }[];
  qrCodes?: { id: string; name: string; type?: string; content?: string; destination?: string; status?: string; qrData?: string; createdAt?: string }[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  technology?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  clientId: string;
  managerId?: string;
  createdAt: string;
  client?: { id: string; name: string };
}

export interface Server {
  id: string;
  name: string;
  provider: string;
  status: string;
  expiryDate?: string;
}

export interface Domain {
  id: string;
  domain: string;
  registrar?: string;
  expirationDate?: string;
  sslExpiration?: string;
}

export interface ClientListResponse {
  data: Client[];
  pagination: PaginationMeta;
}

export const clientsApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string; status?: string; workspaceId?: string }) =>
    api.get<ApiResponse<Client[]>>("/clients", { params }),

  getOptions: (params?: { workspaceId?: string }) =>
    api.get<ApiResponse<{ id: string; name: string; company?: string }[]>>("/clients/options", { params }),

  get: (id: string) => api.get<ApiResponse<Client>>(`/clients/${id}`),

  create: (data: Partial<Client>) => api.post<ApiResponse<Client>>("/clients", data),

  update: (id: string, data: Partial<Client>) => api.put<ApiResponse<Client>>(`/clients/${id}`, data),

  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/clients/${id}`),
};
