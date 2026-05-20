"use client";

import type {
  CustomerEngagementResponse,
  CustomerResponse,
} from "@/api/types/template-config";
import type { WorkItemFieldDefinition } from "@/api/types/work-item-template";
import { getWorkItemExecution } from "@/api/work-item/work-item.api";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import {
  buildFormShareMessage,
  formShareEmailSubject,
} from "@/lib/form-share-message";
import {
  downloadPrintableFormBlob,
  generateGroupPrintableFormPdf,
  printPrintableFormBlob,
  type GroupPrintableTaskSection,
} from "@/lib/export/work-item-printable-form-export";
import type { WorkGroupSection } from "@/lib/work-item-tree";
import { getAccessToken } from "@/lib/auth-storage";
import {
  Download,
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  Printer,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type PreparedForm = {
  blob: Blob;
  filename: string;
  base64: string;
  tasks: GroupPrintableTaskSection[];
};

export default function ExportGroupFormButton({
  companyId,
  engagement,
  customer,
  companyName,
  section,
}: {
  companyId: string;
  engagement: CustomerEngagementResponse;
  customer: CustomerResponse;
  companyName: string;
  section: WorkGroupSection;
}) {
  const groupTitle = section.title ?? `Group ${section.groupNumber}`;
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<PreparedForm | null>(null);
  const [recipient, setRecipient] = useState(customer.contactEmail ?? "");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [canExport, setCanExport] = useState(false);

  const defaultMessage = useMemo(
    () =>
      buildFormShareMessage({
        customerName: customer.name,
        companyName,
        engagementTitle: engagement.title,
        groupTitle,
      }),
    [customer.name, companyName, engagement.title, groupTitle]
  );

  const defaultSubject = useMemo(
    () =>
      formShareEmailSubject({
        companyName,
        engagementTitle: engagement.title,
        groupTitle,
      }),
    [companyName, engagement.title, groupTitle]
  );

  const loadTaskTemplates = useCallback(async (): Promise<
    GroupPrintableTaskSection[]
  > => {
    const sections: GroupPrintableTaskSection[] = [];
    for (const { task, taskRoman } of section.tasks) {
      try {
        const bundle = await getWorkItemExecution(
          companyId,
          engagement.id,
          task.id
        );
        const fields = (bundle.template?.fields ?? []).slice().sort(
          (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
        ) as WorkItemFieldDefinition[];
        if (bundle.template?.configuredAt && fields.length > 0) {
          sections.push({
            taskName: task.name,
            taskRoman,
            fields,
          });
        }
      } catch {
        /* skip tasks without template */
      }
    }
    return sections;
  }, [companyId, engagement.id, section.tasks]);

  useEffect(() => {
    let active = true;
    setCanExport(false);
    setError(null);

    const checkConfigured = async () => {
      for (const { task } of section.tasks) {
        try {
          const bundle = await getWorkItemExecution(
            companyId,
            engagement.id,
            task.id
          );
          const fields = bundle.template?.fields ?? [];
          if (bundle.template?.configuredAt && fields.length > 0) {
            if (active) setCanExport(true);
            return;
          }
        } catch {
          // Ignore per-task read errors during quick availability check.
        }
      }
      if (active) setCanExport(false);
    };

    void checkConfigured();
    return () => {
      active = false;
    };
  }, [companyId, engagement.id, section.tasks]);

  async function prepareForm() {
    setLoading(true);
    setError(null);
    setSent(false);
    try {
      const tasks = await loadTaskTemplates();
      if (tasks.length === 0) {
        throw new Error(
          "No configured fields in this group yet. Set up fields on tasks first."
        );
      }
      const result = await generateGroupPrintableFormPdf({
        companyName,
        customer,
        engagement,
        groupTitle,
        tasks,
      });
      setPrepared({
        blob: result.blob,
        filename: result.filename,
        base64: result.base64,
        tasks,
      });
      setMessage(defaultMessage);
      setSubject(defaultSubject);
      setRecipient(customer.contactEmail ?? "");
      setOpen(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not prepare printable form."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!prepared) return;
    downloadPrintableFormBlob(prepared.blob, prepared.filename);
  }

  function handlePrint() {
    if (!prepared) return;
    try {
      printPrintableFormBlob(prepared.blob);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not open print dialog.");
    }
  }

  function handleWhatsApp() {
    const text = `${message.trim()}\n\n(Download the PDF form from our office portal or request it by email.)`;
    const digits = (customer.contactPhone ?? "").replace(/\D/g, "");
    const waUrl = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  }

  async function handleSendEmail() {
    if (!prepared) return;
    const to = recipient.trim();
    if (!to) {
      alert("Enter the customer email address.");
      return;
    }
    const token = getAccessToken();
    if (!token) {
      alert("Sign in again to send email.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/send-form-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to,
          subject: subject.trim() || defaultSubject,
          message: message.trim() || defaultMessage,
          pdfFilename: prepared.filename,
          pdfBase64: prepared.base64,
          companyName,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(
          data.message ?? data.error ?? "Could not send email."
        );
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send email.");
    } finally {
      setSending(false);
    }
  }

  const hasFileFields = prepared?.tasks.some((t) =>
    t.fields.some((f) => f.widget === "FILE")
  );

  if (!canExport) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => void prepareForm()}
      >
        {loading ? (
          <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
        ) : (
          <FileText className="mr-1.5 size-4" aria-hidden />
        )}
        {loading ? "Preparing…" : "Export form"}
      </Button>
      {error && !open ? (
        <p className="max-w-xs text-right text-[10px] text-error-600">{error}</p>
      ) : null}

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 sm:p-8"
      >
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Share manual form
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Printable PDF for {groupTitle} — two columns (field name and space
              to fill). Use for customers who complete forms on paper.
            </p>
          </div>

          {hasFileFields ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              This form includes file fields. The PDF notes that attachments must
              be provided separately when the customer returns the form.
            </p>
          ) : null}

          <div>
            <Label>Email to</Label>
            <input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="customer@example.com"
              className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>

          <div>
            <Label>Subject</Label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>

          <div>
            <Label>Message</Label>
            <textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
            <p className="mt-1 text-xs text-gray-500">
              Used for email and WhatsApp. Email sends the PDF as an attachment.
            </p>
          </div>

          {error && open ? (
            <p className="text-sm text-error-600">{error}</p>
          ) : null}
          {sent ? (
            <p className="text-sm text-success-600">Email sent successfully.</p>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="mr-1.5 size-4" aria-hidden />
              Download PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
            >
              <Printer className="mr-1.5 size-4" aria-hidden />
              Print
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="mr-1.5 size-4" aria-hidden />
              WhatsApp
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={sending}
              onClick={() => void handleSendEmail()}
            >
              {sending ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
              ) : (
                <Mail className="mr-1.5 size-4" aria-hidden />
              )}
              {sending ? "Sending…" : "Send email"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
