import api from "./client";
import type { ApiResponse } from "@/types";

export interface ShortUrl {
  id: string;
  originalUrl: string;
  shortCode: string;
  alias: string | null;
  clickCount: number;
  clientId: string | null;
  client?: { id: string; name: string; company?: string };
  projectId?: string | null;
  project?: { id: string; name: string };
  category?: string | null;
  passwordHash?: string | null;
  status: "ACTIVE" | "PAUSED" | "EXPIRED";
  tags?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  creator?: { id: string; name: string; email?: string };
  createdAt: string;
  updatedAt?: string;
  _count?: { clicks: number };
  clicks?: { id: string; ip: string; userAgent: string; referer: string; clickedAt: string }[];
  qrCodes?: { id: string; content: string; qrData?: string }[];
}

export interface UrlStats {
  url: ShortUrl;
  stats: {
    totalClicks: number;
    clicks24h: number;
    clicks7d: number;
    clicks30d: number;
    refererCounts: { referer: string | null; _count: { id: number } }[];
  };
}

export const urlsApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string; clientId?: string; projectId?: string; status?: string; workspaceId?: string }) =>
    api.get<ApiResponse<ShortUrl[]>>("/urls", { params }),

  getById: (id: string) =>
    api.get<ApiResponse<ShortUrl>>(`/urls/${id}`),

  getStats: (id: string) =>
    api.get<ApiResponse<UrlStats>>(`/urls/${id}/stats`),

  create: (data: Partial<ShortUrl> & { password?: string }) =>
    api.post<ApiResponse<ShortUrl>>("/urls", data),

  update: (id: string, data: Partial<ShortUrl> & { password?: string }) =>
    api.put<ApiResponse<ShortUrl>>(`/urls/${id}`, data),

  delete: (id: string) =>
    api.delete(`/urls/${id}`),
};
