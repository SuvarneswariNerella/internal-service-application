import { Request, Response } from "express";
import prisma from "@/config/db";

export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
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
  ] = await Promise.all([
    prisma.client.count(),
    prisma.project.count(),
    prisma.project.count({ where: { status: "IN_PROGRESS" } }),
    prisma.server.count(),
    prisma.domain.count(),
    prisma.shortUrl.count(),
    prisma.qrCode.count(),
    prisma.notification.count({ where: { isRead: false } }),
    prisma.server.count({
      where: { expiryDate: { not: null, gte: now, lte: thirtyDays }, status: { not: "DECOMMISSIONED" } },
    }),
    prisma.server.count({
      where: { expiryDate: { not: null, gte: now, lte: sixtyDays }, status: { not: "DECOMMISSIONED" } },
    }),
    prisma.server.count({
      where: { expiryDate: { not: null, gte: now, lte: ninetyDays }, status: { not: "DECOMMISSIONED" } },
    }),
    prisma.domain.count({
      where: {
        OR: [
          { expirationDate: { not: null, gte: now, lte: thirtyDays } },
          { sslExpiration: { not: null, gte: now, lte: thirtyDays } },
        ],
      },
    }),
    prisma.domain.count({
      where: {
        OR: [
          { expirationDate: { not: null, gte: now, lte: sixtyDays } },
          { sslExpiration: { not: null, gte: now, lte: sixtyDays } },
        ],
      },
    }),
    prisma.domain.count({
      where: {
        OR: [
          { expirationDate: { not: null, gte: now, lte: ninetyDays } },
          { sslExpiration: { not: null, gte: now, lte: ninetyDays } },
        ],
      },
    }),
    prisma.billing.aggregate({
      where: { paymentStatus: "PENDING" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.shortUrl.findMany({
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
      _count: true,
    }),
    prisma.financeRecord.count(),
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
