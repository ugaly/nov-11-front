import type { ExpenseWorkflowStatus } from "@/api/types/expense";
import type { ExpenseListFilters, ExpenseRecord } from "@/lib/expenses/expense-types";

export const EXPENSE_STATUS_LABELS: Record<ExpenseWorkflowStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Pending approval",
  APPROVED: "Approved",
  PAID: "Paid",
  REJECTED: "Rejected",
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
    if (filters.expenseTypeId && e.expenseTypeId !== filters.expenseTypeId) {
      return false;
    }
    if (!q) return true;
    return (
      e.referenceNumber.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q) ||
      (e.vendor ?? "").toLowerCase().includes(q) ||
      e.expenseTypeName.toLowerCase().includes(q) ||
      (e.description ?? "").toLowerCase().includes(q) ||
      (e.notes ?? "").toLowerCase().includes(q) ||
      (e.linkedPaymentReference ?? "").toLowerCase().includes(q)
    );
  });
}

export function expenseListStats(items: ExpenseRecord[]) {
  const open = items.filter(
    (e) =>
      e.status === "DRAFT" ||
      e.status === "SUBMITTED" ||
      e.status === "APPROVED"
  );
  const outstanding = open.reduce((s, e) => s + Number(e.amount), 0);
  return {
    total: items.length,
    paid: items.filter((e) => e.status === "PAID").length,
    pendingApproval: items.filter((e) => e.status === "SUBMITTED").length,
    approved: items.filter((e) => e.status === "APPROVED").length,
    draft: items.filter((e) => e.status === "DRAFT").length,
    rejected: items.filter((e) => e.status === "REJECTED").length,
    outstandingAmount: outstanding,
  };
}
