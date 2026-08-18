import { Request, Response } from "express";
import prisma from "@/config/db";

export async function listNotifications(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
  const pageSize = Math.max(1, Math.min(1000, parseInt(String(req.query.pageSize || "20"), 10) || 20));
  const unreadOnly = req.query.unread === "true";

  const where: Record<string, unknown> = {};
  if (unreadOnly) where.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { isRead: false } }),
  ]);

  res.json({
    success: true,
    data: notifications,
    meta: { unreadCount },
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) {
    res.status(404).json({ success: false, error: "Notification not found" });
    return;
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
  res.json({ success: true, data: updated });
}

export async function markAllAsRead(_req: Request, res: Response): Promise<void> {
  await prisma.notification.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  });
  res.json({ success: true, data: { message: "All notifications marked as read" } });
}

export async function deleteNotification(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) {
    res.status(404).json({ success: false, error: "Notification not found" });
    return;
  }

  await prisma.notification.delete({ where: { id } });
  res.json({ success: true, data: { message: "Notification deleted" } });
}

export async function getReminders(req: Request, res: Response): Promise<void> {
  const typeFilter = String(req.query.type || "all");
  const workspaceId = String(req.query.workspaceId || "");
  const now = new Date();
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const getDaysRemaining = (date: Date) => Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const reminders: any[] = [];
  const wsFilter = workspaceId ? { workspaceId } : {};

  if (typeFilter === "all" || typeFilter === "projects") {
    const projects = await prisma.project.findMany({
      where: { ...wsFilter, endDate: { not: null, lte: ninetyDays }, status: { notIn: ["COMPLETED", "ARCHIVED"] } },
      include: { client: { select: { name: true } } },
    });
    reminders.push(...projects.map(p => ({
      id: p.id,
      type: "projects",
      name: p.name,
      client_name: p.client?.name || null,
      project_name: null,
      due_date: p.endDate,
      days_remaining: getDaysRemaining(p.endDate!),
      status: p.status,
      priority: null,
      redirect_url: `/projects/${p.id}`
    })));
  }

  if (typeFilter === "all" || typeFilter === "servers") {
    const servers = await prisma.server.findMany({
      where: { ...wsFilter, expiryDate: { not: null, lte: ninetyDays }, status: { not: "DECOMMISSIONED" } },
      include: { client: { select: { name: true } }, project: { select: { name: true } } },
    });
    reminders.push(...servers.map(s => ({
      id: s.id,
      type: "servers",
      name: s.name,
      client_name: s.client?.name || null,
      project_name: s.project?.name || null,
      due_date: s.expiryDate,
      days_remaining: getDaysRemaining(s.expiryDate!),
      status: s.status,
      priority: null,
      redirect_url: `/servers/${s.id}`
    })));
  }

  if (typeFilter === "all" || typeFilter === "domains") {
    const domains = await prisma.domain.findMany({
      where: { ...wsFilter, expirationDate: { not: null, lte: ninetyDays } },
      include: { client: { select: { name: true } }, project: { select: { name: true } } },
    });
    reminders.push(...domains.map(d => ({
      id: d.id,
      type: "domains",
      name: d.domain,
      client_name: d.client?.name || null,
      project_name: d.project?.name || null,
      due_date: d.expirationDate,
      days_remaining: getDaysRemaining(d.expirationDate!),
      status: d.autoRenewal ? "Auto-renew" : "Manual",
      priority: null,
      redirect_url: `/domains/${d.id}`
    })));
  }

  if (typeFilter === "all" || typeFilter === "maintenance") {
    const tickets = await prisma.maintenanceRecord.findMany({
      where: { ...wsFilter, targetCompletionDate: { not: null, lte: ninetyDays }, status: { notIn: ["RESOLVED", "CANCELLED"] } },
      include: { client: { select: { name: true } }, project: { select: { name: true } } },
    });
    reminders.push(...tickets.map(t => ({
      id: t.id,
      type: "maintenance",
      name: t.title,
      client_name: t.client?.name || null,
      project_name: t.project?.name || null,
      due_date: t.targetCompletionDate,
      days_remaining: getDaysRemaining(t.targetCompletionDate!),
      status: t.status,
      priority: t.priority,
      redirect_url: `/maintenance?ticketId=${t.id}`
    })));
  }

  reminders.sort((a, b) => a.days_remaining - b.days_remaining);

  res.json({ success: true, data: reminders });
}

export async function getRemindersSummary(req: Request, res: Response): Promise<void> {
  const workspaceId = String(req.query.workspaceId || "");
  const now = new Date();
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const getDaysRemaining = (date: Date) => Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  const wsFilter = workspaceId ? { workspaceId } : {};

  const [projects, servers, domains, tickets] = await Promise.all([
    prisma.project.findMany({ where: { ...wsFilter, endDate: { not: null, lte: ninetyDays }, status: { notIn: ["COMPLETED", "ARCHIVED"] } } }),
    prisma.server.findMany({ where: { ...wsFilter, expiryDate: { not: null, lte: ninetyDays }, status: { not: "DECOMMISSIONED" } } }),
    prisma.domain.findMany({ where: { ...wsFilter, expirationDate: { not: null, lte: ninetyDays } } }),
    prisma.maintenanceRecord.findMany({ where: { ...wsFilter, targetCompletionDate: { not: null, lte: ninetyDays }, status: { notIn: ["RESOLVED", "CANCELLED"] } } })
  ]);

  let expired = 0;
  let in30 = 0;
  let in90 = 0;

  const processDate = (date: Date | null) => {
    if (!date) return;
    const days = getDaysRemaining(date);
    if (days < 0) expired++;
    else if (days >= 0 && days <= 30) in30++;
    else if (days > 30 && days <= 90) in90++;
  };

  projects.forEach(p => processDate(p.endDate));
  servers.forEach(s => processDate(s.expiryDate));
  domains.forEach(d => processDate(d.expirationDate));
  tickets.forEach(t => processDate(t.targetCompletionDate));

  res.json({
    success: true,
    data: { expired, in30, in90 }
  });
}
