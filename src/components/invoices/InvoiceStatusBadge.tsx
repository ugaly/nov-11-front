"use client";

import type { InvoiceWorkflowStatus } from "@/api/types/invoice";
import { INVOICE_STATUS_LABELS } from "@/lib/invoices/invoice-utils";

const STYLES: Record<InvoiceWorkflowStatus, string> = {
  DRAFT:
    "bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700",
  SENT: "bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800",
  PARTIALLY_PAID:
    "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800",
  PAID: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800",
  VOID: "bg-gray-100 text-gray-500 ring-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:ring-gray-700",
};

export default function InvoiceStatusBadge({
  status,
  className = "",
}: {
  status: InvoiceWorkflowStatus;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STYLES[status]} ${className}`}
    >
      {INVOICE_STATUS_LABELS[status]}
    </span>
  );
}
