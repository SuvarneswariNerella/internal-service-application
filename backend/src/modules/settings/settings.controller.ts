import { Request, Response, NextFunction } from "express";
import prisma from "@/config/db";
import { testSmtpConnection } from "@/services/email.service";

export const getGeneralSettings = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({ 
        data: {
          agencyName: "Apex Digital Agency LLC",
          baseCurrency: "Indian Rupee (₹ INR) — Default",
          timezone: "India Standard Time (IST) — UTC+05:30",
          smtpHost: "smtp.sendgrid.net",
          smtpPort: "Port 587 (TLS / STARTTLS Recommended)",
          smtpUsername: "notifications@apexagency.com",
          smtpPassword: "SG.xxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          smtpSenderName: "Apex Renewal Alerts",
          smtpSenderEmail: "renewals@apexagency.com"
        } 
      });
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

export const updateGeneralSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    let settings = await prisma.systemSettings.findFirst();
    
    if (settings) {
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data,
      });
    } else {
      settings = await prisma.systemSettings.create({ data });
    }
    
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

export const testSmtpConnectionHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const inputSettings = req.body;
    let settingsToTest = inputSettings;

    // If any required field is missing in input, fill from stored settings
    if (!settingsToTest?.smtpHost || !settingsToTest?.smtpUsername || !settingsToTest?.smtpPassword) {
      const stored = await prisma.systemSettings.findFirst();
      settingsToTest = {
        ...stored,
        ...inputSettings,
      };
    }

    const result = await testSmtpConnection(settingsToTest);
    res.json({
      success: true,
      message: result.message || "SMTP connection verified successfully! Mail server is reachable and credentials are valid.",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to verify SMTP connection. Please check your host, port, and credentials.",
    });
  }
};
