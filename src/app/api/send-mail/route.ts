import {
  buildBrandedMailHtml,
  MAIL_LOGO_CID,
  normalizeMailTemplateId,
  resolveMailLogoPath,
} from "@/lib/mail/html-email";
import { createMailTransport, getSmtpConfig } from "@/lib/smtp-config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type SendMailBody = {
  to: string;
  subject: string;
  message: string;
  /** Template key for visual variant (matches Mail template ids). */
  templateId?: string;
  companyName?: string;
  cc?: string;
  pdfFilename?: string;
  pdfBase64?: string;
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

  let body: SendMailBody;
  try {
    body = (await req.json()) as SendMailBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const to = body.to?.trim();
  if (!to || !EMAIL_RE.test(to)) {
    return NextResponse.json({ error: "invalid_recipient" }, { status: 400 });
  }

  const subject = body.subject?.trim() || "Message";
  const message = body.message?.trim() || "";
  const templateId = normalizeMailTemplateId(body.templateId);
  const companyName = body.companyName?.trim() || "Our team";

  const logoPath = resolveMailLogoPath();
  const html = buildBrandedMailHtml({
    templateId,
    companyName,
    subject,
    bodyText: message,
    includeLogo: Boolean(logoPath),
  });

  const cc = body.cc?.trim();
  const attachments: {
    filename: string;
    path?: string;
    content?: Buffer;
    cid?: string;
    contentType?: string;
  }[] = [];

  if (logoPath) {
    attachments.push({
      filename: "logo.png",
      path: logoPath,
      cid: MAIL_LOGO_CID,
    });
  }

  if (body.pdfBase64?.trim() && body.pdfFilename?.trim()) {
    attachments.push({
      filename: body.pdfFilename.endsWith(".pdf")
        ? body.pdfFilename
        : `${body.pdfFilename}.pdf`,
      content: Buffer.from(body.pdfBase64, "base64"),
      contentType: "application/pdf",
    });
  }

  try {
    const transport = createMailTransport(smtp);
    await transport.sendMail({
      from: smtp.from,
      to,
      cc: cc || undefined,
      subject,
      text: message,
      html,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send-mail failed", err);
    return NextResponse.json(
      {
        error: "send_failed",
        message:
          err instanceof Error ? err.message : "Could not send mail.",
      },
      { status: 502 }
    );
  }
}
