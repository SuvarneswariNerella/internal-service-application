import api from "./client";
import type { ApiResponse } from "@/types";

export interface SearchResult {
  clients: { id: string; name: string; company: string; email: string; status: string }[];
  projects: { id: string; name: string; status: string; technology: string | null; client: { name: string } }[];
  servers: { id: string; name: string; provider: string; status: string; expiryDate: string | null; client: { name: string } | null }[];
  domains: { id: string; domain: string; registrar: string | null; expirationDate: string | null; client: { name: string } | null }[];
  urls: { id: string; shortCode: string; originalUrl: string; clickCount: number; alias: string | null }[];
  billing: { id: string; billingType: string; amount: number; paymentStatus: string; invoiceNumber: string | null; project: { name: string } }[];
}

export const searchApi = {
  search: (q: string) => api.get<ApiResponse<SearchResult>>("/search", { params: { q } }),
};
