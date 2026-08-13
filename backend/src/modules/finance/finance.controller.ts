import { Request, Response } from "express";
import prisma from "@/config/db";
import { financeRecordSchema, updateFinanceRecordSchema } from "./finance.validation";

export const getFinanceRecords = async (req: Request, res: Response) => {
  try {
    const { projectId, workspaceId } = req.query;
    
    const where: any = {};
    if (projectId) where.projectId = String(projectId);
    if (workspaceId) where.workspaceId = String(workspaceId);

    const records = await prisma.financeRecord.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, clientId: true, client: { select: { id: true, name: true } } }
        },
        // @ts-ignore - Prisma client needs regeneration
        client: { select: { id: true, name: true } },
        emailLogs: {
          orderBy: { sentAt: "desc" }
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
          select: { name: true, client: { select: { name: true } } }
        },
        // @ts-ignore - Prisma client needs regeneration
        client: { select: { name: true } },
        emailLogs: {
          orderBy: { sentAt: "desc" }
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

    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.financeRecord.create({
        data: dataToSave as any,
      });

      if (validatedData.workspaceId) {
        if (validatedData.type === "INVOICE") {
          await tx.workspace.update({
            where: { id: validatedData.workspaceId },
            data: { invoiceNextSeq: { increment: 1 } }
          });
        } else if (validatedData.type === "QUOTATION") {
          await tx.workspace.update({
            where: { id: validatedData.workspaceId },
            data: { estimateNextSeq: { increment: 1 } }
          });
        } else if (validatedData.type.startsWith("PURCHASE_ORDER")) {
          await tx.workspace.update({
            where: { id: validatedData.workspaceId },
            data: { poNextSeq: { increment: 1 } }
          });
        }
      }

      return created;
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

    const dataToSave: any = {
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

export const downloadFinancePdf = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const record = await prisma.financeRecord.findUnique({
      where: { id: id as string },
      include: {
        project: {
          select: { name: true, client: { select: { name: true, address: true, notes: true } } }
        },
        // @ts-ignore - Prisma client needs regeneration
        client: { select: { name: true, address: true, notes: true } },
        workspace: true
      }
    });
    
    if (!record) {
      return res.status(404).json({ success: false, error: "Record not found" });
    }

    const { generateFinancePdf } = await import("../../services/pdf.service");
    const clientName = (record as any).client?.name || (record as any).project?.client?.name || "Client";
    const pdfBuffer = await generateFinancePdf(record as any, clientName, (record as any).workspace);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${record.title || 'document'}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const sendFinanceDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { to, subject, message } = req.body;
    
    // 1. Fetch FinanceRecord and Client info
    const record = await prisma.financeRecord.findUnique({
      where: { id: String(id) },
      include: {
        project: {
          select: { name: true, client: { select: { name: true, address: true, notes: true } } }
        },
        // @ts-ignore - Prisma client needs regeneration
        client: { select: { name: true, address: true, notes: true } },
        workspace: true
      }
    });

    if (!record) {
      return res.status(404).json({ success: false, error: "Record not found" });
    }

    // 2. Fetch System Settings for SMTP
    const settings = await prisma.systemSettings.findFirst();
    if (!settings || !settings.smtpHost) {
      return res.status(400).json({ success: false, error: "SMTP settings are not configured." });
    }

    // 3. Generate PDF using Puppeteer
    const { generateFinancePdf } = await import("../../services/pdf.service");
    const clientName = (record as any).client?.name || (record as any).project?.client?.name || "Client";
    const pdfBuffer = await generateFinancePdf(record as any, clientName, (record as any).workspace);
    const fileName = `${record.title || 'document'}.pdf`;

    // 4. Send Email
    const { sendEmail } = await import("../../services/email.service");
    await sendEmail({
      to,
      subject,
      html: message,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    }, settings);

    // 5. Update Document Status
    await prisma.financeRecord.update({
      where: { id: String(id) },
      data: { status: "SENT" }
    });

    // 6. Log Email
    await prisma.emailLog.create({
      data: {
        financeRecordId: record.id,
        sender: settings.smtpSenderEmail || settings.smtpUsername || "system",
        recipient: to,
        subject,
        content: message,
        workspaceId: record.workspaceId
      }
    });

    // 7. Audit Log for Activity Timeline
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user?.userId || "system",
        action: "DOCUMENT_SENT",
        entity: "FinanceRecord",
        entityId: record.id,
        details: { to, subject, timestamp: new Date().toISOString() }
      }
    });

    res.json({ success: true, message: "Document sent successfully" });
  } catch (error: any) {
    console.error("Error sending document:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const convertFinanceDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 1. Fetch the source PO
    const sourcePo = await prisma.financeRecord.findUnique({
      where: { id: String(id) },
      include: { workspace: true }
    });

    if (!sourcePo) {
      return res.status(404).json({ success: false, error: "Record not found" });
    }

    if (!sourcePo.type.startsWith("PURCHASE_ORDER") && !sourcePo.type.startsWith("PROPOSAL") && !sourcePo.type.startsWith("ESTIMATE") && sourcePo.type !== "QUOTATION") {
      return res.status(400).json({ success: false, error: "Only Proposals and Purchase Orders can be converted to Invoices." });
    }

    if (sourcePo.convertedInvoiceId) {
      return res.status(400).json({ success: false, error: "This document has already been converted." });
    }

    const workspace = sourcePo.workspace;
    let nextSeq = workspace?.invoiceNextSeq || 1;
    const prefix = workspace?.invoicePrefix || "INV";
    const year = new Date().getFullYear();
    const invoiceTitle = `${prefix}/${year}/${String(nextSeq).padStart(3, '0')}`;

    // 2. Create the new Invoice in a transaction
    const [newInvoice] = await prisma.$transaction([
      prisma.financeRecord.create({
        data: {
          projectId: sourcePo.projectId,
          type: "INVOICE",
          title: invoiceTitle,
          amount: sourcePo.amount,
          currency: sourcePo.currency,
          status: "DRAFT",
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Default 15 days
          notes: sourcePo.notes,
          metadata: sourcePo.metadata as any,
          workspaceId: sourcePo.workspaceId,
          sourcePoId: sourcePo.id
        }
      }),
      prisma.financeRecord.update({
        where: { id: sourcePo.id },
        data: { status: "CONVERTED" }
      }),
      ...(workspace ? [
        prisma.workspace.update({
          where: { id: workspace.id },
          data: { invoiceNextSeq: { increment: 1 } }
        })
      ] : [])
    ]);

    // 3. Update the document to point to the new invoice
    await prisma.financeRecord.update({
      where: { id: sourcePo.id },
      data: { convertedInvoiceId: newInvoice.id }
    });

    // 4. Audit Log
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user?.userId || "system",
        action: "DOCUMENT_CONVERTED_TO_INVOICE",
        entity: "FinanceRecord",
        entityId: sourcePo.id,
        details: { convertedInvoiceId: newInvoice.id, timestamp: new Date().toISOString() }
      }
    });

    res.json({ success: true, data: newInvoice });
  } catch (error: any) {
    console.error("Error converting document:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
