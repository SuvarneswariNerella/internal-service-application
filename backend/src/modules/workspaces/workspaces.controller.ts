import { Request, Response, NextFunction } from "express";
import prisma from "@/config/db";

export const getAllWorkspaces = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { clients: true }
        }
      }
    });

    const mappedWorkspaces = workspaces.map((w) => {
      const { _count, ...rest } = w;
      return {
        ...rest,
        activeClients: _count.clients
      };
    });

    res.json(mappedWorkspaces);
  } catch (error) {
    next(error);
  }
};

export const createWorkspace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const newWorkspace = await prisma.workspace.create({
      data: {
        displayName: data.displayName,
        shortCode: data.shortCode,
        contactEmail: data.contactEmail,
        legalName: data.legalName,
        gstin: data.gstin,
        state: data.state,
        defaultCurrency: data.defaultCurrency || "INR",
        invoicePrefix: data.invoicePrefix,
        estimatePrefix: data.estimatePrefix,
        poPrefix: data.poPrefix,
        invoiceNextSeq: Number(data.invoiceNextSeq) || 1,
        estimateNextSeq: Number(data.estimateNextSeq) || 1,
        poNextSeq: Number(data.poNextSeq) || 1,
        bankName: data.bankName,
        bankBranch: data.bankBranch,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
        logoUrl: data.logoUrl,
        activeClients: 0
      }
    });
    res.status(201).json(newWorkspace);
  } catch (error) {
    next(error);
  }
};

export const updateWorkspace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    // Convert string to number if needed for sequences
    const updateData = { ...data };
    if (updateData.invoiceNextSeq) updateData.invoiceNextSeq = Number(updateData.invoiceNextSeq);
    if (updateData.estimateNextSeq) updateData.estimateNextSeq = Number(updateData.estimateNextSeq);
    if (updateData.poNextSeq) updateData.poNextSeq = Number(updateData.poNextSeq);

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: id as string },
      data: {
        displayName: updateData.displayName,
        shortCode: updateData.shortCode,
        contactEmail: updateData.contactEmail,
        legalName: updateData.legalName,
        gstin: updateData.gstin,
        state: updateData.state,
        defaultCurrency: updateData.defaultCurrency,
        invoicePrefix: updateData.invoicePrefix,
        estimatePrefix: updateData.estimatePrefix,
        poPrefix: updateData.poPrefix,
        invoiceNextSeq: updateData.invoiceNextSeq,
        estimateNextSeq: updateData.estimateNextSeq,
        poNextSeq: updateData.poNextSeq,
        bankName: updateData.bankName,
        bankBranch: updateData.bankBranch,
        accountNumber: updateData.accountNumber,
        ifscCode: updateData.ifscCode,
        address: updateData.address,
        city: updateData.city,
        postalCode: updateData.postalCode,
        country: updateData.country,
        logoUrl: updateData.logoUrl,
      }
    });
    res.json(updatedWorkspace);
  } catch (error) {
    next(error);
  }
};

export const deleteWorkspace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.workspace.delete({
      where: { id: id as string }
    });
    res.json({ success: true, message: "Workspace deleted successfully" });
  } catch (error) {
    next(error);
  }
};
