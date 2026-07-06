export type MailDeliveryStatus = "SENT" | "FAILED" | "QUEUED";
export type MailChannel = "EMAIL" | "WHATSAPP";

export type MailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  letterContactEmail?: string | null;
  letterContactPhone?: string | null;
  letterContactAddress?: string | null;
  letterRecipientAddress?: string | null;
  letterReLine?: string | null;
  letterSignatoryName?: string | null;
  letterSignatoryTitle?: string | null;
};

export type LetterComposeDetails = {
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  recipientAddress: string;
  reLine?: string;
  signatoryName?: string;
  signatoryTitle?: string;
};

export type MailHistoryRow = {
  id: string;
  sentAt: string;
  recipient: string;
  customerName?: string | null;
  templateName: string;
  channel: MailChannel;
  subject: string;
  status: MailDeliveryStatus;
  errorMessage?: string | null;
};

export type SendOutboundMailRequest = {
  recipient: string;
  customerId?: string;
  customerName?: string;
  templateId: string;
  templateName: string;
  channel: MailChannel;
  subject: string;
  body: string;
  cc?: string;
  letterDetails?: LetterComposeDetails;
};
