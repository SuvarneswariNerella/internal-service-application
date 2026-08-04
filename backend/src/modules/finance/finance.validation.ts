import { z } from "zod";

export const financeRecordSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  type: z.string().min(1, "Type is required"),
  title: z.string().min(1, "Title is required"),
  amount: z.number().min(0, "Amount must be a positive number"),
  currency: z.string().min(1, "Currency is required"),
  status: z.string().min(1, "Status is required"),
  dueDate: z.string().optional().nullable(),
  paidDate: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateFinanceRecordSchema = financeRecordSchema.partial();
