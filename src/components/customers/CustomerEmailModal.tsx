"use client";

import { getApiErrorMessage } from "@/api/errors";
import { getCustomer } from "@/api/template-config/template-config.api";
import { invoiceMessageTextareaClass } from "@/components/invoices/invoice-form-styles";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { sendMailViaApi } from "@/lib/mail/send-mail-client";
import { Loader2, Mail, Send } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  customerId: string;
  customerName: string;
  defaultEmail?: string | null;
  onSent?: () => void;
};

export default function CustomerEmailModal({
  isOpen,
  onClose,
  companyId,
  customerId,
  customerName,
  defaultEmail,
  onSent,
}: Props) {
  const { companyName } = useCompanyContext();
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSubject(`Message from ${companyName ?? "your firm"}`);
    setMessage(
      `Dear ${customerName},\n\n\n\nKind regards,\n${companyName ?? "Team"}`
    );

    if (defaultEmail) {
      setTo(defaultEmail);
      return;
    }

    let cancelled = false;
    setLoadingEmail(true);
    void (async () => {
      try {
        const c = await getCustomer(companyId, customerId);
        if (!cancelled) setTo(c.contactEmail ?? "");
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Could not load customer email."));
        }
      } finally {
        if (!cancelled) setLoadingEmail(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, companyId, customerId, customerName, defaultEmail, companyName]);

  async function handleSend() {
    if (!to.trim()) {
      setError("Recipient email is required.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await sendMailViaApi({
        to: to.trim(),
        cc: cc.trim() || undefined,
        subject: subject.trim() || `Message from ${companyName ?? "your firm"}`,
        message: message.trim(),
        templateId: "generic",
        companyName: companyName ?? "Company",
      });
      onSent?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-0">
      <div className="flex max-h-[min(90vh,40rem)] flex-col">
        <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900">
            <Mail className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Email customer
            </h2>
            <p className="text-sm text-gray-500">{customerName}</p>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {error ? <p className="text-sm text-error-600">{error}</p> : null}
          {loadingEmail ? (
            <p className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading contact…
            </p>
          ) : null}

          <div>
            <Label>To</Label>
            <Input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1.5"
              disabled={loadingEmail}
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
          <div>
            <Label>Message</Label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={12}
              className={`${invoiceMessageTextareaClass} mt-1.5 min-h-[220px]`}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || loadingEmail || !to.trim()}
          >
            {sending ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="mr-1.5 size-4" aria-hidden />
            )}
            {sending ? "Sending…" : "Send email"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
