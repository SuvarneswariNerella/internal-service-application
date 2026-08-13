import { z } from "zod";

export const createMaintenanceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["MAINTENANCE", "SUPPORT", "BUG", "UPDATE"]).default("MAINTENANCE"),
  status: z.enum(["PENDING", "IN_PROGRESS", "RESOLVED", "CANCELLED"]).default("PENDING"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  scheduledDate: z.string().datetime().optional().nullable(),
  completedDate: z.string().datetime().optional().nullable(),
  targetCompletionDate: z.string().datetime().optional().nullable(),
  clientId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  workspaceId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  assigneeName: z.string().optional().nullable(),
});

export const updateMaintenanceSchema = createMaintenanceSchema.partial();
