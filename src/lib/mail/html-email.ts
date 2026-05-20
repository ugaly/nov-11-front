import { existsSync } from "fs";
import { join } from "path";

/** Must match `MailTemplate.id` in mail-dummy-data. */
export type MailHtmlTemplateId =
  | "payment-notification"
  | "invoice-reminder"
  | "engagement-followup"
  | "document-request"
  /** Branded wrapper for manual PDF form sends. */
  | "form-attachment"
  | "generic";

export const MAIL_LOGO_CID = "mail-brand-logo";

const LOGO_RELATIVE = ["public", "images", "logo", "invoice-logo.png"];

export function resolveMailLogoPath(): string | null {
  const abs = join(process.cwd(), ...LOGO_RELATIVE);
  return existsSync(abs) ? abs : null;
}

type Theme = {
  accent: string;
  accentSoft: string;
  stripe: string;
  pillBg: string;
  pillText: string;
  badgeLabel: string;
};

const THEMES: Record<MailHtmlTemplateId, Theme> = {
  "payment-notification": {
    accent: "#059669",
    accentSoft: "#ecfdf5",
    stripe: "#047857",
    pillBg: "#d1fae5",
    pillText: "#065f46",
    badgeLabel: "Payment",
  },
  "invoice-reminder": {
    accent: "#2563eb",
    accentSoft: "#eff6ff",
    stripe: "#1d4ed8",
    pillBg: "#dbeafe",
    pillText: "#1e40af",
    badgeLabel: "Invoice",
  },
  "engagement-followup": {
    accent: "#7c3aed",
    accentSoft: "#f5f3ff",
    stripe: "#6d28d9",
    pillBg: "#ede9fe",
    pillText: "#5b21b6",
    badgeLabel: "Engagement",
  },
  "document-request": {
    accent: "#d97706",
    accentSoft: "#fffbeb",
    stripe: "#b45309",
    pillBg: "#fef3c7",
    pillText: "#92400e",
    badgeLabel: "Documents",
  },
  "form-attachment": {
    accent: "#0d9488",
    accentSoft: "#f0fdfa",
    stripe: "#0f766e",
    pillBg: "#ccfbf1",
    pillText: "#115e59",
    badgeLabel: "Form",
  },
  generic: {
    accent: "#374151",
    accentSoft: "#f9fafb",
    stripe: "#111827",
    pillBg: "#e5e7eb",
    pillText: "#1f2937",
    badgeLabel: "Message",
  },
};

export function normalizeMailTemplateId(id: string | undefined): MailHtmlTemplateId {
  if (!id) return "generic";
  return id in THEMES ? (id as MailHtmlTemplateId) : "generic";
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Turn plain text (with line breaks) into safe HTML paragraphs. */
export function plainTextToMailBodyHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return `<p style="margin:0;font-size:15px;line-height:1.65;color:#374151;">—</p>`;
  }
  const blocks = trimmed.split(/\n\s*\n/).filter(Boolean);
  return blocks
    .map((block) => {
      const withBreaks = escapeHtml(block).replace(/\n/g, "<br/>");
      return `<p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#374151;">${withBreaks}</p>`;
    })
    .join("");
}

export function buildBrandedMailHtml(options: {
  templateId: MailHtmlTemplateId;
  companyName: string;
  subject: string;
  bodyText: string;
  includeLogo: boolean;
}): string {
  const theme = THEMES[options.templateId] ?? THEMES.generic;
  const bodyHtml = plainTextToMailBodyHtml(options.bodyText);
  const company = escapeHtml(options.companyName.trim() || "Your company");
  const subjectEsc = escapeHtml(options.subject.trim() || "Message");

  const logoBlock = options.includeLogo
    ? `<img src="cid:${MAIL_LOGO_CID}" width="160" alt="" style="display:block;margin:0 auto 16px auto;height:auto;border:0;outline:none;text-decoration:none;" />`
    : `<p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;letter-spacing:-0.02em;">${company}</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${subjectEsc}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
  <tr>
    <td align="center" style="padding:28px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr>
          <td style="height:4px;background-color:${theme.stripe};font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:28px 32px 20px;background-color:${theme.accentSoft};text-align:center;border-bottom:1px solid #e5e7eb;">
            ${logoBlock}
            <span style="display:inline-block;padding:6px 14px;background-color:${theme.pillBg};color:${theme.pillText};font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;border-radius:999px;">${escapeHtml(theme.badgeLabel)}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 8px;">
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;line-height:1.25;">${subjectEsc}</h1>
            <p style="margin:10px 0 0;font-size:14px;color:#6b7280;">${company}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 32px 32px;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;line-height:1.5;">This message was sent from your customer portal.</p>
            <p style="margin:0;font-size:12px;color:#d1d5db;">© ${new Date().getFullYear()} ${company}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
