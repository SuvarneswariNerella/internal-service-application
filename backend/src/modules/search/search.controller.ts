import { Request, Response } from "express";
import prisma from "@/config/db";

export async function globalSearch(req: Request, res: Response): Promise<void> {
  const query = String(req.query.q || "").trim();

  if (!query) {
    res.json({ success: true, data: { clients: [], projects: [], servers: [], domains: [], urls: [], billing: [] } });
    return;
  }

  const searchPattern = { contains: query };

  const [clients, projects, servers, domains, urls] = await Promise.all([
    prisma.client.findMany({
      where: {
        OR: [
          { name: searchPattern },
          { company: searchPattern },
          { email: searchPattern },
          { contactPerson: searchPattern },
        ],
      },
      take: 10,
      select: { id: true, name: true, company: true, email: true, status: true },
    }),
    prisma.project.findMany({
      where: {
        OR: [
          { name: searchPattern },
          { description: searchPattern },
          { technology: searchPattern },
        ],
      },
      take: 10,
      select: { id: true, name: true, status: true, technology: true, client: { select: { name: true } } },
    }),
    prisma.server.findMany({
      where: {
        OR: [
          { name: searchPattern },
          { provider: searchPattern },
          { ipAddress: searchPattern },
        ],
      },
      take: 10,
      select: { id: true, name: true, provider: true, status: true, expiryDate: true, client: { select: { name: true } } },
    }),
    prisma.domain.findMany({
      where: {
        OR: [
          { domain: searchPattern },
          { registrar: searchPattern },
          { dnsProvider: searchPattern },
        ],
      },
      take: 10,
      select: { id: true, domain: true, registrar: true, expirationDate: true, client: { select: { name: true } } },
    }),
    prisma.shortUrl.findMany({
      where: {
        OR: [
          { originalUrl: searchPattern },
          { shortCode: searchPattern },
          { alias: searchPattern },
        ],
      },
      take: 10,
      select: { id: true, shortCode: true, originalUrl: true, clickCount: true, alias: true },
    }),
  ]);

  res.json({
    success: true,
    data: { clients, projects, servers, domains, urls },
  });
}
