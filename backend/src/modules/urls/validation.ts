import { z } from "zod";

export const createUrlSchema = z.object({
  originalUrl: z.string().url("Invalid URL format"),
  alias: z
    .string()
    .min(2, "Alias must be at least 2 characters")
    .max(100, "Alias max length is 100 characters")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Alias can only contain letters, numbers, dots, hyphens, and underscores")
    .optional()
    .nullable()
    .or(z.literal("")),
  expiryDate: z.string().optional().nullable().or(z.literal("")),
  clientId: z.string().optional().nullable().or(z.literal("")),
  projectId: z.string().optional().nullable().or(z.literal("")),
  category: z.string().optional().nullable().or(z.literal("")),
  domainId: z.string().optional().nullable().or(z.literal("")),
  password: z.string().optional().nullable().or(z.literal("")),
  maxClicks: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().int().positive().optional()
  ),
  redirectType: z.enum(["301", "302"]).optional().default("302"),
  status: z.enum(["ACTIVE", "PAUSED", "EXPIRED"]).optional().default("ACTIVE"),
  tags: z.string().optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable().or(z.literal("")),
});

export const listUrlsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(10),
  search: z.string().optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  status: z.string().optional(),
});
