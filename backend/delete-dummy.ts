import { PrismaClient } from "@prisma/client";
import fs from "fs";
const prisma = new PrismaClient();

async function main() {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: { id: "d4cf757e-a691-4c27-8fe9-b9d6bf321dce" }
    });

    for (const w of workspaces) {
      await prisma.client.updateMany({ where: { workspaceId: w.id }, data: { workspaceId: null } });
      await prisma.project.updateMany({ where: { workspaceId: w.id }, data: { workspaceId: null } });
      await prisma.server.updateMany({ where: { workspaceId: w.id }, data: { workspaceId: null } });
      await prisma.domain.updateMany({ where: { workspaceId: w.id }, data: { workspaceId: null } });
      await prisma.shortUrl.updateMany({ where: { workspaceId: w.id }, data: { workspaceId: null } });
      await prisma.qrCode.updateMany({ where: { workspaceId: w.id }, data: { workspaceId: null } });
      await prisma.financeRecord.updateMany({ where: { workspaceId: w.id }, data: { workspaceId: null } });
      await prisma.maintenanceRecord.updateMany({ where: { workspaceId: w.id }, data: { workspaceId: null } });
      await prisma.notification.deleteMany({ where: { workspaceId: w.id } });

      await prisma.workspace.delete({ where: { id: w.id } });
    }

    fs.writeFileSync("delete-log.txt", "SUCCESS");
  } catch (err: any) {
    fs.writeFileSync("delete-error.txt", String(err.message || err));
  }
}

main().finally(() => prisma.$disconnect());
