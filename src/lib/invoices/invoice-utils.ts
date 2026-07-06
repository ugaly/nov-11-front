import type { InvoiceWorkflowStatus, OfficeInvoiceResponse } from "@/api/types/invoice";
import type { InvoiceListFilters } from "@/lib/invoices/invoice-types";

export const INVOICE_STATUS_LABELS: Record<InvoiceWorkflowStatus, string> = {
  DRAFT: "Draft",
  SENT: "Issued",
  PARTIALLY_PAID: "Partially paid",
  PAID: "Paid",
  VOID: "Void",
};

export function formatInvoiceAmount(currency: string, amount: number): string {
  return `${Math.round(amount).toLocaleString()} ${currency}`;
}

export function formatInvoiceDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso.includes("T") ? iso : `${iso}T12:00:00`).toLocaleDateString(
      undefined,
      { dateStyle: "medium" }
    );
  } catch {
    return iso;
  }
}

export function filterInvoices(
  items: OfficeInvoiceResponse[],
  filters: InvoiceListFilters
): OfficeInvoiceResponse[] {
  const q = filters.search.trim().toLowerCase();
  return items.filter((inv) => {
    if (filters.status && inv.status !== filters.status) return false;
    if (!q) return true;
    return (
      inv.referenceNumber.toLowerCase().includes(q) ||
      inv.billToName.toLowerCase().includes(q) ||
      inv.billToEmail.toLowerCase().includes(q) ||
      (inv.customerName ?? "").toLowerCase().includes(q)
    );
  });
}

export function invoiceListStats(items: OfficeInvoiceResponse[]) {
  return {
    total: items.length,
    draft: items.filter((i) => i.status === "DRAFT").length,
    sent: items.filter((i) => i.status === "SENT").length,
    paid: items.filter((i) => i.status === "PAID").length,
    partial: items.filter((i) => i.status === "PARTIALLY_PAID").length,
  };
}

export function computeLineAmount(qty: number, unit: number): number {
  return Math.round(qty * unit * 100) / 100;
}

export function computeInvoiceTotals(
  lines: { quantity: number; unitPrice: number }[],
  taxRatePercent: number,
  taxIncluded = false
) {
  const lineSum =
    Math.round(
      lines.reduce((sum, l) => sum + computeLineAmount(l.quantity, l.unitPrice), 0) * 100
    ) / 100;

  if (!taxRatePercent || taxRatePercent <= 0) {
    return { subtotal: lineSum, taxAmount: 0, totalAmount: lineSum };
  }

  if (taxIncluded) {
    const divisor = 1 + taxRatePercent / 100;
    const subtotal = Math.round((lineSum / divisor) * 100) / 100;
    const taxAmount = Math.round((lineSum - subtotal) * 100) / 100;
    return { subtotal, taxAmount, totalAmount: lineSum };
  }

  const subtotal = lineSum;
  const taxAmount = Math.round(subtotal * (taxRatePercent / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
  return { subtotal, taxAmount, totalAmount };
}

export function invoiceBalance(inv: {
  totalAmount: number;
  amountPaid?: number;
  amountRemaining?: number;
}): number {
  if (inv.amountRemaining != null) return Math.max(0, Number(inv.amountRemaining));
  return Math.max(0, Number(inv.totalAmount) - Number(inv.amountPaid ?? 0));
}

export function dashboardInvoiceCounts(items: OfficeInvoiceResponse[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const soon = new Date(today);
  soon.setDate(soon.getDate() + 7);

  let unpaidInvoices = 0;
  let paidInvoices = 0;
  let invoicesDueSoon = 0;

  for (const inv of items) {
    if (inv.status === "PAID") {
      paidInvoices++;
      continue;
    }
    if (inv.status === "SENT" || inv.status === "PARTIALLY_PAID") {
      unpaidInvoices++;
      const due = new Date(
        inv.dueDate.includes("T") ? inv.dueDate : `${inv.dueDate}T12:00:00`
      );
      due.setHours(0, 0, 0, 0);
      if (due >= today && due <= soon) invoicesDueSoon++;
    }
  }

  return { unpaidInvoices, paidInvoices, invoicesDueSoon };
}
