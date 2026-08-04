import { Request, Response } from "express";
import prisma from "@/config/db";

export async function listNotifications(req: Request, res: Response): Promise<void> {
  const page = parseInt(String(req.query.page) || "1");
  const pageSize = parseInt(String(req.query.pageSize) || "20");
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

export async function getExpiringItems(_req: Request, res: Response): Promise<void> {
  const now = new Date();
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const [servers, domains, expiredServers, expiredDomains] = await Promise.all([
    prisma.server.findMany({
      where: { expiryDate: { not: null, gte: now, lte: ninetyDays }, status: { not: "DECOMMISSIONED" } },
      orderBy: { expiryDate: "asc" },
      include: { client: { select: { id: true, name: true } } },
    }),
    prisma.domain.findMany({
      where: {
        OR: [
          { expirationDate: { not: null, gte: now, lte: ninetyDays } },
          { sslExpiration: { not: null, gte: now, lte: ninetyDays } },
        ],
      },
      orderBy: { expirationDate: "asc" },
      include: { client: { select: { id: true, name: true } } },
    }),
    prisma.server.findMany({
      where: { expiryDate: { not: null, lt: now }, status: { not: "DECOMMISSIONED" } },
      include: { client: { select: { id: true, name: true } } },
    }),
    prisma.domain.findMany({
      where: { expirationDate: { not: null, lt: now } },
      include: { client: { select: { id: true, name: true } } },
    }),
  ]);

  const categorize = (days: number) => {
    if (days <= 7) return "critical";
    if (days <= 30) return "warning";
    return "info";
  };

  const getDaysRemaining = (date: Date) => Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const serverReminders = servers.map((s) => ({
    type: "server",
    id: s.id,
    name: s.name,
    provider: s.provider,
    expiryDate: s.expiryDate,
    daysRemaining: s.expiryDate ? getDaysRemaining(s.expiryDate) : null,
    urgency: s.expiryDate ? categorize(getDaysRemaining(s.expiryDate)) : "info",
    client: s.client,
  }));

  const domainReminders = domains.map((d) => ({
    type: "domain",
    id: d.id,
    name: d.domain,
    registrar: d.registrar,
    expirationDate: d.expirationDate,
    sslExpiration: d.sslExpiration,
    daysRemaining: d.expirationDate ? getDaysRemaining(d.expirationDate) : null,
    sslDaysRemaining: d.sslExpiration ? getDaysRemaining(d.sslExpiration) : null,
    urgency: d.expirationDate ? categorize(getDaysRemaining(d.expirationDate)) : "info",
    client: d.client,
  }));

  res.json({
    success: true,
    data: {
      expiring: [...serverReminders, ...domainReminders].sort((a, b) => (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999)),
      expired: [...expiredServers.map((s) => ({ type: "server" as const, id: s.id, name: s.name, expiryDate: s.expiryDate, client: s.client })), ...expiredDomains.map((d) => ({ type: "domain" as const, id: d.id, name: d.domain, expirationDate: d.expirationDate, client: d.client }))],
      stats: {
        expiringSoon30: serverReminders.filter((s) => s.urgency === "critical" || s.urgency === "warning").length + domainReminders.filter((d) => d.urgency === "critical" || d.urgency === "warning").length,
        expiringSoon60: serverReminders.length + domainReminders.length,
        expired: expiredServers.length + expiredDomains.length,
      },
    },
  });
}
