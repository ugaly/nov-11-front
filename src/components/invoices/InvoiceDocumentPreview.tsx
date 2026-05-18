"use client";

import type { InvoiceRecord } from "@/lib/invoices/invoice-types";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import {
  computeDisplayStatus,
  formatInvoiceAmount,
  formatInvoiceDate,
  INVOICE_TYPE_LABELS,
  isVatIncluded,
} from "@/lib/invoices/invoice-utils";
import InvoiceBrandLogo from "@/components/invoices/InvoiceBrandLogo";

export default function InvoiceDocumentPreview({
  invoice,
  companyName = "Your firm",
  compact = false,
}: {
  invoice: InvoiceRecord;
  companyName?: string | null;
  compact?: boolean;
}) {
  const status = computeDisplayStatus(invoice);
  const balance = invoice.total - invoice.amountPaid;
  const showVat = isVatIncluded(invoice);
  const pad = compact ? "px-4 py-4" : "px-8 py-6";

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 ${
        compact ? "" : "ring-1 ring-gray-100 dark:ring-gray-800"
      }`}
    >
      <div
        className={`border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white dark:border-gray-800 dark:from-gray-900 dark:to-gray-900/80 ${pad}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <InvoiceBrandLogo className="h-12 w-auto max-w-[160px] object-contain" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {companyName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Professional services invoice
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

      <div className={`space-y-6 ${compact ? "p-4" : "p-8"}`}>
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
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              {invoice.billingAddress}
            </p>
          </div>
          <div className="sm:text-right">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4 sm:flex-col sm:items-end">
                <dt className="text-gray-500">Issued</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {formatInvoiceDate(invoice.issuedAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 sm:flex-col sm:items-end">
                <dt className="text-gray-500">Due</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {formatInvoiceDate(invoice.dueAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 sm:flex-col sm:items-end">
                <dt className="text-gray-500">Type</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {INVOICE_TYPE_LABELS[invoice.type] ?? invoice.type}
                </dd>
              </div>
              {invoice.engagementRef ? (
                <div className="flex justify-between gap-4 sm:flex-col sm:items-end">
                  <dt className="text-gray-500">Engagement</dt>
                  <dd className="font-mono text-xs font-medium text-gray-900 dark:text-white">
                    {invoice.engagementRef}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>

        {invoice.catalogName ? (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800/60 dark:text-gray-400">
            <span className="font-medium text-gray-800 dark:text-gray-300">
              Service:{" "}
            </span>
            {invoice.catalogName}
          </p>
        ) : null}

        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-800/50">
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 text-right font-semibold">Qty</th>
                <th className="px-4 py-3 text-right font-semibold">Unit</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((line) => (
                <tr
                  key={line.id}
                  className="border-b border-gray-50 last:border-0 dark:border-gray-800/80"
                >
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                    {line.description}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{line.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {formatInvoiceAmount(invoice.currency, line.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                    {formatInvoiceAmount(
                      invoice.currency,
                      line.quantity * line.unitPrice
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
            {invoice.amountPaid > 0 ? (
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                <dt>Paid</dt>
                <dd>{formatInvoiceAmount(invoice.currency, invoice.amountPaid)}</dd>
              </div>
            ) : null}
            {balance > 0 && status !== "PAID" ? (
              <div className="flex justify-between font-semibold text-rose-700 dark:text-rose-400">
                <dt>Balance due</dt>
                <dd>{formatInvoiceAmount(invoice.currency, balance)}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        {invoice.notes ? (
          <div className="rounded-lg border border-dashed border-gray-200 px-4 py-3 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">
            <p className="font-semibold text-gray-800 dark:text-gray-300">Notes</p>
            <p className="mt-1">{invoice.notes}</p>
          </div>
        ) : null}

        <p className="text-center text-[10px] text-gray-400">
          Thank you for your business. Payment terms as stated above.
        </p>
      </div>
    </div>
  );
}
