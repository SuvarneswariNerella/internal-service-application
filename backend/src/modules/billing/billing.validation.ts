import { z } from "zod";

export const createBillingSchema = z.object({
  billingType: z.string().min(1, "Billing type is required"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  paymentStatus: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  invoiceNumber: z.string().optional(),
});

export const updateBillingSchema = z.object({
  billingType: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  paymentStatus: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  invoiceNumber: z.string().optional(),
});
