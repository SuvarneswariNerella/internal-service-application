import { Request, Response } from "express";
import prisma from "@/config/db";
import { financeRecordSchema, updateFinanceRecordSchema } from "./finance.validation";

export const getFinanceRecords = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    
    const records = await prisma.financeRecord.findMany({
      where: projectId ? { projectId: String(projectId) } : undefined,
      include: {
        project: {
          select: { name: true, client: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    
    res.json({ success: true, data: records });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getFinanceRecordById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const record = await prisma.financeRecord.findUnique({
      where: { id: id as string },
      include: {
        project: {
          select: { name: true }
        }
      }
    });
    if (!record) {
      return res.status(404).json({ success: false, error: "Record not found" });
    }
    res.json({ success: true, data: record });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createFinanceRecord = async (req: Request, res: Response) => {
  try {
    const validatedData = financeRecordSchema.parse(req.body);
    
    const dataToSave = {
      ...validatedData,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      paidDate: validatedData.paidDate ? new Date(validatedData.paidDate) : null,
    };

    const record = await prisma.financeRecord.create({
      data: dataToSave as any, // bypassing strict Decimal type checking for creation
    });
    res.status(201).json({ success: true, data: record });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || error.errors });
  }
};

export const updateFinanceRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateFinanceRecordSchema.parse(req.body);

    const dataToSave = {
      ...validatedData,
    };
    
    if (validatedData.dueDate !== undefined) {
      dataToSave.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
    }
    if (validatedData.paidDate !== undefined) {
      dataToSave.paidDate = validatedData.paidDate ? new Date(validatedData.paidDate) : null;
    }

    const record = await prisma.financeRecord.update({
      where: { id: id as string },
      data: dataToSave as any,
    });
    res.json({ success: true, data: record });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || error.errors });
  }
};

export const deleteFinanceRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.financeRecord.delete({ where: { id: id as string } });
    res.json({ success: true, message: "Record deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
