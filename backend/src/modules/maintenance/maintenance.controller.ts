import { Request, Response } from "express";
import prisma from "@/config/db";
import { createError } from "@/middleware/errorHandler";
import { logAudit } from "@/utils/audit";

export async function listMaintenanceRecords(req: Request, res: Response): Promise<void> {
  const page = parseInt((req.query.page as string) || "1");
  const pageSize = parseInt((req.query.pageSize as string) || "10");
  const search = (req.query.search as string) || "";
  const status = (req.query.status as string) || "";
  const priority = (req.query.priority as string) || "";
  const clientId = (req.query.clientId as string) || "";
  const projectId = (req.query.projectId as string) || "";
  const workspaceId = (req.query.workspaceId as string) || "";

  const where: any = {};
  
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }
  
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (clientId) where.clientId = clientId;
  if (projectId) where.projectId = projectId;
  if (workspaceId) where.workspaceId = workspaceId;

  const [records, total, allRecordsForStats] = await Promise.all([
    prisma.maintenanceRecord.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
      },
    }),
    prisma.maintenanceRecord.count({ where }),
    prisma.maintenanceRecord.findMany({
      where: { workspaceId: workspaceId || undefined },
      select: { status: true, createdAt: true, completedDate: true, updatedAt: true }
    })
  ]);

  const openTickets = allRecordsForStats.filter(r => r.status !== 'RESOLVED' && r.status !== 'CANCELLED').length;
  const allTickets = allRecordsForStats.length;
  
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0,0,0,0);
  
  const resolvedThisMonth = allRecordsForStats.filter(r => {
    if (r.status !== 'RESOLVED' && r.status !== 'CANCELLED') return false;
    const dateToUse = r.completedDate || r.updatedAt;
    return dateToUse && new Date(dateToUse) >= currentMonthStart;
  }).length;

  let totalResolutionTime = 0;
  let resolvedCount = 0;
  allRecordsForStats.forEach(r => {
    if (r.status === 'RESOLVED' || r.status === 'CANCELLED') {
      const dateToUse = r.completedDate || r.updatedAt;
      if (dateToUse) {
        totalResolutionTime += new Date(dateToUse).getTime() - new Date(r.createdAt).getTime();
        resolvedCount++;
      }
    }
  });
  
  const avgResolutionMs = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;
  const avgResolutionHours = avgResolutionMs / (1000 * 60 * 60);
  let avgResolutionTime = "N/A";
  if (resolvedCount > 0) {
    if (avgResolutionHours < 24) {
      avgResolutionTime = `${Math.round(avgResolutionHours)}h`;
    } else {
      avgResolutionTime = `${Math.round(avgResolutionHours / 24)}d`;
    }
  }

  res.json({
    success: true,
    data: records,
    stats: {
      openTickets,
      resolvedThisMonth,
      avgResolutionTime,
      allTickets
    },
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function getMaintenanceRecord(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const record = await prisma.maintenanceRecord.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, avatar: true } },
      statusHistory: {
        include: { changedBy: { select: { id: true, name: true, avatar: true } } },
        orderBy: { enteredAt: "asc" }
      },
      comments: { include: { user: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!record) throw createError(404, "Maintenance record not found");
  res.json({ success: true, data: record });
}

export async function createMaintenanceRecord(req: Request, res: Response): Promise<void> {
  const { title, description, type, status, priority, scheduledDate, completedDate, targetCompletionDate, clientId, projectId, workspaceId, assigneeId, assigneeName } = req.body;

  let assignedClientId = clientId || null;

  // Auto-assign client if projectId is provided
  if (projectId && !clientId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw createError(404, "Project not found");
    assignedClientId = project.clientId;
  }

  let ticketNumber = `TKT-${Math.floor(Date.now() / 1000)}`;
  if (workspaceId) {
    const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (ws) {
      ticketNumber = `${ws.ticketPrefix || 'TKT'}-${ws.ticketNextSeq}`;
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { ticketNextSeq: { increment: 1 } },
      });
    }
  } else {
    // Generate sequential TKT number if no workspace is provided
    const lastRecord = await prisma.maintenanceRecord.findFirst({
      where: { ticketNumber: { startsWith: 'TKT-' } },
      orderBy: { createdAt: 'desc' }
    });
    let nextSeq = 1001;
    if (lastRecord && lastRecord.ticketNumber && lastRecord.ticketNumber.includes('-')) {
      const parts = lastRecord.ticketNumber.split('-');
      if (parts.length > 1) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num < 1000000) {
          nextSeq = num + 1;
        }
      }
    }
    ticketNumber = `TKT-${nextSeq}`;
  }

  let finalCompletedDate = completedDate ? new Date(completedDate) : null;
  if (!finalCompletedDate && (status === "RESOLVED" || status === "CANCELLED")) {
    finalCompletedDate = new Date();
  }

  const newRecord = await prisma.maintenanceRecord.create({
    data: {
      ticketNumber,
      title,
      description,
      type: type || "MAINTENANCE",
      status: status || "PENDING",
      priority: priority || "MEDIUM",
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      completedDate: finalCompletedDate,
      targetCompletionDate: targetCompletionDate ? new Date(targetCompletionDate) : null,
      clientId: assignedClientId,
      projectId: projectId || null,
      workspaceId: workspaceId || null,
      assigneeId: assigneeId || null,
      // @ts-ignore
      assigneeName: assigneeName || null,
      statusHistory: {
        create: {
          status: status || "PENDING",
          changedById: req.user!.userId,
        }
      }
    },
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, avatar: true } },
      statusHistory: {
        include: { changedBy: { select: { id: true, name: true, avatar: true } } },
        orderBy: { enteredAt: "asc" }
      }
    },
  });

  await logAudit({
    userId: req.user!.userId,
    action: "CREATE",
    entity: "MaintenanceRecord",
    entityId: newRecord.id,
    details: { title: newRecord.title, type: newRecord.type },
  });

  res.status(201).json({ success: true, data: newRecord });
}

