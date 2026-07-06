"use client";

import {
  downloadOfficeInvoicePdf,
  getOfficeInvoice,
  markOfficeInvoicePaid,
  resendOfficeInvoice,
  sendOfficeInvoice,
  voidOfficeInvoice,
} from "@/api/invoice/invoice.api";
import type {
  MarkInvoicePaidRequest,
  OfficeInvoiceResponse,
} from "@/api/types/invoice";
import InvoiceDocumentView from "@/components/invoices/InvoiceDocumentView";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import InvoiceWorkflowStatusBar from "@/components/invoices/InvoiceWorkflowStatusBar";
import ReminderList from "@/components/shared/ReminderList";
import {
  SetupBackLink,
  SetupSectionCard,
  SetupStatCard,
} from "@/components/setup/setup-pro-ui";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/context/ToastContext";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { getStoredUser } from "@/lib/auth-storage";
import { useInvoiceAccess } from "@/lib/invoices/use-invoice-access";
import { downloadBlob } from "@/lib/download-blob";
import {
  formatInvoiceAmount,
  formatInvoiceDate,
  invoiceBalance,
} from "@/lib/invoices/invoice-utils";
import type { ReminderEntry, ReminderSchedule } from "@/lib/reminders/reminder-types";
import {
  Ban,
  Banknote,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Download,
  Loader2,
  Mail,
  RotateCcw,
  Send,
  User,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function InvoiceDetailPanel({ invoiceId }: { invoiceId: string }) {
  const toast = useToast();
  const { companyName } = useCompanyContext();
  const me = getStoredUser();
  const { officeId, access, loading: accessLoading, refresh: refreshAccess } =
    useInvoiceAccess();
  const [invoice, setInvoice] = useState<OfficeInvoiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!officeId) return;
    setLoading(true);
    try {
      setInvoice(await getOfficeInvoice(officeId, invoiceId));
    } catch {
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  }, [officeId, invoiceId]);

  useEffect(() => {
    void refreshAccess();
    void refresh();
  }, [refresh, refreshAccess, invoiceId]);

  const documentData = useMemo(() => {
    if (!invoice) return null;
    const balance = invoiceBalance(invoice);
    return {
      referenceNumber: invoice.referenceNumber,
      status: invoice.status,
      billToName: invoice.billToName,
      billToEmail: invoice.billToEmail,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency,
      lineItems: invoice.lineItems.map((l) => ({
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        lineAmount: Number(l.lineAmount),
      })),
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.taxRate),
      taxAmount: Number(invoice.taxAmount),
      totalAmount: Number(invoice.totalAmount),
      taxIncluded: invoice.taxIncluded,
      amountPaid: Number(invoice.amountPaid),
      amountRemaining: balance > 0 ? balance : undefined,
      notes: invoice.notes ?? undefined,
      terms: invoice.terms ?? undefined,
      companyName,
    };
  }, [invoice, companyName]);

  if (accessLoading || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
      </div>
    );
  }

  if (!officeId || !access?.visible) {
    return (
      <div className="space-y-4">
        <SetupBackLink href="/invoices">
          <ChevronLeft className="size-4" aria-hidden />
          Back to invoices
        </SetupBackLink>
        <p className="text-sm text-gray-500">Invoices are not available for your account.</p>
      </div>
    );
  }

  if (!invoice || !documentData) {
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
  const balance = invoiceBalance(inv);
  const isCreator =
    Boolean(inv.createdBy?.id && me?.id) &&
    inv.createdBy!.id.toLowerCase() === me!.id!.toLowerCase();
  const canSend = access.canSend && inv.status === "DRAFT";
  const canResend =
    access.canSend &&
    (inv.status === "SENT" ||
      inv.status === "PARTIALLY_PAID" ||
      inv.status === "PAID");
  const canMarkPaid =
    access.canMarkPaid &&
    (inv.status === "DRAFT" ||
      inv.status === "SENT" ||
      inv.status === "PARTIALLY_PAID");
  const canVoid =
    inv.status !== "PAID" &&
    inv.status !== "PARTIALLY_PAID" &&
    inv.status !== "VOID" &&
    (isCreator || access.canSend);

  const pendingHint =
    (inv.status === "DRAFT" ||
      inv.status === "SENT" ||
      inv.status === "PARTIALLY_PAID") &&
    !canMarkPaid
      ? "You need Mark paid permission to record customer payments."
      : null;

  const reminderEntries: ReminderEntry[] = (inv.reminders ?? []).map((r) => ({
    id: r.id ?? `rem-${r.schedule}`,
    schedule: r.schedule as ReminderSchedule,
    at: r.customAt ?? undefined,
    note: r.note ?? undefined,
  }));

  async function runAction(
    label: string,
    fn: () => Promise<OfficeInvoiceResponse>
  ) {
    setBusy(true);
    try {
      setInvoice(await fn());
      toast.showSuccess(label);
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownloadPdf() {
    if (!officeId) return;
    setDownloading(true);
    try {
      const blob = await downloadOfficeInvoicePdf(officeId, inv.id);
      const safeName = inv.referenceNumber.replace(/[^a-zA-Z0-9._-]/g, "_");
      downloadBlob(blob, `${safeName}.pdf`);
      toast.showSuccess("Invoice PDF downloaded.");
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : "Could not download PDF.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <SetupBackLink href="/invoices">
          <ChevronLeft className="size-4" aria-hidden />
          Back to invoices
        </SetupBackLink>
        <InvoiceWorkflowStatusBar
          status={inv.status}
          className="w-full sm:ml-auto sm:w-auto"
        />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {inv.referenceNumber}
            </h1>
            <InvoiceStatusBadge status={inv.status} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {inv.billToName} · {inv.billToEmail}
          </p>
          {inv.customerName ? (
            <p className="text-sm text-gray-500">Customer · {inv.customerName}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={downloading || busy}
            onClick={() => void handleDownloadPdf()}
          >
            {downloading ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="mr-1.5 size-4" aria-hidden />
            )}
            Download PDF
          </Button>
          {canSend ? (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void runAction("Invoice issued (no email).", () =>
                    sendOfficeInvoice(officeId!, inv.id, { sendEmail: false })
                  )
                }
              >
                Mark as issued
              </Button>
              <Button
                size="sm"
                disabled={busy}
                onClick={() =>
                  void runAction("Invoice issued and emailed.", () =>
                    sendOfficeInvoice(officeId!, inv.id, { sendEmail: true })
                  )
                }
              >
                <Send className="mr-1.5 size-4" aria-hidden />
                Issue & email
              </Button>
            </>
          ) : null}
          {canResend ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                void runAction("Invoice emailed to customer.", () =>
                  resendOfficeInvoice(officeId!, inv.id)
                )
              }
            >
              <RotateCcw className="mr-1.5 size-4" aria-hidden />
              Send email
            </Button>
          ) : null}
          {canMarkPaid ? (
            <Button size="sm" disabled={busy} onClick={() => setMarkPaidOpen(true)}>
              <Banknote className="mr-1.5 size-4" aria-hidden />
              {inv.status === "PARTIALLY_PAID" ? "Record payment" : "Mark as paid"}
            </Button>
          ) : null}
          {canVoid ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                void runAction("Invoice voided.", () =>
                  voidOfficeInvoice(officeId!, inv.id)
                )
              }
            >
              <Ban className="mr-1.5 size-4" aria-hidden />
              Void
            </Button>
          ) : null}
        </div>
      </div>

      {pendingHint ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {pendingHint}
        </p>
      ) : inv.status === "DRAFT" ? (
        <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
          Draft — issue to the customer portal, email, or record payment without
          sending email.
        </p>
      ) : inv.status === "PARTIALLY_PAID" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          Partially paid — {formatInvoiceAmount(inv.currency, balance)} remaining of{" "}
          {formatInvoiceAmount(inv.currency, inv.totalAmount)}.
        </p>
      ) : null}

      {(inv.status === "SENT" ||
        inv.status === "PARTIALLY_PAID" ||
        inv.status === "PAID") && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SetupStatCard
            icon={Wallet}
            label="Invoice total"
            value={formatInvoiceAmount(inv.currency, Number(inv.totalAmount))}
          />
          <SetupStatCard
            icon={Banknote}
            label="Paid"
            value={formatInvoiceAmount(inv.currency, Number(inv.amountPaid))}
          />
          <SetupStatCard
            icon={Banknote}
            label="Remaining"
            value={formatInvoiceAmount(inv.currency, balance)}
          />
          <SetupStatCard
            icon={Calendar}
            label="Due date"
            value={formatInvoiceDate(inv.dueDate)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <InvoiceDocumentView data={documentData} variant="detail" />
        </div>

        <div className="space-y-4 xl:col-span-4">
          <SetupSectionCard title="Activity">
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3">
                <User className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Created</p>
                  <p className="text-gray-500">
                    {inv.createdBy?.fullName ?? "—"} ·{" "}
                    {formatInvoiceDate(inv.createdAt)}
                  </p>
                </div>
              </li>
              {inv.sentAt ? (
                <li className="flex gap-3">
                  <Mail className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Issued</p>
                    <p className="text-gray-500">
                      {inv.sentBy?.fullName ?? "—"} · {formatInvoiceDate(inv.sentAt)}
                    </p>
                  </div>
                </li>
              ) : null}
              {inv.paidAt ? (
                <li className="flex gap-3">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-emerald-500"
                    aria-hidden
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {inv.status === "PAID" ? "Fully paid" : "Last payment"}
                    </p>
                    <p className="text-gray-500">
                      {inv.paidBy?.fullName ?? "—"} · {formatInvoiceDate(inv.paidAt)}
                    </p>
                  </div>
                </li>
              ) : null}
              <li className="flex gap-3">
                <Calendar className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Due</p>
                  <p className="text-gray-500">{formatInvoiceDate(inv.dueDate)}</p>
                </div>
              </li>
            </ul>
          </SetupSectionCard>

          {(inv.reminders ?? []).length > 0 ? (
            <SetupSectionCard title="Payment reminders">
              <p className="mb-3 text-xs text-gray-500">
                Scheduled emails while this invoice is unpaid (after send).
              </p>
              <ReminderList
                reminders={reminderEntries}
                referenceDate={inv.dueDate}
                referenceKind="due"
              />
            </SetupSectionCard>
          ) : null}
        </div>
      </div>

      {(inv.payments ?? []).length > 0 ? (
        <SetupSectionCard title="Customer payments">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-700">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Amount</th>
                  <th className="pb-2 pr-4">Recorded by</th>
                  <th className="pb-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {inv.payments!.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                  >
                    <td className="py-2.5 pr-4 text-gray-900 dark:text-white">
                      {formatInvoiceDate(row.paidAt)}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-gray-900 dark:text-white">
                      {formatInvoiceAmount(inv.currency, Number(row.amount))}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">
                      {row.recordedBy?.fullName ?? "—"}
                    </td>
                    <td className="py-2.5 text-gray-600 dark:text-gray-400">
                      {row.note ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SetupSectionCard>
      ) : null}

      <MarkInvoicePaidModal
        open={markPaidOpen}
        invoice={inv}
        officeId={officeId}
        onClose={() => setMarkPaidOpen(false)}
        onSaved={(updated) => {
          setInvoice(updated);
          setMarkPaidOpen(false);
          toast.showSuccess(
            updated.status === "PAID"
              ? "Invoice fully paid."
              : "Partial payment recorded."
          );
        }}
      />
    </div>
  );
}

function MarkInvoicePaidModal({
  open,
  invoice,
  officeId,
  onClose,
  onSaved,
}: {
  open: boolean;
  invoice: OfficeInvoiceResponse;
  officeId: string;
  onClose: () => void;
  onSaved: (inv: OfficeInvoiceResponse) => void;
}) {
  const toast = useToast();
  const balance = invoiceBalance(invoice);
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(String(balance));
      setPaidAt(new Date().toISOString().slice(0, 10));
      setNote("");
    }
  }, [open, balance]);

  async function submit() {
    const payAmount = Number(amount.replace(/,/g, ""));
    if (!payAmount || payAmount <= 0) {
      toast.showError("Enter a valid payment amount.");
      return;
    }
    if (payAmount > balance) {
      toast.showError(
        `Amount cannot exceed the remaining balance (${formatInvoiceAmount(invoice.currency, balance)}).`
      );
      return;
    }
    const body: MarkInvoicePaidRequest = {
      amount: payAmount,
      note: note.trim() || undefined,
    };
    if (paidAt.trim()) {
      body.paidAt = paidAt.trim();
    }
    setSaving(true);
    try {
      const updated = await markOfficeInvoicePaid(officeId, invoice.id, body);
      onSaved(updated);
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : "Could not record payment.");
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Record customer payment
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {invoice.billToName} · {invoice.referenceNumber}
      </p>
      <p className="mt-2 text-sm font-medium text-gray-800 dark:text-gray-200">
        Remaining balance: {formatInvoiceAmount(invoice.currency, balance)}
      </p>
      <div className="mt-4 space-y-4">
        <div>
          <Label>Amount received ({invoice.currency}) *</Label>
          <Input
            type="number"
            min="0"
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-gray-500">
            Defaults to the full balance. Enter less for a partial payment.
          </p>
        </div>
        <div>
          <Label>Payment date</Label>
          <Input
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Note</Label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Bank ref, receipt no."
            className="mt-1.5"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={() => void submit()}>
            {saving ? (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            ) : null}
            Confirm payment
          </Button>
        </div>
      </div>
    </Modal>
  );
}
