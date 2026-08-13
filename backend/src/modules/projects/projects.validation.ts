import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  technology: z.string().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "ARCHIVED"]).optional(),
  clientId: z.string().min(1, "Client ID is required"),
  managerId: z.string().optional(),
  workspaceId: z.string().optional().nullable(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  technology: z.string().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "ARCHIVED"]).optional(),
  clientId: z.string().min(1).optional(),
  managerId: z.string().optional(),
  workspaceId: z.string().optional().nullable(),
});
