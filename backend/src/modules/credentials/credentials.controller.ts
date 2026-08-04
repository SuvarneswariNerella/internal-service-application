import { Request, Response } from "express";
import prisma from "@/config/db";
import { createError } from "@/middleware/errorHandler";
import { encrypt, decrypt } from "@/utils/encryption";
import { logAudit } from "@/utils/audit";

export async function listCredentials(req: Request, res: Response): Promise<void> {
  const projectId = String(req.params.projectId);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw createError(404, "Project not found");

  const credentials = await prisma.credential.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  const masked = credentials.map((c) => ({
    ...c,
    password: "••••••••",
  }));

  res.json({ success: true, data: masked });
}

export async function createCredential(req: Request, res: Response): Promise<void> {
  const projectId = String(req.params.projectId);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw createError(404, "Project not found");

  const encryptedPassword = encrypt(req.body.password);

  const credential = await prisma.credential.create({
    data: {
      projectId,
      portalName: req.body.portalName,
      username: req.body.username,
      password: encryptedPassword,
      notes: req.body.notes,
      assetCategory: req.body.assetCategory,
      loginUrl: req.body.loginUrl,
      minRoleAccess: req.body.minRoleAccess,
    },
  });

  await logAudit({
    userId: req.user!.userId,
    action: "CREATE",
    entity: "Credential",
    entityId: credential.id,
    details: { portalName: credential.portalName, projectId },
  });

  res.status(201).json({
    success: true,
    data: { ...credential, password: "••••••••" },
  });
}

export async function updateCredential(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const credential = await prisma.credential.findUnique({ where: { id } });
  if (!credential) throw createError(404, "Credential not found");

  const updateData: Record<string, string> = {};
  if (req.body.portalName) updateData.portalName = req.body.portalName;
  if (req.body.username) updateData.username = req.body.username;
  if (req.body.password) updateData.password = encrypt(req.body.password);
  if (req.body.notes !== undefined) updateData.notes = req.body.notes;
  if (req.body.assetCategory !== undefined) updateData.assetCategory = req.body.assetCategory;
  if (req.body.loginUrl !== undefined) updateData.loginUrl = req.body.loginUrl;
  if (req.body.minRoleAccess !== undefined) updateData.minRoleAccess = req.body.minRoleAccess;

  const updated = await prisma.credential.update({
    where: { id },
    data: updateData,
  });

  await logAudit({
    userId: req.user!.userId,
    action: "UPDATE",
    entity: "Credential",
    entityId: id,
    details: { portalName: updated.portalName, changes: { ...req.body, password: req.body.password ? "[REDACTED]" : undefined } },
  });

  res.json({
    success: true,
    data: { ...updated, password: "••••••••" },
  });
}

export async function deleteCredential(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const credential = await prisma.credential.findUnique({ where: { id } });
  if (!credential) throw createError(404, "Credential not found");

  await prisma.credential.delete({ where: { id } });

  await logAudit({
    userId: req.user!.userId,
    action: "DELETE",
    entity: "Credential",
    entityId: id,
    details: { portalName: credential.portalName },
  });

  res.json({ success: true, data: { message: "Credential deleted" } });
}

export async function revealCredential(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const credential = await prisma.credential.findUnique({ where: { id } });
  if (!credential) throw createError(404, "Credential not found");

  const decryptedPassword = decrypt(credential.password);

  await logAudit({
    userId: req.user!.userId,
    action: "REVEAL_CREDENTIAL",
    entity: "Credential",
    entityId: credential.id,
    details: { portalName: credential.portalName },
  });

  res.json({
    success: true,
    data: { ...credential, password: decryptedPassword },
  });
}
