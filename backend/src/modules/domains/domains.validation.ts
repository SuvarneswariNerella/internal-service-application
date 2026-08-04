import { z } from "zod";

export const createDomainSchema = z.object({
  domain: z.string().min(1, "Domain is required"),
  registrar: z.string().optional(),
  purchaseDate: z.string().optional().nullable(),
  expirationDate: z.string().optional().nullable(),
  sslExpiration: z.string().optional().nullable(),
  renewalCost: z.number().optional().nullable(),
  dnsProvider: z.string().optional(),
  autoRenewal: z.boolean().optional(),
  clientId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
});

export const updateDomainSchema = z.object({
  domain: z.string().min(1).optional(),
  registrar: z.string().optional(),
  purchaseDate: z.string().optional().nullable(),
  expirationDate: z.string().optional().nullable(),
  sslExpiration: z.string().optional().nullable(),
  renewalCost: z.number().optional().nullable(),
  dnsProvider: z.string().optional(),
  autoRenewal: z.boolean().optional(),
  clientId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
});
