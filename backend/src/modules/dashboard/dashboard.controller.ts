import { Request, Response } from "express";
import prisma from "@/config/db";

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  const workspaceId = typeof req.query.workspaceId === "string" && req.query.workspaceId !== "all" 
    ? req.query.workspaceId 
    : undefined;

  const clientFilter = workspaceId ? { workspaceId } : undefined;
  const projectFilter = workspaceId ? { client: { workspaceId } } : undefined;
  const financeFilter = workspaceId ? { workspaceId } : undefined;

  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const [
    totalClients,
    totalProjects,
    activeProjects,
    totalServers,
    totalDomains,
    totalUrls,
    totalQrCodes,
    unreadReminders,
    serversExpiring30,
    serversExpiring60,
    serversExpiring90,
    domainsExpiring30,
    domainsExpiring60,
    domainsExpiring90,
    pendingBilling,
    topUrls,
    rawNotifications,
    rawFinanceRecords,
    rawEmailLogs,
    rawClients,
    rawProjects,
    rawServers,
    rawDomains,
    projectsByStatus,
    totalFinanceRecords,
    totalMaintenanceRecords,
  ] = await Promise.all([
    prisma.client.count({ where: clientFilter }),
    prisma.project.count({ where: projectFilter }),
    prisma.project.count({ where: { status: "IN_PROGRESS", ...projectFilter } }),
    prisma.server.count({ where: { client: clientFilter } }),
    prisma.domain.count({ where: { client: clientFilter } }),
    prisma.shortUrl.count({ where: { client: clientFilter } }),
    prisma.qrCode.count({ where: { client: clientFilter } }),
    prisma.notification.count({ where: { isRead: false } }),
    prisma.server.count({
      where: { expiryDate: { not: null, gte: now, lte: thirtyDays }, status: { not: "DECOMMISSIONED" }, client: clientFilter },
    }),
    prisma.server.count({
      where: { expiryDate: { not: null, gte: now, lte: sixtyDays }, status: { not: "DECOMMISSIONED" }, client: clientFilter },
    }),
    prisma.server.count({
      where: { expiryDate: { not: null, gte: now, lte: ninetyDays }, status: { not: "DECOMMISSIONED" }, client: clientFilter },
    }),
    prisma.domain.count({
      where: {
        AND: clientFilter ? [{ client: clientFilter }] : [],
        OR: [
          { expirationDate: { not: null, gte: now, lte: thirtyDays } },
          { sslExpiration: { not: null, gte: now, lte: thirtyDays } },
        ],
      },
    }),
    prisma.domain.count({
      where: {
        AND: clientFilter ? [{ client: clientFilter }] : [],
        OR: [
          { expirationDate: { not: null, gte: now, lte: sixtyDays } },
          { sslExpiration: { not: null, gte: now, lte: sixtyDays } },
        ],
      },
    }),
    prisma.domain.count({
      where: {
        AND: clientFilter ? [{ client: clientFilter }] : [],
        OR: [
          { expirationDate: { not: null, gte: now, lte: ninetyDays } },
          { sslExpiration: { not: null, gte: now, lte: ninetyDays } },
        ],
      },
    }),
    prisma.financeRecord.aggregate({
      where: { status: "OVERDUE", workspaceId: workspaceId ? workspaceId : undefined },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.shortUrl.findMany({
      where: { client: clientFilter },
      orderBy: { clickCount: "desc" },
      take: 5,
      select: { id: true, shortCode: true, originalUrl: true, clickCount: true },
    }),
    prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, type: true, title: true, message: true, isRead: true, createdAt: true },
    }),
    prisma.financeRecord.findMany({
      where: financeFilter,
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        client: { select: { name: true } },
        project: { select: { name: true } },
      },
    }),
    prisma.emailLog.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      orderBy: { sentAt: "desc" },
      take: 6,
    }),
    prisma.client.findMany({
      where: clientFilter,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, contactPerson: true, createdAt: true },
    }),
    prisma.project.findMany({
      where: projectFilter,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { client: { select: { name: true } } },
    }),
    prisma.server.findMany({
      where: { client: clientFilter },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { client: { select: { name: true } } },
    }),
    prisma.domain.findMany({
      where: { client: clientFilter },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { client: { select: { name: true } } },
    }),
    prisma.project.groupBy({
      by: ["status"],
      where: projectFilter,
      _count: true,
    }),
    prisma.financeRecord.count({ where: financeFilter }),
    prisma.maintenanceRecord.count({ where: clientFilter }),
  ]);

  // Aggregate unified system activities
  const activities: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    createdAt: Date;
  }> = [];

  for (const f of rawFinanceRecords) {
    const docType = f.type === "INVOICE" ? "Invoice" : f.type === "QUOTATION" ? "Estimate" : "Purchase Order";
    const clientStr = f.client?.name || f.project?.name ? ` for ${f.client?.name || f.project?.name}` : "";
    activities.push({
      id: `finance-${f.id}`,
      type: f.type,
      title: `${docType} #${f.title || f.id.slice(0, 8)}`,
      message: `${docType}${clientStr} • ₹${Number(f.amount || 0).toLocaleString()} (${f.status})`,
      createdAt: f.createdAt,
    });
  }

  for (const e of rawEmailLogs) {
    activities.push({
      id: `email-${e.id}`,
      type: "EMAIL",
      title: `Email: ${e.subject}`,
      message: `Delivered to ${e.recipient}`,
      createdAt: e.sentAt,
    });
  }

  for (const c of rawClients) {
    activities.push({
      id: `client-${c.id}`,
      type: "CLIENT",
      title: `New Client: ${c.name}`,
      message: `Client profile created • ${c.email || c.contactPerson || "Active"}`,
      createdAt: c.createdAt,
    });
  }

  for (const p of rawProjects) {
    activities.push({
      id: `project-${p.id}`,
      type: "PROJECT",
      title: `Project: ${p.name}`,
      message: `Status: ${p.status.replace(/_/g, ' ')} • Client: ${p.client?.name || 'Internal'}`,
      createdAt: p.createdAt,
    });
  }

  for (const s of rawServers) {
    activities.push({
      id: `server-${s.id}`,
      type: "SERVER",
      title: `Server: ${s.name}`,
      message: `Server registered${s.client?.name ? ` for ${s.client.name}` : ''}`,
      createdAt: s.createdAt,
    });
  }

  for (const d of rawDomains) {
    activities.push({
      id: `domain-${d.id}`,
      type: "DOMAIN",
      title: `Domain: ${d.domain}`,
      message: `Domain tracked${d.client?.name ? ` for ${d.client.name}` : ''}`,
      createdAt: d.createdAt,
    });
  }

  for (const n of rawNotifications) {
    activities.push({
      id: `notif-${n.id}`,
      type: n.type || "NOTIFICATION",
      title: n.title,
      message: n.message,
      createdAt: n.createdAt,
    });
  }

  // Sort unified activities by createdAt descending and take the 10 most recent
  const recentActivity = activities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  res.json({
    success: true,
    data: {
      overview: {
        totalClients,
        totalProjects,
        activeProjects,
        totalServers,
        totalDomains,
        totalUrls,
        totalQrCodes,
        unreadReminders,
        totalFinanceRecords,
        totalMaintenanceRecords,
      },
      expiringServers: {
        within30Days: serversExpiring30,
        within60Days: serversExpiring60,
        within90Days: serversExpiring90,
      },
      expiringDomains: {
        within30Days: domainsExpiring30,
        within60Days: domainsExpiring60,
        within90Days: domainsExpiring90,
      },
      pendingBilling: {
        totalAmount: Number(pendingBilling._sum.amount || 0),
        count: pendingBilling._count,
      },
      topUrls,
      recentActivity,
      projectsByStatus: projectsByStatus.map((p) => ({
        status: p.status,
        count: p._count,
      })),
    },
  });
}
