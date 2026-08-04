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

export interface ExpiringItem {
  type: "server" | "domain";
  id: string;
  name: string;
  expiryDate?: string;
  expirationDate?: string;
  daysRemaining?: number;
  urgency: string;
  client?: { id: string; name: string };
}

export const remindersApi = {
  getNotifications: (params?: { page?: number; unread?: boolean }) =>
    api.get<ApiResponse<Notification[]>>("/reminders/notifications", { params }),

  getExpiring: () =>
    api.get<ApiResponse<{ expiring: ExpiringItem[]; expired: ExpiringItem[]; stats: { expiringSoon30: number; expiringSoon60: number; expired: number } }>>("/reminders/expiring"),

  markAsRead: (id: string) =>
    api.put<ApiResponse<Notification>>(`/reminders/notifications/${id}/read`),

  markAllAsRead: () =>
    api.put<ApiResponse<{ message: string }>>("/reminders/notifications/read-all"),

  deleteNotification: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/reminders/notifications/${id}`),
};
