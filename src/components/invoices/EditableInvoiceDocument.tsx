"use client";

import InvoiceBrandLogo from "@/components/invoices/InvoiceBrandLogo";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import InvoiceVatToggle from "@/components/invoices/InvoiceVatToggle";
import DatePicker from "@/components/form/date-picker";
import {
  invoiceFieldClass,
  invoiceNotesTextareaClass,
} from "@/components/invoices/invoice-form-styles";
import type { InvoiceLineItem, InvoiceRecord } from "@/lib/invoices/invoice-types";
import {
  computeDisplayStatus,
  formatInvoiceAmount,
  formatInvoiceDate,
  INVOICE_TYPE_LABELS,
  isVatIncluded,
  newInvoiceLineItem,
  recalculateInvoice,
} from "@/lib/invoices/invoice-utils";
import { Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/button/Button";

const cellInputClass = `${invoiceFieldClass} h-10 px-2.5 py-2 text-sm`;

type Props = {
  invoice: InvoiceRecord;
  companyName?: string | null;
  onChange: (invoice: InvoiceRecord) => void;
};

export default function EditableInvoiceDocument({
  invoice,
  companyName = "Your firm",
  onChange,
}: Props) {
  const status = computeDisplayStatus(invoice);
  const balance = invoice.total - invoice.amountPaid;
  const showVat = isVatIncluded(invoice);

  function patch(partial: Partial<InvoiceRecord>) {
    onChange(recalculateInvoice({ ...invoice, ...partial }));
  }

  function updateLine(id: string, partial: Partial<InvoiceLineItem>) {
    patch({
      lineItems: invoice.lineItems.map((l) =>
        l.id === id ? { ...l, ...partial } : l
      ),
    });
  }

  function addLine() {
    patch({ lineItems: [...invoice.lineItems, newInvoiceLineItem()] });
  }

  function removeLine(id: string) {
    if (invoice.lineItems.length <= 1) return;
    patch({ lineItems: invoice.lineItems.filter((l) => l.id !== id) });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ring-1 ring-brand-200/60 dark:border-gray-800 dark:bg-gray-900 dark:ring-brand-800/40">
      <div className="border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white px-8 py-6 dark:border-gray-800 dark:from-gray-900 dark:to-gray-900/80">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <InvoiceBrandLogo />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {companyName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Professional services invoice · editing
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Invoice
            </p>
            <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">
              {invoice.number}
            </p>
            <div className="mt-2 flex justify-end">
              <InvoiceStatusBadge status={status} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Bill to
            </p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-white">
              {invoice.customerName}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {invoice.customerEmail}
            </p>
            <textarea
              value={invoice.billingAddress}
              onChange={(e) => patch({ billingAddress: e.target.value })}
              rows={3}
              className={`${invoiceNotesTextareaClass} mt-2 min-h-[72px] text-xs`}
              placeholder="Billing address"
            />
          </div>
          <div className="space-y-4 sm:text-right">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4 sm:flex-col sm:items-end">
                <dt className="text-gray-500">Issued</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {formatInvoiceDate(invoice.issuedAt)}
                </dd>
              </div>
            </dl>
            <DatePicker
              id="invoice-edit-due"
              label="Due date"
              placeholder="Select due date"
              value={invoice.dueAt}
              onValueChange={(dueAt) => patch({ dueAt })}
              className="sm:ml-auto sm:max-w-[220px]"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 sm:text-right">
              {INVOICE_TYPE_LABELS[invoice.type] ?? invoice.type}
              {invoice.engagementRef ? (
                <span className="mt-1 block font-mono text-xs">
                  {invoice.engagementRef}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        <input
          type="text"
          value={invoice.catalogName ?? ""}
          onChange={(e) =>
            patch({ catalogName: e.target.value.trim() || undefined })
          }
          className={invoiceFieldClass}
          placeholder="Service / catalog name (optional)"
        />

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-800/50">
                <th className="px-3 py-3 font-semibold">Description</th>
                <th className="w-20 px-2 py-3 text-right font-semibold">Qty</th>
                <th className="w-32 px-2 py-3 text-right font-semibold">Unit</th>
                <th className="w-28 px-3 py-3 text-right font-semibold">Amount</th>
                <th className="w-10 px-1 py-3" />
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((line) => (
                <tr
                  key={line.id}
                  className="border-b border-gray-50 align-top dark:border-gray-800/80"
                >
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) =>
                        updateLine(line.id, { description: e.target.value })
                      }
                      className={cellInputClass}
                      placeholder="Description"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min="1"
                      value={String(line.quantity)}
                      onChange={(e) =>
                        updateLine(line.id, {
                          quantity: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className={`${cellInputClass} text-right`}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min="0"
                      value={line.unitPrice ? String(line.unitPrice) : ""}
                      onChange={(e) =>
                        updateLine(line.id, {
                          unitPrice: Number(e.target.value) || 0,
                        })
                      }
                      className={`${cellInputClass} text-right`}
                    />
                  </td>
                  <td className="px-3 py-2 pt-3 text-right font-medium text-gray-900 dark:text-white">
                    {formatInvoiceAmount(
                      invoice.currency,
                      line.quantity * line.unitPrice
                    )}
                  </td>
                  <td className="px-1 py-2">
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      disabled={invoice.lineItems.length <= 1}
                      className="rounded p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                      aria-label="Remove line"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button type="button" size="sm" variant="outline" onClick={addLine}>
          <Plus className="mr-1.5 size-4" aria-hidden />
          Add line item
        </Button>

        <InvoiceVatToggle
          checked={isVatIncluded(invoice)}
          onChange={(included) => patch({ vatIncluded: included })}
        />

        <div className="flex justify-end">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <dt>Subtotal</dt>
              <dd>{formatInvoiceAmount(invoice.currency, invoice.subtotal)}</dd>
            </div>
            {showVat ? (
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <dt>VAT ({Math.round(invoice.taxRate * 100)}%)</dt>
                <dd>{formatInvoiceAmount(invoice.currency, invoice.taxAmount)}</dd>
              </div>
            ) : (
              <p className="text-right text-xs text-gray-400">VAT not included</p>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900 dark:border-gray-700 dark:text-white">
              <dt>Total</dt>
              <dd>{formatInvoiceAmount(invoice.currency, invoice.total)}</dd>
            </div>
            {balance > 0 && status !== "PAID" ? (
              <div className="flex justify-between font-semibold text-rose-700 dark:text-rose-400">
                <dt>Balance due</dt>
                <dd>{formatInvoiceAmount(invoice.currency, balance)}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Notes (optional)
          </label>
          <textarea
            value={invoice.notes ?? ""}
            onChange={(e) => patch({ notes: e.target.value || undefined })}
            className={`${invoiceNotesTextareaClass} mt-2`}
            placeholder="Payment instructions, bank details, or internal note…"
          />
        </div>
      </div>
    </div>
  );
}
