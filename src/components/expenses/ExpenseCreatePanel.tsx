"use client";

import {
  createOfficeExpense,
  submitExpenseForApproval,
  uploadExpenseAttachment,
} from "@/api/expense/expense.api";
import type { ExpenseReminderDto } from "@/api/types/expense";
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
import { useExpenseAccess } from "@/lib/expenses/use-expense-access";
import { useExpenseOptions } from "@/lib/expenses/use-expense-options";
import {
  sanitizeReminders,
  type ReminderEntry,
} from "@/lib/reminders/reminder-types";
import { ChevronLeft, Loader2, Paperclip } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const textareaClass =
  "min-h-[88px] w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function ExpenseCreatePanel() {
  const router = useRouter();
  const toast = useToast();
  const { officeId, access, loading: accessLoading } = useExpenseAccess();
  const {
    types,
    loading: optionsLoading,
    error: optionsError,
  } = useExpenseOptions();

  const [title, setTitle] = useState("");
  const [vendor, setVendor] = useState("");
  const [expenseTypeId, setExpenseTypeId] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [submitAfterCreate, setSubmitAfterCreate] = useState(false);
  const [reminders, setReminders] = useState<ReminderEntry[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>({
    autoCreateEnabled: true,
    dayOfMonth: 1,
    reminderDaysBefore: 7,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (types.length > 0 && !expenseTypeId) {
      setExpenseTypeId(types[0].id);
    }
  }, [types, expenseTypeId]);

  useEffect(() => {
    const t = types.find((x) => x.id === expenseTypeId);
    if (!t) return;
    if (t.recurringAutoCreateDefault) {
      setRecurrenceEnabled(true);
      setRecurrence({
        autoCreateEnabled: true,
        dayOfMonth: t.recurringDayOfMonth ?? 1,
        reminderDaysBefore: t.recurringReminderDaysBefore ?? 7,
      });
    }
  }, [expenseTypeId, types]);

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
        <SetupBackLink href="/expenses">
          <ChevronLeft className="size-4" aria-hidden />
          Back to expenses
        </SetupBackLink>
        <p className="text-sm text-gray-500">
          You do not have permission to create expenses.
        </p>
      </div>
    );
  }

  if (types.length === 0) {
    return (
      <div className="space-y-4">
        <SetupBackLink href="/expenses">
          <ChevronLeft className="size-4" aria-hidden />
          Back to expenses
        </SetupBackLink>
        <p className="text-sm text-gray-500">
          {optionsError ?? "No expense types configured."}{" "}
          <Link href="/setup/expense-types" className="text-brand-600 underline">
            Add types in Setup
          </Link>
          .
        </p>
      </div>
    );
  }

  async function handleSubmit() {
    const parsedAmount = Number(amount.replace(/,/g, ""));
    if (!title.trim() || !parsedAmount || parsedAmount <= 0) {
      toast.showError("Title and amount are required.");
      return;
    }
    if (!expenseTypeId) {
      toast.showError("Select an expense type.");
      return;
    }

    const reminderPayload: ExpenseReminderDto[] = sanitizeReminders(reminders).map(
      (r) => ({
        schedule: r.schedule,
        customAt: r.at,
        note: r.note,
      })
    );

    setSaving(true);
    try {
      const oid = officeId!;
      let expense = await createOfficeExpense(oid, {
        title: title.trim(),
        vendor: vendor.trim() || undefined,
        expenseTypeId,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        currency: "TZS",
        amount: parsedAmount,
        expenseDate,
        reminders: reminderPayload.length > 0 ? reminderPayload : undefined,
        recurrence: recurrenceEnabled
          ? {
              autoCreateEnabled: recurrence.autoCreateEnabled,
              dayOfMonth: recurrence.dayOfMonth,
              reminderDaysBefore: recurrence.reminderDaysBefore,
            }
          : undefined,
      });

      if (receiptFile) {
        expense = await uploadExpenseAttachment(oid, expense.id, receiptFile);
      }

      if (submitAfterCreate && access?.canSubmit) {
        expense = await submitExpenseForApproval(oid, expense.id);
        toast.showSuccess("Expense created and submitted for approval.");
      } else {
        toast.showSuccess("Expense draft saved.");
      }
      router.push(`/expenses/${expense.id}`);
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : "Could not save expense.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SetupBackLink href="/expenses">
        <ChevronLeft className="size-4" aria-hidden />
        Back to expenses
      </SetupBackLink>

      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          New expense
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Creates a draft for your office. Submit for approval when ready — approvers
          and payers are configured under Setup → Office permissions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SetupSectionCard title="Expense details">
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Office supplies, travel"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Vendor / payee</Label>
              <Input
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="Supplier or merchant name"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Expense type</Label>
              <select
                className={`${selectClass} mt-1.5`}
                value={expenseTypeId}
                onChange={(e) => setExpenseTypeId(e.target.value)}
              >
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Description</Label>
              <textarea
                className={`${textareaClass} mt-1.5`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was purchased or paid for"
              />
            </div>
            <div>
              <Label>Internal notes</Label>
              <textarea
                className={`${textareaClass} mt-1.5`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes for approvers"
              />
            </div>
          </div>
        </SetupSectionCard>

        <SetupSectionCard title="Amount & date">
          <div className="space-y-4">
            <div>
              <Label>Amount (TZS) *</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <DatePicker
                id="expense-date"
                label="Expense date"
                value={expenseDate}
                onValueChange={setExpenseDate}
              />
            </div>

            <ReminderFields
              value={reminders}
              onChange={setReminders}
              referenceDate={expenseDate}
              referenceKind="expense"
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
              <Label>Receipt (optional)</Label>
              <p className="mt-1 text-xs text-gray-500">
                Upload one receipt now, or add more attachments on the detail page
                after saving.
              </p>
              <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-brand-600 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900/50">
                <Paperclip className="size-4" aria-hidden />
                {receiptFile ? receiptFile.name : "Choose file"}
                <input
                  type="file"
                  className="sr-only"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                  onChange={(e) => {
                    setReceiptFile(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
              </label>
              {receiptFile ? (
                <button
                  type="button"
                  className="mt-1 text-xs text-gray-500 underline"
                  onClick={() => setReceiptFile(null)}
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
                    Otherwise the expense stays as a draft you can edit later.
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
                Save expense
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/expenses")}
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
