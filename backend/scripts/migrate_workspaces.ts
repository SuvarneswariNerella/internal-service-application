import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting workspace migration...");

  // Update Projects
  const projects = await prisma.project.findMany({ include: { client: true } });
  for (const project of projects) {
    if (project.client?.workspaceId && project.workspaceId !== project.client.workspaceId) {
      await prisma.project.update({
        where: { id: project.id },
        data: { workspaceId: project.client.workspaceId },
      });
      console.log(`Updated project ${project.id} with workspace ${project.client.workspaceId}`);
    }
  }

  // Update Servers
  const servers = await prisma.server.findMany({ include: { client: true, project: { include: { client: true } } } });
  for (const server of servers) {
    const workspaceId = server.client?.workspaceId || server.project?.client?.workspaceId;
    if (workspaceId && server.workspaceId !== workspaceId) {
      await prisma.server.update({
        where: { id: server.id },
        data: { workspaceId },
      });
      console.log(`Updated server ${server.id} with workspace ${workspaceId}`);
    }
  }

  // Update Domains
  const domains = await prisma.domain.findMany({ include: { client: true, project: { include: { client: true } } } });
  for (const domain of domains) {
    const workspaceId = domain.client?.workspaceId || domain.project?.client?.workspaceId;
    if (workspaceId && domain.workspaceId !== workspaceId) {
      await prisma.domain.update({
        where: { id: domain.id },
        data: { workspaceId },
      });
      console.log(`Updated domain ${domain.id} with workspace ${workspaceId}`);
    }
  }

  // Update ShortUrls
  const urls = await prisma.shortUrl.findMany({ include: { client: true, project: { include: { client: true } } } });
  for (const url of urls) {
    const workspaceId = url.client?.workspaceId || url.project?.client?.workspaceId;
    if (workspaceId && url.workspaceId !== workspaceId) {
      await prisma.shortUrl.update({
        where: { id: url.id },
        data: { workspaceId },
      });
      console.log(`Updated shortUrl ${url.id} with workspace ${workspaceId}`);
    }
  }

  // Update QrCodes
  const qrCodes = await prisma.qrCode.findMany({ include: { client: true, project: { include: { client: true } } } });
  for (const qrCode of qrCodes) {
    const workspaceId = qrCode.client?.workspaceId || qrCode.project?.client?.workspaceId;
    if (workspaceId && qrCode.workspaceId !== workspaceId) {
      await prisma.qrCode.update({
        where: { id: qrCode.id },
        data: { workspaceId },
      });
      console.log(`Updated qrCode ${qrCode.id} with workspace ${workspaceId}`);
    }
  }

  // Update FinanceRecords
  const financeRecords = await prisma.financeRecord.findMany({ include: { project: { include: { client: true } } } });
  for (const record of financeRecords) {
    const workspaceId = record.project?.workspaceId || record.project?.client?.workspaceId;
    if (workspaceId && record.workspaceId !== workspaceId) {
      await prisma.financeRecord.update({
        where: { id: record.id },
        data: { workspaceId },
      });
      console.log(`Updated finance record ${record.id} with workspace ${workspaceId}`);
    }
  }

  console.log("Migration complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
