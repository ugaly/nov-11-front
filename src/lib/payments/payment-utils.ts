import type { PaymentWorkflowStatus } from "@/api/types/payment";
import type { PaymentListFilters, PaymentRecord } from "@/lib/payments/payment-types";

export const PAYMENT_STATUS_LABELS: Record<PaymentWorkflowStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED_FOR_APPROVAL: "Pending approval",
  APPROVED: "Approved",
  PARTIALLY_PAID: "Partially paid",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export function formatPaymentAmount(currency: string, amount: number): string {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: currency === "TZS" ? "TZS" : currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPaymentDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function paymentBalance(record: PaymentRecord): number {
  if (record.amountRemaining != null) {
    return Math.max(0, Number(record.amountRemaining));
  }
  return Math.max(0, Number(record.amountDue) - Number(record.amountPaid));
}

export function filterPayments(
  items: PaymentRecord[],
  filters: PaymentListFilters
): PaymentRecord[] {
  const q = filters.search.trim().toLowerCase();
  return items.filter((p) => {
    if (filters.status && p.status !== filters.status) return false;
    if (filters.categoryId && p.categoryId !== filters.categoryId) return false;
    if (!q) return true;
    return (
      p.referenceNumber.toLowerCase().includes(q) ||
      p.payeeName.toLowerCase().includes(q) ||
      p.purpose.toLowerCase().includes(q) ||
      p.categoryName.toLowerCase().includes(q) ||
      (p.reconciliationNote ?? "").toLowerCase().includes(q) ||
      (p.linkedInvoiceNumber ?? "").toLowerCase().includes(q)
    );
  });
}

export function paymentListStats(items: PaymentRecord[]) {
  const open = items.filter(
    (p) =>
      p.status === "DRAFT" ||
      p.status === "SUBMITTED_FOR_APPROVAL" ||
      p.status === "APPROVED" ||
      p.status === "PARTIALLY_PAID"
  );
  const outstanding = open.reduce((s, p) => s + paymentBalance(p), 0);
  return {
    total: items.length,
    paid: items.filter((p) => p.status === "PAID").length,
    pendingApproval: items.filter((p) => p.status === "SUBMITTED_FOR_APPROVAL")
      .length,
    approved: items.filter((p) => p.status === "APPROVED").length,
    partiallyPaid: items.filter((p) => p.status === "PARTIALLY_PAID").length,
    draft: items.filter((p) => p.status === "DRAFT").length,
    outstandingAmount: outstanding,
  };
}
