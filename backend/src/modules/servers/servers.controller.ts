import { Request, Response } from "express";
import prisma from "@/config/db";
import { createError } from "@/middleware/errorHandler";
import { logAudit } from "@/utils/audit";

export async function listServers(req: Request, res: Response): Promise<void> {
  const page = parseInt(String(req.query.page) || "1");
  const pageSize = parseInt(String(req.query.pageSize) || "10");
  const search = String(req.query.search || "");
  const status = String(req.query.status || "");
  const clientId = String(req.query.clientId || "");
  const projectId = String(req.query.projectId || "");

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { provider: { contains: search } },
      { ipAddress: { contains: search } },
    ];
  }
  if (status) where.status = status;
  if (clientId) where.clientId = clientId;
  if (projectId) where.projectId = projectId;

  const [servers, total] = await Promise.all([
    prisma.server.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.server.count({ where }),
  ]);

  res.json({
    success: true,
    data: servers,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function getServer(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const server = await prisma.server.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, company: true } },
      project: { select: { id: true, name: true } },
    },
  });

  if (!server) throw createError(404, "Server not found");
  res.json({ success: true, data: server });
}

export async function createServer(req: Request, res: Response): Promise<void> {
  let clientId = req.body.clientId || null;
  if (req.body.clientId) {
    const client = await prisma.client.findUnique({ where: { id: req.body.clientId } });
    if (!client) throw createError(404, "Client not found");
  }
  if (req.body.projectId) {
    const project = await prisma.project.findUnique({ where: { id: req.body.projectId } });
    if (!project) throw createError(404, "Project not found");
    if (!clientId && project.clientId) {
      clientId = project.clientId;
    }
  }

  const server = await prisma.server.create({
    data: {
      name: req.body.name,
      provider: req.body.provider,
      ipAddress: req.body.ipAddress,
      purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : null,
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
      renewalCost: req.body.renewalCost,
      renewalFrequency: req.body.renewalFrequency,
      status: req.body.status || "ACTIVE",
      clientId,
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
    entity: "Server",
    entityId: server.id,
    details: { name: server.name, provider: server.provider },
  });

  res.status(201).json({ success: true, data: server });
}

export async function updateServer(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const server = await prisma.server.findUnique({ where: { id } });
  if (!server) throw createError(404, "Server not found");

  const updateData: Record<string, unknown> = {};
  if (req.body.name) updateData.name = req.body.name;
  if (req.body.provider) updateData.provider = req.body.provider;
  if (req.body.ipAddress !== undefined) updateData.ipAddress = req.body.ipAddress;
  if (req.body.purchaseDate !== undefined) updateData.purchaseDate = req.body.purchaseDate ? new Date(req.body.purchaseDate) : null;
  if (req.body.expiryDate !== undefined) updateData.expiryDate = req.body.expiryDate ? new Date(req.body.expiryDate) : null;
  if (req.body.renewalCost !== undefined) updateData.renewalCost = req.body.renewalCost;
  if (req.body.renewalFrequency !== undefined) updateData.renewalFrequency = req.body.renewalFrequency;
  if (req.body.status) updateData.status = req.body.status;
  if (req.body.clientId !== undefined) updateData.clientId = req.body.clientId || null;
  if (req.body.projectId !== undefined) updateData.projectId = req.body.projectId || null;

  if (req.body.projectId) {
    const project = await prisma.project.findUnique({ where: { id: req.body.projectId } });
    if (!project) throw createError(404, "Project not found");
    if (!updateData.clientId && project.clientId) {
      updateData.clientId = project.clientId;
    }
  }

  const updated = await prisma.server.update({
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
    entity: "Server",
    entityId: id,
    details: { name: updated.name, changes: req.body },
  });

  res.json({ success: true, data: updated });
}

export async function deleteServer(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const server = await prisma.server.findUnique({ where: { id } });
  if (!server) throw createError(404, "Server not found");

  await prisma.server.delete({ where: { id } });

  await logAudit({
    userId: req.user!.userId,
    action: "DELETE",
    entity: "Server",
    entityId: id,
    details: { name: server.name, provider: server.provider },
  });

  res.json({ success: true, data: { message: "Server deleted" } });
}

export async function getExpiringServers(_req: Request, res: Response): Promise<void> {
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const servers = await prisma.server.findMany({
    where: {
      expiryDate: { not: null, lte: thirtyDays, gte: now },
      status: { not: "DECOMMISSIONED" },
    },
    orderBy: { expiryDate: "asc" },
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });

  res.json({ success: true, data: servers });
}
