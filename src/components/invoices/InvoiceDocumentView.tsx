"use client";

import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import type { InvoiceWorkflowStatus } from "@/api/types/invoice";
import { INVOICE_LOGO_SRC } from "@/lib/brand-logo";
import {
  computeLineAmount,
  formatInvoiceAmount,
  formatInvoiceDate,
} from "@/lib/invoices/invoice-utils";
import Image from "next/image";

export type InvoiceDocumentLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineAmount?: number;
};

export type InvoiceDocumentData = {
  referenceNumber?: string;
  status?: InvoiceWorkflowStatus;
  billToName: string;
  billToEmail: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  lineItems: InvoiceDocumentLine[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  taxIncluded?: boolean;
  amountPaid?: number;
  amountRemaining?: number;
  notes?: string;
  terms?: string;
  companyName?: string | null;
};

type Props = {
  data: InvoiceDocumentData;
  variant?: "preview" | "detail";
  className?: string;
};

export default function InvoiceDocumentView({
  data,
  variant = "preview",
  className = "",
}: Props) {
  const isDraft = !data.referenceNumber || data.referenceNumber.startsWith("DRAFT");
  const refLabel = isDraft ? "DRAFT" : data.referenceNumber;
  const lines = data.lineItems.filter((l) => l.description.trim());
  const showPlaceholderLines = lines.length === 0;

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-gray-700 dark:bg-gray-950 ${className}`}
    >
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-6 py-5 text-white sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <Image
                src={INVOICE_LOGO_SRC}
                alt=""
                width={36}
                height={36}
                className="h-8 w-auto object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-white/90">
                {data.companyName ?? "Your company"}
              </p>
              <p className="text-xs text-white/60">Tax invoice</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
              Invoice
            </p>
            <p className="font-mono text-lg font-bold tracking-tight">{refLabel}</p>
            {data.status ? (
              <div className="mt-2 flex justify-end">
                <InvoiceStatusBadge status={data.status} />
              </div>
            ) : isDraft ? (
              <span className="mt-2 inline-flex rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white/90">
                Preview
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 border-b border-gray-100 px-6 py-6 sm:grid-cols-2 sm:px-8 dark:border-gray-800">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Bill to
          </p>
          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
            {data.billToName.trim() || "—"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {data.billToEmail.trim() || "recipient@example.com"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:text-right">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Issue date
            </p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">
              {formatInvoiceDate(data.issueDate)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Due date
            </p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">
              {formatInvoiceDate(data.dueDate)}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6">
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
          <table className="w-full min-w-[28rem] text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-900/60">
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Unit</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {showPlaceholderLines ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm italic text-gray-400"
                  >
                    Line items appear here as you type…
                  </td>
                </tr>
              ) : (
                lines.map((line, i) => {
                  const amount =
                    line.lineAmount ??
                    computeLineAmount(line.quantity, line.unitPrice);
                  return (
                    <tr key={`${line.description}-${i}`}>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {line.description}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                        {line.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                        {Number(line.unitPrice).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                        {amount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <dl className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between gap-4 text-gray-600 dark:text-gray-400">
            <dt>Subtotal</dt>
            <dd className="font-medium text-gray-900 dark:text-white">
              {formatInvoiceAmount(data.currency, data.subtotal)}
            </dd>
          </div>
          {data.taxRate > 0 ? (
            <div className="flex justify-between gap-4 text-gray-600 dark:text-gray-400">
              <dt>
                Tax ({data.taxRate}%){data.taxIncluded ? " incl." : ""}
              </dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatInvoiceAmount(data.currency, data.taxAmount)}
              </dd>
            </div>
          ) : null}
          {data.amountPaid != null && data.amountPaid > 0 ? (
            <>
              <div className="flex justify-between gap-4 text-gray-600 dark:text-gray-400">
                <dt>Paid</dt>
                <dd>{formatInvoiceAmount(data.currency, data.amountPaid)}</dd>
              </div>
              {data.amountRemaining != null && data.amountRemaining > 0 ? (
                <div className="flex justify-between gap-4 border-t border-gray-200 pt-2 dark:border-gray-700">
                  <dt className="font-semibold text-gray-900 dark:text-white">
                    Balance due
                  </dt>
                  <dd className="font-bold text-gray-900 dark:text-white">
                    {formatInvoiceAmount(data.currency, data.amountRemaining)}
                  </dd>
                </div>
              ) : null}
            </>
          ) : null}
          <div className="flex justify-between gap-4 border-t border-gray-200 pt-3 dark:border-gray-700">
            <dt className="text-base font-semibold text-gray-900 dark:text-white">
              Total due
            </dt>
            <dd className="text-lg font-bold text-gray-900 dark:text-white">
              {formatInvoiceAmount(data.currency, data.totalAmount)}
            </dd>
          </div>
        </dl>
      </div>

      {(data.notes?.trim() || data.terms?.trim()) && (
        <div className="border-t border-gray-100 bg-gray-50/80 px-6 py-5 text-sm dark:border-gray-800 dark:bg-gray-900/40 sm:px-8">
          {data.notes?.trim() ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Notes
              </p>
              <p className="mt-1 whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                {data.notes}
              </p>
            </div>
          ) : null}
          {data.terms?.trim() ? (
            <div className={data.notes?.trim() ? "mt-4" : ""}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Terms
              </p>
              <p className="mt-1 whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                {data.terms}
              </p>
            </div>
          ) : null}
        </div>
      )}

      {variant === "preview" ? (
        <p className="border-t border-gray-100 px-6 py-3 text-center text-[10px] text-gray-400 dark:border-gray-800">
          Live preview — updates as you edit
        </p>
      ) : null}
    </article>
  );
}
