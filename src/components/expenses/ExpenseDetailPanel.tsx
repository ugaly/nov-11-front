"use client";

import ExpenseStatusBadge from "@/components/expenses/ExpenseStatusBadge";
import ReminderList from "@/components/shared/ReminderList";
import {
  SetupBackLink,
  SetupSectionCard,
  SetupStatCard,
} from "@/components/setup/setup-pro-ui";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import {
  getExpenseById,
  saveExpense,
} from "@/lib/expenses/expense-storage";
import type { ExpenseAttachment, ExpenseRecord, ExpenseStatus } from "@/lib/expenses/expense-types";
import {
  EXPENSE_CATEGORY_LABELS,
  formatExpenseAmount,
  formatExpenseDate,
} from "@/lib/expenses/expense-utils";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  FileText,
  History,
  Loader2,
  Receipt,
  Send,
  Tag,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function ExpenseDetailPanel({ expenseId }: { expenseId: string }) {
  const [expense, setExpense] = useState<ExpenseRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState("");

  const refresh = useCallback(() => {
    setExpense(getExpenseById(expenseId) ?? null);
  }, [expenseId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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

  async function transition(
    next: ExpenseStatus,
    label: string,
    extra?: Partial<ExpenseRecord>
  ) {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 350));
    const today = new Date().toISOString().slice(0, 10);
    const updated = saveExpense({
      ...e,
      ...extra,
      status: next,
      history: [
        { id: `h-${Date.now()}`, at: today, label },
        ...e.history,
      ],
    });
    setExpense(updated);
    setNote(label);
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <SetupBackLink href="/expenses">
            <ChevronLeft className="size-4" aria-hidden />
            Back to expenses
          </SetupBackLink>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {e.title}
            </h1>
            <ExpenseStatusBadge status={e.status} />
          </div>
          <p className="mt-1 font-mono text-xs text-gray-500">
            {e.referenceNumber} · {e.vendor}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {e.status === "DRAFT" ? (
            <Button
              size="sm"
              disabled={busy}
              onClick={() =>
                void transition("SUBMITTED", "Submitted for approval.")
              }
            >
              <Send className="mr-1.5 size-4" aria-hidden />
              Submit
            </Button>
          ) : null}
          {e.status === "SUBMITTED" ? (
            <>
              <Button
                size="sm"
                disabled={busy}
                onClick={() =>
                  void transition("APPROVED", "Expense approved.")
                }
              >
                <CheckCircle2 className="mr-1.5 size-4" aria-hidden />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void transition("REJECTED", "Expense rejected.")
                }
              >
                <XCircle className="mr-1.5 size-4" aria-hidden />
                Reject
              </Button>
            </>
          ) : null}
          {e.status === "APPROVED" ? (
            <Button
              size="sm"
              disabled={busy}
              onClick={() =>
                void transition("PAID", "Marked as paid.", {
                  paidAt: new Date().toISOString().slice(0, 10),
                  paymentMethod: "Bank transfer",
                  linkedPaymentRef: paymentRef.trim() || undefined,
                })
              }
            >
              Mark paid
            </Button>
          ) : null}
        </div>
      </div>

      {note ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          {note}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SetupStatCard
          icon={Receipt}
          label="Amount"
          value={formatExpenseAmount(e.currency, e.amount)}
        />
        <SetupStatCard
          icon={Tag}
          label="Category"
          value={EXPENSE_CATEGORY_LABELS[e.category]}
        />
        <SetupStatCard
          icon={Calendar}
          label="Expense date"
          value={formatExpenseDate(e.expenseDate)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SetupSectionCard title="Details">
          <dl className="space-y-3 text-sm">
            <Row label="Vendor" value={e.vendor} />
            <Row label="Description" value={e.description} />
            {e.notes ? <Row label="Notes" value={e.notes} /> : null}
            {e.paymentMethod ? (
              <Row label="Payment method" value={e.paymentMethod} />
            ) : null}
            {e.paidAt ? (
              <Row label="Paid on" value={formatExpenseDate(e.paidAt)} />
            ) : null}
            {e.linkedPaymentRef ? (
              <Row
                label="Payment ref"
                value={
                  <Link
                    href="/payments"
                    className="font-mono text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {e.linkedPaymentRef}
                  </Link>
                }
              />
            ) : null}
          </dl>
          {e.status === "APPROVED" ? (
            <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
              <Label>Link payment reference (optional)</Label>
              <Input
                value={paymentRef}
                onChange={(ev) => setPaymentRef(ev.target.value)}
                placeholder="PAY-2026-0001"
                className="mt-1.5"
              />
            </div>
          ) : null}
        </SetupSectionCard>

        <SetupSectionCard title="Receipt & reminders">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            Receipt
          </p>
          {e.receipt ? (
            <ReceiptLink receipt={e.receipt} />
          ) : (
            <p className="text-sm text-gray-500">No receipt uploaded.</p>
          )}
          <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-gray-500">
            Reminders
          </p>
          <ReminderList reminders={e.reminders} />
        </SetupSectionCard>
      </div>

      <SetupSectionCard title="History">
        <ul className="space-y-4">
          {e.history.map((h) => (
            <li
              key={h.id}
              className="flex gap-3 border-l-2 border-gray-200 pl-4 dark:border-gray-700"
            >
              <History className="mt-0.5 size-4 text-gray-400" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {h.label}
                </p>
                <p className="text-xs text-gray-500">
                  {formatExpenseDate(h.at)}
                  {h.detail ? ` · ${h.detail}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </SetupSectionCard>

      {busy ? (
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Updating…
        </p>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-gray-900 dark:text-white">{value}</dd>
    </div>
  );
}

function ReceiptLink({ receipt }: { receipt: ExpenseAttachment }) {
  if (receipt.dataUrl) {
    return (
      <a
        href={receipt.dataUrl}
        download={receipt.name}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
      >
        <FileText className="size-4" aria-hidden />
        {receipt.name}
      </a>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <FileText className="size-4" aria-hidden />
      {receipt.name}
    </span>
  );
}
