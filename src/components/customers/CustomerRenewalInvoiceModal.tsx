"use client";

import DatePicker from "@/components/form/date-picker";
import { invoiceNotesTextareaClass } from "@/components/invoices/invoice-form-styles";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import type { CustomerEngagementResponse } from "@/api/types/template-config";
import { formatInvoiceAmount } from "@/lib/invoices/invoice-utils";
import { Loader2, Receipt, Send } from "lucide-react";
import { useEffect, useState } from "react";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerEmail?: string | null;
  engagements: CustomerEngagementResponse[];
  onCreated?: () => void;
};

export default function CustomerRenewalInvoiceModal({
  isOpen,
  onClose,
  customerName,
  customerEmail,
  engagements,
  onCreated,
}: Props) {
  const { companyName } = useCompanyContext();
  const [engagementId, setEngagementId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [amount, setAmount] = useState("1500000");
  const [notes, setNotes] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setDueAt(d.toISOString().slice(0, 10));
    setEngagementId(engagements[0]?.id ?? "");
    setNotes(
      `Renewal invoice for ${customerName}. Please settle by the due date below.`
    );
  }, [isOpen, engagements, customerName]);

  const selected = engagements.find((e) => e.id === engagementId);

  async function handleSubmit() {
    if (!engagementId) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    onCreated?.();
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900">
          <Receipt className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Renewal invoice
          </h2>
          <p className="text-sm text-gray-500">{customerName}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Creates a renewal draft from an active engagement. Sample flow until billing
        API is connected.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <Label>Engagement / service *</Label>
          <select
            className={`${selectClass} mt-1.5`}
            value={engagementId}
            onChange={(e) => setEngagementId(e.target.value)}
            disabled={engagements.length === 0}
          >
            {engagements.length === 0 ? (
              <option value="">No engagements — add one first</option>
            ) : (
              engagements.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.catalogName} ({e.status})
                </option>
              ))
            )}
          </select>
        </div>

        <DatePicker
          id="renewal-invoice-due"
          label="Due date *"
          value={dueAt}
          onValueChange={setDueAt}
        />

        <div>
          <Label>Amount (TZS)</Label>
          <Input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1.5"
          />
          {amount ? (
            <p className="mt-1 text-xs text-gray-500">
              Preview total incl. VAT:{" "}
              <strong>
                {formatInvoiceAmount(
                  "TZS",
                  Math.round(Number(amount) * 1.18) || 0
                )}
              </strong>
            </p>
          ) : null}
        </div>

        <div>
          <Label>Notes for invoice</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`${invoiceNotesTextareaClass} mt-1.5 min-h-[100px]`}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="rounded border-gray-300"
          />
          Email invoice to {customerEmail ?? "customer"} after creating
        </label>

        {selected ? (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-900/50 dark:text-gray-400">
            From <span className="font-medium">{companyName}</span> ·{" "}
            {selected.catalogName}
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={submitting || !engagementId || engagements.length === 0}
          onClick={() => void handleSubmit()}
        >
          {submitting ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
          ) : (
            <Send className="mr-1.5 size-4" aria-hidden />
          )}
          {submitting ? "Creating…" : sendEmail ? "Create & send" : "Create draft"}
        </Button>
      </div>
    </Modal>
  );
}
