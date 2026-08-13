import api from "./client";
import type { ApiResponse } from "@/types";

export interface FinanceRecord {
  id: string;
  projectId: string;
  project?: {
    name: string;
    clientId: string;
    client?: {
      id: string;
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
  metadata?: any;
  workspaceId?: string;
  createdAt: string;
  updatedAt: string;
  emailLogs?: {
    id: string;
    sender: string;
    recipient: string;
    subject: string;
    status: string;
    sentAt: string;
  }[];
  sourcePoId?: string;
  convertedInvoiceId?: string;
}

export const financeApi = {
  list: (params?: { projectId?: string; status?: string; workspaceId?: string }) =>
    api.get<ApiResponse<FinanceRecord[]>>("/finance", { params }),

  get: (id: string) => api.get<ApiResponse<FinanceRecord>>(`/finance/${id}`),

  create: (data: Partial<FinanceRecord>) => api.post<ApiResponse<FinanceRecord>>("/finance", data),

  update: (id: string, data: Partial<FinanceRecord>) => api.put<ApiResponse<FinanceRecord>>(`/finance/${id}`, data),

  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/finance/${id}`),

  sendDocument: (id: string, data: { to: string; subject: string; message: string }) => 
    api.post<ApiResponse<{ message: string }>>(`/finance/${id}/send`, data),

  convert: (id: string) => api.post<ApiResponse<FinanceRecord>>(`/finance/${id}/convert`),
};
