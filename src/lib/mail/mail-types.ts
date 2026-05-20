export type MailDeliveryStatus = "SENT" | "FAILED" | "QUEUED";
export type MailChannel = "EMAIL" | "WHATSAPP";

export type MailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

export type MailHistoryRow = {
  id: string;
  sentAt: string;
  recipient: string;
  customerName?: string;
  templateName: string;
  channel: MailChannel;
  subject: string;
  status: MailDeliveryStatus;
};
