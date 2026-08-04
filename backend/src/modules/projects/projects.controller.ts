import { Request, Response } from "express";
import prisma from "@/config/db";
import { createError } from "@/middleware/errorHandler";
import { logAudit } from "@/utils/audit";

export async function listProjects(req: Request, res: Response): Promise<void> {
  const page = parseInt((req.query.page as string) || "1");
  const pageSize = parseInt((req.query.pageSize as string) || "10");
  const search = (req.query.search as string) || "";
  const status = (req.query.status as string) || "";
  const clientId = (req.query.clientId as string) || "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { technology: { contains: search } },
    ];
  }
  if (status) where.status = status;
  if (clientId) where.clientId = clientId;

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { client: { select: { id: true, name: true, company: true } } },
    }),
    prisma.project.count({ where }),
  ]);

  res.json({
    success: true,
    data: projects,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function getProject(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  let project: any = null;

  try {
    project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            contactPerson: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        assets: true,
        credentials: {
          select: { id: true, portalName: true, username: true, notes: true, assetCategory: true, loginUrl: true, minRoleAccess: true, createdAt: true },
        },
      },
    });
  } catch (err) {
    console.error("[ProjectsController] Error fetching full project details, attempting simplified query:", err);
    project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        credentials: {
          select: { id: true, portalName: true, username: true, notes: true, assetCategory: true, loginUrl: true, minRoleAccess: true, createdAt: true },
        },
      },
    });
  }

  if (!project) throw createError(404, "Project not found");
  res.json({ success: true, data: project });
}

export async function createProject(req: Request, res: Response): Promise<void> {
  const clientId = String(req.body.clientId);
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw createError(404, "Client not found");

  const { name, description, technology, startDate, endDate, status, managerId } = req.body;

  const project = await prisma.project.create({
    data: {
      name,
      description: description || null,
      technology: technology || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: status || "PLANNING",
      clientId,
      managerId: managerId || null,
    },
    include: { client: { select: { id: true, name: true } } },
  });

  await logAudit({
    userId: req.user!.userId,
    action: "CREATE",
    entity: "Project",
    entityId: project.id,
    details: { name: project.name, clientId: project.clientId },
  });

  res.status(201).json({ success: true, data: project });
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw createError(404, "Project not found");

  const { name, description, technology, startDate, endDate, status, clientId, managerId } = req.body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description || null;
  if (technology !== undefined) updateData.technology = technology || null;
  if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
  if (status !== undefined) updateData.status = status;
  if (clientId !== undefined) updateData.clientId = clientId;
  if (managerId !== undefined) updateData.managerId = managerId || null;

  const updated = await prisma.project.update({
    where: { id },
    data: updateData,
    include: { client: { select: { id: true, name: true } } },
  });

  await logAudit({
    userId: req.user!.userId,
    action: "UPDATE",
    entity: "Project",
    entityId: id,
    details: { name: updated.name, changes: req.body },
  });

  res.json({ success: true, data: updated });
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw createError(404, "Project not found");

  await prisma.$transaction([
    prisma.credential.deleteMany({ where: { projectId: id } }),
    prisma.asset.deleteMany({ where: { projectId: id } }),
    prisma.project.delete({ where: { id } }),
  ]);

  await logAudit({
    userId: req.user!.userId,
    action: "DELETE",
    entity: "Project",
    entityId: id,
    details: { name: project.name },
  });

  res.json({ success: true, data: { message: "Project deleted" } });
}

export async function updateProjectAssets(req: Request, res: Response): Promise<void> {
  const projectId = String(req.params.id);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw createError(404, "Project not found");

  const { gitRepo, productionUrl, stagingUrl, documentation, database, apiCollection, designFiles, customAssets } = req.body;

  const assets = await (prisma.asset as any).upsert({
    where: { projectId },
    update: {
      gitRepo: gitRepo !== undefined ? (gitRepo || null) : undefined,
      productionUrl: productionUrl !== undefined ? (productionUrl || null) : undefined,
      stagingUrl: stagingUrl !== undefined ? (stagingUrl || null) : undefined,
      documentation: documentation !== undefined ? (documentation || null) : undefined,
      database: database !== undefined ? (database || null) : undefined,
      apiCollection: apiCollection !== undefined ? (apiCollection || null) : undefined,
      designFiles: designFiles !== undefined ? (designFiles || null) : undefined,
      customAssets: customAssets !== undefined ? customAssets : undefined,
    },
    create: {
      projectId,
      gitRepo: gitRepo || null,
      productionUrl: productionUrl || null,
      stagingUrl: stagingUrl || null,
      documentation: documentation || null,
      database: database || null,
      apiCollection: apiCollection || null,
      designFiles: designFiles || null,
      customAssets: customAssets || null,
    },
  });

  await logAudit({
    userId: req.user!.userId,
    action: "UPDATE",
    entity: "Asset",
    entityId: assets.id,
    details: { projectId, assets: req.body },
  });

  res.json({ success: true, data: assets });
}
