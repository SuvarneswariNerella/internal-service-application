import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { config } from "@/config";
import { swaggerSpec } from "@/config/swagger";
import { errorHandler } from "@/middleware/errorHandler";
import authRoutes from "@/modules/auth/auth.routes";
import clientRoutes from "@/modules/clients/clients.routes";
import projectRoutes from "@/modules/projects/projects.routes";
import credentialRoutes from "@/modules/credentials/credentials.routes";
import billingRoutes from "@/modules/billing/billing.routes";
import serverRoutes from "@/modules/servers/servers.routes";
import domainRoutes from "@/modules/domains/domains.routes";
import reminderRoutes from "@/modules/reminders/reminders.routes";
import urlRoutes from "@/modules/urls/routes";
import qrCodeRoutes from "@/modules/qrcodes/routes";
import financeRoutes from "@/modules/finance/finance.routes";
import dashboardRoutes from "@/modules/dashboard/dashboard.routes";
import searchRoutes from "@/modules/search/search.routes";
import auditLogRoutes from "@/modules/audit-logs/audit-logs.routes";
import platformRoutes from "@/modules/platforms/platforms.routes";
import workspaceRoutes from "@/modules/workspaces/workspaces.routes";
import settingsRoutes from "@/modules/settings/settings.routes";
import maintenanceRoutes from "@/modules/maintenance/maintenance.routes";
import templateRoutes from "@/modules/templates/templates.routes";
import usersRoutes from "@/modules/users/users.routes";
import { redirectShortUrl } from "@/modules/urls/controller";
import { startCronJobs } from "@/utils/cron";

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "IOMS API Documentation",
  customCss: ".swagger-ui .topbar { display: none }",
}));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});



app.get("/s/:shortCode", redirectShortUrl);

app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/credentials", credentialRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/servers", serverRoutes);
app.use("/api/domains", domainRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/urls", urlRoutes);
app.use("/api/qrcodes", qrCodeRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/platforms", platformRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/users", usersRoutes);

app.use(errorHandler);

import { ensureQrCodeTableSchema, seedInitialDataIfEmpty, ensureAssetPlatformsTable, ensureCredentialTableSchema, ensureFinanceRecordTableSchema } from "@/config/initDb";

app.get("/api/seed", async (_req, res) => {
  await seedInitialDataIfEmpty();
  res.json({ success: true, message: "Database seeded successfully" });
});

app.get("/api/debug-data", async (_req, res) => {
  try {
    const prisma = (await import("@/config/db")).default;
    const clients = await prisma.client.findMany();

    for (const c of clients) {
      const existing = await prisma.project.findMany({ where: { clientId: c.id } });
      if (existing.length === 0) {
        await prisma.project.create({
          data: {
            name: `${c.name} Main Portal`,
            description: `Primary application for ${c.name}`,
            technology: "React, Node.js",
            startDate: new Date(),
            status: "IN_PROGRESS",
            clientId: c.id,
          },
        });
        await prisma.project.create({
          data: {
            name: `${c.name} Cloud Platform`,
            description: `Cloud services for ${c.name}`,
            technology: "TypeScript, AWS",
            startDate: new Date(),
            status: "PLANNING",
            clientId: c.id,
          },
        });
      }
    }

    const allClients = await prisma.client.findMany();
    const allProjects = await prisma.project.findMany({ include: { client: { select: { id: true, name: true } } } });
    const allWorkspaces = await prisma.workspace.findMany();

    res.json({
      clientsCount: allClients.length,
      projectsCount: allProjects.length,
      workspacesCount: allWorkspaces.length,
      workspaces: allWorkspaces.map(w => ({ id: w.id, displayName: w.displayName })),
      clients: allClients.map((c) => ({ id: c.id, name: c.name })),
      projects: allProjects.map((p) => ({ id: p.id, name: p.name, clientId: p.clientId, clientName: p.client?.name })),
    });
  } catch (error) {
    res.status(500).send(String(error));
  }
});

ensureQrCodeTableSchema().then(() => {
  seedInitialDataIfEmpty();
});

ensureAssetPlatformsTable();
ensureCredentialTableSchema();
ensureFinanceRecordTableSchema();

startCronJobs();

app.listen(config.port, '0.0.0.0', () => {
  console.log(`[IOMS] Server running on port ${config.port}`);
  console.log(`[IOMS] API docs available at http://localhost:${config.port}/api/docs`);
});

export default app;
