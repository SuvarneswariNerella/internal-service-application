import { z } from "zod";

export const qrCodeSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  type: z.enum(["URL", "TEXT", "EMAIL", "PHONE", "SMS", "WIFI", "VCARD"]).default("URL"),
  content: z.string().optional().default(""),
  rawContent: z.any().optional(),
  clientId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  shortUrlId: z.string().nullable().optional(),
  format: z.enum(["SVG", "PNG"]).optional().default("SVG"),
  size: z.coerce.number().int().min(64).max(1024).optional().default(256),
  foregroundColor: z.string().optional().default("#000000"),
  backgroundColor: z.string().optional().default("#FFFFFF"),
  errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional().default("M"),
  expiryDate: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED", "EXPIRED"]).optional().default("ACTIVE"),
  tags: z.string().nullable().optional(),
  saveToLibrary: z.boolean().optional().default(true),
  workspaceId: z.string().nullable().optional(),
});

export const previewQrSchema = z.object({
  type: z.enum(["URL", "TEXT", "EMAIL", "PHONE", "SMS", "WIFI", "VCARD"]).default("URL"),
  content: z.string().optional().default(""),
  rawContent: z.any().optional(),
  format: z.enum(["SVG", "PNG"]).optional().default("SVG"),
  size: z.coerce.number().int().min(64).max(1024).optional().default(256),
  foregroundColor: z.string().optional().default("#000000"),
  backgroundColor: z.string().optional().default("#FFFFFF"),
  errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional().default("M"),
});
