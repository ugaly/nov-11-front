import type { InvoiceRecord } from "@/lib/invoices/invoice-types";
import {
  formatInvoiceAmount,
  formatInvoiceDate,
  INVOICE_STATUS_LABELS,
  INVOICE_TYPE_LABELS,
} from "@/lib/invoices/invoice-utils";
import { downloadExcel } from "@/lib/export/excel";
import {
  addPdfTable,
  createBrandedPdf,
  savePdf,
  slugifyFilename,
} from "@/lib/export/pdf-document";

function row(inv: InvoiceRecord): string[] {
  return [
    inv.number,
    inv.customerName,
    INVOICE_TYPE_LABELS[inv.type] ?? inv.type,
    INVOICE_STATUS_LABELS[inv.status] ?? inv.status,
    formatInvoiceAmount(inv.currency, inv.total),
    formatInvoiceDate(inv.issuedAt),
    formatInvoiceDate(inv.dueAt),
  ];
}

function exportBasename(companyName: string) {
  const slug = slugifyFilename(companyName) || "company";
  const date = new Date().toISOString().slice(0, 10);
  return `invoices-${slug}-${date}`;
}

export async function exportInvoicesPdf(
  companyName: string,
  invoices: InvoiceRecord[]
): Promise<void> {
  const { doc, startY } = await createBrandedPdf({
    title: "Invoices",
    companyName,
    subtitle: `${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`,
  });

  addPdfTable(doc, startY, {
    title: "Invoice list",
    head: [["Number", "Customer", "Type", "Status", "Total", "Issued", "Due"]],
    body: invoices.map(row),
  });

  savePdf(doc, `${exportBasename(companyName)}.pdf`);
}

export function exportInvoicesExcel(
  companyName: string,
  invoices: InvoiceRecord[]
): void {
  downloadExcel(`${exportBasename(companyName)}.xlsx`, [
    {
      name: "Invoices",
      headers: ["Number", "Customer", "Type", "Status", "Total", "Issued", "Due"],
      rows: invoices.map(row),
    },
  ]);
}
