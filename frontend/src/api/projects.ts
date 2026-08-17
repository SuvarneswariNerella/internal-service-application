import api from "./client";
import type { ApiResponse } from "@/types";

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
  client?: {
    id: string;
    name: string;
    company?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    state?: string;
    city?: string;
    pincode?: string;
    notes?: string;
  };
  assets?: Asset;
  credentials?: Credential[];
  billing?: Billing[];
}

export interface CustomAssetItem {
  id: string;
  title: string;
  type: string;
  url: string;
  createdAt?: string;
}

export interface Asset {
  id: string;
  projectId: string;
  gitRepo?: string;
  productionUrl?: string;
  stagingUrl?: string;
  documentation?: string;
  database?: string;
  apiCollection?: string;
  designFiles?: string;
  customAssets?: CustomAssetItem[];
}

export interface Credential {
  id: string;
  portalName: string;
  username: string;
  password: string;
  notes?: string;
  assetCategory?: string;
  loginUrl?: string;
  minRoleAccess?: string;
  createdAt: string;
}

export interface Billing {
  id: string;
  projectId: string;
  billingType: string;
  amount: number;
  currency: string;
  dueDate?: string;
  paymentStatus: string;
  invoiceNumber?: string;
  createdAt: string;
}

export const projectsApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string; status?: string; clientId?: string; workspaceId?: string }) =>
    api.get<ApiResponse<Project[]>>("/projects", { params }),

  get: (id: string) => api.get<ApiResponse<Project>>(`/projects/${id}`),

  create: (data: Partial<Project>) => api.post<ApiResponse<Project>>("/projects", data),

  update: (id: string, data: Partial<Project>) => api.put<ApiResponse<Project>>(`/projects/${id}`, data),

  updateAssets: (id: string, data: Partial<Asset>) => api.put<ApiResponse<Asset>>(`/projects/${id}/assets`, data),

  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/projects/${id}`),
};
