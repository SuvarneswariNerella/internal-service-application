import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting workspace migration...");

  // 1. Migrate Projects
  const projects = await prisma.project.findMany({
    include: { client: true }
  });
  let projectUpdates = 0;
  for (const project of projects) {
    if (!project.workspaceId && project.client?.workspaceId) {
      await prisma.project.update({
        where: { id: project.id },
        data: { workspaceId: project.client.workspaceId }
      });
      projectUpdates++;
    }
  }
  console.log(`Updated ${projectUpdates} projects.`);

  // 2. Migrate Servers
  const servers = await prisma.server.findMany({
    include: { client: true, project: { include: { client: true } } }
  });
  let serverUpdates = 0;
  for (const server of servers) {
    if (!server.workspaceId) {
      const workspaceId = server.client?.workspaceId || server.project?.client?.workspaceId;
      if (workspaceId) {
        await prisma.server.update({
          where: { id: server.id },
          data: { workspaceId }
        });
        serverUpdates++;
      }
    }
  }
  console.log(`Updated ${serverUpdates} servers.`);

  // 3. Migrate Domains
  const domains = await prisma.domain.findMany({
    include: { client: true, project: { include: { client: true } } }
  });
  let domainUpdates = 0;
  for (const domain of domains) {
    if (!domain.workspaceId) {
      const workspaceId = domain.client?.workspaceId || domain.project?.client?.workspaceId;
      if (workspaceId) {
        await prisma.domain.update({
          where: { id: domain.id },
          data: { workspaceId }
        });
        domainUpdates++;
      }
    }
  }
  console.log(`Updated ${domainUpdates} domains.`);

  // 4. Migrate ShortUrls
  const shortUrls = await prisma.shortUrl.findMany({
    include: { client: true, project: { include: { client: true } } }
  });
  let shortUrlUpdates = 0;
  for (const url of shortUrls) {
    if (!url.workspaceId) {
      const workspaceId = url.client?.workspaceId || url.project?.client?.workspaceId;
      if (workspaceId) {
        await prisma.shortUrl.update({
          where: { id: url.id },
          data: { workspaceId }
        });
        shortUrlUpdates++;
      }
    }
  }
  console.log(`Updated ${shortUrlUpdates} short URLs.`);

  // 5. Migrate QrCodes
  const qrCodes = await prisma.qrCode.findMany({
    include: { client: true, project: { include: { client: true } } }
  });
  let qrCodeUpdates = 0;
  for (const qr of qrCodes) {
    if (!qr.workspaceId) {
      const workspaceId = qr.client?.workspaceId || qr.project?.client?.workspaceId;
      if (workspaceId) {
        await prisma.qrCode.update({
          where: { id: qr.id },
          data: { workspaceId }
        });
        qrCodeUpdates++;
      }
    }
  }
  console.log(`Updated ${qrCodeUpdates} QR codes.`);

  // 6. Migrate FinanceRecords
  const financeRecords = await prisma.financeRecord.findMany({
    include: { project: { include: { client: true } } }
  });
  let financeUpdates = 0;
  for (const record of financeRecords) {
    if (!record.workspaceId) {
      const workspaceId = record.project?.client?.workspaceId;
      if (workspaceId) {
        await prisma.financeRecord.update({
          where: { id: record.id },
          data: { workspaceId }
        });
        financeUpdates++;
      }
    }
  }
  console.log(`Updated ${financeUpdates} finance records.`);

  console.log("Migration complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
