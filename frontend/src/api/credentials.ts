import api from "./client";
import type { ApiResponse } from "@/types";

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

export const credentialsApi = {
  list: (projectId: string) =>
    api.get<ApiResponse<Credential[]>>(`/credentials/project/${projectId}`),

  create: (projectId: string, data: { portalName: string; username: string; password: string; notes?: string; assetCategory?: string; loginUrl?: string; minRoleAccess?: string }) =>
    api.post<ApiResponse<Credential>>(`/credentials/project/${projectId}`, data),

  update: (id: string, data: Partial<Credential>) =>
    api.put<ApiResponse<Credential>>(`/credentials/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/credentials/${id}`),

  reveal: (id: string) =>
    api.get<ApiResponse<Credential>>(`/credentials/${id}/reveal`),
};
