import {
  buildBrandedMailHtml,
  MAIL_LOGO_CID,
  normalizeMailTemplateId,
  resolveMailLogoPath,
} from "@/lib/mail/html-email";
import { createMailTransport, getSmtpConfig } from "@/lib/smtp-config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type SendFormEmailBody = {
  to: string;
  subject: string;
  message: string;
  pdfFilename: string;
  pdfBase64: string;
  companyName?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const smtp = getSmtpConfig();
  if (!smtp) {
    return NextResponse.json(
      {
        error: "smtp_not_configured",
        message:
          "Email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and MAIL_FROM in .env.local.",
      },
      { status: 503 }
    );
  }

  let body: SendFormEmailBody;
  try {
    body = (await req.json()) as SendFormEmailBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const to = body.to?.trim();
  if (!to || !EMAIL_RE.test(to)) {
    return NextResponse.json({ error: "invalid_recipient" }, { status: 400 });
  }

  if (!body.pdfBase64?.trim() || !body.pdfFilename?.trim()) {
    return NextResponse.json({ error: "missing_attachment" }, { status: 400 });
  }

  const subject = body.subject?.trim() || "Form attachment";
  const message = body.message?.trim() || "Please find the attached form.";
  const companyName = body.companyName?.trim() || "Our team";

  const logoPath = resolveMailLogoPath();
  const html = buildBrandedMailHtml({
    templateId: normalizeMailTemplateId("form-attachment"),
    companyName,
    subject,
    bodyText: message,
    includeLogo: Boolean(logoPath),
  });

  try {
    const transport = createMailTransport(smtp);
    const pdfAttachment = {
      filename: body.pdfFilename.endsWith(".pdf")
        ? body.pdfFilename
        : `${body.pdfFilename}.pdf`,
      content: Buffer.from(body.pdfBase64, "base64"),
      contentType: "application/pdf",
    };
    const logoAttachment = logoPath
      ? {
          filename: "logo.png",
          path: logoPath,
          cid: MAIL_LOGO_CID,
        }
      : null;

    await transport.sendMail({
      from: smtp.from,
      to,
      subject,
      text: message,
      html,
      attachments: logoAttachment
        ? [logoAttachment, pdfAttachment]
        : [pdfAttachment],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send-form-email failed", err);
    return NextResponse.json(
      {
        error: "send_failed",
        message:
          err instanceof Error ? err.message : "Could not send email.",
      },
      { status: 502 }
    );
  }
}
