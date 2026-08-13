import api from "./client";
import type { ApiResponse } from "@/types";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityId?: string;
  entityType?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Reminder {
  id: string;
  type: "projects" | "servers" | "domains" | "maintenance";
  name: string;
  client_name: string | null;
  project_name: string | null;
  due_date: string;
  days_remaining: number;
  status: string;
  priority: string | null;
  redirect_url: string;
}

export const remindersApi = {
  getReminders: (params?: { type?: string; workspaceId?: string }) =>
    api.get<ApiResponse<Reminder[]>>("/reminders", { params }),

  getSummary: (params?: { workspaceId?: string }) =>
    api.get<ApiResponse<{ expired: number; in30: number; in90: number }>>("/reminders/summary", { params }),

  getNotifications: (params?: { page?: number; unread?: boolean }) =>
    api.get<ApiResponse<Notification[]>>("/reminders/notifications", { params }),
  markAsRead: (id: string) =>
    api.put<ApiResponse<Notification>>(`/reminders/notifications/${id}/read`),

  markAllAsRead: () =>
    api.put<ApiResponse<{ message: string }>>("/reminders/notifications/read-all"),

  deleteNotification: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/reminders/notifications/${id}`),
};
