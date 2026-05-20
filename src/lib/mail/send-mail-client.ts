import { getAccessToken } from "@/lib/auth-storage";

export type SendMailClientPayload = {
  to: string;
  subject: string;
  message: string;
  templateId?: string;
  companyName?: string;
  cc?: string;
  pdfFilename?: string;
  pdfBase64?: string;
};

export async function sendMailViaApi(
  payload: SendMailClientPayload
): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Session expired. Please sign in again.");
  }

  const res = await fetch("/api/send-mail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not send email.");
  }
}
