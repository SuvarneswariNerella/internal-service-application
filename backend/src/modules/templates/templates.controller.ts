import { Request, Response } from "express";
import prisma from "@/config/db";
import { createTemplateSchema, updateTemplateSchema } from "./templates.validation";

export const getTemplates = async (req: Request, res: Response) => {
  try {
    const { workspaceId, type } = req.query;
    
    const whereClause: any = {};
    if (workspaceId) whereClause.workspaceId = String(workspaceId);
    if (type) whereClause.type = String(type);

    const templates = await prisma.designTemplate.findMany({
      where: whereClause,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({ success: true, data: templates });
  } catch (error: any) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await prisma.designTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      return res.status(404).json({ success: false, error: "Template not found" });
    }

    res.json({ success: true, data: template });
  } catch (error: any) {
    console.error("Error fetching template:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const data = createTemplateSchema.parse(req.body);

    const newTemplate = await prisma.$transaction(async (tx) => {
      // If marking as default, unset others for the same workspace and type
      if (data.isDefault) {
        await tx.designTemplate.updateMany({
          where: {
            workspaceId: data.workspaceId,
            type: data.type,
            isDefault: true
          },
          data: { isDefault: false }
        });
      }

      return await tx.designTemplate.create({
        data
      });
    });

    res.status(201).json({ success: true, data: newTemplate });
  } catch (error: any) {
    console.error("Error creating template:", error);
    res.status(400).json({ success: false, error: error.message || "Invalid request" });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateTemplateSchema.parse(req.body);

    const template = await prisma.designTemplate.findUnique({ where: { id } });
    if (!template) {
      return res.status(404).json({ success: false, error: "Template not found" });
    }

    const updatedTemplate = await prisma.$transaction(async (tx) => {
      // If marking as default, unset others
      if (data.isDefault) {
        await tx.designTemplate.updateMany({
          where: {
            workspaceId: data.workspaceId || template.workspaceId,
            type: data.type || template.type,
            isDefault: true,
            id: { not: id }
          },
          data: { isDefault: false }
        });
      }

      return await tx.designTemplate.update({
        where: { id },
        data
      });
    });

    res.json({ success: true, data: updatedTemplate });
  } catch (error: any) {
    console.error("Error updating template:", error);
    res.status(400).json({ success: false, error: error.message || "Invalid request" });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.designTemplate.delete({
      where: { id }
    });
    res.json({ success: true, data: { deleted: true } });
  } catch (error: any) {
    console.error("Error deleting template:", error);
    res.status(500).json({ success: false, error: "Failed to delete template" });
  }
};
