"use client";

import {
  approveOfficeExpense,
  cancelOfficeExpense,
  duplicateExpenseToMonth,
  getExpenseRecurrence,
  getOfficeExpense,
  markOfficeExpensePaid,
  rejectOfficeExpense,
  submitExpenseForApproval,
  upsertExpenseRecurrence,
  uploadExpenseAttachment,
} from "@/api/expense/expense.api";
import type { OfficeExpenseResponse } from "@/api/types/expense";
import ExpenseWorkflowStatusBar from "@/components/expenses/ExpenseWorkflowStatusBar";
import ReferenceBox from "@/components/shared/ReferenceBox";
import RecurrenceFields, {
  type RecurrenceConfig,
} from "@/components/shared/RecurrenceFields";
import ReminderList from "@/components/shared/ReminderList";
import {
  SetupBackLink,
  SetupSectionCard,
  SetupStatCard,
} from "@/components/setup/setup-pro-ui";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/form/date-picker";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/context/ToastContext";
import { getStoredUser } from "@/lib/auth-storage";
import {
  formatExpenseAmount,
  formatExpenseDate,
} from "@/lib/expenses/expense-utils";
import { useExpenseAccess } from "@/lib/expenses/use-expense-access";
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
  Send,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function ExpenseDetailPanel({ expenseId }: { expenseId: string }) {
  const toast = useToast();
  const me = getStoredUser();
  const { officeId, access, loading: accessLoading, refresh: refreshAccess } =
    useExpenseAccess();
  const { methods, loading: methodsLoading } = usePaymentOptions();
  const [expense, setExpense] = useState<OfficeExpenseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>({
    autoCreateEnabled: true,
    dayOfMonth: 1,
    reminderDaysBefore: 7,
  });
  const [dupOpen, setDupOpen] = useState(false);
  const [dupYear, setDupYear] = useState(() => new Date().getFullYear());
  const [dupMonth, setDupMonth] = useState(() => {
    const d = new Date();
    return d.getMonth() === 11 ? 1 : d.getMonth() + 2;
  });

  const refresh = useCallback(async () => {
    if (!officeId) return;
    setLoading(true);
    try {
      setExpense(await getOfficeExpense(officeId, expenseId));
      const rec = await getExpenseRecurrence(officeId, expenseId);
      if (rec) {
        setRecurrenceEnabled(true);
        setRecurrence({
          autoCreateEnabled: rec.autoCreateEnabled,
          dayOfMonth: rec.dayOfMonth,
          reminderDaysBefore: rec.reminderDaysBefore,
        });
      } else {
        setRecurrenceEnabled(false);
      }
    } catch {
      setExpense(null);
    } finally {
      setLoading(false);
    }
  }, [officeId, expenseId]);

  useEffect(() => {
    void refreshAccess();
    void refresh();
  }, [refresh, refreshAccess, expenseId]);

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
        <SetupBackLink href="/expenses">
          <ChevronLeft className="size-4" aria-hidden />
          Back to expenses
        </SetupBackLink>
        <p className="text-sm text-gray-500">Expenses are not available for your account.</p>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="space-y-4">
        <SetupBackLink href="/expenses">
          <ChevronLeft className="size-4" aria-hidden />
          Back to expenses
        </SetupBackLink>
        <p className="text-sm text-gray-500">Expense not found.</p>
      </div>
    );
  }

  const e = expense;
  const isCreator =
    Boolean(e.createdBy?.id && me?.id) &&
    e.createdBy!.id.toLowerCase() === me!.id!.toLowerCase();
  const canSubmit = access.canSubmit && e.status === "DRAFT";
  const canApprove = access.canApprove && e.status === "SUBMITTED";
  const canReject = access.canApprove && e.status === "SUBMITTED";
  const canMarkPaid = access.canMarkPaid && e.status === "APPROVED";
  const canCancel =
    e.status !== "PAID" &&
    e.status !== "REJECTED" &&
    (isCreator || access.canApprove);

  async function saveRecurrence() {
    if (!officeId) return;
    setBusy(true);
    try {
      await upsertExpenseRecurrence(officeId, expenseId, {
        autoCreateEnabled: recurrenceEnabled && recurrence.autoCreateEnabled,
        dayOfMonth: recurrence.dayOfMonth,
        reminderDaysBefore: recurrence.reminderDaysBefore,
      });
      toast.showSuccess(
        recurrenceEnabled && recurrence.autoCreateEnabled
          ? "Repeat settings saved."
          : "Monthly auto-create turned off."
      );
      await refresh();
    } catch (err) {
      toast.showError(
        err instanceof Error ? err.message : "Could not save repeat settings."
      );
    } finally {
      setBusy(false);
    }
  }

  async function runAction(
    label: string,
    fn: () => Promise<OfficeExpenseResponse>
  ) {
    setBusy(true);
    try {
      const updated = await fn();
      setExpense(updated);
      toast.showSuccess(label);
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  const pendingHint =
    e.status === "SUBMITTED" && !canApprove
      ? "You need Approve permission (Setup → Office permissions) to approve this expense."
      : e.status === "APPROVED" && !canMarkPaid
        ? "You need Mark paid permission to record reimbursement."
        : null;

  const reminderEntries: ReminderEntry[] = (e.reminders ?? []).map((r) => ({
    id: r.id ?? `rem-${r.schedule}`,
    schedule: r.schedule,
    at: r.customAt,
    note: r.note,
  }));

  const canUploadAttachment =
    e.status === "DRAFT" || e.status === "SUBMITTED";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <SetupBackLink href="/expenses">
          <ChevronLeft className="size-4" aria-hidden />
          Back to expenses
        </SetupBackLink>
        <ExpenseWorkflowStatusBar
          status={e.status}
          className="w-full sm:ml-auto sm:w-auto"
        />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <ReferenceBox
            label="Expense reference"
            value={e.referenceNumber}
            readOnly
            onCopy={() => {
              void navigator.clipboard.writeText(e.referenceNumber);
              toast.showSuccess("Reference copied.");
            }}
          />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {e.title} · {e.expenseTypeName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canSubmit ? (
            <Button
              size="sm"
              disabled={busy}
              onClick={() =>
                void runAction("Submitted for approval.", () =>
                  submitExpenseForApproval(officeId, e.id)
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
                void runAction("Expense approved.", () =>
                  approveOfficeExpense(officeId, e.id)
                )
              }
            >
              <CheckCircle2 className="mr-1.5 size-4" aria-hidden />
              Approve
            </Button>
          ) : null}
          {canReject ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                void runAction("Expense rejected.", () =>
                  rejectOfficeExpense(officeId, e.id)
                )
              }
            >
              <X className="mr-1.5 size-4" aria-hidden />
              Reject
            </Button>
          ) : null}
          {canMarkPaid ? (
            <Button size="sm" disabled={busy} onClick={() => setMarkPaidOpen(true)}>
              <Banknote className="mr-1.5 size-4" aria-hidden />
              Mark as paid
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                void runAction("Expense cancelled.", () =>
                  cancelOfficeExpense(officeId, e.id)
                )
              }
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </div>

      {pendingHint ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {pendingHint}
        </p>
      ) : e.status === "SUBMITTED" && canApprove && access.canMarkPaid ? (
        <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
          Approve this expense first; then mark it paid once reimbursed.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SetupStatCard
          icon={Wallet}
          label="Amount"
          value={formatExpenseAmount(e.currency, Number(e.amount))}
        />
        <SetupStatCard
          icon={Calendar}
          label="Expense date"
          value={formatExpenseDate(e.expenseDate)}
        />
        {e.paidAt ? (
          <SetupStatCard
            icon={Banknote}
            label="Paid on"
            value={formatExpenseDate(e.paidAt)}
          />
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SetupSectionCard title="Expense details">
          <dl className="space-y-3 text-sm">
            <DetailRow label="Title" value={e.title} />
            {e.vendor ? <DetailRow label="Vendor" value={e.vendor} /> : null}
            <DetailRow label="Type" value={e.expenseTypeName} />
            {e.description ? (
              <DetailRow label="Description" value={e.description} />
            ) : null}
            {e.notes ? <DetailRow label="Notes" value={e.notes} /> : null}
            {e.paymentMethod ? (
              <DetailRow label="Payment method" value={e.paymentMethod} />
            ) : null}
            {e.linkedPaymentReference ? (
              <DetailRow
                label="Linked payment"
                value={e.linkedPaymentReference}
              />
            ) : null}
            {e.createdBy ? (
              <DetailRow label="Created by" value={e.createdBy.fullName} />
            ) : null}
            {e.submittedBy ? (
              <DetailRow label="Submitted by" value={e.submittedBy.fullName} />
            ) : null}
            {e.approvedBy ? (
              <DetailRow label="Approved by" value={e.approvedBy.fullName} />
            ) : null}
            {e.rejectedBy ? (
              <DetailRow label="Rejected by" value={e.rejectedBy.fullName} />
            ) : null}
            {e.paidBy ? (
              <DetailRow label="Paid by" value={e.paidBy.fullName} />
            ) : null}
          </dl>
        </SetupSectionCard>

        <SetupSectionCard title="Attachments & reminders">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            Attachments
          </p>
          {(e.attachments ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">No attachments.</p>
          ) : (
            <ul className="space-y-2">
              {(e.attachments ?? []).map((a) => (
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
          {canUploadAttachment ? (
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm text-brand-600">
              <Paperclip className="size-4" aria-hidden />
              Add attachment
              <input
                type="file"
                className="sr-only"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                onChange={(ev) => {
                  const file = ev.target.files?.[0];
                  ev.target.value = "";
                  if (!file) return;
                  void (async () => {
                    setBusy(true);
                    try {
                      const updated = await uploadExpenseAttachment(
                        officeId,
                        e.id,
                        file
                      );
                      setExpense(updated);
                      toast.showSuccess("Attachment uploaded.");
                    } catch (err) {
                      toast.showError(
                        err instanceof Error ? err.message : "Upload failed."
                      );
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}
              />
            </label>
          ) : null}
          <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-gray-500">
            Email reminders
          </p>
          <ReminderList
            reminders={reminderEntries}
            referenceDate={e.expenseDate}
            referenceKind="expense"
          />
        </SetupSectionCard>
      </div>

      {access?.canCreate ? (
        <SetupSectionCard title="Monthly repeat">
          <RecurrenceFields
            enabled={recurrenceEnabled}
            onEnabledChange={setRecurrenceEnabled}
            value={recurrence}
            onChange={setRecurrence}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void saveRecurrence()}
            >
              Save repeat settings
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => setDupOpen(true)}
            >
              Duplicate to month…
            </Button>
          </div>
          {recurrenceEnabled && e.status !== "PAID" && e.status !== "REJECTED" ? (
            <p className="mt-3 text-xs text-gray-500">
              Auto-create runs on the 1st of each month while enabled. Reminder time
              is set under Setup → Expense reminders.
            </p>
          ) : null}
        </SetupSectionCard>
      ) : null}

      <SetupSectionCard title="Activity">
        {(e.activityLog ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">No activity yet.</p>
        ) : (
          <ul className="space-y-4">
            {e.activityLog!.map((h) => (
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
                    {formatExpenseDate(h.at)}
                    {h.detail ? ` · ${h.detail}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SetupSectionCard>

      <Modal isOpen={dupOpen} onClose={() => setDupOpen(false)} className="max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Duplicate to month
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Creates a one-off draft for the chosen month (does not change auto-repeat).
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <Label>Year</Label>
            <Input
              type="number"
              value={String(dupYear)}
              onChange={(ev) => setDupYear(Number(ev.target.value))}
            />
          </div>
          <div>
            <Label>Month (1–12)</Label>
            <Input
              type="number"
              min="1"
              max="12"
              value={String(dupMonth)}
              onChange={(ev) => setDupMonth(Number(ev.target.value))}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setDupOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={busy}
            onClick={() => {
              void (async () => {
                if (!officeId) return;
                setBusy(true);
                try {
                  const created = await duplicateExpenseToMonth(officeId, expenseId, {
                    year: dupYear,
                    month: dupMonth,
                  });
                  toast.showSuccess("Draft created for selected month.");
                  setDupOpen(false);
                  window.location.href = `/expenses/${created.id}`;
                } catch (err) {
                  toast.showError(
                    err instanceof Error ? err.message : "Duplicate failed."
                  );
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            Create draft
          </Button>
        </div>
      </Modal>

      <MarkPaidModal
        open={markPaidOpen}
        expense={e}
        officeId={officeId}
        methodSuggestions={methods.map((m) => m.name)}
        onClose={() => setMarkPaidOpen(false)}
        onSaved={(updated) => {
          setExpense(updated);
          setMarkPaidOpen(false);
          toast.showSuccess("Expense marked as paid.");
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
  expense,
  officeId,
  methodSuggestions,
  onClose,
  onSaved,
}: {
  open: boolean;
  expense: OfficeExpenseResponse;
  officeId: string;
  methodSuggestions: string[];
  onClose: () => void;
  onSaved: (e: OfficeExpenseResponse) => void;
}) {
  const toast = useToast();
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paidAt, setPaidAt] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [linkedPaymentReference, setLinkedPaymentReference] = useState("");
  const [saving, setSaving] = useState(false);
  const selectClass =
    "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  useEffect(() => {
    if (open) {
      setPaidAt(new Date().toISOString().slice(0, 10));
      setLinkedPaymentReference("");
      if (methodSuggestions.length > 0) {
        setPaymentMethod(methodSuggestions[0]);
      } else {
        setPaymentMethod("");
      }
    }
  }, [open, methodSuggestions]);

  async function submit() {
    if (!paymentMethod.trim()) {
      toast.showError("Enter a payment method.");
      return;
    }
    setSaving(true);
    try {
      const updated = await markOfficeExpensePaid(officeId, expense.id, {
        paymentMethod: paymentMethod.trim(),
        paidAt,
        linkedPaymentReference: linkedPaymentReference.trim() || undefined,
      });
      onSaved(updated);
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : "Could not mark as paid.");
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Mark expense as paid
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {expense.title} ·{" "}
        {formatExpenseAmount(expense.currency, Number(expense.amount))}
      </p>
      <div className="mt-4 space-y-4">
        <div>
          <Label>Payment method *</Label>
          {methodSuggestions.length > 0 ? (
            <select
              className={`${selectClass} mt-1.5`}
              value={paymentMethod}
              onChange={(ev) => setPaymentMethod(ev.target.value)}
            >
              {methodSuggestions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          ) : (
            <Input
              value={paymentMethod}
              onChange={(ev) => setPaymentMethod(ev.target.value)}
              placeholder="Cash, bank transfer, mobile money…"
              className="mt-1.5"
            />
          )}
        </div>
        <div>
          <DatePicker
            id="expense-paid-at"
            label="Paid on"
            value={paidAt}
            onValueChange={setPaidAt}
          />
        </div>
        <div>
          <Label>Linked payment reference</Label>
          <Input
            value={linkedPaymentReference}
            onChange={(ev) => setLinkedPaymentReference(ev.target.value)}
            placeholder="Payment ref, transfer ID"
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
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
}
