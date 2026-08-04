import { PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

function generateShortCode(): string {
  return crypto.randomBytes(4).toString("base64url").slice(0, 8);
}

export async function createShortUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      originalUrl,
      alias,
      expiryDate,
      clientId,
      projectId,
      category,
      domainId,
      password,
      maxClicks,
      redirectType,
      status,
      tags,
      notes,
    } = req.body;

    let shortCode = alias || generateShortCode();

    if (alias) {
      const existing = await prisma.shortUrl.findUnique({ where: { shortCode } });
      if (existing) {
        return res.status(409).json({ error: "Alias already in use" });
      }
    }

    const createdBy = (req as any).user?.userId || null;
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const url = await prisma.shortUrl.create({
      data: {
        originalUrl,
        shortCode,
        alias: alias || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        clientId: clientId || null,
        projectId: projectId || null,
        category: category || null,
        domainId: domainId || null,
        passwordHash,
        maxClicks: maxClicks ? Number(maxClicks) : null,
        redirectType: redirectType || "302",
        status: status || "ACTIVE",
        tags: tags || null,
        notes: notes || null,
        createdBy,
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true } },
        domain: { select: { id: true, domain: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(201).json({ success: true, data: url });
  } catch (error) {
    return next(error);
  }
}

export async function updateShortUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const existing = await prisma.shortUrl.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Short URL not found" });

    const {
      originalUrl,
      alias,
      expiryDate,
      clientId,
      projectId,
      category,
      domainId,
      password,
      maxClicks,
      redirectType,
      status,
      tags,
      notes,
    } = req.body;

    const updateData: Record<string, unknown> = {};
    if (originalUrl) updateData.originalUrl = originalUrl;
    if (alias !== undefined) updateData.alias = alias || null;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (clientId !== undefined) updateData.clientId = clientId || null;
    if (projectId !== undefined) updateData.projectId = projectId || null;
    if (category !== undefined) updateData.category = category || null;
    if (domainId !== undefined) updateData.domainId = domainId || null;
    if (password !== undefined) {
      updateData.passwordHash = password ? await bcrypt.hash(password, 10) : null;
    }
    if (maxClicks !== undefined) updateData.maxClicks = maxClicks ? Number(maxClicks) : null;
    if (redirectType) updateData.redirectType = redirectType;
    if (status) updateData.status = status;
    if (tags !== undefined) updateData.tags = tags || null;
    if (notes !== undefined) updateData.notes = notes || null;

    const url = await prisma.shortUrl.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true } },
        domain: { select: { id: true, domain: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    return res.json({ success: true, data: url });
  } catch (error) {
    return next(error);
  }
}

export async function listUrls(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const pageSize = Math.max(1, Math.min(1000, parseInt(String(req.query.pageSize || "10"), 10) || 10));
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId : "";
    const projectId = typeof req.query.projectId === "string" ? req.query.projectId : "";
    const status = typeof req.query.status === "string" ? req.query.status : "";

    const where: any = {};
    if (search) {
      where.OR = [
        { originalUrl: { contains: search } },
        { shortCode: { contains: search } },
        { alias: { contains: search } },
        { category: { contains: search } },
        { tags: { contains: search } },
      ];
    }
    if (clientId) where.clientId = clientId;
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.shortUrl.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, company: true } },
          project: { select: { id: true, name: true } },
          domain: { select: { id: true, domain: true } },
          creator: { select: { id: true, name: true, email: true } },
          _count: { select: { clicks: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.shortUrl.count({ where }),
    ]);

    return res.json({
      success: true,
      data,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getUrlById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const url = await prisma.shortUrl.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true } },
        domain: { select: { id: true, domain: true } },
        creator: { select: { id: true, name: true, email: true } },
        _count: { select: { clicks: true } },
      },
    });
    if (!url) return res.status(404).json({ error: "URL not found" });
    return res.json({ success: true, data: url });
  } catch (error) {
    return next(error);
  }
}

