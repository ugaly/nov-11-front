"use client";

import { DEFAULT_VAT_RATE } from "@/lib/invoices/invoice-utils";

export default function InvoiceVatToggle({
  checked,
  onChange,
  disabled,
  className = "",
}: {
  checked: boolean;
  onChange: (included: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40 ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 rounded border-gray-300 text-gray-900 focus:ring-brand-500 dark:border-gray-600"
      />
      <span className="text-sm">
        <span className="font-medium text-gray-900 dark:text-white">
          Include VAT ({Math.round(DEFAULT_VAT_RATE * 100)}%)
        </span>
        <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
          {checked
            ? "VAT is added on top of line items."
            : "Total equals subtotal only — VAT excluded."}
        </span>
      </span>
    </label>
  );
}
