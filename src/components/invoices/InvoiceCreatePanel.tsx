"use client";

import {
  createOfficeInvoice,
  sendOfficeInvoice,
} from "@/api/invoice/invoice.api";
import InvoiceDocumentView, {
  type InvoiceDocumentData,
} from "@/components/invoices/InvoiceDocumentView";
import InvoiceRecipientAutocomplete, {
  type InvoiceBillTo,
} from "@/components/invoices/InvoiceRecipientAutocomplete";
import InvoiceTaxFields from "@/components/invoices/InvoiceTaxFields";
import ReminderFields from "@/components/shared/ReminderFields";
import {
  SetupBackLink,
  SetupSectionCard,
} from "@/components/setup/setup-pro-ui";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/form/date-picker";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useToast } from "@/context/ToastContext";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useInvoiceAccess } from "@/lib/invoices/use-invoice-access";
import { computeInvoiceTotals } from "@/lib/invoices/invoice-utils";
import type { ReminderEntry } from "@/lib/reminders/reminder-types";
import { sanitizeReminders } from "@/lib/reminders/reminder-types";
import { ChevronLeft, Eye, Loader2, Plus, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const textareaClass =
  "min-h-[88px] w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

type LineRow = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

function newLine(desc = "", price = ""): LineRow {
  return {
    id: crypto.randomUUID(),
    description: desc,
    quantity: "1",
    unitPrice: price,
  };
}

export default function InvoiceCreatePanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { companyName } = useCompanyContext();
  const { officeId, access, loading: accessLoading } = useInvoiceAccess();

  const [billTo, setBillTo] = useState<InvoiceBillTo>({
    billToName: "",
    billToEmail: "",
  });
  const [issueDate, setIssueDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxIncluded, setTaxIncluded] = useState(false);
  const [taxRate, setTaxRate] = useState("18");
  const [reminders, setReminders] = useState<ReminderEntry[]>([]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [lineItems, setLineItems] = useState<LineRow[]>([newLine(), newLine()]);
  const [sendAfterCreate, setSendAfterCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prefillDone, setPrefillDone] = useState(false);

  useEffect(() => {
    if (prefillDone) return;
    const name = searchParams.get("name") ?? "";
    const email = searchParams.get("email") ?? "";
    const customerId = searchParams.get("customerId") ?? undefined;
    const line = searchParams.get("line") ?? "";
    const amount = searchParams.get("amount") ?? "";
    const notesParam = searchParams.get("notes") ?? "";

    if (name || email || customerId) {
      setBillTo({
        billToName: name,
        billToEmail: email,
        customerId: customerId || undefined,
      });
    }
    if (line || amount) {
      setLineItems([newLine(line, amount), newLine()]);
    }
    if (notesParam) setNotes(notesParam);
    setPrefillDone(true);
  }, [searchParams, prefillDone]);

  const parsedLines = useMemo(() => {
    return lineItems
      .map((l) => ({
        description: l.description.trim(),
        quantity: Number(l.quantity.replace(/,/g, "")) || 0,
        unitPrice: Number(l.unitPrice.replace(/,/g, "")) || 0,
      }))
      .filter((l) => l.description && l.quantity > 0 && l.unitPrice >= 0);
  }, [lineItems]);

  const totals = useMemo(
    () =>
      computeInvoiceTotals(
        parsedLines,
        taxEnabled ? Number(taxRate) || 0 : 0,
        taxIncluded
      ),
    [parsedLines, taxRate, taxEnabled, taxIncluded]
  );

  const previewData: InvoiceDocumentData = useMemo(
    () => ({
      referenceNumber: "DRAFT-PREVIEW",
      billToName: billTo.billToName,
      billToEmail: billTo.billToEmail,
      issueDate,
      dueDate,
      currency: "TZS",
      lineItems: parsedLines,
      subtotal: totals.subtotal,
      taxRate: taxEnabled ? Number(taxRate) || 0 : 0,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      taxIncluded: taxEnabled && taxIncluded,
      notes,
      terms,
      companyName,
    }),
    [
      billTo,
      issueDate,
      dueDate,
      parsedLines,
      totals,
      taxRate,
      taxEnabled,
      taxIncluded,
      notes,
      terms,
      companyName,
    ]
  );

  if (accessLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
      </div>
    );
  }

  if (!officeId || !access?.canCreate) {
    return (
      <div className="space-y-4">
        <SetupBackLink href="/invoices">
          <ChevronLeft className="size-4" aria-hidden />
          Back to invoices
        </SetupBackLink>
        <p className="text-sm text-gray-500">
          You do not have permission to create invoices.
        </p>
      </div>
    );
  }

  async function handleSubmit(send: boolean) {
    if (!billTo.billToName.trim() || !billTo.billToEmail.trim()) {
      toast.showError("Bill to name and email are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billTo.billToEmail.trim())) {
      toast.showError("Enter a valid bill-to email.");
      return;
    }
    if (parsedLines.length === 0) {
      toast.showError("Add at least one line item with description, quantity, and price.");
      return;
    }

    setSaving(true);
    try {
      let invoice = await createOfficeInvoice(officeId!, {
        customerId: billTo.customerId,
        billToName: billTo.billToName.trim(),
        billToEmail: billTo.billToEmail.trim(),
        issueDate,
        dueDate,
        currency: "TZS",
        taxRate: taxEnabled ? Number(taxRate) || 0 : 0,
        taxIncluded: taxEnabled && taxIncluded,
        reminders: sanitizeReminders(reminders).map((r) => ({
          schedule: r.schedule,
          customAt: r.at,
          note: r.note,
        })),
        notes: notes.trim() || undefined,
        terms: terms.trim() || undefined,
        lineItems: parsedLines,
      });
      if (send || sendAfterCreate) {
        if (!access?.canSend) {
          toast.showError("Invoice saved as draft. You need Send permission to email it.");
          router.push(`/invoices/${invoice.id}`);
          return;
        }
        invoice = await sendOfficeInvoice(officeId!, invoice.id);
        toast.showSuccess("Invoice created and sent by email.");
      } else {
        toast.showSuccess("Invoice saved as draft.");
      }
      router.push(`/invoices/${invoice.id}`);
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : "Could not create invoice.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <SetupBackLink href="/invoices">
          <ChevronLeft className="size-4" aria-hidden />
          Invoices
        </SetupBackLink>
        <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
          Create invoice
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          The preview updates as you type. Sending is handled by the server.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-7">
          <SetupSectionCard title="Recipient">
            <InvoiceRecipientAutocomplete
              officeId={officeId}
              value={billTo}
              onChange={setBillTo}
              disabled={saving}
            />
          </SetupSectionCard>

          <SetupSectionCard title="Dates">
            <div className="grid gap-5 sm:grid-cols-2">
              <DatePicker
                id="invoice-issue-date"
                label="Issue date *"
                value={issueDate}
                onValueChange={setIssueDate}
              />
              <DatePicker
                id="invoice-due-date"
                label="Due date *"
                value={dueDate}
                onValueChange={setDueDate}
              />
            </div>
          </SetupSectionCard>

          <SetupSectionCard title="Tax">
            <InvoiceTaxFields
              taxEnabled={taxEnabled}
              taxIncluded={taxIncluded}
              taxRate={taxRate}
              onTaxEnabledChange={setTaxEnabled}
              onTaxIncludedChange={setTaxIncluded}
              onTaxRateChange={setTaxRate}
              lines={parsedLines}
              disabled={saving}
            />
          </SetupSectionCard>

          <SetupSectionCard title="Payment reminders">
            <p className="mb-3 text-xs text-gray-500">
              Email the customer again on these schedules while the invoice is unpaid
              (after you send it).
            </p>
            <ReminderFields
              value={reminders}
              onChange={setReminders}
              referenceDate={dueDate}
              referenceKind="due"
            />
          </SetupSectionCard>

          <SetupSectionCard
            title="Line items"
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setLineItems((rows) => [...rows, newLine()])}
              >
                <Plus className="mr-1 size-4" aria-hidden />
                Add line
              </Button>
            }
          >
            <div className="space-y-4">
              {lineItems.map((row) => (
                <div
                  key={row.id}
                  className="grid gap-3 rounded-xl border border-gray-100 p-4 dark:border-gray-800 sm:grid-cols-12"
                >
                  <div className="sm:col-span-6">
                    <Label>Description</Label>
                    <Input
                      className="mt-1.5"
                      value={row.description}
                      onChange={(e) =>
                        setLineItems((rows) =>
                          rows.map((r) =>
                            r.id === row.id
                              ? { ...r, description: e.target.value }
                              : r
                          )
                        )
                      }
                      placeholder="Service or product"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Qty</Label>
                    <Input
                      className="mt-1.5"
                      value={row.quantity}
                      onChange={(e) =>
                        setLineItems((rows) =>
                          rows.map((r) =>
                            r.id === row.id ? { ...r, quantity: e.target.value } : r
                          )
                        )
                      }
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Label>Unit price</Label>
                    <Input
                      className="mt-1.5"
                      value={row.unitPrice}
                      onChange={(e) =>
                        setLineItems((rows) =>
                          rows.map((r) =>
                            r.id === row.id
                              ? { ...r, unitPrice: e.target.value }
                              : r
                          )
                        )
                      }
                    />
                  </div>
                  <div className="flex items-end sm:col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label="Remove line"
                      disabled={lineItems.length <= 1}
                      onClick={() =>
                        setLineItems((rows) => rows.filter((r) => r.id !== row.id))
                      }
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SetupSectionCard>

          <SetupSectionCard title="Notes & terms">
            <div className="space-y-4">
              <div>
                <Label>Notes (optional)</Label>
                <textarea
                  className={`${textareaClass} mt-1.5`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment instructions or bank details…"
                />
              </div>
              <div>
                <Label>Terms (optional)</Label>
                <textarea
                  className={`${textareaClass} mt-1.5`}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                />
              </div>
            </div>
          </SetupSectionCard>

          <div className="flex flex-wrap items-center gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={sendAfterCreate}
                onChange={(e) => setSendAfterCreate(e.target.checked)}
                disabled={!access?.canSend}
              />
              Send by email after saving
            </label>
            <div className="ml-auto flex flex-wrap gap-2">
              <Link href="/invoices">
                <Button type="button" variant="outline" disabled={saving}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void handleSubmit(false)}
              >
                {saving ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
                ) : null}
                Save draft
              </Button>
              {access?.canSend ? (
                <Button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSubmit(true)}
                >
                  <Send className="mr-1.5 size-4" aria-hidden />
                  Save & send
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="xl:col-span-5">
          <div className="sticky top-24 space-y-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Eye className="size-3.5" aria-hidden />
              Live preview
            </p>
            <InvoiceDocumentView data={previewData} variant="preview" />
          </div>
        </div>
      </div>
    </div>
  );
}