export async function getUrlStats(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const url = await prisma.shortUrl.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        domain: { select: { id: true, domain: true } },
        clicks: { orderBy: { clickedAt: "desc" }, take: 100 },
        _count: { select: { clicks: true } },
      },
    });
    if (!url) return res.status(404).json({ error: "URL not found" });

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [clicks24h, clicks7d, clicks30d, totalClicks] = await Promise.all([
      prisma.clickLog.count({ where: { urlId: id, clickedAt: { gte: last24h } } }),
      prisma.clickLog.count({ where: { urlId: id, clickedAt: { gte: last7d } } }),
      prisma.clickLog.count({ where: { urlId: id, clickedAt: { gte: last30d } } }),
      prisma.clickLog.count({ where: { urlId: id } }),
    ]);

    const refererCounts = await prisma.clickLog.groupBy({
      by: ["referer"],
      where: { urlId: id },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    return res.json({
      success: true,
      data: {
        url,
        stats: { totalClicks, clicks24h, clicks7d, clicks30d, refererCounts },
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const url = await prisma.shortUrl.findUnique({ where: { id } });
    if (!url) return res.status(404).json({ error: "URL not found" });

    await prisma.clickLog.deleteMany({ where: { urlId: id } });
    await prisma.shortUrl.delete({ where: { id } });
    return res.json({ success: true, message: "URL deleted" });
  } catch (error) {
    return next(error);
  }
}

export async function redirectShortUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const shortCode = req.params.shortCode as string;
    const url = await prisma.shortUrl.findUnique({
      where: { shortCode },
      include: { client: true, project: true, domain: true },
    });

    if (!url) {
      return res.status(404).send(`
        <!Token html>
        <html>
        <head><title>404 - Not Found</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f9fafb;color:#374151;}.card{background:#fff;padding:2rem;border-radius:1rem;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1);text-align:center;max-width:400px;}</style></head>
        <body><div class="card"><h2 style="color:#ef4444;margin-top:0;">404 Not Found</h2><p>The short link <strong>/s/${shortCode}</strong> does not exist or has been removed.</p></div></body>
        </html>
      `);
    }

    if (url.status === "PAUSED") {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Link Paused</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f9fafb;color:#374151;}.card{background:#fff;padding:2rem;border-radius:1rem;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1);text-align:center;max-width:400px;}</style></head>
        <body><div class="card"><h2 style="color:#f59e0b;margin-top:0;">Link Paused</h2><p>This short link is currently paused by the administrator.</p></div></body>
        </html>
      `);
    }

    if (url.status === "EXPIRED" || (url.expiryDate && new Date() > url.expiryDate)) {
      if (url.status !== "EXPIRED") {
        await prisma.shortUrl.update({ where: { id: url.id }, data: { status: "EXPIRED" } });
      }
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Link Expired</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f9fafb;color:#374151;}.card{background:#fff;padding:2rem;border-radius:1rem;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1);text-align:center;max-width:400px;}</style></head>
        <body><div class="card"><h2 style="color:#ef4444;margin-top:0;">Link Expired</h2><p>This short link has expired.</p></div></body>
        </html>
      `);
    }

    if (url.maxClicks && url.clickCount >= url.maxClicks) {
      if (url.status !== "EXPIRED") {
        await prisma.shortUrl.update({ where: { id: url.id }, data: { status: "EXPIRED" } });
      }
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Click Limit Reached</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f9fafb;color:#374151;}.card{background:#fff;padding:2rem;border-radius:1rem;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1);text-align:center;max-width:400px;}</style></head>
        <body><div class="card"><h2 style="color:#ef4444;margin-top:0;">Click Limit Reached</h2><p>This short link has reached its maximum allowed clicks (${url.maxClicks}).</p></div></body>
        </html>
      `);
    }

    // Password verification logic
    if (url.passwordHash) {
      const providedPassword = (req.query.password || req.body?.password || req.headers["x-url-password"]) as string;
      let isMatch = false;
      if (providedPassword) {
        isMatch = await bcrypt.compare(providedPassword, url.passwordHash);
      }

      if (!isMatch) {
        const hasError = !!providedPassword;
        return res.status(401).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Protected Short Link</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f3f4f6; color: #111827; }
              .card { background: #ffffff; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); width: 100%; max-width: 380px; }
              h2 { margin-top: 0; font-size: 1.25rem; font-weight: 700; color: #111827; }
              p { font-size: 0.875rem; color: #4b5563; margin-bottom: 1.5rem; }
              input { width: 100%; box-sizing: border-box; padding: 0.625rem 0.875rem; border: 1px solid #d1d5db; border-radius: 0.5rem; margin-bottom: 1rem; font-size: 0.875rem; }
              input:focus { outline: 2px solid #0052ff; border-color: transparent; }
              button { width: 100%; padding: 0.625rem; background: #0052ff; color: white; border: none; border-radius: 0.5rem; font-weight: 600; font-size: 0.875rem; cursor: pointer; }
              button:hover { background: #0041cc; }
              .error { color: #dc2626; font-size: 0.75rem; font-weight: 600; margin-bottom: 0.75rem; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>Password Required</h2>
              <p>This link is password protected. Enter the password to continue.</p>
              ${hasError ? '<div class="error">Incorrect password. Please try again.</div>' : ''}
              <form method="GET" action="/s/${shortCode}">
                <input type="password" name="password" placeholder="Enter password" required autofocus />
                <button type="submit">Access Link</button>
              </form>
            </div>
          </body>
          </html>
        `);
      }
    }

    // Increment click count & record log
    await prisma.shortUrl.update({
      where: { id: url.id },
      data: { clickCount: { increment: 1 } },
    });

    await prisma.clickLog.create({
      data: {
        urlId: url.id,
        ip: (req.ip || req.socket.remoteAddress || "") as string,
        userAgent: (req.get("User-Agent") || "") as string,
        referer: (req.get("Referer") || "") as string,
      },
    });

    const statusCode = parseInt(url.redirectType || "302", 10) === 301 ? 301 : 302;
    return res.redirect(statusCode, url.originalUrl);
  } catch (error) {
    return next(error);
  }
}
