import { z } from "zod";

export const createTemplateSchema = z.object({
  type: z.string().min(1, "Type is required"),
  design: z.string().min(1, "Design is required"),
  isDefault: z.boolean().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  customHtml: z.string().optional(),
  customCss: z.string().optional(),
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export const updateTemplateSchema = z.object({
  type: z.string().optional(),
  design: z.string().optional(),
  isDefault: z.boolean().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  customHtml: z.string().optional(),
  customCss: z.string().optional(),
  workspaceId: z.string().optional(),
});
