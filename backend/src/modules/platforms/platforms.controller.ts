import { Request, Response } from "express";
import prisma from "@/config/db";
import { randomUUID } from "crypto";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function listPlatforms(_req: Request, res: Response) {
  try {
    const platforms: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, name, slug, createdAt, updatedAt FROM \`AssetPlatform\` ORDER BY name ASC`
    );
    res.json({ success: true, data: platforms });
  } catch (error: any) {
    console.error("listPlatforms error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function createPlatform(req: Request, res: Response) {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, error: "Platform name is required." });
    }

    const trimmedName = name.trim();
    const slug = slugify(trimmedName);

    // Case-insensitive duplicate check
    const existing: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, name, slug FROM \`AssetPlatform\` WHERE LOWER(name) = LOWER(?) LIMIT 1`,
      trimmedName
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: "Platform already exists.",
        data: existing[0],
      });
    }

    const id = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO \`AssetPlatform\` (id, name, slug, createdAt, updatedAt) VALUES (?, ?, ?, NOW(3), NOW(3))`,
      id,
      trimmedName,
      slug
    );

    const created: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, name, slug, createdAt, updatedAt FROM \`AssetPlatform\` WHERE id = ?`,
      id
    );

    res.status(201).json({ success: true, data: created[0] });
  } catch (error: any) {
    console.error("createPlatform error:", error);
    // Duplicate key race condition
    if (error.code === "P2010" || (error.message && error.message.includes("Duplicate entry"))) {
      const existing: any[] = await prisma.$queryRawUnsafe(
        `SELECT id, name, slug FROM \`AssetPlatform\` WHERE LOWER(name) = LOWER(?) LIMIT 1`,
        req.body.name?.trim() ?? ""
      );
      return res.status(409).json({
        success: false,
        error: "Platform already exists.",
        data: existing[0] ?? null,
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
}
