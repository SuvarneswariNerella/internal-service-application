import api from "./client";
import type { ApiResponse } from "@/types";

export interface TicketUser {
  id: string;
  name: string;
  avatar?: string;
}

export interface TicketComment {
  id: string;
  content: string;
  createdAt: string;
  user: TicketUser;
}

export interface TicketStatusHistory {
  id: string;
  status: string;
  enteredAt: string;
  exitedAt?: string;
  durationMinutes?: number;
  changedBy?: TicketUser;
}


export interface MaintenanceRecord {
  id: string;
  ticketNumber?: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  priority: string;
  scheduledDate?: string;
  completedDate?: string;
  targetCompletionDate?: string;
  clientId?: string;
  client?: { id: string; name: string };
  projectId?: string;
  project?: { id: string; name: string };
  workspaceId?: string | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  assignee?: TicketUser | null;
  comments?: TicketComment[];
  statusHistory?: TicketStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export const maintenanceApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string; status?: string; priority?: string; clientId?: string; projectId?: string; workspaceId?: string }) =>
    api.get<ApiResponse<MaintenanceRecord[]> & { stats?: { openTickets: number; resolvedThisMonth: number; avgResolutionTime: string; allTickets: number } }>("/maintenance", { params }),

  get: (id: string) => api.get<ApiResponse<MaintenanceRecord>>(`/maintenance/${id}`),

  create: (data: Partial<MaintenanceRecord>) => api.post<ApiResponse<MaintenanceRecord>>("/maintenance", data),

  update: (id: string, data: Partial<MaintenanceRecord>) => api.put<ApiResponse<MaintenanceRecord>>(`/maintenance/${id}`, data),

  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/maintenance/${id}`),

  addComment: (id: string, content: string) => api.post<ApiResponse<TicketComment>>(`/maintenance/${id}/comments`, { content }),
};
