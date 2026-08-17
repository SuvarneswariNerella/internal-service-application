import { PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import QRCode from "qrcode";
import crypto from "crypto";

const prisma = new PrismaClient();

export function buildQrEncodedString(type: string, content?: string, rawContent?: any): string {
  let raw: any = rawContent;
  if (typeof rawContent === "string") {
    try {
      raw = JSON.parse(rawContent);
    } catch {
      raw = {};
    }
  }
  raw = raw || {};

  switch (type) {
    case "URL":
      return content || raw.url || "";

    case "TEXT":
      return content || raw.text || "";

    case "EMAIL": {
      const to = raw.to || content || "";
      const subject = raw.subject || "";
      const body = raw.body || "";
      if (!to) return content || "";
      const params: string[] = [];
      if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
      if (body) params.push(`body=${encodeURIComponent(body)}`);
      return `mailto:${to}${params.length > 0 ? "?" + params.join("&") : ""}`;
    }

    case "PHONE": {
      const phone = raw.phone || content || "";
      if (!phone) return content || "";
      return phone.startsWith("tel:") ? phone : `tel:${phone}`;
    }

    case "SMS": {
      const phone = raw.phone || "";
      const message = raw.message || "";
      if (!phone && content) return content;
      return `smsto:${phone}:${message}`;
    }

    case "WIFI": {
      const ssid = raw.ssid || "";
      const password = raw.password || "";
      const enc = raw.encryption === "None" || raw.encryption === "nopass" ? "nopass" : (raw.encryption || "WPA");
      const hidden = raw.hidden ? "true" : "false";
      if (!ssid && content) return content;
      return `WIFI:S:${ssid};T:${enc};P:${password};H:${hidden};;`;
    }

    case "VCARD": {
      const fn = raw.fullName || content || "";
      const phone = raw.phone || "";
      const email = raw.email || "";
      const org = raw.company || "";
      const title = raw.jobTitle || "";
      if (!fn && content) return content;
      return `BEGIN:VCARD\nVERSION:3.0\nN:${fn}\nFN:${fn}\nTEL:${phone}\nEMAIL:${email}\nORG:${org}\nTITLE:${title}\nEND:VCARD`;
    }

    default:
      return content || "";
  }
}

export async function renderQrData(
  encodedContent: string,
  format: string,
  size: number,
  fgColor: string,
  bgColor: string,
  ecLevel: "L" | "M" | "Q" | "H"
): Promise<string> {
  const qrOptions = {
    width: size || 256,
    margin: 2,
    color: { dark: fgColor || "#000000", light: bgColor || "#FFFFFF" },
    errorCorrectionLevel: ecLevel || "M",
  };

  const textToRender = encodedContent || "https://example.com";

  if (format === "SVG") {
    return await QRCode.toString(textToRender, { ...qrOptions, type: "svg" });
  } else {
    return await QRCode.toDataURL(textToRender, qrOptions);
  }
}

export async function previewQrCode(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      type = "URL",
      content = "",
      rawContent,
      format = "SVG",
      size = 256,
      foregroundColor = "#000000",
      backgroundColor = "#FFFFFF",
      errorCorrectionLevel = "M",
    } = req.body;

    const encodedString = buildQrEncodedString(type, content, rawContent);

    const qrData = await renderQrData(
      encodedString,
      format,
      Number(size),
      foregroundColor,
      backgroundColor,
      errorCorrectionLevel as any
    );

    return res.json({
      success: true,
      data: {
        encodedString,
        qrData,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function generateQrCode(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      name,
      type = "URL",
      content = "",
      rawContent,
      clientId,
      projectId,
      shortUrlId,
      format = "SVG",
      size = 256,
      foreground,
      background,
      foregroundColor = "#000000",
      backgroundColor = "#FFFFFF",
      errorCorrectionLevel = "M",
      expiryDate,
      status = "ACTIVE",
      tags,
      workspaceId,
      saveToLibrary = true,
    } = req.body;

    const fg = foregroundColor || foreground || "#000000";
    const bg = backgroundColor || background || "#FFFFFF";

    const finalEncodedContent = buildQrEncodedString(type, content, rawContent);

    const qrData = await renderQrData(
      finalEncodedContent,
      format,
      Number(size),
      fg,
      bg,
      errorCorrectionLevel as any
    );

    let saved: any = null;
    if (saveToLibrary) {
      try {
        saved = await (prisma as any).qrCode.create({
          data: {
            name,
            type,
            content: finalEncodedContent,
            rawContent: rawContent ? rawContent : undefined,
            clientId: clientId || null,
            projectId: projectId || null,
            shortUrlId: shortUrlId || null,
            format,
            size: Number(size),
            foregroundColor: fg,
            backgroundColor: bg,
            errorCorrectionLevel,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            status,
            tags: tags || null,
            workspaceId: workspaceId || null,
          },
          include: {
            client: { select: { id: true, name: true, company: true } },
            project: { select: { id: true, name: true } },
            shortUrl: { select: { id: true, shortCode: true, originalUrl: true } },
          },
        });
      } catch (prismaError) {
        console.warn("[Prisma Create Fallback] Invoking SQL insert due to cached Prisma client model:", prismaError);
        const newId = crypto.randomUUID();
        const rawJsonStr = rawContent ? JSON.stringify(rawContent) : null;
        const expDateVal = expiryDate ? new Date(expiryDate).toISOString().slice(0, 19).replace("T", " ") : null;

        await prisma.$executeRawUnsafe(
          `INSERT INTO QrCode (id, name, type, content, rawContent, clientId, projectId, shortUrlId, workspaceId, format, size, foregroundColor, backgroundColor, errorCorrectionLevel, expiryDate, status, tags, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
          newId,
          name,
          type,
          finalEncodedContent,
          rawJsonStr,
          clientId || null,
          projectId || null,
          shortUrlId || null,
          workspaceId || null,
          format,
          Number(size),
          fg,
          bg,
          errorCorrectionLevel,
          expDateVal,
          status,
          tags || null
        );

        saved = await prisma.qrCode.findUnique({
          where: { id: newId },
          include: {
            client: { select: { id: true, name: true, company: true } },
            project: { select: { id: true, name: true } },
            shortUrl: { select: { id: true, shortCode: true, originalUrl: true } },
          },
        });
      }
    }

    return res.status(201).json({
      success: true,
      data: saved
        ? { ...saved, qrData }
        : {
            id: null,
            name,
            content: finalEncodedContent,
            type,
            format,
            size,
            foregroundColor: fg,
            backgroundColor: bg,
            errorCorrectionLevel,
            status,
            qrData,
          },
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateQrCode(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const existing = await prisma.qrCode.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "QR code not found" });

    const {
      name,
      type,
      content,
      rawContent,
      clientId,
      projectId,
      shortUrlId,
      format,
      size,
      foregroundColor,
      backgroundColor,
      foreground,
      background,
      errorCorrectionLevel,
      expiryDate,
      status,
      tags,
      workspaceId,
    } = req.body;

    const newType = type || existing.type;
    const fg = foregroundColor || foreground || (existing as any).foregroundColor || (existing as any).foreground || "#000000";
    const bg = backgroundColor || background || (existing as any).backgroundColor || (existing as any).background || "#FFFFFF";
    const newFormat = format || existing.format || "SVG";
    const newSize = size !== undefined ? Number(size) : (existing.size || 256);
    const newEcLevel = errorCorrectionLevel || (existing as any).errorCorrectionLevel || "M";

    const finalEncodedContent = buildQrEncodedString(newType, content, rawContent);

    let updated: any = null;
    try {
      updated = await (prisma as any).qrCode.update({
        where: { id },
        data: {
          name: name !== undefined ? name : existing.name,
          type: newType,
          content: finalEncodedContent,
          rawContent: rawContent !== undefined ? rawContent : (existing as any).rawContent,
          clientId: clientId !== undefined ? (clientId || null) : (existing as any).clientId,
          projectId: projectId !== undefined ? (projectId || null) : (existing as any).projectId,
          shortUrlId: shortUrlId !== undefined ? (shortUrlId || null) : (existing as any).shortUrlId,
          format: newFormat,
          size: newSize,
          foregroundColor: fg,
          backgroundColor: bg,
          errorCorrectionLevel: newEcLevel,
          expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : (existing as any).expiryDate,
          status: status || (existing as any).status || "ACTIVE",
          tags: tags !== undefined ? tags : (existing as any).tags,
          workspaceId: workspaceId !== undefined ? (workspaceId || null) : (existing as any).workspaceId,
        },
        include: {
          client: { select: { id: true, name: true, company: true } },
          project: { select: { id: true, name: true } },
          shortUrl: { select: { id: true, shortCode: true, originalUrl: true } },
        },
      });
    } catch (prismaError) {
      console.warn("[Prisma Update Fallback] Invoking SQL update due to cached Prisma client model:", prismaError);
      const rawJsonStr = rawContent !== undefined ? (rawContent ? JSON.stringify(rawContent) : null) : (existing as any).rawContent ? JSON.stringify((existing as any).rawContent) : null;
      const expDateVal = expiryDate !== undefined ? (expiryDate ? new Date(expiryDate).toISOString().slice(0, 19).replace("T", " ") : null) : (existing as any).expiryDate ? new Date((existing as any).expiryDate).toISOString().slice(0, 19).replace("T", " ") : null;

      await prisma.$executeRawUnsafe(
        `UPDATE QrCode SET
          name = ?, type = ?, content = ?, rawContent = ?, clientId = ?, projectId = ?, shortUrlId = ?, workspaceId = ?,
          format = ?, size = ?, foregroundColor = ?, backgroundColor = ?, errorCorrectionLevel = ?,
          expiryDate = ?, status = ?, tags = ?, updatedAt = NOW(3)
         WHERE id = ?`,
        name !== undefined ? name : existing.name,
        newType,
        finalEncodedContent,
        rawJsonStr,
        clientId !== undefined ? (clientId || null) : (existing as any).clientId,
        projectId !== undefined ? (projectId || null) : (existing as any).projectId,
        shortUrlId !== undefined ? (shortUrlId || null) : (existing as any).shortUrlId,
        workspaceId !== undefined ? (workspaceId || null) : (existing as any).workspaceId,
        newFormat,
        newSize,
        fg,
        bg,
        newEcLevel,
        expDateVal,
        status || (existing as any).status || "ACTIVE",
        tags !== undefined ? tags : (existing as any).tags,
        id
      );

      updated = await prisma.qrCode.findUnique({
        where: { id },
        include: {
          client: { select: { id: true, name: true, company: true } },
          project: { select: { id: true, name: true } },
          shortUrl: { select: { id: true, shortCode: true, originalUrl: true } },
        },
      });
    }

    const qrData = await renderQrData(
      updated.content,
      updated.format || "SVG",
      updated.size || 256,
      updated.foregroundColor || "#000000",
      updated.backgroundColor || "#FFFFFF",
      (updated.errorCorrectionLevel || "M") as any
    );

    return res.json({
      success: true,
      data: { ...updated, qrData },
    });
  } catch (error) {
    return next(error);
  }
}

export async function listQrCodes(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, pageSize = 50, search, clientId, projectId, workspaceId, type, status } = req.query as any;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { content: { contains: search } },
        { tags: { contains: search } },
      ];
    }
    if (clientId) where.clientId = clientId;
    if (projectId) where.projectId = projectId;
    if (workspaceId) where.workspaceId = workspaceId;
    if (type) where.type = type;
    if (status) where.status = status;
    where.shortUrlId = null; // Exclude QR codes created for URL shortener

    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    let data: any[] = [];
    let total = 0;

    try {
      [data, total] = await Promise.all([
        (prisma as any).qrCode.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: "desc" },
          include: {
            client: { select: { id: true, name: true, company: true } },
            project: { select: { id: true, name: true } },
            shortUrl: { select: { id: true, shortCode: true, originalUrl: true } },
          },
        }),
        (prisma as any).qrCode.count({ where }),
      ]);
    } catch {
      // Fallback SQL query if prisma client model is cached
      const rawRows: any = await prisma.$queryRawUnsafe(`SELECT * FROM QrCode WHERE shortUrlId IS NULL ORDER BY createdAt DESC LIMIT ? OFFSET ?`, take, skip);
      const countRes: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as total FROM QrCode WHERE shortUrlId IS NULL`);
      total = Number(countRes[0]?.total || 0);
      data = Array.isArray(rawRows) ? rawRows : [];
    }

    // Attach qrData thumbnails to list items
    const itemsWithQrData = await Promise.all(
      data.map(async (qr) => {
        try {
          const qrData = await renderQrData(
            qr.content,
            qr.format || "SVG",
            qr.size || 256,
            qr.foregroundColor || qr.foreground || "#000000",
            qr.backgroundColor || qr.background || "#FFFFFF",
            (qr.errorCorrectionLevel || "M") as any
          );
          return { ...qr, qrData };
        } catch {
          return { ...qr, qrData: "" };
        }
      })
    );

    return res.json({
      success: true,
      data: itemsWithQrData,
      pagination: { page: Number(page), pageSize: Number(pageSize), total, totalPages: Math.ceil(total / take) },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getQrCodeById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    let qr: any = null;
    try {
      qr = await (prisma as any).qrCode.findUnique({
        where: { id },
        include: {
          client: { select: { id: true, name: true, company: true } },
          project: { select: { id: true, name: true } },
          shortUrl: { select: { id: true, shortCode: true, originalUrl: true } },
        },
      });
    } catch {
      const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM QrCode WHERE id = ? LIMIT 1`, id);
      qr = rows?.[0] || null;
    }

    if (!qr) return res.status(404).json({ error: "QR code not found" });

    const qrData = await renderQrData(
      qr.content,
      qr.format || "SVG",
      qr.size || 256,
      qr.foregroundColor || qr.foreground || "#000000",
      qr.backgroundColor || qr.background || "#FFFFFF",
      (qr.errorCorrectionLevel || "M") as any
    );

    return res.json({ success: true, data: { ...qr, qrData } });
  } catch (error) {
    return next(error);
  }
}

export async function deleteQrCode(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await prisma.$executeRawUnsafe(`DELETE FROM QrCode WHERE id = ?`, id);
    return res.json({ success: true, message: "QR code deleted" });
  } catch (error) {
    return next(error);
  }
}

export async function downloadQrCode(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { format = "PNG", color = "#000000", size = "1024" } = req.query;

    let qr: any = null;
    try {
      qr = await (prisma as any).qrCode.findUnique({
        where: { id },
      });
    } catch {
      const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM QrCode WHERE id = ? LIMIT 1`, id);
      qr = rows?.[0] || null;
    }

    if (!qr) return res.status(404).json({ error: "QR code not found" });

    const qrOptions = {
      width: Number(size),
      margin: 2,
      color: { dark: color as string, light: "#FFFFFF" },
      errorCorrectionLevel: (qr.errorCorrectionLevel || "M") as any,
    };

    if (format === "SVG") {
      const svgString = await QRCode.toString(qr.content, { ...qrOptions, type: "svg" });
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Content-Disposition", `attachment; filename="qrcode-${id}.svg"`);
      return res.send(svgString);
    } else {
      const buffer = await QRCode.toBuffer(qr.content, qrOptions);
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", `attachment; filename="qrcode-${id}.png"`);
      return res.send(buffer);
    }
  } catch (error) {
    return next(error);
  }
}
