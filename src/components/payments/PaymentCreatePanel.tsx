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
  nextPaymentReference,
  savePayment,
} from "@/lib/payments/payment-storage";
import type {
  PaymentAttachment,
  PaymentCategory,
  PaymentMethod,
  PaymentRecord,
} from "@/lib/payments/payment-types";
import {
  derivePaymentStatus,
  PAYMENT_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/payments/payment-utils";
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

export default function PaymentCreatePanel() {
  const router = useRouter();
  const [payeeName, setPayeeName] = useState("");
  const [payeeAccount, setPayeeAccount] = useState("");
  const [category, setCategory] = useState<PaymentCategory>("SUPPLIER");
  const [purpose, setPurpose] = useState("");
  const [amountDue, setAmountDue] = useState("");
  const [dueAt, setDueAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [markPaidNow, setMarkPaidNow] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BANK_TRANSFER");
  const [reconciliationNote, setReconciliationNote] = useState("");
  const [linkedInvoiceNumber, setLinkedInvoiceNumber] = useState("");
  const [attachments, setAttachments] = useState<PaymentAttachment[]>([]);
  const [reminders, setReminders] = useState<ReminderEntry[]>([
    createEmptyReminder(),
  ]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileError(null);
    try {
      const att = await fileToDataUrlAttachment(file);
      setAttachments((prev) => [...prev, att]);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Could not read file.");
    }
  }

  async function handleSubmit() {
    const amount = Number(amountDue.replace(/,/g, ""));
    if (!payeeName.trim() || !purpose.trim() || !amount || amount <= 0) return;
    if (category === "RECONCILIATION" && !reconciliationNote.trim()) return;

    setSaving(true);
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const paid = markPaidNow ? amount : 0;
    const id = `pay-${Date.now()}`;
    const history = [
      {
        id: `h-${Date.now()}`,
        at: today,
        label: markPaidNow ? "Created and paid" : "Created (unpaid)",
        detail: markPaidNow
          ? `${PAYMENT_METHOD_LABELS[paymentMethod]} — ${purpose}`
          : `Scheduled — due ${dueAt}`,
        amount: markPaidNow ? amount : undefined,
      },
    ];

    const savedReminders = sanitizeReminders(reminders);

    const record: PaymentRecord = {
      id,
      referenceNumber: nextPaymentReference(),
      payeeName: payeeName.trim(),
      payeeAccount: payeeAccount.trim() || undefined,
      category,
      purpose: purpose.trim(),
      currency: "TZS",
      amountDue: amount,
      amountPaid: paid,
      status: derivePaymentStatus(amount, paid, markPaidNow ? "PAID" : "UNPAID"),
      dueAt,
      createdAt: today,
      paidAt: markPaidNow ? today : undefined,
      paymentMethod: markPaidNow ? paymentMethod : undefined,
      reconciliationNote: reconciliationNote.trim() || undefined,
      linkedInvoiceNumber: linkedInvoiceNumber.trim() || undefined,
      attachments,
      reminders: savedReminders.length > 0 ? savedReminders : undefined,
      history,
    };

    savePayment(record);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    router.push(`/payments/${id}`);
  }

  const needsReconciliation = category === "RECONCILIATION";

  return (
    <div className="space-y-6">
      <SetupBackLink href="/payments">
        <ChevronLeft className="size-4" aria-hidden />
        Back to payments
      </SetupBackLink>

      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Record payment
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Outgoing payment to an external entity. Create as unpaid or mark paid on
          save with reference for reconciliation.
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
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as PaymentCategory)
                }
              >
                {Object.entries(PAYMENT_CATEGORY_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
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
              <Label>Linked invoice #</Label>
              <Input
                value={linkedInvoiceNumber}
                onChange={(e) => setLinkedInvoiceNumber(e.target.value)}
                placeholder="Optional — for letter reconciliation"
                className="mt-1.5"
              />
            </div>
          </div>
        </SetupSectionCard>

        <SetupSectionCard title="Amount & settlement">
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

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-900/50">
              <input
                type="checkbox"
                className="mt-1 size-4 rounded border-gray-300"
                checked={markPaidNow}
                onChange={(e) => setMarkPaidNow(e.target.checked)}
              />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Mark as paid on create
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Records full payment immediately with method and paid date.
                  Leave unchecked to schedule as unpaid.
                </p>
              </div>
            </label>

            {markPaidNow ? (
              <div>
                <Label>Payment method</Label>
                <select
                  className={`${selectClass} mt-1.5`}
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PaymentMethod)
                  }
                >
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <ReminderFields value={reminders} onChange={setReminders} />

            <div>
              <Label>Reference attachment</Label>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                  <Paperclip className="size-4" aria-hidden />
                  Upload file
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => void onFileChange(e)}
                  />
                </label>
              </div>
              {fileError ? (
                <p className="mt-1 text-xs text-rose-600">{fileError}</p>
              ) : null}
              {attachments.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {attachments.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2 text-xs dark:bg-gray-800"
                    >
                      <span className="truncate">{a.name}</span>
                      <button
                        type="button"
                        className="text-gray-500 hover:text-rose-600"
                        onClick={() =>
                          setAttachments((prev) =>
                            prev.filter((x) => x.id !== a.id)
                          )
                        }
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
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
                Save payment
              </Button>
              <LinkButton href="/payments" />
            </div>
          </div>
        </SetupSectionCard>
      </div>
    </div>
  );
}

function LinkButton({ href }: { href: string }) {
  const router = useRouter();
  return (
    <Button type="button" variant="outline" onClick={() => router.push(href)}>
      Cancel
    </Button>
  );
}
