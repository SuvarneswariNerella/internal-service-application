import { z } from "zod";

export const createServerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  provider: z.string().min(1, "Provider is required"),
  ipAddress: z.string().optional(),
  purchaseDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  renewalCost: z.number().optional().nullable(),
  renewalFrequency: z.string().optional(),
  status: z.enum(["ACTIVE", "EXPIRING_SOON", "EXPIRED", "DECOMMISSIONED"]).optional(),
  clientId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
});

export const updateServerSchema = z.object({
  name: z.string().min(1).optional(),
  provider: z.string().min(1).optional(),
  ipAddress: z.string().optional(),
  purchaseDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  renewalCost: z.number().optional().nullable(),
  renewalFrequency: z.string().optional(),
  status: z.enum(["ACTIVE", "EXPIRING_SOON", "EXPIRED", "DECOMMISSIONED"]).optional(),
  clientId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
});
