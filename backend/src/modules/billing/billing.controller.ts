import { Request, Response } from "express";
import prisma from "@/config/db";
import { createError } from "@/middleware/errorHandler";
import { logAudit } from "@/utils/audit";

export async function listBilling(req: Request, res: Response): Promise<void> {
  const projectId = String(req.params.projectId);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw createError(404, "Project not found");

  const billing = await prisma.billing.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: billing });
}

export async function createBilling(req: Request, res: Response): Promise<void> {
  const projectId = String(req.params.projectId);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw createError(404, "Project not found");

  const billing = await prisma.billing.create({
    data: {
      projectId,
      billingType: req.body.billingType,
      amount: req.body.amount,
      currency: req.body.currency,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      paymentStatus: req.body.paymentStatus,
      invoiceNumber: req.body.invoiceNumber,
    },
  });

  await logAudit({
    userId: req.user!.userId,
    action: "CREATE",
    entity: "Billing",
    entityId: billing.id,
    details: { billingType: billing.billingType, amount: Number(billing.amount), projectId },
  });

  res.status(201).json({ success: true, data: billing });
}

export async function updateBilling(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const billing = await prisma.billing.findUnique({ where: { id } });
  if (!billing) throw createError(404, "Billing record not found");

  const updateData: Record<string, unknown> = {};
  if (req.body.billingType) updateData.billingType = req.body.billingType;
  if (req.body.amount) updateData.amount = req.body.amount;
  if (req.body.currency) updateData.currency = req.body.currency;
  if (req.body.dueDate !== undefined) updateData.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
  if (req.body.paymentStatus) updateData.paymentStatus = req.body.paymentStatus;
  if (req.body.invoiceNumber !== undefined) updateData.invoiceNumber = req.body.invoiceNumber;

  const updated = await prisma.billing.update({ where: { id }, data: updateData });

  await logAudit({
    userId: req.user!.userId,
    action: "UPDATE",
    entity: "Billing",
    entityId: id,
    details: { billingType: updated.billingType, changes: req.body },
  });

  res.json({ success: true, data: updated });
}

export async function deleteBilling(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const billing = await prisma.billing.findUnique({ where: { id } });
  if (!billing) throw createError(404, "Billing record not found");

  await prisma.billing.delete({ where: { id } });

  await logAudit({
    userId: req.user!.userId,
    action: "DELETE",
    entity: "Billing",
    entityId: id,
    details: { billingType: billing.billingType, amount: Number(billing.amount) },
  });

  res.json({ success: true, data: { message: "Billing record deleted" } });
}
