"use client";

import {
  createOfficePayment,
  submitPaymentForApproval,
  uploadPaymentAttachment,
} from "@/api/payment/payment.api";
import type {
  PaymentReferenceDto,
  PaymentReminderDto,
} from "@/api/types/payment";
import PaymentReferencesEditor from "@/components/payments/PaymentReferencesEditor";
import {
  SetupBackLink,
  SetupSectionCard,
} from "@/components/setup/setup-pro-ui";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/form/date-picker";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import RecurrenceFields, {
  type RecurrenceConfig,
} from "@/components/shared/RecurrenceFields";
import ReminderFields from "@/components/shared/ReminderFields";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  sanitizeReminders,
  type ReminderEntry,
} from "@/lib/reminders/reminder-types";
import { usePaymentAccess } from "@/lib/payments/use-payment-access";
import { usePaymentOptions } from "@/lib/payments/use-payment-options";
import { ChevronLeft, Loader2, Paperclip } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const textareaClass =
  "min-h-[88px] w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function PaymentCreatePanel() {
  const router = useRouter();
  const toast = useToast();
  const { officeId, access, loading: accessLoading } = usePaymentAccess();
  const {
    categories,
    loading: optionsLoading,
    error: optionsError,
  } = usePaymentOptions();

  const [payeeName, setPayeeName] = useState("");
  const [payeeAccount, setPayeeAccount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [amountDue, setAmountDue] = useState("");
  const [dueAt, setDueAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [submitAfterCreate, setSubmitAfterCreate] = useState(false);
  const [reconciliationNote, setReconciliationNote] = useState("");
  const [references, setReferences] = useState<PaymentReferenceDto[]>([]);
  const [reminders, setReminders] = useState<ReminderEntry[]>([]);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>({
    autoCreateEnabled: true,
    dayOfMonth: 1,
    reminderDaysBefore: 7,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  useEffect(() => {
    const c = categories.find((x) => x.id === categoryId);
    if (!c?.recurringAutoCreateDefault) return;
    setRecurrenceEnabled(true);
    setRecurrence({
      autoCreateEnabled: true,
      dayOfMonth: c.recurringDayOfMonth ?? 1,
      reminderDaysBefore: c.recurringReminderDaysBefore ?? 7,
    });
  }, [categoryId, categories]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
  );
  const needsReconciliation = selectedCategory?.requiresReconciliationNote ?? false;

  if (accessLoading || optionsLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
      </div>
    );
  }

  if (!officeId || !access?.canCreate) {
    return (
      <div className="space-y-4">
        <SetupBackLink href="/payments">
          <ChevronLeft className="size-4" aria-hidden />
          Back to payments
        </SetupBackLink>
        <p className="text-sm text-gray-500">
          You do not have permission to create payments.
        </p>
      </div>
    );
  }

  async function handleSubmit() {
    const amount = Number(amountDue.replace(/,/g, ""));
    if (!payeeName.trim() || !purpose.trim() || !amount || amount <= 0) {
      toast.showError("Payee, purpose, and amount are required.");
      return;
    }
    if (!categoryId) {
      toast.showError("Select a payment category.");
      return;
    }
    if (needsReconciliation && !reconciliationNote.trim()) {
      toast.showError("Reconciliation note is required for this category.");
      return;
    }

    const reminderPayload: PaymentReminderDto[] = sanitizeReminders(reminders).map(
      (r) => ({
        schedule: r.schedule,
        customAt: r.at,
        note: r.note,
      })
    );

    setSaving(true);
    try {
      const oid = officeId!;
      let payment = await createOfficePayment(oid, {
        payeeName: payeeName.trim(),
        payeeAccount: payeeAccount.trim() || undefined,
        categoryId,
        purpose: purpose.trim(),
        currency: "TZS",
        amountDue: amount,
        dueDate: dueAt,
        reconciliationNote: reconciliationNote.trim() || undefined,
        references: references.length > 0 ? references : undefined,
        reminders: reminderPayload.length > 0 ? reminderPayload : undefined,
        recurrence: recurrenceEnabled
          ? {
              autoCreateEnabled: recurrence.autoCreateEnabled,
              dayOfMonth: recurrence.dayOfMonth,
              reminderDaysBefore: recurrence.reminderDaysBefore,
            }
          : undefined,
      });
      if (attachmentFile) {
        try {
          payment = await uploadPaymentAttachment(oid, payment.id, attachmentFile);
        } catch (attachErr) {
          toast.showError(
            `Payment saved, but attachment failed: ${getApiErrorMessage(
              attachErr,
              "Upload failed."
            )}`
          );
          router.push(`/payments/${payment.id}`);
          return;
        }
      }
      const hasAttachment =
        (payment.attachments?.length ?? payment.attachmentCount ?? 0) > 0;
      if (submitAfterCreate && access?.canSubmit) {
        payment = await submitPaymentForApproval(oid, payment.id);
        toast.showSuccess(
          hasAttachment
            ? "Payment created with attachment and submitted for approval."
            : "Payment created and submitted for approval."
        );
      } else {
        toast.showSuccess(
          hasAttachment
            ? "Payment draft saved with attachment."
            : "Payment draft saved."
        );
      }
      router.push(`/payments/${payment.id}`);
    } catch (e) {
      toast.showError(getApiErrorMessage(e, "Could not save payment."));
      setSaving(false);
    }
  }

  if (categories.length === 0) {
    return (
      <div className="space-y-4">
        <SetupBackLink href="/payments">
          <ChevronLeft className="size-4" aria-hidden />
          Back to payments
        </SetupBackLink>
        <p className="text-sm text-gray-500">
          {optionsError ?? "No payment categories configured."}{" "}
          <Link href="/setup/payment-categories" className="text-brand-600 underline">
            Add categories in Setup
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SetupBackLink href="/payments">
        <ChevronLeft className="size-4" aria-hidden />
        Back to payments
      </SetupBackLink>

      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          New payment
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Creates a draft for your office. Submit for approval when ready — approvers
          and payers are configured under Setup → Payment permissions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SetupSectionCard title="Payee & purpose">
          <div className="space-y-4">
            <div>
              <Label>Payee / external entity *</Label>
              <Input
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                placeholder="e.g. TRA, supplier, bank"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Account / control number</Label>
              <Input
                value={payeeAccount}
                onChange={(e) => setPayeeAccount(e.target.value)}
                placeholder="Bank account, mobile money, control no."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Category</Label>
              <select
                className={`${selectClass} mt-1.5`}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Purpose / reason *</Label>
              <textarea
                className={`${textareaClass} mt-1.5`}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Why this payment is being made"
              />
            </div>
            <div>
              <Label>
                Reconciliation note
                {needsReconciliation ? " *" : ""}
              </Label>
              <textarea
                className={`${textareaClass} mt-1.5`}
                value={reconciliationNote}
                onChange={(e) => setReconciliationNote(e.target.value)}
                placeholder="Ledger match, letter ref, engagement code…"
              />
            </div>
            <div>
              <Label>Linked references</Label>
              <p className="mt-1 text-xs text-gray-500">
                Optional invoice, engagement, or control numbers.
              </p>
              <div className="mt-2">
                <PaymentReferencesEditor
                  references={references}
                  editable
                  onChange={setReferences}
                />
              </div>
            </div>
          </div>
        </SetupSectionCard>

        <SetupSectionCard title="Amount & due date">
          <div className="space-y-4">
            <div>
              <Label>Amount (TZS) *</Label>
              <Input
                type="number"
                value={amountDue}
                onChange={(e) => setAmountDue(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <DatePicker
                id="payment-due"
                label="Due date"
                value={dueAt}
                onValueChange={setDueAt}
              />
            </div>

            <ReminderFields
              value={reminders}
              onChange={setReminders}
              referenceDate={dueAt}
              referenceKind="due"
              optional
            />

            <RecurrenceFields
              enabled={recurrenceEnabled}
              onEnabledChange={setRecurrenceEnabled}
              value={recurrence}
              onChange={setRecurrence}
              className="border-t border-gray-100 pt-4 dark:border-gray-800"
            />

            <div>
              <Label>Attachment (optional)</Label>
              <p className="mt-1 text-xs text-gray-500">
                Upload a supporting document now, or add more attachments on the
                detail page after saving.
              </p>
              <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-brand-600 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900/50">
                <Paperclip className="size-4" aria-hidden />
                {attachmentFile ? attachmentFile.name : "Choose file"}
                <input
                  type="file"
                  className="sr-only"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  onChange={(e) => {
                    setAttachmentFile(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
              </label>
              {attachmentFile ? (
                <button
                  type="button"
                  className="mt-1 text-xs text-gray-500 underline"
                  onClick={() => setAttachmentFile(null)}
                >
                  Remove file
                </button>
              ) : null}
            </div>

            {access?.canSubmit ? (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                <input
                  type="checkbox"
                  className="mt-1 size-4 rounded border-gray-300"
                  checked={submitAfterCreate}
                  onChange={(e) => setSubmitAfterCreate(e.target.checked)}
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Submit for approval after save
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Otherwise the payment stays as a draft you can edit later.
                  </p>
                </div>
              </label>
            ) : null}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                disabled={saving}
                onClick={() => void handleSubmit()}
              >
                {saving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                ) : null}
                Save payment
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/payments")}
              >
                Cancel
              </Button>
            </div>
          </div>
        </SetupSectionCard>
      </div>
    </div>
  );
}
