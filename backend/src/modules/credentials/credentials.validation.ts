import { z } from "zod";

export const createCredentialSchema = z.object({
  portalName: z.string().min(1, "Portal name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  notes: z.string().optional(),
  assetCategory: z.string().optional(),
  loginUrl: z.string().optional(),
  minRoleAccess: z.string().optional(),
});

export const updateCredentialSchema = z.object({
  portalName: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  notes: z.string().optional(),
  assetCategory: z.string().optional(),
  loginUrl: z.string().optional(),
  minRoleAccess: z.string().optional(),
});
