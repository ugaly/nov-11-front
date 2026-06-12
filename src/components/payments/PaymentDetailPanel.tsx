"use client";

import {
  approveOfficePayment,
  cancelOfficePayment,
  getOfficePayment,
  updateOfficePaymentReferences,
  reopenCancelledOfficePayment,
  markOfficePaymentPaid,
  submitPaymentForApproval,
  uploadPaymentAttachment,
} from "@/api/payment/payment.api";
import type {
  OfficePaymentResponse,
  PaymentReferenceDto,
} from "@/api/types/payment";
import PaymentReferencesEditor from "@/components/payments/PaymentReferencesEditor";
import PaymentWorkflowStatusBar from "@/components/payments/PaymentWorkflowStatusBar";
import ReferenceBox from "@/components/shared/ReferenceBox";
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
import { getApiErrorMessage } from "@/lib/api-error";
import { getStoredUser } from "@/lib/auth-storage";
import { usePaymentAccess } from "@/lib/payments/use-payment-access";
import {
  formatPaymentAmount,
  formatPaymentDate,
  paymentBalance,
} from "@/lib/payments/payment-utils";
import { usePaymentOptions } from "@/lib/payments/use-payment-options";
import type { ReminderEntry } from "@/lib/reminders/reminder-types";
import {
  Banknote,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  FileText,
  History,
  Loader2,
  Paperclip,
  RotateCcw,
  Send,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function PaymentDetailPanel({ paymentId }: { paymentId: string }) {
  const toast = useToast();
  const me = getStoredUser();
  const { officeId, access, loading: accessLoading, refresh: refreshAccess } =
    usePaymentAccess();
  const { methods, loading: methodsLoading } = usePaymentOptions();
  const [payment, setPayment] = useState<OfficePaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!officeId) return;
    setLoading(true);
    try {
      setPayment(await getOfficePayment(officeId, paymentId));
    } catch {
      setPayment(null);
    } finally {
      setLoading(false);
    }
  }, [officeId, paymentId]);

  useEffect(() => {
    void refreshAccess();
    void refresh();
  }, [refresh, refreshAccess, paymentId]);

  if (accessLoading || loading || methodsLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
      </div>
    );
  }

  if (!officeId || !access?.visible) {
    return (
      <div className="space-y-4">
        <SetupBackLink href="/payments">
          <ChevronLeft className="size-4" aria-hidden />
          Back to payments
        </SetupBackLink>
        <p className="text-sm text-gray-500">Payments are not available for your account.</p>
      </div>
    );
  }

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
  const isCreator =
    Boolean(p.createdBy?.id && me?.id) &&
    p.createdBy!.id.toLowerCase() === me!.id!.toLowerCase();
  const canSubmit = access.canSubmit && p.status === "DRAFT";
  const canApprove =
    access.canApprove && p.status === "SUBMITTED_FOR_APPROVAL";
  const canMarkPaid =
    access.canMarkPaid &&
    (p.status === "APPROVED" || p.status === "PARTIALLY_PAID");
  const canCancel =
    p.status !== "PAID" &&
    p.status !== "PARTIALLY_PAID" &&
    p.status !== "CANCELLED" &&
    (isCreator || access.canApprove);
  const canReopen =
    p.status === "CANCELLED" && (isCreator || access.canApprove);
  const canEditReferences = p.status === "DRAFT" && access.canCreate;
  const paymentReferences: PaymentReferenceDto[] = p.references ?? [];

  async function handleAttachmentUpload(file: File) {
    if (!officeId) {
      toast.showError("Office not available.");
      return;
    }
    setUploadingAttachment(true);
    try {
      const updated = await uploadPaymentAttachment(officeId, paymentId, file);
      setPayment(updated);
      toast.showSuccess("Attachment uploaded.");
    } catch (err) {
      toast.showError(getApiErrorMessage(err, "Upload failed."));
    } finally {
      setUploadingAttachment(false);
    }
  }

  async function saveReferences(next: PaymentReferenceDto[]) {
    if (!officeId) return;
    setBusy(true);
    try {
      const updated = await updateOfficePaymentReferences(
        officeId,
        p.id,
        next
      );
      setPayment(updated);
      toast.showSuccess("References updated.");
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : "Could not save references.");
    } finally {
      setBusy(false);
    }
  }

  const pendingHint =
    p.status === "SUBMITTED_FOR_APPROVAL" && !canApprove
      ? "You need Approve permission (Setup → Payment permissions) to approve this payment."
      : (p.status === "APPROVED" || p.status === "PARTIALLY_PAID") && !canMarkPaid
        ? "You need Mark paid permission to record payments."
        : null;

  async function runAction(
    label: string,
    fn: () => Promise<OfficePaymentResponse>
  ) {
    setBusy(true);
    try {
      const updated = await fn();
      setPayment(updated);
      toast.showSuccess(label);
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  const reminderEntries: ReminderEntry[] = (p.reminders ?? []).map((r) => ({
    id: r.id ?? `rem-${r.schedule}`,
    schedule: r.schedule,
    at: r.customAt,
    note: r.note,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <SetupBackLink href="/payments">
          <ChevronLeft className="size-4" aria-hidden />
          Back to payments
        </SetupBackLink>
        <PaymentWorkflowStatusBar
          status={p.status}
          className="w-full sm:ml-auto sm:w-auto"
        />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <ReferenceBox
            label="Payment reference"
            value={p.referenceNumber}
            readOnly
            onCopy={() => {
              void navigator.clipboard.writeText(p.referenceNumber);
              toast.showSuccess("Reference copied.");
            }}
          />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {p.payeeName} · {p.categoryName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canSubmit ? (
            <Button
              size="sm"
              disabled={busy}
              onClick={() =>
                void runAction("Submitted for approval.", () =>
                  submitPaymentForApproval(officeId, p.id)
                )
              }
            >
              <Send className="mr-1.5 size-4" aria-hidden />
              Submit for approval
            </Button>
          ) : null}
          {canApprove ? (
            <Button
              size="sm"
              disabled={busy}
              onClick={() =>
                void runAction("Payment approved.", () =>
                  approveOfficePayment(officeId, p.id)
                )
              }
            >
              <CheckCircle2 className="mr-1.5 size-4" aria-hidden />
              Approve
            </Button>
          ) : null}
          {canMarkPaid ? (
            <Button size="sm" disabled={busy} onClick={() => setMarkPaidOpen(true)}>
              <Banknote className="mr-1.5 size-4" aria-hidden />
              {p.status === "PARTIALLY_PAID" ? "Record payment" : "Mark as paid"}
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                void runAction("Payment cancelled.", () =>
                  cancelOfficePayment(officeId, p.id)
                )
              }
            >
              Cancel
            </Button>
          ) : null}
          {canReopen ? (
            <Button
              size="sm"
              disabled={busy}
              onClick={() =>
                void runAction("Returned to pending approval.", () =>
                  reopenCancelledOfficePayment(officeId, p.id)
                )
              }
            >
              <RotateCcw className="mr-1.5 size-4" aria-hidden />
              Return to pending approval
            </Button>
          ) : null}
        </div>
      </div>

      {pendingHint ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {pendingHint}
        </p>
      ) : p.status === "SUBMITTED_FOR_APPROVAL" && canApprove && access.canMarkPaid ? (
        <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
          Approve this payment first; then record full or partial payments once approved.
        </p>
      ) : p.status === "PARTIALLY_PAID" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          Partially paid — {formatPaymentAmount(p.currency, balance)} remaining of{" "}
          {formatPaymentAmount(p.currency, Number(p.amountDue))}.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SetupStatCard
          icon={Wallet}
          label="Amount due"
          value={formatPaymentAmount(p.currency, Number(p.amountDue))}
        />
        <SetupStatCard
          icon={Banknote}
          label="Paid"
          value={formatPaymentAmount(p.currency, Number(p.amountPaid))}
        />
        <SetupStatCard
          icon={Banknote}
          label="Remaining"
          value={formatPaymentAmount(p.currency, balance)}
        />
        <SetupStatCard
          icon={Calendar}
          label="Due date"
          value={formatPaymentDate(p.dueDate)}
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
            {p.paymentMethodName ? (
              <DetailRow label="Method" value={p.paymentMethodName} />
            ) : null}
            {p.paidAt ? (
              <DetailRow label="Paid on" value={formatPaymentDate(p.paidAt)} />
            ) : null}
            {p.createdBy ? (
              <DetailRow label="Created by" value={p.createdBy.fullName} />
            ) : null}
            {p.approvedBy ? (
              <DetailRow label="Approved by" value={p.approvedBy.fullName} />
            ) : null}
          </dl>
        </SetupSectionCard>

        <SetupSectionCard title="References & reminders">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            Linked references
          </p>
          <PaymentReferencesEditor
            references={paymentReferences}
            editable={canEditReferences && !busy}
            onChange={(next) => void saveReferences(next)}
          />
          <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-gray-500">
            Attachments
          </p>
          {(p.attachments ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">No attachments.</p>
          ) : (
            <ul className="space-y-2">
              {(p.attachments ?? []).map((a) => (
                <li key={a.id}>
                  {a.url ? (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                    >
                      <FileText className="size-4" aria-hidden />
                      {a.fileName}
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <FileText className="size-4" aria-hidden />
                      {a.fileName}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {p.status === "DRAFT" || p.status === "SUBMITTED_FOR_APPROVAL" ? (
            <label
              className={`mt-3 inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-brand-600 dark:border-gray-700 ${
                uploadingAttachment
                  ? "cursor-wait opacity-70"
                  : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50"
              }`}
            >
              {uploadingAttachment ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Paperclip className="size-4" aria-hidden />
              )}
              {uploadingAttachment ? "Uploading…" : "Add attachment"}
              <input
                type="file"
                className="sr-only"
                disabled={uploadingAttachment || busy}
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  void handleAttachmentUpload(file);
                }}
              />
            </label>
          ) : null}
          <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-gray-500">
            Email reminders
          </p>
          <ReminderList
            reminders={reminderEntries}
            referenceDate={p.dueDate}
            referenceKind="due"
          />
        </SetupSectionCard>
      </div>

      {(p.installments ?? []).length > 0 ? (
        <SetupSectionCard title="Payment installments">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-700">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Amount</th>
                  <th className="pb-2 pr-4">Method</th>
                  <th className="pb-2 pr-4">Recorded by</th>
                  <th className="pb-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {p.installments!.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                  >
                    <td className="py-2.5 pr-4 text-gray-900 dark:text-white">
                      {formatPaymentDate(row.paidAt)}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-gray-900 dark:text-white">
                      {formatPaymentAmount(p.currency, Number(row.amount))}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">
                      {row.paymentMethodName ?? "—"}
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

      <SetupSectionCard title="Activity">
        {(p.activityLog ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">No activity yet.</p>
        ) : (
          <ul className="space-y-4">
            {p.activityLog!.map((h) => (
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
                    {h.action}
                    {h.actor ? (
                      <span className="ml-2 font-normal text-gray-500">
                        — {h.actor.fullName}
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

      <MarkPaidModal
        open={markPaidOpen}
        payment={p}
        officeId={officeId}
        methods={methods}
        onClose={() => setMarkPaidOpen(false)}
        onSaved={(updated) => {
          setPayment(updated);
          setMarkPaidOpen(false);
          toast.showSuccess(
            updated.status === "PAID"
              ? "Payment fully paid."
              : "Partial payment recorded."
          );
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

function MarkPaidModal({
  open,
  payment,
  officeId,
  methods,
  onClose,
  onSaved,
}: {
  open: boolean;
  payment: OfficePaymentResponse;
  officeId: string;
  methods: { id: string; name: string }[];
  onClose: () => void;
  onSaved: (p: OfficePaymentResponse) => void;
}) {
  const toast = useToast();
  const balance = paymentBalance(payment);
  const [methodId, setMethodId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const selectClass =
    "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  useEffect(() => {
    if (open) {
      setAmount(String(balance));
      if (methods.length > 0) {
        setMethodId(methods[0].id);
      }
    }
  }, [open, balance, methods]);

  async function submit() {
    if (!methodId) {
      toast.showError("Select a payment method.");
      return;
    }
    const payAmount = Number(amount.replace(/,/g, ""));
    if (!payAmount || payAmount <= 0) {
      toast.showError("Enter a valid payment amount.");
      return;
    }
    if (payAmount > balance) {
      toast.showError(
        `Amount cannot exceed the remaining balance (${formatPaymentAmount(payment.currency, balance)}).`
      );
      return;
    }
    setSaving(true);
    try {
      const updated = await markOfficePaymentPaid(officeId, payment.id, {
        paymentMethodId: methodId,
        amount: payAmount,
        note: note.trim() || undefined,
      });
      onSaved(updated);
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : "Could not record payment.");
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Record payment
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {payment.payeeName} · due {formatPaymentAmount(payment.currency, Number(payment.amountDue))}
      </p>
      <p className="mt-2 text-sm font-medium text-gray-800 dark:text-gray-200">
        Remaining balance: {formatPaymentAmount(payment.currency, balance)}
      </p>
      <div className="mt-4 space-y-4">
        <div>
          <Label>Amount to pay (TZS) *</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-gray-500">
            Defaults to the full remaining balance. Enter less for a partial payment.
          </p>
        </div>
        <div>
          <Label>Payment method</Label>
          {methods.length === 0 ? (
            <p className="mt-1 text-sm text-gray-500">
              No payment methods configured. Add them under Setup → Payment methods.
            </p>
          ) : (
            <select
              className={`${selectClass} mt-1.5`}
              value={methodId}
              onChange={(e) => setMethodId(e.target.value)}
            >
              {methods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <Label>Note</Label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Transfer ref, receipt no."
            className="mt-1.5"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving || methods.length === 0} onClick={() => void submit()}>
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
