import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be a 6-digit number").optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
  retainer: z.number().optional(),
  accountManagerLead: z.string().optional(),
  workspaceId: z.string().optional(),
  notes: z.string().optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
  contactPerson: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be a 6-digit number").optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
  retainer: z.number().optional(),
  accountManagerLead: z.string().optional(),
  workspaceId: z.string().optional(),
  notes: z.string().optional(),
});
