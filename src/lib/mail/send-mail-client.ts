import { sendOutboundMail } from "@/api/mail/mail.api";
import type { LetterComposeDetails, MailChannel } from "@/api/types/mail";

export type SendMailClientPayload = {
  companyId: string;
  to: string;
  subject: string;
  message: string;
  channel?: MailChannel;
  templateId?: string;
  templateName?: string;
  customerId?: string;
  customerName?: string;
  cc?: string;
  letterDetails?: LetterComposeDetails;
};

export async function sendMailViaApi(
  payload: SendMailClientPayload
): Promise<void> {
  await sendOutboundMail(payload.companyId, {
    recipient: payload.to.trim(),
    customerId: payload.customerId,
    customerName: payload.customerName,
    templateId: payload.templateId ?? "generic",
    templateName: payload.templateName ?? "General message",
    channel: payload.channel ?? "EMAIL",
    subject: payload.subject.trim() || "Message",
    body: payload.message.trim(),
    cc: payload.cc?.trim() || undefined,
    letterDetails: payload.letterDetails,
  });
}
