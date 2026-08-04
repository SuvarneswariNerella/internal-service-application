import cron from "node-cron";
import prisma from "@/config/db";

const REMINDER_DAYS = [90, 60, 30, 15, 7, 3, 1];

async function checkExpiringItems() {
  console.log("[Cron] Checking expiring items...");
  const now = new Date();

  for (const days of REMINDER_DAYS) {
    const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const expiringServers = await prisma.server.findMany({
      where: { expiryDate: { gte: startOfDay, lt: endOfDay }, status: { not: "DECOMMISSIONED" } },
    });

    for (const server of expiringServers) {
      const existing = await prisma.notification.findFirst({
        where: { entityId: server.id, entityType: "server", type: `server_expiring_${days}d` },
      });
      if (!existing) {
        await prisma.notification.create({
          data: {
            type: `server_expiring_${days}d`,
            title: `Server expiring in ${days} days`,
            message: `Server "${server.name}" (${server.provider}) expires on ${server.expiryDate?.toLocaleDateString()}`,
            entityId: server.id,
            entityType: "server",
          },
        });
      }
    }

    const expiringDomains = await prisma.domain.findMany({
      where: { expirationDate: { gte: startOfDay, lt: endOfDay } },
    });

    for (const domain of expiringDomains) {
      const existing = await prisma.notification.findFirst({
        where: { entityId: domain.id, entityType: "domain", type: `domain_expiring_${days}d` },
      });
      if (!existing) {
        await prisma.notification.create({
          data: {
            type: `domain_expiring_${days}d`,
            title: `Domain expiring in ${days} days`,
            message: `Domain "${domain.domain}" expires on ${domain.expirationDate?.toLocaleDateString()}`,
            entityId: domain.id,
            entityType: "domain",
          },
        });
      }
    }
  }

  const expiredServers = await prisma.server.findMany({
    where: { expiryDate: { lt: now }, status: { not: "DECOMMISSIONED" } },
  });
  for (const server of expiredServers) {
    await prisma.server.update({ where: { id: server.id }, data: { status: "EXPIRED" } });
  }

  const expiringServers = await prisma.server.findMany({
    where: { expiryDate: { gt: now }, status: "ACTIVE" },
  });
  for (const server of expiringServers) {
    if (server.expiryDate) {
      const daysLeft = Math.ceil((server.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 30) {
        await prisma.server.update({ where: { id: server.id }, data: { status: "EXPIRING_SOON" } });
      }
    }
  }

  console.log("[Cron] Expiring items check complete");
}

export function startCronJobs() {
  cron.schedule("0 9 * * *", checkExpiringItems);
  console.log("[Cron] Scheduled daily check at 9:00 AM");
}