export async function updateMaintenanceRecord(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const record = await prisma.maintenanceRecord.findUnique({ where: { id } });
  if (!record) throw createError(404, "Maintenance record not found");

  const updateData: any = {};
  if (req.body.title) updateData.title = req.body.title;
  if (req.body.description !== undefined) updateData.description = req.body.description;
  if (req.body.type) updateData.type = req.body.type;
  if (req.body.priority) updateData.priority = req.body.priority;
  if (req.body.scheduledDate !== undefined) updateData.scheduledDate = req.body.scheduledDate ? new Date(req.body.scheduledDate) : null;
  if (req.body.completedDate !== undefined) updateData.completedDate = req.body.completedDate ? new Date(req.body.completedDate) : null;
  if (req.body.targetCompletionDate !== undefined) updateData.targetCompletionDate = req.body.targetCompletionDate ? new Date(req.body.targetCompletionDate) : null;
  if (req.body.clientId !== undefined) updateData.clientId = req.body.clientId || null;
  if (req.body.projectId !== undefined) updateData.projectId = req.body.projectId || null;
  if (req.body.workspaceId !== undefined) updateData.workspaceId = req.body.workspaceId || null;
  if (req.body.assigneeId !== undefined) updateData.assigneeId = req.body.assigneeId || null;
  // @ts-ignore
  if (req.body.assigneeName !== undefined) updateData.assigneeName = req.body.assigneeName || null;

  if (req.body.status) {
    updateData.status = req.body.status;
    if (req.body.status === "RESOLVED" || req.body.status === "CANCELLED") {
      if (updateData.completedDate === undefined && !record.completedDate) {
        updateData.completedDate = new Date();
      }
    } else {
      if (updateData.completedDate === undefined && record.completedDate) {
        updateData.completedDate = null;
      }
    }
    
    if (req.body.status !== record.status) {
      const lastHistory = await prisma.ticketStatusHistory.findFirst({
        where: { maintenanceRecordId: id, exitedAt: null },
        orderBy: { enteredAt: 'desc' }
      });
      
      if (lastHistory) {
        const now = new Date();
        const durationMs = now.getTime() - lastHistory.enteredAt.getTime();
        const durationMinutes = Math.floor(durationMs / 60000);
        
        await prisma.ticketStatusHistory.update({
          where: { id: lastHistory.id },
          data: { exitedAt: now, durationMinutes }
        });
      }
      
      updateData.statusHistory = {
        create: {
          status: req.body.status,
          changedById: req.user!.userId,
        }
      };
    }
  }
  if (req.body.projectId) {
    const project = await prisma.project.findUnique({ where: { id: req.body.projectId } });
    if (!project) throw createError(404, "Project not found");
    if (!updateData.clientId && project.clientId) {
      updateData.clientId = project.clientId;
    }
  }

  const updatedRecord = await prisma.maintenanceRecord.update({
    where: { id },
    data: updateData,
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, avatar: true } },
      statusHistory: {
        include: { changedBy: { select: { id: true, name: true, avatar: true } } },
        orderBy: { enteredAt: "asc" }
      }
    },
  });

  await logAudit({
    userId: req.user!.userId,
    action: "UPDATE",
    entity: "MaintenanceRecord",
    entityId: id,
    details: { title: updatedRecord.title, changes: req.body },
  });

  res.json({ success: true, data: updatedRecord });
}

export async function deleteMaintenanceRecord(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const record = await prisma.maintenanceRecord.findUnique({ where: { id } });
  if (!record) throw createError(404, "Maintenance record not found");

  await prisma.maintenanceRecord.delete({ where: { id } });

  await logAudit({
    userId: req.user!.userId,
    action: "DELETE",
    entity: "MaintenanceRecord",
    entityId: id,
    details: { title: record.title },
  });

  res.json({ success: true, data: { message: "Maintenance record deleted" } });
}

export async function addComment(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const { content } = req.body;
  
  const record = await prisma.maintenanceRecord.findUnique({ where: { id } });
  if (!record) throw createError(404, "Maintenance record not found");

  const comment = await prisma.ticketComment.create({
    data: {
      maintenanceRecordId: id,
      userId: req.user!.userId,
      content,
    },
    include: {
      user: { select: { id: true, name: true, avatar: true } }
    }
  });

  res.status(201).json({ success: true, data: comment });
}

