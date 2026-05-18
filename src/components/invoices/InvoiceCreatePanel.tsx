"use client";

import InvoiceDocumentPreview from "@/components/invoices/InvoiceDocumentPreview";
import {
  SetupBackLink,
  SetupSectionCard,
} from "@/components/setup/setup-pro-ui";
import {
  invoiceNotesTextareaClass,
} from "@/components/invoices/invoice-form-styles";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/form/date-picker";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import {
  DUMMY_INVOICE_CUSTOMERS,
  getDummyInvoiceById,
} from "@/lib/invoices/invoice-dummy-data";
import InvoiceVatToggle from "@/components/invoices/InvoiceVatToggle";
import type { InvoiceLineItem, InvoiceRecord, InvoiceType } from "@/lib/invoices/invoice-types";
import {
  DEFAULT_VAT_RATE,
  formatInvoiceAmount,
  recalculateInvoice,
} from "@/lib/invoices/invoice-utils";
import {
  ChevronLeft,
  Loader2,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

function newLine(id: string): InvoiceLineItem {
  return { id, description: "", quantity: 1, unitPrice: 0 };
}

function buildPreview(
  customerId: string,
  lineItems: InvoiceLineItem[],
  dueAt: string,
  notes: string,
  type: InvoiceType,
  vatIncluded: boolean
): InvoiceRecord | null {
  const customer = DUMMY_INVOICE_CUSTOMERS.find((c) => c.id === customerId);
  if (!customer) return null;

  return recalculateInvoice({
    id: "preview",
    number: "INV-DRAFT-NEW",
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    type,
    status: "DRAFT",
    currency: "TZS",
    subtotal: 0,
    vatIncluded,
    taxRate: DEFAULT_VAT_RATE,
    taxAmount: 0,
    total: 0,
    amountPaid: 0,
    issuedAt: new Date().toISOString().slice(0, 10),
    dueAt,
    lineItems: lineItems.filter((l) => l.description.trim()),
    notes: notes || undefined,
    billingAddress: customer.billingAddress,
    activities: [],
  });
}

export default function InvoiceCreatePanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromId = searchParams.get("from");
  const source = fromId ? getDummyInvoiceById(fromId) : null;

  const { companyName } = useCompanyContext();
  const [customerId, setCustomerId] = useState(source?.customerId ?? "");
  const [type, setType] = useState<InvoiceType>(source?.type ?? "MANUAL");
  const [dueAt, setDueAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState(source?.notes ?? "");
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    source?.lineItems.map((l) => ({ ...l, id: `new-${l.id}` })) ?? [
      newLine("1"),
      newLine("2"),
    ]
  );
  const [sendAfterCreate, setSendAfterCreate] = useState(true);
  const [vatIncluded, setVatIncluded] = useState(source?.vatIncluded ?? false);
  const [saving, setSaving] = useState(false);

  const preview = useMemo(
    () => buildPreview(customerId, lineItems, dueAt, notes, type, vatIncluded),
    [customerId, lineItems, dueAt, notes, type, vatIncluded]
  );

  function updateLine(id: string, patch: Partial<InvoiceLineItem>) {
    setLineItems((rows) =>
      rows.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  }

  async function handleSubmit(send: boolean) {
    if (!customerId || !preview || preview.lineItems.length === 0) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    router.push(send ? "/invoices/inv-002" : "/invoices");
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
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Manual invoices for one-off or custom billing. Most invoices are
          auto-generated from engagements — use this when you need to bill a
          customer directly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-7">
          <SetupSectionCard title="Customer & terms">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Customer *</Label>
                <select
                  className={`${selectClass} mt-1.5`}
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">Select customer…</option>
                  {DUMMY_INVOICE_CUSTOMERS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Invoice type</Label>
                <select
                  className={`${selectClass} mt-1.5`}
                  value={type}
                  onChange={(e) => setType(e.target.value as InvoiceType)}
                >
                  <option value="MANUAL">Manual</option>
                  <option value="ONE_TIME">One-time</option>
                  <option value="SUBSCRIPTION">Subscription</option>
                  <option value="RENEWAL">Renewal</option>
                  <option value="UPGRADE">Upgrade</option>
                </select>
              </div>
              <div className="sm:col-span-2 sm:max-w-xs">
                <DatePicker
                  id="invoice-create-due"
                  label="Due date *"
                  placeholder="Select due date"
                  value={dueAt}
                  onValueChange={setDueAt}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Notes (optional)</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`${invoiceNotesTextareaClass} mt-1.5`}
                  placeholder="Payment instructions, bank details, or internal note…"
                />
              </div>
            </div>
          </SetupSectionCard>

          <SetupSectionCard
            title="Line items"
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setLineItems((rows) => [...rows, newLine(String(Date.now()))])
                }
              >
                <Plus className="mr-1 size-4" aria-hidden />
                Add line
              </Button>
            }
          >
            <div className="space-y-4">
              {lineItems.map((line, idx) => (
                <div
                  key={line.id}
                  className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/30"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-gray-500">
                      Line {idx + 1}
                    </span>
                    {lineItems.length > 1 ? (
                      <button
                        type="button"
                        className="text-gray-400 hover:text-rose-600"
                        onClick={() =>
                          setLineItems((rows) => rows.filter((r) => r.id !== line.id))
                        }
                        aria-label="Remove line"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-12">
                    <div className="sm:col-span-6">
                      <Label>Description</Label>
                      <Input
                        value={line.description}
                        onChange={(e) =>
                          updateLine(line.id, { description: e.target.value })
                        }
                        className="mt-1"
                        placeholder="Service description"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={String(line.quantity)}
                        onChange={(e) =>
                          updateLine(line.id, {
                            quantity: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <Label>Unit price (TZS)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={line.unitPrice ? String(line.unitPrice) : ""}
                        onChange={(e) =>
                          updateLine(line.id, {
                            unitPrice: Number(e.target.value) || 0,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SetupSectionCard>

          <InvoiceVatToggle checked={vatIncluded} onChange={setVatIncluded} />

          <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
            <input
              type="checkbox"
              checked={sendAfterCreate}
              onChange={(e) => setSendAfterCreate(e.target.checked)}
              className="rounded border-gray-300"
            />
            Send invoice to customer by email after saving
          </label>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={saving || !preview?.lineItems.length}
              onClick={() => void handleSubmit(false)}
            >
              {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
              Save as draft
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving || !preview?.lineItems.length || !customerId}
              onClick={() => void handleSubmit(sendAfterCreate)}
            >
              <Send className="mr-1.5 size-4" aria-hidden />
              Save & send
            </Button>
          </div>
        </div>

        <div className="xl:col-span-5">
          <div className="sticky top-24 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Live preview
            </p>
            {preview && preview.lineItems.length > 0 ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total:{" "}
                  <strong className="text-gray-900 dark:text-white">
                    {formatInvoiceAmount(preview.currency, preview.total)}
                  </strong>
                </p>
                <InvoiceDocumentPreview
                  invoice={preview}
                  companyName={companyName}
                  compact
                />
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-gray-200 px-4 py-12 text-center text-sm text-gray-500 dark:border-gray-700">
                Select a customer and add at least one line item to preview.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
