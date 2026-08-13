import api from "./client";
import type { ApiResponse } from "@/types";

export interface QrCodeItem {
  id: string;
  name: string;
  type: string;
  content: string;
  rawContent?: any;
  clientId?: string | null;
  client?: { id: string; name: string; company?: string } | null;
  projectId?: string | null;
  project?: { id: string; name: string } | null;
  shortUrlId?: string | null;
  shortUrl?: { id: string; shortCode: string; originalUrl: string } | null;
  format: string;
  size: number;
  foregroundColor?: string;
  backgroundColor?: string;
  errorCorrectionLevel?: string;
  expiryDate?: string | null;
  status?: string;
  tags?: string | null;
  qrData?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface QrCodeListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  clientId?: string;
  projectId?: string;
  type?: string;
  status?: string;
  workspaceId?: string;
}

export const qrCodesApi = {
  list: (params?: QrCodeListParams) =>
    api.get<ApiResponse<QrCodeItem[]>>("/qrcodes", { params }),

  getById: (id: string) =>
    api.get<ApiResponse<QrCodeItem>>(`/qrcodes/${id}`),

  preview: (data: {
    type?: string;
    content?: string;
    rawContent?: any;
    format?: string;
    size?: number;
    foregroundColor?: string;
    backgroundColor?: string;
    errorCorrectionLevel?: string;
  }) =>
    api.post<ApiResponse<{ encodedString: string; qrData: string }>>("/qrcodes/preview", data),

  create: (data: any) =>
    api.post<ApiResponse<QrCodeItem>>("/qrcodes", data),

  update: (id: string, data: any) =>
    api.put<ApiResponse<QrCodeItem>>(`/qrcodes/${id}`, data),

  generate: (data: any) =>
    api.post<ApiResponse<QrCodeItem>>("/qrcodes/generate", data),

  download: (id: string, params?: { format?: string; color?: string; size?: number }) =>
    api.get(`/qrcodes/${id}/download`, { params, responseType: "blob" }),

  delete: (id: string) =>
    api.delete(`/qrcodes/${id}`),
};
