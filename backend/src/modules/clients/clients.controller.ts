import { Request, Response } from "express";
import prisma from "@/config/db";
import { createError } from "@/middleware/errorHandler";
import { logAudit } from "@/utils/audit";
import QRCode from "qrcode";

export async function listClients(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const pageSize = Math.max(1, Math.min(1000, parseInt(req.query.pageSize as string, 10) || 10));
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const status = typeof req.query.status === "string" ? req.query.status : "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { company: { contains: search } },
      { email: { contains: search } },
    ];
  }
  if (status) {
    where.status = status;
  }

  let clients: any[] = [];
  let total = 0;

  try {
    [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { projects: true, servers: true, domains: true, shortUrls: true, qrCodes: true } },
          projects: {
            select: {
              technology: true,
              status: true,
              billing: { select: { amount: true } },
              assets: { select: { id: true } },
            },
          },
          servers: {
            select: { expiryDate: true, status: true },
          },
          domains: {
            select: { expirationDate: true },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);
  } catch {
    [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { projects: true, servers: true, domains: true, shortUrls: true } },
          projects: {
            select: {
              technology: true,
              status: true,
              billing: { select: { amount: true } },
              assets: { select: { id: true } },
            },
          },
          servers: {
            select: { expiryDate: true, status: true },
          },
          domains: {
            select: { expirationDate: true },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    // Attach raw qrCode count if model missing in prisma cache
    for (const c of clients) {
      const qrRes: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM QrCode WHERE clientId = ?`, c.id);
      c._count = { ...c._count, qrCodes: Number(qrRes[0]?.count || 0) };
    }
  }

  const enriched = clients.map((client) => {
    const techSet = new Set<string>();
    let totalBilling = 0;
    let assetCount = 0;
    let activeServices = 0;

    client.projects.forEach((p: any) => {
      if (p.technology) {
        p.technology.split(",").map((t: string) => t.trim()).filter(Boolean).forEach((t: string) => techSet.add(t));
      }
      p.billing?.forEach((b: any) => { totalBilling += Number(b.amount); });
      if (p.assets) assetCount++;
      if (p.status !== "COMPLETED" && p.status !== "ARCHIVED") activeServices++;
    });

    const now = new Date();
    const allRenewalDates = [
      ...client.servers.filter((s: any) => s.expiryDate).map((s: any) => new Date(s.expiryDate!)),
      ...client.domains.filter((d: any) => d.expirationDate).map((d: any) => new Date(d.expirationDate!)),
    ].filter((d) => d > now);

    const nearestRenewal = allRenewalDates.length > 0
      ? allRenewalDates.reduce((a, b) => (a < b ? a : b))
      : null;

    const daysUntilRenewal = nearestRenewal
      ? Math.ceil((nearestRenewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      id: client.id,
      name: client.name,
      company: client.company,
      contactPerson: client.contactPerson,
      email: client.email,
      phone: client.phone,
      address: client.address,
      status: client.status,
      notes: client.notes,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      _count: client._count,
      technologies: Array.from(techSet),
      daysUntilRenewal,
      totalBilling,
      assetCount,
      activeServices,
    };
  });

  res.json({
    success: true,
    data: enriched,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function getClient(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  let client: any = null;
  try {
    client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: { select: { id: true, name: true, status: true, technology: true, createdAt: true, startDate: true } },
        servers: { select: { id: true, name: true, provider: true, status: true, expiryDate: true, ipAddress: true, renewalCost: true } },
        domains: { select: { id: true, domain: true, registrar: true, expirationDate: true, sslExpiration: true, autoRenewal: true, renewalCost: true } },
        shortUrls: { select: { id: true, shortCode: true, originalUrl: true, alias: true, clickCount: true, category: true, status: true, expiryDate: true, createdAt: true } },
        qrCodes: { select: { id: true, name: true, type: true, content: true, rawContent: true, format: true, size: true, foregroundColor: true, backgroundColor: true, status: true, tags: true, createdAt: true } },
        _count: { select: { projects: true, servers: true, domains: true, shortUrls: true, qrCodes: true } },
      },
    });
  } catch {
    client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: { select: { id: true, name: true, status: true, technology: true, createdAt: true, startDate: true } },
        servers: { select: { id: true, name: true, provider: true, status: true, expiryDate: true, ipAddress: true, renewalCost: true } },
        domains: { select: { id: true, domain: true, registrar: true, expirationDate: true, sslExpiration: true, autoRenewal: true, renewalCost: true } },
        shortUrls: { select: { id: true, shortCode: true, originalUrl: true, alias: true, clickCount: true, category: true, status: true, expiryDate: true, createdAt: true } },
        _count: { select: { projects: true, servers: true, domains: true, shortUrls: true } },
      },
    });

    if (client) {
      const qrRows: any = await prisma.$queryRawUnsafe(`SELECT * FROM QrCode WHERE clientId = ? ORDER BY createdAt DESC`, id);
      client.qrCodes = Array.isArray(qrRows) ? qrRows : [];
      client._count = { ...client._count, qrCodes: client.qrCodes.length };
    }
  }

  if (!client) throw createError(404, "Client not found");

  // Attach qrData thumbnails to client.qrCodes
  if (client.qrCodes && Array.isArray(client.qrCodes)) {
    client.qrCodes = await Promise.all(
      client.qrCodes.map(async (qr: any) => {
        try {
          const fg = qr.foregroundColor || qr.foreground || "#000000";
          const bg = qr.backgroundColor || qr.background || "#FFFFFF";
          const qrOptions = { width: qr.size || 256, margin: 2, color: { dark: fg, light: bg } };
          let qrData = "";
          if ((qr.format || "SVG") === "SVG") {
            qrData = await QRCode.toString(qr.content || "https://example.com", { ...qrOptions, type: "svg" });
          } else {
            qrData = await QRCode.toDataURL(qr.content || "https://example.com", qrOptions);
          }
          return { ...qr, qrData };
        } catch {
          return { ...qr, qrData: "" };
        }
      })
    );
  }

  res.json({ success: true, data: client });
}

export async function createClient(req: Request, res: Response): Promise<void> {
  const existing = await prisma.client.findFirst({ where: { email: req.body.email } });
  if (existing) throw createError(409, "Client with this email already exists");

  const client = await prisma.client.create({ data: req.body });

  await logAudit({
    userId: req.user!.userId,
    action: "CREATE",
    entity: "Client",
    entityId: client.id,
    details: { name: client.name, company: client.company },
  });

  res.status(201).json({ success: true, data: client });
}

export async function updateClient(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) throw createError(404, "Client not found");

  const updated = await prisma.client.update({ where: { id }, data: req.body });

  await logAudit({
    userId: req.user!.userId,
    action: "UPDATE",
    entity: "Client",
    entityId: id,
    details: { name: updated.name, changes: req.body },
  });

  res.json({ success: true, data: updated });
}

export async function deleteClient(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const client = await prisma.client.findUnique({
    where: { id },
    include: { projects: { select: { id: true } }, shortUrls: { select: { id: true } } },
  });
  if (!client) throw createError(404, "Client not found");

  const projectIds = client.projects.map((p) => p.id);
  const urlIds = client.shortUrls.map((u) => u.id);

  await prisma.$transaction([
    prisma.billing.deleteMany({ where: { projectId: { in: projectIds } } }),
    prisma.credential.deleteMany({ where: { projectId: { in: projectIds } } }),
    prisma.asset.deleteMany({ where: { projectId: { in: projectIds } } }),
    prisma.project.deleteMany({ where: { clientId: id } }),
    prisma.clickLog.deleteMany({ where: { urlId: { in: urlIds } } }),
    prisma.shortUrl.deleteMany({ where: { clientId: id } }),
    prisma.server.updateMany({ where: { clientId: id }, data: { clientId: null } }),
    prisma.domain.updateMany({ where: { clientId: id }, data: { clientId: null } }),
    prisma.client.delete({ where: { id } }),
  ]);

  await logAudit({
    userId: req.user!.userId,
    action: "DELETE",
    entity: "Client",
    entityId: id,
    details: { name: client.name, company: client.company },
  });

  res.json({ success: true, data: { message: "Client deleted" } });
}

export async function getClientOptions(_req: Request, res: Response): Promise<void> {
  const clients = await prisma.client.findMany({
    select: {
      id: true,
      name: true,
      company: true,
    },
    orderBy: { name: "asc" },
  });

  res.json({ success: true, data: clients });
}
