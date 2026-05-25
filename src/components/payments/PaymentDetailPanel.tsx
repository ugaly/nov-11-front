"use client";

import PaymentStatusBadge from "@/components/payments/PaymentStatusBadge";
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
import { fileToDataUrlAttachment } from "@/lib/attachment-utils";
import {
  getPaymentById,
  savePayment,
} from "@/lib/payments/payment-storage";
import type {
  PaymentAttachment,
  PaymentMethod,
  PaymentRecord,
} from "@/lib/payments/payment-types";
import {
  derivePaymentStatus,
  formatPaymentAmount,
  formatPaymentDate,
  PAYMENT_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  paymentBalance,
} from "@/lib/payments/payment-utils";
import {
  Banknote,
  Calendar,
  ChevronLeft,
  ExternalLink,
  FileText,
  History,
  Loader2,
  Paperclip,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function PaymentDetailPanel({ paymentId }: { paymentId: string }) {
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setPayment(getPaymentById(paymentId) ?? null);
  }, [paymentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!payment) {
    return (
      <div className="space-y-4">
        <SetupBackLink href="/payments">
          <ChevronLeft className="size-4" aria-hidden />
          Back to payments
        </SetupBackLink>
        <p className="text-sm text-gray-500">Payment not found.</p>
      </div>
    );
  }

  const p = payment;
  const balance = paymentBalance(p);
  const canPay = p.status !== "PAID" && p.status !== "CANCELLED";

  function appendHistory(
    record: PaymentRecord,
    entry: PaymentRecord["history"][0]
  ): PaymentRecord {
    return { ...record, history: [entry, ...record.history] };
  }

  async function cancelPayment() {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 400));
    const updated = savePayment({
      ...p,
      status: "CANCELLED",
      history: [
        {
          id: `h-${Date.now()}`,
          at: new Date().toISOString().slice(0, 10),
          label: "Cancelled",
        },
        ...p.history,
      ],
    });
    setPayment(updated);
    setNote("Payment cancelled.");
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <SetupBackLink href="/payments">
            <ChevronLeft className="size-4" aria-hidden />
            Back to payments
          </SetupBackLink>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-lg font-bold text-gray-900 dark:text-white">
              {p.referenceNumber}
            </h1>
            <PaymentStatusBadge status={p.status} />
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {p.payeeName} · {PAYMENT_CATEGORY_LABELS[p.category]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canPay ? (
            <Button size="sm" onClick={() => setRecordOpen(true)}>
              <Banknote className="mr-1.5 size-4" aria-hidden />
              Record payment
            </Button>
          ) : null}
          {p.status !== "CANCELLED" && p.status !== "PAID" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void cancelPayment()}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </div>

      {note ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          {note}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SetupStatCard
          icon={Wallet}
          label="Amount due"
          value={formatPaymentAmount(p.currency, p.amountDue)}
        />
        <SetupStatCard
          icon={Banknote}
          label="Paid"
          value={formatPaymentAmount(p.currency, p.amountPaid)}
        />
        <SetupStatCard
          icon={Banknote}
          label="Balance"
          value={formatPaymentAmount(p.currency, balance)}
        />
        <SetupStatCard
          icon={Calendar}
          label="Due date"
          value={formatPaymentDate(p.dueAt)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SetupSectionCard title="Payment details">
          <dl className="space-y-3 text-sm">
            <DetailRow label="Payee" value={p.payeeName} />
            {p.payeeAccount ? (
              <DetailRow label="Account" value={p.payeeAccount} />
            ) : null}
            <DetailRow label="Purpose" value={p.purpose} />
            {p.reconciliationNote ? (
              <DetailRow label="Reconciliation" value={p.reconciliationNote} />
            ) : null}
            {p.linkedInvoiceNumber ? (
              <DetailRow
                label="Invoice link"
                value={
                  <span className="inline-flex items-center gap-1 font-mono text-xs">
                    {p.linkedInvoiceNumber}
                    <ExternalLink className="size-3 opacity-50" aria-hidden />
                  </span>
                }
              />
            ) : null}
            {p.paymentMethod ? (
              <DetailRow
                label="Method"
                value={PAYMENT_METHOD_LABELS[p.paymentMethod]}
              />
            ) : null}
            {p.paidAt ? (
              <DetailRow label="Paid on" value={formatPaymentDate(p.paidAt)} />
            ) : null}
            <DetailRow label="Created" value={formatPaymentDate(p.createdAt)} />
          </dl>
        </SetupSectionCard>

        <SetupSectionCard title="References & reminders">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            Attachments
          </p>
          {p.attachments.length === 0 ? (
            <p className="text-sm text-gray-500">No attachments.</p>
          ) : (
            <ul className="space-y-2">
              {p.attachments.map((a) => (
                <li key={a.id}>
                  <AttachmentLink attachment={a} />
                </li>
              ))}
            </ul>
          )}
          <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-gray-500">
            Reminders
          </p>
          <ReminderList
            reminders={p.reminders}
            referenceDate={p.dueAt}
            referenceKind="due"
          />
        </SetupSectionCard>
      </div>

      <SetupSectionCard title="Payment history">
        {p.history.length === 0 ? (
          <p className="text-sm text-gray-500">No activity yet.</p>
        ) : (
          <ul className="space-y-4">
            {p.history.map((h) => (
              <li
                key={h.id}
                className="flex gap-3 border-l-2 border-gray-200 pl-4 dark:border-gray-700"
              >
                <History
                  className="mt-0.5 size-4 shrink-0 text-gray-400"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {h.label}
                    {h.amount != null ? (
                      <span className="ml-2 font-normal text-emerald-700 dark:text-emerald-400">
                        {formatPaymentAmount(p.currency, h.amount)}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatPaymentDate(h.at)}
                    {h.detail ? ` · ${h.detail}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SetupSectionCard>

      <RecordPaymentModal
        open={recordOpen}
        payment={p}
        onClose={() => setRecordOpen(false)}
        onSaved={(updated) => {
          setPayment(updated);
          setRecordOpen(false);
          setNote("Payment recorded.");
        }}
      />
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-36 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="text-gray-900 dark:text-white">{value}</dd>
    </div>
  );
}

function AttachmentLink({ attachment }: { attachment: PaymentAttachment }) {
  if (attachment.dataUrl) {
    return (
      <a
        href={attachment.dataUrl}
        download={attachment.name}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
      >
        <FileText className="size-4" aria-hidden />
        {attachment.name}
      </a>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
      <FileText className="size-4" aria-hidden />
      {attachment.name}
    </span>
  );
}

function RecordPaymentModal({
  open,
  payment,
  onClose,
  onSaved,
}: {
  open: boolean;
  payment: PaymentRecord;
  onClose: () => void;
  onSaved: (p: PaymentRecord) => void;
}) {
  const balance = paymentBalance(payment);
  const [amount, setAmount] = useState(String(balance));
  const [method, setMethod] = useState<PaymentMethod>("BANK_TRANSFER");
  const [detail, setDetail] = useState("");
  const [attachment, setAttachment] = useState<PaymentAttachment | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectClass =
    "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  useEffect(() => {
    if (open) {
      setAmount(String(paymentBalance(payment)));
      setDetail("");
      setAttachment(null);
      setFileError(null);
    }
  }, [open, payment]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setAttachment(await fileToDataUrlAttachment(file));
      setFileError(null);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  async function submit() {
    const pay = Number(amount.replace(/,/g, ""));
    if (!pay || pay <= 0) return;
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const newPaid = Math.min(payment.amountDue, payment.amountPaid + pay);
    const attachments = attachment
      ? [...payment.attachments, attachment]
      : payment.attachments;
    const updated = savePayment({
      ...payment,
      amountPaid: newPaid,
      paidAt: today,
      paymentMethod: method,
      attachments,
      status: derivePaymentStatus(payment.amountDue, newPaid),
      history: [
        {
          id: `h-${Date.now()}`,
          at: today,
          label: newPaid >= payment.amountDue ? "Paid in full" : "Partial payment",
          amount: pay,
          detail: detail.trim() || PAYMENT_METHOD_LABELS[method],
        },
        ...payment.history,
      ],
    });
    await new Promise((r) => setTimeout(r, 300));
    setSaving(false);
    onSaved(updated);
  }

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Record payment
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Balance {formatPaymentAmount(payment.currency, balance)}
      </p>
      <div className="mt-4 space-y-4">
        <div>
          <Label>Amount</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Method</Label>
          <select
            className={`${selectClass} mt-1.5`}
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          >
            {Object.entries(PAYMENT_METHOD_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Note</Label>
          <Input
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Transfer ref, receipt no."
            className="mt-1.5"
          />
        </div>
        <div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-brand-600">
            <Paperclip className="size-4" aria-hidden />
            Attach receipt
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => void onFile(e)}
            />
          </label>
          {attachment ? (
            <p className="mt-1 flex items-center gap-2 text-xs text-gray-600">
              {attachment.name}
              <button type="button" onClick={() => setAttachment(null)}>
                <X className="size-3.5" aria-hidden />
              </button>
            </p>
          ) : null}
          {fileError ? (
            <p className="text-xs text-rose-600">{fileError}</p>
          ) : null}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={() => void submit()}>
            {saving ? (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            ) : null}
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
