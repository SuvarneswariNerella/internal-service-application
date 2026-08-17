import { Request, Response } from "express";
import prisma from "@/config/db";

export async function getItems(req: Request, res: Response): Promise<void> {
  try {
    const items = await prisma.itemCode.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: items });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ success: false, message: "Failed to fetch items" });
  }
}
