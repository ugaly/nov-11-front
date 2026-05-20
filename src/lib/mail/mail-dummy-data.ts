import type { MailHistoryRow, MailTemplate } from "@/lib/mail/mail-types";

export const MAIL_TEMPLATES: MailTemplate[] = [
  {
    id: "payment-notification",
    name: "Payment notification",
    subject: "Payment notice for your account",
    body:
      "Dear Customer,\n\nThis is a friendly reminder about your outstanding payment.\nPlease review your account and complete payment by the due date.\n\nRegards,\nFinance Team",
  },
  {
    id: "invoice-reminder",
    name: "Invoice reminder",
    subject: "Invoice reminder",
    body:
      "Hello,\n\nPlease find a reminder that your invoice is due soon.\nIf payment has already been made, kindly ignore this message.\n\nThank you.",
  },
  {
    id: "engagement-followup",
    name: "Engagement follow-up",
    subject: "Follow-up on your engagement",
    body:
      "Dear Customer,\n\nWe are following up on your current engagement.\nPlease share any pending details so we can proceed.\n\nBest regards,\nSupport Team",
  },
  {
    id: "document-request",
    name: "Document request",
    subject: "Request for supporting documents",
    body:
      "Hello,\n\nTo continue processing your request, please provide the required supporting documents.\nYou can reply directly to this message with the requested details.\n\nThank you.",
  },
];

export const MAIL_HISTORY_SEED: MailHistoryRow[] = [
  {
    id: "mail_1",
    sentAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    recipient: "accounts@novdemo.co.tz",
    customerName: "NOV Demo Company",
    templateName: "Payment notification",
    channel: "EMAIL",
    subject: "Payment notice for your account",
    status: "SENT",
  },
  {
    id: "mail_2",
    sentAt: new Date(Date.now() - 1000 * 60 * 220).toISOString(),
    recipient: "+255700000123",
    customerName: "JOSEPH MWALWAMA",
    templateName: "Invoice reminder",
    channel: "WHATSAPP",
    subject: "Invoice reminder",
    status: "FAILED",
  },
  {
    id: "mail_3",
    sentAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    recipient: "client@sample.com",
    customerName: "Sample Client Ltd",
    templateName: "Document request",
    channel: "EMAIL",
    subject: "Request for supporting documents",
    status: "QUEUED",
  },
];
