"use client";

import InvoiceDocumentPreview from "@/components/invoices/InvoiceDocumentPreview";
import type { InvoiceRecord } from "@/lib/invoices/invoice-types";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { invoiceMessageTextareaClass } from "@/components/invoices/invoice-form-styles";
import { generateInvoicePdf } from "@/lib/export/invoice-document-pdf";
import { sendMailViaApi } from "@/lib/mail/send-mail-client";
import { formatInvoiceAmount } from "@/lib/invoices/invoice-utils";
import { Loader2, Mail, Send } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  invoice: InvoiceRecord;
  isOpen: boolean;
  onClose: () => void;
  onSent?: () => void;
};

export default function ResendInvoiceModal({
  invoice,
  isOpen,
  onClose,
  onSent,
}: Props) {
  const { companyName } = useCompanyContext();
  const [to, setTo] = useState(invoice.customerEmail);
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [attachPdf, setAttachPdf] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTo(invoice.customerEmail);
    setSubject(
      `Invoice ${invoice.number} from ${companyName ?? "your firm"} — ${formatInvoiceAmount(invoice.currency, invoice.total)}`
    );
    setMessage(
      `Dear ${invoice.customerName},\n\nPlease find attached invoice ${invoice.number} for ${formatInvoiceAmount(invoice.currency, invoice.total)}.\n\nPayment is due by ${new Date(invoice.dueAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}.\n\nIf you have any questions, reply to this email.\n\nKind regards,\n${companyName ?? "Accounts team"}`
    );
  }, [isOpen, invoice, companyName]);

  async function handleSend() {
    if (!to.trim()) {
      setSendError("Recipient email is required.");
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      let pdfFilename: string | undefined;
      let pdfBase64: string | undefined;
      if (attachPdf) {
        const pdf = await generateInvoicePdf(invoice, companyName ?? "Company");
        pdfFilename = pdf.filename;
        pdfBase64 = pdf.base64;
      }
      await sendMailViaApi({
        to: to.trim(),
        cc: cc.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
        templateId: "invoice-reminder",
        companyName: companyName ?? "Company",
        pdfFilename,
        pdfBase64,
      });
      onSent?.();
      onClose();
    } catch (err) {
      setSendError(
        err instanceof Error ? err.message : "Could not send invoice."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[min(72rem,calc(100vw-2rem))] p-0"
    >
      <div className="flex h-[min(92vh,58rem)] max-h-[92vh] flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900">
              <Mail className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Resend invoice
              </h2>
              <p className="text-sm text-gray-500">{invoice.number}</p>
            </div>
          </div>
        </div>

        <div className="grid min-h-[min(520px,62vh)] flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
            <div className="flex min-h-0 flex-col overflow-y-auto border-b border-gray-200 p-6 dark:border-gray-800 lg:border-b-0 lg:border-r">
            <div className="flex min-h-full flex-col gap-5">
              {sendError ? (
                <p className="text-sm text-error-600">{sendError}</p>
              ) : null}
              <div>
                <Label>To</Label>
                <Input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>CC (optional)</Label>
                <Input
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="finance@example.com"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div className="flex min-h-0 flex-1 flex-col">
                <Label>Message</Label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={18}
                  className={`${invoiceMessageTextareaClass} mt-1.5 min-h-[min(380px,48vh)] flex-1`}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={attachPdf}
                  onChange={(e) => setAttachPdf(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Attach PDF copy of invoice
              </label>
            </div>
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden bg-gray-50/80 dark:bg-gray-950/40">
            <p className="shrink-0 border-b border-gray-200 px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800">
              Email preview
            </p>
            <div className="min-h-[min(480px,58vh)] flex-1 overflow-y-auto p-4">
              <InvoiceDocumentPreview
                invoice={invoice}
                companyName={companyName}
                compact
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSend()} disabled={sending || !to.trim()}>
            {sending ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="mr-1.5 size-4" aria-hidden />
            )}
            {sending ? "Sending…" : "Send invoice"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
