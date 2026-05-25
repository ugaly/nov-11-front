import type {
  InvoiceLineItem,
  InvoiceListFilters,
  InvoiceRecord,
  InvoiceStatus,
} from "@/lib/invoices/invoice-types";

export const DEFAULT_VAT_RATE = 0.18;

/** Legacy invoices without vatIncluded show VAT when tax was already applied. */
export function isVatIncluded(inv: InvoiceRecord): boolean {
  if (inv.vatIncluded !== undefined) return inv.vatIncluded;
  return inv.taxAmount > 0;
}

export function recalculateInvoice<T extends InvoiceRecord>(inv: T): T {
  const subtotal = inv.lineItems.reduce(
    (s, l) => s + l.quantity * (Number(l.unitPrice) || 0),
    0
  );
  const included = isVatIncluded(inv);
  const rate =
    inv.taxRate > 0 ? inv.taxRate : DEFAULT_VAT_RATE;
  const taxAmount = included ? Math.round(subtotal * rate) : 0;
  return {
    ...inv,
    subtotal,
    vatIncluded: included,
    taxRate: rate,
    taxAmount,
    total: subtotal + taxAmount,
  };
}

export function newInvoiceLineItem(id?: string): InvoiceLineItem {
  return {
    id: id ?? `line-${Date.now()}`,
    description: "",
    quantity: 1,
    unitPrice: 0,
  };
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  PAID: "Paid",
  UNPAID: "Unpaid",
  DUE_7_DAYS: "Due in 7 days",
  DUE_30_DAYS: "Due in 30 days",
  OVERDUE: "Overdue",
  DRAFT: "Draft",
  CANCELLED: "Cancelled",
};

export const INVOICE_TYPE_LABELS: Record<string, string> = {
  SUBSCRIPTION: "Subscription",
  RENEWAL: "Renewal",
  UPGRADE: "Upgrade",
  ONE_TIME: "One-time",
  MANUAL: "Manual",
};

export function formatInvoiceAmount(currency: string, amount: number): string {
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatInvoiceDate(iso: string): string {
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

export function daysUntilDue(dueAt: string): number {
  const due = new Date(dueAt);
  const now = new Date();
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function computeDisplayStatus(inv: InvoiceRecord): InvoiceStatus {
  if (inv.status === "PAID" || inv.status === "CANCELLED" || inv.status === "DRAFT") {
    return inv.status;
  }
  const days = daysUntilDue(inv.dueAt);
  if (days < 0) return "OVERDUE";
  if (days <= 7) return "DUE_7_DAYS";
  if (days <= 30) return "DUE_30_DAYS";
  return inv.status === "OVERDUE" ? "OVERDUE" : "UNPAID";
}

export function filterInvoices(
  items: InvoiceRecord[],
  filters: InvoiceListFilters
): InvoiceRecord[] {
  let list = items.map((inv) => ({
    ...inv,
    status: computeDisplayStatus(inv),
  }));

  const q = filters.search.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (inv) =>
        inv.number.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.customerEmail.toLowerCase().includes(q) ||
        (inv.catalogName?.toLowerCase().includes(q) ?? false)
    );
  }

  if (filters.status) {
    list = list.filter((inv) => inv.status === filters.status);
  }

  if (filters.type) {
    list = list.filter((inv) => inv.type === filters.type);
  }

  switch (filters.sort) {
    case "oldest":
      list.sort((a, b) => a.issuedAt.localeCompare(b.issuedAt));
      break;
    case "amount-desc":
      list.sort((a, b) => b.total - a.total);
      break;
    case "amount-asc":
      list.sort((a, b) => a.total - b.total);
      break;
    case "due-soon":
      list.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
      break;
    case "newest":
    default:
      list.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  }

  return list;
}

export function dashboardInvoiceCounts(items: InvoiceRecord[]) {
  const withStatus = items.map((inv) => ({
    ...inv,
    status: computeDisplayStatus(inv),
  }));

  return {
    paidInvoices: withStatus.filter((i) => i.status === "PAID").length,
    unpaidInvoices: withStatus.filter(
      (i) =>
        i.status !== "PAID" &&
        i.status !== "CANCELLED" &&
        i.status !== "DRAFT"
    ).length,
    invoicesDueSoon: withStatus.filter((i) => i.status === "DUE_7_DAYS")
      .length,
  };
}

export function invoiceListStats(items: InvoiceRecord[]) {
  const withStatus = items.map((inv) => ({
    ...inv,
    status: computeDisplayStatus(inv),
  }));

  const outstanding = withStatus.filter(
    (i) =>
      i.status !== "PAID" &&
      i.status !== "CANCELLED" &&
      i.status !== "DRAFT"
  );

  return {
    totalCount: items.length,
    outstandingAmount: outstanding.reduce((s, i) => s + (i.total - i.amountPaid), 0),
    paidCount: withStatus.filter((i) => i.status === "PAID").length,
    due7Count: withStatus.filter((i) => i.status === "DUE_7_DAYS").length,
    due30Count: withStatus.filter(
      (i) => i.status === "DUE_30_DAYS" || i.status === "UNPAID"
    ).length,
    overdueCount: withStatus.filter((i) => i.status === "OVERDUE").length,
  };
}
