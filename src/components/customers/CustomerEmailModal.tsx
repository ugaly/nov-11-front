"use client";

import { getApiErrorMessage } from "@/api/errors";
import { listMailTemplates } from "@/api/mail/mail.api";
import { getCustomer } from "@/api/template-config/template-config.api";
import type { MailChannel, MailTemplate } from "@/api/types/mail";
import { invoiceMessageTextareaClass } from "@/components/invoices/invoice-form-styles";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import {
  isLetterTemplate,
  letterDetailsFromTemplate,
} from "@/lib/mail/letter-template";
import { sendMailViaApi } from "@/lib/mail/send-mail-client";
import { AlertCircle, Loader2, Mail, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

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
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateId, setTemplateId] = useState("generic");
  const [channel, setChannel] = useState<MailChannel>("EMAIL");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [letterContactEmail, setLetterContactEmail] = useState("");
  const [letterContactPhone, setLetterContactPhone] = useState("");
  const [letterContactAddress, setLetterContactAddress] = useState("");
  const [letterRecipientAddress, setLetterRecipientAddress] = useState("");
  const [letterReLine, setLetterReLine] = useState("");
  const [letterSignatoryName, setLetterSignatoryName] = useState("");
  const [letterSignatoryTitle, setLetterSignatoryTitle] = useState("");
  const [contactEmail, setContactEmail] = useState<string | null>(null);
  const [contactPhone, setContactPhone] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loadingContact, setLoadingContact] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate: MailTemplate = useMemo(
    () =>
      templates.find((t) => t.id === templateId) ??
      templates[0] ?? {
        id: "generic",
        name: "General message",
        subject: `Message from ${companyName ?? "your firm"}`,
        body: `Dear ${customerName},\n\n\n\nKind regards,\n${companyName ?? "Team"}`,
      },
    [templateId, templates, companyName, customerName]
  );

  const isLetter = isLetterTemplate(selectedTemplate.id);

  function applyTemplate(template: MailTemplate) {
    setSubject(template.subject);
    setMessage(template.body);
    if (isLetterTemplate(template.id)) {
      const letter = letterDetailsFromTemplate(template);
      setLetterContactEmail(letter.contactEmail);
      setLetterContactPhone(letter.contactPhone);
      setLetterContactAddress(letter.contactAddress);
      setLetterRecipientAddress(letter.recipientAddress);
      setLetterReLine(letter.reLine ?? "");
      setLetterSignatoryName(letter.signatoryName ?? "");
      setLetterSignatoryTitle(letter.signatoryTitle ?? "");
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setChannel("EMAIL");
    setCc("");
    setLoadingTemplates(true);
    void listMailTemplates(companyId)
      .then((items) => {
        setTemplates(items);
        const first = items[0];
        if (first) {
          setTemplateId(first.id);
          applyTemplate(first);
        }
      })
      .catch(() => setTemplates([]))
      .finally(() => setLoadingTemplates(false));

    if (defaultEmail) {
      setContactEmail(defaultEmail);
      setTo(defaultEmail);
      setContactPhone(null);
      return;
    }

    let cancelled = false;
    setLoadingContact(true);
    void (async () => {
      try {
        const c = await getCustomer(companyId, customerId);
        if (!cancelled) {
          setContactEmail(c.contactEmail ?? null);
          setContactPhone(c.contactPhone ?? null);
          setTo(c.contactEmail ?? "");
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Could not load customer contact."));
        }
      } finally {
        if (!cancelled) setLoadingContact(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, companyId, customerId, defaultEmail]);

  useEffect(() => {
    if (!isOpen) return;
    if (channel === "EMAIL") {
      setTo(contactEmail ?? "");
      return;
    }
    const digits = contactPhone?.replace(/\D/g, "") ?? "";
    setTo(digits || contactPhone || "");
  }, [channel, contactEmail, contactPhone, isOpen]);

  async function handleSend() {
    if (!to.trim()) {
      setError(
        channel === "EMAIL"
          ? "Recipient email is required."
          : "Recipient phone is required."
      );
      return;
    }
    if (channel === "EMAIL" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await sendMailViaApi({
        companyId,
        to: to.trim(),
        cc: channel === "EMAIL" ? cc.trim() || undefined : undefined,
        subject: subject.trim() || selectedTemplate.subject,
        message: message.trim() || selectedTemplate.body,
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        channel,
        customerId,
        customerName,
        letterDetails: isLetter
          ? {
              contactEmail: letterContactEmail.trim(),
              contactPhone: letterContactPhone.trim(),
              contactAddress: letterContactAddress.trim(),
              recipientAddress: letterRecipientAddress.trim(),
              reLine: letterReLine.trim() || undefined,
              signatoryName: letterSignatoryName.trim() || undefined,
              signatoryTitle: letterSignatoryTitle.trim() || undefined,
            }
          : undefined,
      });
      onSent?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-0"
    >
      <div className="flex max-h-[min(90vh,40rem)] flex-col">
        <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900">
            <Mail className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Message customer
            </h2>
            <p className="text-sm text-gray-500">{customerName}</p>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {error ? <p className="text-sm text-error-600">{error}</p> : null}
          {(loadingContact || loadingTemplates) ? (
            <p className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading…
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Template</Label>
              <select
                className={`${selectClass} mt-1.5`}
                value={templateId}
                disabled={loadingTemplates || !templates.length}
                onChange={(e) => {
                  const id = e.target.value;
                  setTemplateId(id);
                  const next =
                    templates.find((t) => t.id === id) ?? selectedTemplate;
                  applyTemplate(next);
                }}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Channel</Label>
              <select
                className={`${selectClass} mt-1.5`}
                value={channel}
                onChange={(e) => setChannel(e.target.value as MailChannel)}
              >
                <option value="EMAIL">Email</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>
          </div>

          <div>
            <Label>{channel === "EMAIL" ? "To (email)" : "To (phone)"}</Label>
            <Input
              type={channel === "EMAIL" ? "email" : "tel"}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1.5"
              disabled={loadingContact}
            />
          </div>

          {channel === "EMAIL" ? (
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
          ) : (
            <p className="text-xs text-gray-500">
              WhatsApp messages are queued on the server — delivery integration is
              coming soon.
            </p>
          )}

          {isLetter ? (
            <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-900/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Letterhead (editable)
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Contact email</Label>
                  <Input
                    value={letterContactEmail}
                    onChange={(e) => setLetterContactEmail(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Contact phone</Label>
                  <Input
                    value={letterContactPhone}
                    onChange={(e) => setLetterContactPhone(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div>
                <Label>Office address (letterhead)</Label>
                <textarea
                  rows={5}
                  value={letterContactAddress}
                  onChange={(e) => setLetterContactAddress(e.target.value)}
                  className={`${invoiceMessageTextareaClass} mt-1.5`}
                />
              </div>
              <div>
                <Label>Recipient address (on letter)</Label>
                <textarea
                  rows={4}
                  value={letterRecipientAddress}
                  onChange={(e) => setLetterRecipientAddress(e.target.value)}
                  placeholder="DIRECTOR&#10;ORGANISATION&#10;P O BOX …&#10;CITY"
                  className={`${invoiceMessageTextareaClass} mt-1.5`}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Subject line</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder='e.g. CLIENT NAME "The Firm"'
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Re: line</Label>
                  <Input
                    value={letterReLine}
                    onChange={(e) => setLetterReLine(e.target.value)}
                    placeholder="Re: Registered Office"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1.5"
              />
            </div>
          )}

          <div>
            <Label>{isLetter ? "Letter body" : "Message"}</Label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={isLetter ? 14 : 12}
              className={`${invoiceMessageTextareaClass} mt-1.5 min-h-[220px]`}
            />
          </div>

          {isLetter ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Signatory name</Label>
                <Input
                  value={letterSignatoryName}
                  onChange={(e) => setLetterSignatoryName(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Signatory title</Label>
                <Input
                  value={letterSignatoryTitle}
                  onChange={(e) => setLetterSignatoryTitle(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          ) : null}

          <p className="flex items-center gap-1.5 text-xs text-gray-500">
            <AlertCircle className="size-3.5" aria-hidden />
            {isLetter
              ? "Formal letter layout with logo — edit all fields before sending."
              : "Choose a template, edit it, then send."}
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || loadingContact || loadingTemplates || !to.trim()}
          >
            {sending ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="mr-1.5 size-4" aria-hidden />
            )}
            {sending
              ? "Sending…"
              : channel === "WHATSAPP"
                ? "Queue WhatsApp"
                : "Send email"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
