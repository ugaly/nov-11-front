import type { CustomerEngagementBillingSummary } from "@/api/types/template-config";
import { formatMoneyTotals } from "@/lib/format-money";

export function formatEngagementBillingStatus(
  billing: CustomerEngagementBillingSummary | null | undefined
): string {
  if (!billing || billing.engagementsWithCharge === 0) {
    return "—";
  }

  const parts: string[] = [];
  if (billing.paidCount > 0) {
    parts.push(
      billing.paidCount === 1 && billing.partialCount === 0 && billing.unpaidCount === 0 && billing.noInvoiceCount === 0
        ? "Paid"
        : `${billing.paidCount} paid`
    );
  }
  if (billing.partialCount > 0) {
    const paid = formatMoneyTotals(billing.paidTotals);
    parts.push(
      billing.partialCount === 1
        ? `Partially paid${paid !== "—" ? ` (${paid} paid)` : ""}`
        : `${billing.partialCount} partial${paid !== "—" ? ` · ${paid} paid` : ""}`
    );
  }
  if (billing.unpaidCount > 0) {
    parts.push(billing.unpaidCount === 1 ? "Unpaid" : `${billing.unpaidCount} unpaid`);
  }
  if (billing.noInvoiceCount > 0) {
    parts.push(
      billing.noInvoiceCount === 1 ? "No invoice" : `${billing.noInvoiceCount} no invoice`
    );
  }

  return parts.length > 0 ? parts.join(" · ") : "—";
}

export function engagementBillingStatusClass(
  billing: CustomerEngagementBillingSummary | null | undefined
): string {
  if (!billing || billing.engagementsWithCharge === 0) {
    return "text-gray-500 dark:text-gray-400";
  }
  if (
    billing.paidCount > 0 &&
    billing.partialCount === 0 &&
    billing.unpaidCount === 0 &&
    billing.noInvoiceCount === 0
  ) {
    return "text-emerald-700 dark:text-emerald-400";
  }
  if (billing.partialCount > 0) {
    return "text-amber-700 dark:text-amber-400";
  }
  if (billing.unpaidCount > 0) {
    return "text-rose-700 dark:text-rose-400";
  }
  return "text-gray-500 dark:text-gray-400";
}
