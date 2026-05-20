"use client";

import { getApiErrorMessage } from "@/api/errors";
import { getCustomer, listCustomers } from "@/api/template-config/template-config.api";
import type { CustomerListItemResponse } from "@/api/types/template-config";
import SetupEmptyState from "@/components/setup/SetupEmptyState";
import SetupPageShell from "@/components/setup/SetupPageShell";
import {
  setupListTableSectionClass,
  setupListTdClass,
  setupListThClass,
  setupTableClass,
  setupTableRowClass,
} from "@/components/setup/setup-table-styles";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { getAccessToken } from "@/lib/auth-storage";
import {
  MAIL_HISTORY_SEED,
  MAIL_TEMPLATES,
} from "@/lib/mail/mail-dummy-data";
import type {
  MailChannel,
  MailDeliveryStatus,
  MailHistoryRow,
  MailTemplate,
} from "@/lib/mail/mail-types";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Mail,
  Plus,
  Search,
  SendHorizonal,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type MailFilters = {
  search: string;
  status: "" | MailDeliveryStatus;
  channel: "" | MailChannel;
};

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const STATUS_LABELS: Record<MailDeliveryStatus, string> = {
  SENT: "Sent",
  FAILED: "Delivery failed",
  QUEUED: "Queued",
};

const CHANNEL_LABELS: Record<MailChannel, string> = {
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
};

function statusBadgeClass(status: MailDeliveryStatus): string {
  if (status === "SENT") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800";
  }
  if (status === "FAILED") {
    return "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800";
  }
  return "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800";
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function MailPanel() {
  return (
    <SetupPageShell
      title="Mail"
      description="Send customer communications with reusable templates and track delivery status."
    >
      {() => <MailList />}
    </SetupPageShell>
  );
}

