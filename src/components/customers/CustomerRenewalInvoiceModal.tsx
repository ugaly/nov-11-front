"use client";

import {
  createOfficeInvoice,
  sendOfficeInvoice,
} from "@/api/invoice/invoice.api";
import InvoiceDocumentView from "@/components/invoices/InvoiceDocumentView";
import InvoiceTaxFields from "@/components/invoices/InvoiceTaxFields";
import DatePicker from "@/components/form/date-picker";
import { invoiceNotesTextareaClass } from "@/components/invoices/invoice-form-styles";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/context/ToastContext";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import type { CustomerEngagementResponse } from "@/api/types/template-config";
import { useInvoiceAccess } from "@/lib/invoices/use-invoice-access";
import { computeInvoiceTotals } from "@/lib/invoices/invoice-utils";
import { getStoredUser } from "@/lib/auth-storage";
import { Loader2, Receipt, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  customerEmail?: string | null;
  engagements: CustomerEngagementResponse[];
  onCreated?: (invoiceId: string) => void;
};

export default function CustomerRenewalInvoiceModal({
  isOpen,
  onClose,
  customerId,
  customerName,
  customerEmail,
  engagements,
  onCreated,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const { companyName } = useCompanyContext();
  const officeId = getStoredUser()?.officeId ?? null;
  const { access } = useInvoiceAccess();

  const [engagementId, setEngagementId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [amount, setAmount] = useState("1500000");
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxIncluded, setTaxIncluded] = useState(false);
  const [taxRate, setTaxRate] = useState("18");
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
  const issueDate = new Date().toISOString().slice(0, 10);
  const amountNum = Number(amount.replace(/,/g, "")) || 0;
  const lineDescription = selected
    ? `Renewal — ${selected.catalogName}`
    : "Renewal services";

  const parsedLines = useMemo(
    () =>
      amountNum > 0
        ? [{ description: lineDescription, quantity: 1, unitPrice: amountNum }]
        : [],
    [amountNum, lineDescription]
  );

  const totals = useMemo(
    () =>
      computeInvoiceTotals(
        parsedLines,
        taxEnabled ? Number(taxRate) || 0 : 0,
        taxIncluded
      ),
    [parsedLines, taxRate, taxEnabled, taxIncluded]
  );

  const previewData = useMemo(
    () => ({
      referenceNumber: "DRAFT-RENEWAL",
      billToName: customerName,
      billToEmail: customerEmail ?? "",
      issueDate,
      dueDate: dueAt,
      currency: "TZS",
      lineItems: parsedLines,
      subtotal: totals.subtotal,
      taxRate: taxEnabled ? Number(taxRate) || 0 : 0,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      taxIncluded: taxEnabled && taxIncluded,
      notes,
      companyName,
    }),
    [
      customerName,
      customerEmail,
      issueDate,
      dueAt,
      parsedLines,
      totals,
      taxRate,
      taxEnabled,
      taxIncluded,
      notes,
      companyName,
    ]
  );

  async function handleSubmit() {
    if (!officeId) {
      toast.showError("Your account is not assigned to an office.");
      return;
    }
    if (!access?.canCreate) {
      toast.showError("You do not have permission to create invoices.");
      return;
    }
    if (!engagementId || !customerEmail?.trim()) {
      toast.showError("Select an engagement and ensure the customer has an email.");
      return;
    }
    if (amountNum <= 0) {
      toast.showError("Enter a valid amount.");
      return;
    }

    setSubmitting(true);
    try {
      let invoice = await createOfficeInvoice(officeId, {
        customerId,
        engagementId: selected?.id,
        billToName: customerName.trim(),
        billToEmail: customerEmail.trim(),
        issueDate,
        dueDate: dueAt,
        currency: "TZS",
        taxRate: taxEnabled ? Number(taxRate) || 0 : 0,
        taxIncluded: taxEnabled && taxIncluded,
        notes: notes.trim() || undefined,
        lineItems: parsedLines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      });
      if (sendEmail) {
        if (!access.canSend) {
          toast.showError("Draft saved. You need Send permission to email the invoice.");
          onCreated?.(invoice.id);
          onClose();
          router.push(`/invoices/${invoice.id}`);
          return;
        }
        invoice = await sendOfficeInvoice(officeId, invoice.id, { sendEmail: true });
        toast.showSuccess("Renewal invoice created and sent.");
      } else {
        toast.showSuccess("Renewal invoice saved as draft.");
      }
      onCreated?.(invoice.id);
      onClose();
      router.push(`/invoices/${invoice.id}`);
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : "Could not create invoice.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-5xl p-0">
      <div className="flex max-h-[min(92vh,48rem)] flex-col">
        <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
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

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto p-6 lg:grid-cols-2">
          <div className="space-y-4">
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
              <Label>Line amount (TZS) *</Label>
              <Input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the amount as you quote it (before or after tax depending on
                settings below).
              </p>
            </div>

            <InvoiceTaxFields
              taxEnabled={taxEnabled}
              taxIncluded={taxIncluded}
              taxRate={taxRate}
              onTaxEnabledChange={setTaxEnabled}
              onTaxIncludedChange={setTaxIncluded}
              onTaxRateChange={setTaxRate}
              lines={parsedLines}
              disabled={submitting}
            />

            <div>
              <Label>Notes</Label>
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
                disabled={!access?.canSend}
                className="rounded border-gray-300"
              />
              Email invoice to {customerEmail ?? "customer"} after creating
            </label>
          </div>

          <div className="min-h-[20rem]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Preview
            </p>
            <InvoiceDocumentView data={previewData} variant="preview" />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
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
      </div>
    </Modal>
  );
}
