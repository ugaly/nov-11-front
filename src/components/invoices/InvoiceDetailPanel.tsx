"use client";

import EditableInvoiceDocument from "@/components/invoices/EditableInvoiceDocument";
import InvoiceDocumentPreview from "@/components/invoices/InvoiceDocumentPreview";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import ResendInvoiceModal from "@/components/invoices/ResendInvoiceModal";
import {
  SetupAvatar,
  SetupBackLink,
  SetupContactLine,
  SetupSectionCard,
  SetupStatCard,
} from "@/components/setup/setup-pro-ui";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { downloadInvoicePdf } from "@/lib/export/invoice-document-pdf";
import { getDummyInvoiceById } from "@/lib/invoices/invoice-dummy-data";
import type { InvoiceRecord } from "@/lib/invoices/invoice-types";
import {
  computeDisplayStatus,
  daysUntilDue,
  formatInvoiceAmount,
  formatInvoiceDate,
  INVOICE_TYPE_LABELS,
  recalculateInvoice,
} from "@/lib/invoices/invoice-utils";
import {
  ArrowUpCircle,
  Banknote,
  Calendar,
  ChevronLeft,
  Copy,
  Download,
  FileText,
  History,
  Loader2,
  Mail,
  Pencil,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function InvoiceDetailPanel({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const { companyName, loading: ctxLoading, error: ctxError, reload } =
    useCompanyContext();
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(() =>
    getDummyInvoiceById(invoiceId) ?? null
  );
  const [resendOpen, setResendOpen] = useState(false);
  const [paidModalOpen, setPaidModalOpen] = useState(false);
  const [actionNote, setActionNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<InvoiceRecord | null>(null);

  useEffect(() => {
    if (invoice && !editing) setEditDraft(invoice);
  }, [invoice, editing]);

  const refresh = useCallback(() => {
    setInvoice(getDummyInvoiceById(invoiceId) ?? null);
  }, [invoiceId]);

  if (ctxLoading) {
    return <p className="text-sm text-gray-500">Loading workspace…</p>;
  }

  if (ctxError) {
    return (
      <p className="text-sm text-error-700">
        {ctxError}{" "}
        <button type="button" className="underline" onClick={() => void reload()}>
          Retry
        </button>
      </p>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-4">
        <SetupBackLink href="/invoices">
          <ChevronLeft className="size-4" aria-hidden />
          Back to invoices
        </SetupBackLink>
        <p className="text-sm text-gray-500">Invoice not found.</p>
      </div>
    );
  }

  const inv = invoice;
  const status = computeDisplayStatus(inv);
  const balance = inv.total - inv.amountPaid;
  const days = daysUntilDue(inv.dueAt);
  const canEditInvoice = status !== "PAID" && status !== "CANCELLED";

  function startEditing() {
    setEditDraft({ ...inv });
    setEditing(true);
    setActionNote(null);
  }

  function cancelEditing() {
    setEditDraft({ ...inv });
    setEditing(false);
  }

  function saveEditing() {
    if (!editDraft) return;
    const saved = recalculateInvoice({
      ...editDraft,
      activities: [
        {
          id: `a-${Date.now()}`,
          at: new Date().toISOString().slice(0, 10),
          label: "Invoice updated",
          detail: "Line items or terms edited",
        },
        ...editDraft.activities,
      ],
    });
    setInvoice(saved);
    setEditDraft(saved);
    setEditing(false);
    setActionNote("Invoice saved.");
  }

  async function runAction(
    label: string,
    updater: (inv: InvoiceRecord) => InvoiceRecord
  ) {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    setInvoice((prev) => (prev ? updater(prev) : prev));
    setActionNote(label);
    setBusy(false);
    setPaidModalOpen(false);
  }

  function markPaid() {
    void runAction("Invoice marked as paid.", (inv) => ({
      ...inv,
      status: "PAID",
      amountPaid: inv.total,
      paidAt: new Date().toISOString().slice(0, 10),
      activities: [
        {
          id: `a-${Date.now()}`,
          at: new Date().toISOString().slice(0, 10),
          label: "Marked as paid",
          detail: "Manual payment recorded",
        },
        ...inv.activities,
      ],
    }));
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <SetupBackLink href="/invoices">
            <ChevronLeft className="size-4" aria-hidden />
            Invoices
          </SetupBackLink>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {invoice.number}
            </h1>
            <InvoiceStatusBadge status={status} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <SetupAvatar name={invoice.customerName} size="xs" />
              {invoice.customerName}
            </span>
            <span>·</span>
            <span>{INVOICE_TYPE_LABELS[invoice.type]}</span>
            <span>·</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatInvoiceAmount(invoice.currency, invoice.total)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {editing ? (
            <>
              <Button size="sm" onClick={saveEditing} disabled={busy}>
                Save changes
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEditing} disabled={busy}>
                Cancel
              </Button>
            </>
          ) : canEditInvoice ? (
            <Button size="sm" variant="outline" onClick={startEditing} disabled={busy}>
              <Pencil className="mr-1.5 size-4" aria-hidden />
              Edit invoice
            </Button>
          ) : null}
          {!editing && status !== "PAID" && status !== "CANCELLED" ? (
            <>
              <Button
                size="sm"
                onClick={() => setPaidModalOpen(true)}
                disabled={busy}
              >
                <Banknote className="mr-1.5 size-4" aria-hidden />
                Mark as paid
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void runAction("Renewal invoice draft created.", (inv) => ({
                    ...inv,
                    type: "RENEWAL",
                    activities: [
                      {
                        id: `a-${Date.now()}`,
                        at: new Date().toISOString().slice(0, 10),
                        label: "Renewal initiated",
                      },
                      ...inv.activities,
                    ],
                  }))
                }
              >
                <RotateCcw className="mr-1.5 size-4" aria-hidden />
                Renew
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void runAction("Upgrade line items applied.", (inv) => ({
                    ...inv,
                    type: "UPGRADE",
                    activities: [
                      {
                        id: `a-${Date.now()}`,
                        at: new Date().toISOString().slice(0, 10),
                        label: "Upgrade applied",
                      },
                      ...inv.activities,
                    ],
                  }))
                }
              >
                <ArrowUpCircle className="mr-1.5 size-4" aria-hidden />
                Upgrade
              </Button>
            </>
          ) : null}
          {!editing ? (
            <Button size="sm" variant="outline" onClick={() => setResendOpen(true)}>
              <Mail className="mr-1.5 size-4" aria-hidden />
              Resend
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            disabled={pdfBusy}
            onClick={() => {
              setPdfBusy(true);
              void downloadInvoicePdf(inv, companyName ?? "Company")
                .catch((err) =>
                  alert(
                    err instanceof Error
                      ? err.message
                      : "Could not download PDF."
                  )
                )
                .finally(() => setPdfBusy(false));
            }}
          >
            {pdfBusy ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="mr-1.5 size-4" aria-hidden />
            )}
            {pdfBusy ? "Preparing…" : "PDF"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/invoices/create?from=${invoice.id}`)}
          >
            <Copy className="mr-1.5 size-4" aria-hidden />
            Duplicate
          </Button>
          {status !== "CANCELLED" && status !== "PAID" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                void runAction("Invoice cancelled.", (inv) => ({
                  ...inv,
                  status: "CANCELLED",
                  activities: [
                    {
                      id: `a-${Date.now()}`,
                      at: new Date().toISOString().slice(0, 10),
                      label: "Invoice cancelled",
                    },
                    ...inv.activities,
                  ],
                }))
              }
            >
              <XCircle className="mr-1.5 size-4" aria-hidden />
              Cancel
            </Button>
          ) : null}
        </div>
      </div>

      {actionNote ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          {actionNote}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SetupStatCard
          icon={FileText}
          label="Balance due"
          value={
            status === "PAID"
              ? formatInvoiceAmount(invoice.currency, 0)
              : formatInvoiceAmount(invoice.currency, balance)
          }
        />
        <SetupStatCard
          icon={Calendar}
          label="Due date"
          value={formatInvoiceDate(invoice.dueAt)}
          hint={
            status === "PAID"
              ? "Paid"
              : days < 0
                ? `${Math.abs(days)} days overdue`
                : days === 0
                  ? "Due today"
                  : `Due in ${days} days`
          }
        />
        <SetupStatCard
          icon={Banknote}
          label="Amount paid"
          value={formatInvoiceAmount(invoice.currency, invoice.amountPaid)}
        />
        <SetupStatCard
          icon={RefreshCw}
          label="Last sent"
          value={
            invoice.activities.find((a) => a.label.toLowerCase().includes("sent"))
              ?.at
              ? formatInvoiceDate(
                  invoice.activities.find((a) =>
                    a.label.toLowerCase().includes("sent")
                  )!.at
                )
              : "—"
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="xl:col-span-8">
          {editing && editDraft ? (
            <EditableInvoiceDocument
              invoice={editDraft}
              companyName={companyName}
              onChange={setEditDraft}
            />
          ) : (
            <InvoiceDocumentPreview invoice={invoice} companyName={companyName} />
          )}
        </div>

        <div className="space-y-6 xl:col-span-4">
          <SetupSectionCard title="Customer" icon={FileText}>
            <div className="flex items-start gap-3">
              <SetupAvatar name={invoice.customerName} />
              <div className="min-w-0 space-y-2">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {invoice.customerName}
                </p>
                <SetupContactLine icon={Mail} href={`mailto:${invoice.customerEmail}`}>
                  {invoice.customerEmail}
                </SetupContactLine>
                <p className="text-xs leading-relaxed text-gray-500">
                  {invoice.billingAddress}
                </p>
                <Link
                  href={`/setup/customers/${invoice.customerId}`}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  View customer profile →
                </Link>
              </div>
            </div>
          </SetupSectionCard>

          <SetupSectionCard title="Payment details" icon={Banknote}>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Method</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  Bank transfer
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Reference</dt>
                <dd className="font-mono text-xs">{invoice.number}</dd>
              </div>
              {invoice.paidAt ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Paid on</dt>
                  <dd>{formatInvoiceDate(invoice.paidAt)}</dd>
                </div>
              ) : null}
            </dl>
          </SetupSectionCard>

          <SetupSectionCard title="Activity" icon={History}>
            <ul className="space-y-4">
              {invoice.activities.map((a) => (
                <li key={a.id} className="relative border-l-2 border-gray-200 pl-4 dark:border-gray-700">
                  <span className="absolute -left-[5px] top-1.5 size-2 rounded-full bg-gray-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {a.label}
                  </p>
                  <p className="text-xs text-gray-500">{formatInvoiceDate(a.at)}</p>
                  {a.detail ? (
                    <p className="mt-0.5 text-xs text-gray-500">{a.detail}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </SetupSectionCard>
        </div>
      </div>

      <ResendInvoiceModal
        invoice={invoice}
        isOpen={resendOpen}
        onClose={() => setResendOpen(false)}
        onSent={() => {
          setActionNote(`Invoice resent to ${invoice.customerEmail}.`);
          refresh();
        }}
      />

      <Modal isOpen={paidModalOpen} onClose={() => setPaidModalOpen(false)} className="max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Mark as paid?
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Record full payment of{" "}
          <strong>{formatInvoiceAmount(invoice.currency, balance)}</strong> for{" "}
          {invoice.number}.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setPaidModalOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => markPaid()} disabled={busy}>
            {busy ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
            Confirm payment
          </Button>
        </div>
      </Modal>
    </div>
  );
}
