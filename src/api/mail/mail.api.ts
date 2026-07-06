import { apiClient } from "@/api/client";
import type {
  MailChannel,
  MailDeliveryStatus,
  MailHistoryRow,
  MailTemplate,
  SendOutboundMailRequest,
} from "@/api/types/mail";

function mailBase(companyId: string) {
  return `/api/companies/${companyId}/mail`;
}

export async function listMailTemplates(
  companyId: string
): Promise<MailTemplate[]> {
  const { data } = await apiClient.get<MailTemplate[]>(
    `${mailBase(companyId)}/templates`
  );
  return data;
}

export async function listMailMessages(
  companyId: string,
  params?: {
    search?: string;
    status?: MailDeliveryStatus;
    channel?: MailChannel;
  }
): Promise<MailHistoryRow[]> {
  const { data } = await apiClient.get<MailHistoryRow[]>(
    `${mailBase(companyId)}/messages`,
    { params }
  );
  return data;
}

export async function sendOutboundMail(
  companyId: string,
  body: SendOutboundMailRequest
): Promise<MailHistoryRow> {
  const { data } = await apiClient.post<MailHistoryRow>(
    `${mailBase(companyId)}/messages`,
    body
  );
  return data;
}
