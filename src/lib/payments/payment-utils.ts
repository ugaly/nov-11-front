import type {
  PaymentListFilters,
  PaymentRecord,
  PaymentStatus,
} from "@/lib/payments/payment-types";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PAID: "Paid",
  PARTIAL: "Partial",
  SCHEDULED: "Scheduled",
  CANCELLED: "Cancelled",
};

export const PAYMENT_CATEGORY_LABELS: Record<
  import("@/lib/payments/payment-types").PaymentCategory,
  string
> = {
  SUPPLIER: "Supplier",
  TAX: "Tax / statutory",
  SALARY: "Salary & payroll",
  UTILITY: "Utility",
  LOAN: "Loan repayment",
  RECONCILIATION: "Reconciliation",
  OTHER: "Other",
};

export const PAYMENT_METHOD_LABELS: Record<
  import("@/lib/payments/payment-types").PaymentMethod,
  string
> = {
  BANK_TRANSFER: "Bank transfer",
  MOBILE_MONEY: "Mobile money",
  CASH: "Cash",
  CHEQUE: "Cheque",
  CARD: "Card",
  OTHER: "Other",
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
  return Math.max(0, record.amountDue - record.amountPaid);
}

export function derivePaymentStatus(
  amountDue: number,
  amountPaid: number,
  explicit?: PaymentStatus
): PaymentStatus {
  if (explicit === "CANCELLED" || explicit === "SCHEDULED") return explicit;
  if (amountPaid <= 0) return "UNPAID";
  if (amountPaid >= amountDue) return "PAID";
  return "PARTIAL";
}

export function filterPayments(
  items: PaymentRecord[],
  filters: PaymentListFilters
): PaymentRecord[] {
  const q = filters.search.trim().toLowerCase();
  return items.filter((p) => {
    if (filters.status && p.status !== filters.status) return false;
    if (filters.category && p.category !== filters.category) return false;
    if (!q) return true;
    return (
      p.referenceNumber.toLowerCase().includes(q) ||
      p.payeeName.toLowerCase().includes(q) ||
      p.purpose.toLowerCase().includes(q) ||
      (p.reconciliationNote ?? "").toLowerCase().includes(q) ||
      (p.linkedInvoiceNumber ?? "").toLowerCase().includes(q)
    );
  });
}

export function paymentListStats(items: PaymentRecord[]) {
  const unpaid = items.filter((p) => p.status === "UNPAID" || p.status === "PARTIAL");
  const outstanding = unpaid.reduce((s, p) => s + paymentBalance(p), 0);
  return {
    total: items.length,
    paid: items.filter((p) => p.status === "PAID").length,
    unpaid: items.filter((p) => p.status === "UNPAID").length,
    partial: items.filter((p) => p.status === "PARTIAL").length,
    outstandingAmount: outstanding,
  };
}
