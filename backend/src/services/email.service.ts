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

const parseSmtpPort = (portSetting: string | number | undefined): { port: number; secure: boolean } => {
  const rawPort = String(portSetting || "587");
  const portMatch = rawPort.match(/\d+/);
  const port = portMatch ? parseInt(portMatch[0], 10) : 587;
  const secure = port === 465;
  return { port, secure };
};

export const testSmtpConnection = async (settings: any) => {
  if (!settings?.smtpHost || !settings?.smtpUsername || !settings?.smtpPassword) {
    throw new Error("SMTP Host, Username, and Password are required to test connection.");
  }

  const { port, secure } = parseSmtpPort(settings.smtpPort);

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port,
    secure,
    auth: {
      user: settings.smtpUsername,
      pass: settings.smtpPassword,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  await transporter.verify();
  return { success: true, message: `Successfully connected and authenticated with ${settings.smtpHost}:${port}` };
};

export const sendEmail = async (options: EmailOptions, settings: any) => {
  if (!settings?.smtpHost || !settings?.smtpUsername || !settings?.smtpPassword) {
    throw new Error("SMTP settings are not fully configured in System Settings.");
  }

  const { port, secure } = parseSmtpPort(settings.smtpPort);

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port,
    secure,
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
