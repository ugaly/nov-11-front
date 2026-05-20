import nodemailer from "nodemailer";

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
};

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "") ?? "";
  const from = process.env.MAIL_FROM?.trim() || user;

  if (!host || !user || !pass || !from) return null;

  const port = Number(process.env.SMTP_PORT ?? "587");
  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    user,
    pass,
    from,
  };
}

export function createMailTransport(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}