function MailList() {
  const { companyId, companyName } = useCompanyContext();
  const [rows, setRows] = useState<MailHistoryRow[]>(MAIL_HISTORY_SEED);
  const [filters, setFilters] = useState<MailFilters>({
    search: "",
    status: "",
    channel: "",
  });
  const [customers, setCustomers] = useState<CustomerListItemResponse[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    setLoadingCustomers(true);
    setCustomerError(null);
    void listCustomers(companyId)
      .then((items) => setCustomers(items))
      .catch((err) =>
        setCustomerError(getApiErrorMessage(err, "Could not load customers."))
      )
      .finally(() => setLoadingCustomers(false));
  }, [companyId]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filters.status && r.status !== filters.status) return false;
      if (filters.channel && r.channel !== filters.channel) return false;
      if (!q) return true;
      return (
        r.recipient.toLowerCase().includes(q) ||
        (r.customerName ?? "").toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        r.templateName.toLowerCase().includes(q)
      );
    });
  }, [rows, filters]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      sent: rows.filter((r) => r.status === "SENT").length,
      failed: rows.filter((r) => r.status === "FAILED").length,
      queued: rows.filter((r) => r.status === "QUEUED").length,
    }),
    [rows]
  );

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Mail}
            label="Total sent"
            value={String(stats.total)}
            hint="All communication records"
          />
          <StatCard
            icon={CheckCircle2}
            label="Delivered"
            value={String(stats.sent)}
            hint="Successful sends"
          />
          <StatCard
            icon={XCircle}
            label="Delivery failed"
            value={String(stats.failed)}
            hint="Need retry"
          />
          <StatCard
            icon={Clock3}
            label="Queued"
            value={String(stats.queued)}
            hint="Pending delivery"
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/20">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Mail history
              </p>
              <p className="text-xs text-gray-500">
                {filtered.length} of {rows.length} messages
              </p>
            </div>
            <Button type="button" size="sm" onClick={() => setComposeOpen(true)}>
              <Plus className="mr-1.5 size-4" aria-hidden />
              Send mail
            </Button>
          </div>

          <div className="grid gap-4 border-b border-gray-100 p-5 dark:border-gray-800 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label>Search</Label>
              <div className="relative mt-1.5">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                  aria-hidden
                />
                <Input
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, search: e.target.value }))
                  }
                  placeholder="Search recipient, customer, subject..."
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Delivery</Label>
              <select
                className={`${selectClass} mt-1.5`}
                value={filters.status}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    status: e.target.value as MailFilters["status"],
                  }))
                }
              >
                <option value="">All</option>
                <option value="SENT">Sent</option>
                <option value="FAILED">Delivery failed</option>
                <option value="QUEUED">Queued</option>
              </select>
            </div>
            <div>
              <Label>Channel</Label>
              <select
                className={`${selectClass} mt-1.5`}
                value={filters.channel}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    channel: e.target.value as MailFilters["channel"],
                  }))
                }
              >
                <option value="">All</option>
                <option value="EMAIL">Email</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>
          </div>

          <div className={setupListTableSectionClass}>
            {filtered.length === 0 ? (
              <SetupEmptyState
                icon={Mail}
                title="No messages found"
                description="Adjust filters or send a new message."
                action={
                  <Button type="button" size="sm" onClick={() => setComposeOpen(true)}>
                    <SendHorizonal className="mr-1.5 size-4" aria-hidden />
                    Compose
                  </Button>
                }
              />
            ) : (
              <Table className={setupTableClass}>
                <TableHeader>
                  <TableRow>
                    {[
                      "Date",
                      "Recipient",
                      "Template",
                      "Channel",
                      "Subject",
                      "Status",
                    ].map((h) => (
                      <TableCell key={h} isHeader className={setupListThClass}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.id} className={setupTableRowClass}>
                      <TableCell className={setupListTdClass}>
                        {formatDateTime(row.sentAt)}
                      </TableCell>
                      <TableCell className={setupListTdClass}>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {row.customerName ?? "Custom recipient"}
                        </p>
                        <p className="text-xs text-gray-500">{row.recipient}</p>
                      </TableCell>
                      <TableCell className={setupListTdClass}>
                        {row.templateName}
                      </TableCell>
                      <TableCell className={setupListTdClass}>
                        {CHANNEL_LABELS[row.channel]}
                      </TableCell>
                      <TableCell className={setupListTdClass}>{row.subject}</TableCell>
                      <TableCell className={setupListTdClass}>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(row.status)}`}
                        >
                          {STATUS_LABELS[row.status]}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      <ComposeMailModal
        open={composeOpen}
        companyId={companyId}
        customers={customers}
        loadingCustomers={loadingCustomers}
        customerError={customerError}
        onClose={() => setComposeOpen(false)}
        onSend={async (payload) => {
          let status: MailDeliveryStatus = "QUEUED";
          if (payload.channel === "EMAIL") {
            const token = getAccessToken();
            if (!token) {
              alert("Session expired. Please sign in again.");
              return "FAILED";
            }
            try {
              const res = await fetch("/api/send-mail", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  to: payload.recipient,
                  subject: payload.subject,
                  message: payload.body,
                  templateId: payload.templateId,
                  companyName: companyName ?? "Company",
                }),
              });
              const data = (await res.json().catch(() => ({}))) as {
                message?: string;
                error?: string;
              };
              if (!res.ok) {
                throw new Error(data.message ?? data.error ?? "Could not send email.");
              }
              status = "SENT";
            } catch (err) {
              alert(err instanceof Error ? err.message : "Could not send email.");
              status = "FAILED";
            }
          } else {
            const text = payload.body.trim();
            const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(wa, "_blank");
            status = "SENT";
          }

          const next: MailHistoryRow = {
            id: `mail_${Date.now()}`,
            sentAt: new Date().toISOString(),
            recipient: payload.recipient,
            customerName: payload.customerName,
            templateName: payload.templateName,
            channel: payload.channel,
            subject: payload.subject,
            status,
          };
          setRows((prev) => [next, ...prev]);
          return status;
        }}
      />
    </>
  );
}

function ComposeMailModal({
  open,
  companyId,
  customers,
  loadingCustomers,
  customerError,
  onClose,
  onSend,
}: {
  open: boolean;
  companyId: string | null;
  customers: CustomerListItemResponse[];
  loadingCustomers: boolean;
  customerError: string | null;
  onClose: () => void;
  onSend: (payload: {
    recipient: string;
    customerName?: string;
    templateId: string;
    templateName: string;
    channel: MailChannel;
    subject: string;
    body: string;
  }) => Promise<MailDeliveryStatus>;
}) {
  const [templateId, setTemplateId] = useState(MAIL_TEMPLATES[0]!.id);
  const [recipient, setRecipient] = useState("");
  const [channel, setChannel] = useState<MailChannel>("EMAIL");
  const [subject, setSubject] = useState(MAIL_TEMPLATES[0]!.subject);
  const [body, setBody] = useState(MAIL_TEMPLATES[0]!.body);
  const [sending, setSending] = useState(false);
  const [enrichedRecipients, setEnrichedRecipients] = useState<
    {
      id: string;
      name: string;
      contactEmail: string | null;
      contactPhone: string | null;
    }[]
  >([]);
  const [enrichingContacts, setEnrichingContacts] = useState(false);

  const selectedTemplate: MailTemplate = useMemo(
    () =>
      MAIL_TEMPLATES.find((t) => t.id === templateId) ?? MAIL_TEMPLATES[0]!,
    [templateId]
  );

  useEffect(() => {
    if (!open || !companyId || customers.length === 0) {
      setEnrichedRecipients([]);
      return;
    }
    let cancelled = false;
    setEnrichingContacts(true);
    void (async () => {
      try {
        const rows = await Promise.all(
          customers.map(async (c) => {
            try {
              const full = await getCustomer(companyId, c.id);
              return {
                id: c.id,
                name: full.name,
                contactEmail: full.contactEmail,
                contactPhone: full.contactPhone ?? c.contactPhone,
              };
            } catch {
              return {
                id: c.id,
                name: c.name,
                contactEmail: null,
                contactPhone: c.contactPhone,
              };
            }
          })
        );
        if (!cancelled) setEnrichedRecipients(rows);
      } finally {
        if (!cancelled) setEnrichingContacts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, companyId, customers]);

  const recipientOptions = useMemo(() => {
    if (channel === "EMAIL") {
      return enrichedRecipients
        .filter((r) => r.contactEmail?.trim())
        .map((r) => {
          const email = r.contactEmail!.trim();
          return {
            value: email,
            label: `${r.name} · ${email}`,
          };
        });
    }
    return enrichedRecipients
      .filter((r) => r.contactPhone?.trim())
      .map((r) => {
        const digits = r.contactPhone!.replace(/\D/g, "");
        return {
          value: digits || r.contactPhone!.trim(),
          label: `${r.name} · ${r.contactPhone}`,
        };
      });
  }, [channel, enrichedRecipients]);

  useEffect(() => {
    setSubject(selectedTemplate.subject);
    setBody(selectedTemplate.body);
  }, [selectedTemplate]);

  function resolveCustomerNameForSend(to: string): string | undefined {
    const trimmed = to.trim();
    if (channel === "EMAIL") {
      const lower = trimmed.toLowerCase();
      return enrichedRecipients.find(
        (r) => r.contactEmail?.trim().toLowerCase() === lower
      )?.name;
    }
    const norm = trimmed.replace(/\D/g, "");
    return enrichedRecipients.find(
      (r) => r.contactPhone && r.contactPhone.replace(/\D/g, "") === norm
    )?.name;
  }

  async function submit() {
    if (!recipient.trim()) {
      alert("Enter recipient (customer, email, or phone).");
      return;
    }
    if (channel === "EMAIL") {
      const email = recipient.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert("For Email channel, recipient must be a valid email address.");
        return;
      }
    }
    setSending(true);
    try {
      await onSend({
        recipient: recipient.trim(),
        customerName: resolveCustomerNameForSend(recipient.trim()),
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        channel,
        subject: subject.trim() || selectedTemplate.subject,
        body: body.trim() || selectedTemplate.body,
      });
      onClose();
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 sm:p-8"
    >
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Send mail
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose a reusable template, edit it, then send.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Template</Label>
            <select
              className={`${selectClass} mt-1.5`}
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              {MAIL_TEMPLATES.map((t) => (
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
              onChange={(e) => {
                setChannel(e.target.value as MailChannel);
                setRecipient("");
              }}
            >
              <option value="EMAIL">Email</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
          </div>
        </div>

        <div>
          <Label>Recipient (search customer or type custom)</Label>
          <input
            list="mail-recipient-customers"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={
              channel === "EMAIL"
                ? "Pick a customer to fill email, or type an address"
                : "Pick a customer to fill phone, or type a number"
            }
            className="mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
          <datalist id="mail-recipient-customers">
            {recipientOptions.map((opt) => (
              <option key={`${opt.value}|${opt.label}`} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </datalist>
          {enrichingContacts ? (
            <p className="mt-1 text-xs text-gray-500">Loading customer emails…</p>
          ) : null}
          {loadingCustomers ? (
            <p className="mt-1 text-xs text-gray-500">Loading customers...</p>
          ) : null}
          {customerError ? (
            <p className="mt-1 text-xs text-error-600">{customerError}</p>
          ) : null}
        </div>

        <div>
          <Label>Subject</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Message subject"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label>Message</Label>
          <textarea
            rows={9}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </div>

        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <AlertCircle className="size-3.5" aria-hidden />
          You can fully edit template content before sending.
        </p>

        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={() => void submit()} disabled={sending}>
            <SendHorizonal className="mr-1.5 size-4" aria-hidden />
            {sending ? "Sending..." : "Send now"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/30">
      <Icon className="size-5 text-brand-600 dark:text-brand-400" aria-hidden />
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </div>
  );
}
