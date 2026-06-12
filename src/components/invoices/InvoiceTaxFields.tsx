"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { computeInvoiceTotals } from "@/lib/invoices/invoice-utils";

type Props = {
  taxEnabled: boolean;
  taxIncluded: boolean;
  taxRate: string;
  onTaxEnabledChange: (enabled: boolean) => void;
  onTaxIncludedChange: (included: boolean) => void;
  onTaxRateChange: (rate: string) => void;
  lines: { quantity: number; unitPrice: number }[];
  currency?: string;
  disabled?: boolean;
};

export default function InvoiceTaxFields({
  taxEnabled,
  taxIncluded,
  taxRate,
  onTaxEnabledChange,
  onTaxIncludedChange,
  onTaxRateChange,
  lines,
  currency = "TZS",
  disabled,
}: Props) {
  const rateNum = taxEnabled ? Number(taxRate) || 0 : 0;
  const totals = computeInvoiceTotals(lines, rateNum, taxIncluded);

  return (
    <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-900/40">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
        <input
          type="checkbox"
          checked={taxEnabled}
          disabled={disabled}
          onChange={(e) => {
            onTaxEnabledChange(e.target.checked);
            if (!e.target.checked) onTaxRateChange("0");
          }}
          className="rounded border-gray-300"
        />
        Apply tax (VAT)
      </label>

      {taxEnabled ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Tax rate (%)</Label>
            <Input
              className="mt-1.5"
              type="number"
              min="0"
              step={0.01}
              value={taxRate}
              disabled={disabled}
              onChange={(e) => onTaxRateChange(e.target.value)}
            />
          </div>
          <div className="flex flex-col justify-end">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={taxIncluded}
                disabled={disabled}
                onChange={(e) => onTaxIncludedChange(e.target.checked)}
                className="rounded border-gray-300"
              />
              Prices include tax (inclusive)
            </label>
            <p className="mt-1 text-xs text-gray-500">
              {taxIncluded
                ? "Line amounts include VAT; tax is extracted from the total."
                : "Tax is added on top of line subtotal (exclusive)."}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-500">No tax applied — total equals line subtotal.</p>
      )}

      <p className="text-sm text-gray-700 dark:text-gray-300">
        Subtotal {totals.subtotal.toLocaleString()} {currency}
        {taxEnabled && totals.taxAmount > 0 ? (
          <>
            {" "}
            · Tax {totals.taxAmount.toLocaleString()} ·{" "}
          </>
        ) : null}
        <strong>
          Total {totals.totalAmount.toLocaleString()} {currency}
        </strong>
      </p>
    </div>
  );
}
