import api from "./client";
import type { ApiResponse } from "@/types";

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

export const billingApi = {
  list: (projectId: string) =>
    api.get<ApiResponse<Billing[]>>(`/billing/project/${projectId}`),

  create: (projectId: string, data: { billingType: string; amount: number; currency?: string; dueDate?: string; paymentStatus?: string; invoiceNumber?: string }) =>
    api.post<ApiResponse<Billing>>(`/billing/project/${projectId}`, data),

  update: (id: string, data: Partial<Billing>) =>
    api.put<ApiResponse<Billing>>(`/billing/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/billing/${id}`),
};
