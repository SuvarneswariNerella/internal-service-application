import api from "./client";
import type { ApiResponse } from "@/types";

export interface FinanceRecord {
  id: string;
  projectId: string;
  project?: {
    name: string;
    client?: {
      name: string;
    };
  };
  type: string;
  title: string;
  amount: number;
  currency: string;
  status: string;
  dueDate?: string;
  paidDate?: string;
  fileUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const financeApi = {
  list: (params?: { projectId?: string; status?: string }) =>
    api.get<ApiResponse<FinanceRecord[]>>("/finance", { params }),

  get: (id: string) => api.get<ApiResponse<FinanceRecord>>(`/finance/${id}`),

  create: (data: Partial<FinanceRecord>) => api.post<ApiResponse<FinanceRecord>>("/finance", data),

  update: (id: string, data: Partial<FinanceRecord>) => api.put<ApiResponse<FinanceRecord>>(`/finance/${id}`, data),

  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/finance/${id}`),
};
