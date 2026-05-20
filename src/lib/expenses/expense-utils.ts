import type {
  ExpenseListFilters,
  ExpenseRecord,
  ExpenseStatus,
} from "@/lib/expenses/expense-types";

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  PAID: "Paid",
  REJECTED: "Rejected",
};

export const EXPENSE_CATEGORY_LABELS: Record<
  import("@/lib/expenses/expense-types").ExpenseCategory,
  string
> = {
  TRAVEL: "Travel",
  OFFICE: "Office",
  SOFTWARE: "Software",
  MARKETING: "Marketing",
  PAYROLL: "Payroll",
  UTILITIES: "Utilities",
  OTHER: "Other",
};

export function formatExpenseAmount(currency: string, amount: number): string {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: currency === "TZS" ? "TZS" : currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatExpenseDate(iso: string): string {
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

export function filterExpenses(
  items: ExpenseRecord[],
  filters: ExpenseListFilters
): ExpenseRecord[] {
  const q = filters.search.trim().toLowerCase();
  return items.filter((e) => {
    if (filters.status && e.status !== filters.status) return false;
    if (filters.category && e.category !== filters.category) return false;
    if (!q) return true;
    return (
      e.referenceNumber.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q) ||
      e.vendor.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
    );
  });
}

export function expenseListStats(items: ExpenseRecord[]) {
  return {
    total: items.length,
    paid: items.filter((e) => e.status === "PAID").length,
    pending: items.filter(
      (e) => e.status === "SUBMITTED" || e.status === "APPROVED"
    ).length,
    draft: items.filter((e) => e.status === "DRAFT").length,
    totalAmount: items
      .filter((e) => e.status === "PAID")
      .reduce((s, e) => s + e.amount, 0),
  };
}
