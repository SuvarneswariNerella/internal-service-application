import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional().default(""),
  contactPerson: z.string().optional().default(""),
  email: z.string().email("Invalid email address"),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  pincode: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional().default("ACTIVE"),
  retainer: z.number().nullable().optional().default(0),
  accountManagerLead: z.string().nullable().optional(),
  workspaceId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  company: z.string().nullable().optional(),
  contactPerson: z.string().nullable().optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  pincode: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
  retainer: z.number().nullable().optional(),
  accountManagerLead: z.string().nullable().optional(),
  workspaceId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
