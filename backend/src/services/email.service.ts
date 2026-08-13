import nodemailer from "nodemailer";

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: {
    filename: string;
    content: Buffer;
    contentType?: string;
  }[];
}

export const sendEmail = async (options: EmailOptions, settings: any) => {
  if (!settings?.smtpHost || !settings?.smtpUsername || !settings?.smtpPassword) {
    throw new Error("SMTP settings are not fully configured in System Settings.");
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: parseInt(settings.smtpPort || '587', 10),
    secure: settings.smtpPort === '465', // true for 465, false for other ports
    auth: {
      user: settings.smtpUsername,
      pass: settings.smtpPassword,
    },
  });

  const from = settings.smtpSenderName 
    ? `"${settings.smtpSenderName}" <${settings.smtpSenderEmail || settings.smtpUsername}>`
    : settings.smtpSenderEmail || settings.smtpUsername;

  const info = await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments,
  });

  return info;
};
