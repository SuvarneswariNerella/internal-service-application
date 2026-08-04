import { Request, Response } from "express";
import prisma from "@/config/db";

export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  const page = parseInt(String(req.query.page) || "1");
  const pageSize = parseInt(String(req.query.pageSize) || "20");
  const action = String(req.query.action || "");
  const entity = String(req.query.entity || "");
  const userId = String(req.query.userId || "");

  const where: Record<string, unknown> = {};
  if (action) where.action = action;
  if (entity) where.entity = entity;
  if (userId) where.userId = userId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function listLoginLogs(req: Request, res: Response): Promise<void> {
  const page = parseInt(String(req.query.page) || "1");
  const pageSize = parseInt(String(req.query.pageSize) || "20");
  const userId = String(req.query.userId || "");
  const success = req.query.success;

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (success !== undefined) where.success = success === "true";

  const [logs, total] = await Promise.all([
    prisma.loginLog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.loginLog.count({ where }),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
