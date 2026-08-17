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
    recentActivity,
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
      take: 10,
      select: { id: true, type: true, title: true, message: true, isRead: true, createdAt: true },
    }),
    prisma.project.groupBy({
      by: ["status"],
      where: projectFilter,
      _count: true,
    }),
    prisma.financeRecord.count({ where: financeFilter }),
    prisma.maintenanceRecord.count({ where: clientFilter }),
  ]);

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
