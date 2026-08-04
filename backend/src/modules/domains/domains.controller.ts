import { Request, Response } from "express";
import prisma from "@/config/db";
import { createError } from "@/middleware/errorHandler";
import { logAudit } from "@/utils/audit";

export async function listDomains(req: Request, res: Response): Promise<void> {
  const page = parseInt(String(req.query.page) || "1");
  const pageSize = parseInt(String(req.query.pageSize) || "10");
  const search = String(req.query.search || "");
  const clientId = String(req.query.clientId || "");
  const projectId = String(req.query.projectId || "");

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { domain: { contains: search } },
      { registrar: { contains: search } },
      { dnsProvider: { contains: search } },
    ];
  }
  if (clientId) where.clientId = clientId;
  if (projectId) where.projectId = projectId;

  const [domains, total] = await Promise.all([
    prisma.domain.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.domain.count({ where }),
  ]);

  res.json({
    success: true,
    data: domains,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function getDomain(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const domain = await prisma.domain.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, company: true } },
      project: { select: { id: true, name: true } },
    },
  });

  if (!domain) throw createError(404, "Domain not found");
  res.json({ success: true, data: domain });
}

export async function createDomain(req: Request, res: Response): Promise<void> {
  if (req.body.clientId) {
    const client = await prisma.client.findUnique({ where: { id: req.body.clientId } });
    if (!client) throw createError(404, "Client not found");
  }
  if (req.body.projectId) {
    const project = await prisma.project.findUnique({ where: { id: req.body.projectId } });
    if (!project) throw createError(404, "Project not found");
  }

  const domain = await prisma.domain.create({
    data: {
      domain: req.body.domain,
      registrar: req.body.registrar,
      purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : null,
      expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : null,
      sslExpiration: req.body.sslExpiration ? new Date(req.body.sslExpiration) : null,
      renewalCost: req.body.renewalCost,
      dnsProvider: req.body.dnsProvider,
      autoRenewal: req.body.autoRenewal || false,
      clientId: req.body.clientId || null,
      projectId: req.body.projectId || null,
    },
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });

  await logAudit({
    userId: req.user!.userId,
    action: "CREATE",
    entity: "Domain",
    entityId: domain.id,
    details: { domain: domain.domain, registrar: domain.registrar },
  });

  res.status(201).json({ success: true, data: domain });
}

export async function updateDomain(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const domain = await prisma.domain.findUnique({ where: { id } });
  if (!domain) throw createError(404, "Domain not found");

  if (req.body.projectId) {
    const project = await prisma.project.findUnique({ where: { id: req.body.projectId } });
    if (!project) throw createError(404, "Project not found");
  }

  const updateData: Record<string, unknown> = {};
  if (req.body.domain) updateData.domain = req.body.domain;
  if (req.body.registrar !== undefined) updateData.registrar = req.body.registrar;
  if (req.body.purchaseDate !== undefined) updateData.purchaseDate = req.body.purchaseDate ? new Date(req.body.purchaseDate) : null;
  if (req.body.expirationDate !== undefined) updateData.expirationDate = req.body.expirationDate ? new Date(req.body.expirationDate) : null;
  if (req.body.sslExpiration !== undefined) updateData.sslExpiration = req.body.sslExpiration ? new Date(req.body.sslExpiration) : null;
  if (req.body.renewalCost !== undefined) updateData.renewalCost = req.body.renewalCost;
  if (req.body.dnsProvider !== undefined) updateData.dnsProvider = req.body.dnsProvider;
  if (req.body.autoRenewal !== undefined) updateData.autoRenewal = req.body.autoRenewal;
  if (req.body.clientId !== undefined) updateData.clientId = req.body.clientId || null;
  if (req.body.projectId !== undefined) updateData.projectId = req.body.projectId || null;

  const updated = await prisma.domain.update({
    where: { id },
    data: updateData,
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });

  await logAudit({
    userId: req.user!.userId,
    action: "UPDATE",
    entity: "Domain",
    entityId: id,
    details: { domain: updated.domain, changes: req.body },
  });

  res.json({ success: true, data: updated });
}

export async function deleteDomain(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const domain = await prisma.domain.findUnique({ where: { id } });
  if (!domain) throw createError(404, "Domain not found");

  await prisma.domain.delete({ where: { id } });

  await logAudit({
    userId: req.user!.userId,
    action: "DELETE",
    entity: "Domain",
    entityId: id,
    details: { domain: domain.domain, registrar: domain.registrar },
  });

  res.json({ success: true, data: { message: "Domain deleted" } });
}

export async function getExpiringDomains(_req: Request, res: Response): Promise<void> {
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const domains = await prisma.domain.findMany({
    where: {
      OR: [
        { expirationDate: { not: null, lte: thirtyDays, gte: now } },
        { sslExpiration: { not: null, lte: thirtyDays, gte: now } },
      ],
    },
    orderBy: { expirationDate: "asc" },
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });

  res.json({ success: true, data: domains });
}
