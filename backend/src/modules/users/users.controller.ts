import { Request, Response } from "express";
import prisma from "@/config/db";

export async function listUsers(_req: Request, res: Response): Promise<void> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
    },
    orderBy: {
      name: 'asc'
    }
  });

  res.json({
    success: true,
    data: users,
  });
}
