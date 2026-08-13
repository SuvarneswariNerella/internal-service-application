import { Request, Response, NextFunction } from "express";
import prisma from "@/config/db";

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
