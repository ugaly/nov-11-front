"use client";

import {
  SetupBackLink,
  SetupSectionCard,
} from "@/components/setup/setup-pro-ui";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/form/date-picker";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import ReminderFields from "@/components/shared/ReminderFields";
import { fileToDataUrlAttachment } from "@/lib/attachment-utils";
import {
  createEmptyReminder,
  sanitizeReminders,
  type ReminderEntry,
} from "@/lib/reminders/reminder-types";
import {
  nextExpenseReference,
  saveExpense,
} from "@/lib/expenses/expense-storage";
import type {
  ExpenseAttachment,
  ExpenseCategory,
  ExpenseRecord,
  ExpenseStatus,
} from "@/lib/expenses/expense-types";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/expenses/expense-utils";
import {
  ChevronLeft,
  Loader2,
  Paperclip,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const textareaClass =
  "min-h-[88px] w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function ExpenseCreatePanel() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("OFFICE");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [initialStatus, setInitialStatus] = useState<ExpenseStatus>("DRAFT");
  const [notes, setNotes] = useState("");
  const [receipt, setReceipt] = useState<ExpenseAttachment | null>(null);
  const [reminders, setReminders] = useState<ReminderEntry[]>([
    createEmptyReminder(),
  ]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onReceipt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setReceipt(await fileToDataUrlAttachment(file));
      setFileError(null);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  async function handleSubmit() {
    const amt = Number(amount.replace(/,/g, ""));
    if (!title.trim() || !vendor.trim() || !amt || amt <= 0) return;

    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const id = `exp-${Date.now()}`;
    const statusLabels: Record<ExpenseStatus, string> = {
      DRAFT: "Draft created",
      SUBMITTED: "Submitted for approval",
      APPROVED: "Created as approved",
      PAID: "Created as paid",
      REJECTED: "Rejected",
    };

    const savedReminders = sanitizeReminders(reminders);

    const record: ExpenseRecord = {
      id,
      referenceNumber: nextExpenseReference(),
      title: title.trim(),
      vendor: vendor.trim(),
      category,
      description: description.trim() || title.trim(),
      currency: "TZS",
      amount: amt,
      status: initialStatus,
      expenseDate,
      createdAt: today,
      paidAt: initialStatus === "PAID" ? today : undefined,
      paymentMethod: initialStatus === "PAID" ? "Card" : undefined,
      notes: notes.trim() || undefined,
      receipt: receipt ?? undefined,
      reminders: savedReminders.length > 0 ? savedReminders : undefined,
      history: [
        {
          id: `h-${Date.now()}`,
          at: today,
          label: statusLabels[initialStatus],
        },
      ],
    };

    saveExpense(record);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    router.push(`/expenses/${id}`);
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
          Log a company expense with vendor, category, receipt, and workflow status.
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
                className="mt-1.5"
                placeholder="Short label"
              />
            </div>
            <div>
              <Label>Vendor *</Label>
              <Input
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Category</Label>
              <select
                className={`${selectClass} mt-1.5`}
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as ExpenseCategory)
                }
              >
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
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
              />
            </div>
            <div>
              <Label>Notes</Label>
              <textarea
                className={`${textareaClass} mt-1.5`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Billable engagement, cost centre…"
              />
            </div>
          </div>
        </SetupSectionCard>

        <SetupSectionCard title="Amount & status">
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
            <div>
              <Label>Initial status</Label>
              <select
                className={`${selectClass} mt-1.5`}
                value={initialStatus}
                onChange={(e) =>
                  setInitialStatus(e.target.value as ExpenseStatus)
                }
              >
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submit for approval</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <ReminderFields value={reminders} onChange={setReminders} />

            <div>
              <Label>Receipt</Label>
              <label className="mt-1.5 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                <Paperclip className="size-4" aria-hidden />
                Upload receipt
                <input
                  type="file"
                  className="sr-only"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => void onReceipt(e)}
                />
              </label>
              {receipt ? (
                <p className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                  {receipt.name}
                  <button type="button" onClick={() => setReceipt(null)}>
                    <X className="size-3.5" aria-hidden />
                  </button>
                </p>
              ) : null}
              {fileError ? (
                <p className="mt-1 text-xs text-rose-600">{fileError}</p>
              ) : null}
            </div>
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
