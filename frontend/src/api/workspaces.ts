import api from "./client";

export interface Workspace {
  id: string;
  displayName: string;
  shortCode: string;
  legalName: string;
  contactEmail?: string;
  gstin?: string;
  state?: string;
  defaultCurrency: string;
  invoicePrefix?: string;
  estimatePrefix?: string;
  poPrefix?: string;
  invoiceNextSeq: number;
  estimateNextSeq: number;
  poNextSeq: number;
  bankName?: string;
  bankBranch?: string;
  accountNumber?: string;
  ifscCode?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  activeClients: number;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const workspacesApi = {
  list: () => api.get<Workspace[]>("/workspaces"),
  create: (data: Partial<Workspace>) => api.post<Workspace>("/workspaces", data),
  update: (id: string, data: Partial<Workspace>) => api.put<Workspace>(`/workspaces/${id}`, data),
  delete: (id: string) => api.delete(`/workspaces/${id}`),
};
