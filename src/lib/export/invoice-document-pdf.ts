import type { InvoiceRecord } from "@/lib/invoices/invoice-types";
import {
  computeDisplayStatus,
  formatInvoiceAmount,
  formatInvoiceDate,
  INVOICE_STATUS_LABELS,
  INVOICE_TYPE_LABELS,
  isVatIncluded,
} from "@/lib/invoices/invoice-utils";
import { loadInvoiceExportLogo } from "@/lib/export/logo";
import { slugifyFilename } from "@/lib/export/pdf-document";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type InvoicePdfResult = {
  blob: Blob;
  base64: string;
  filename: string;
};

function exportFilename(invoice: InvoiceRecord, companyName: string): string {
  const num = slugifyFilename(invoice.number) || "invoice";
  const customer = slugifyFilename(invoice.customerName) || "customer";
  const company = slugifyFilename(companyName) || "company";
  return `invoice-${num}-${customer}-${company}.pdf`;
}

export async function generateInvoicePdf(
  invoice: InvoiceRecord,
  companyName: string
): Promise<InvoicePdfResult> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  const logo = await loadInvoiceExportLogo();
  if (logo) {
    const logoW = 42;
    const logoH = 14;
    doc.addImage(
      logo.dataUrl,
      logo.format,
      margin,
      y,
      logoW,
      logoH,
      undefined,
      "FAST"
    );
    y += logoH + 4;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39);
  doc.text(companyName.trim() || "Company", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text("Professional services invoice", margin, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39);
  doc.text(invoice.number, pageWidth - margin, y, { align: "right" });
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const status = INVOICE_STATUS_LABELS[computeDisplayStatus(invoice)] ?? invoice.status;
  doc.text(`Status: ${status}`, pageWidth - margin, y, { align: "right" });
  y += 10;

  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text("Bill to", margin, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text(invoice.customerName, margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(55, 65, 81);
  doc.text(invoice.customerEmail, margin, y);
  y += 5;
  const addrLines = doc.splitTextToSize(
    invoice.billingAddress || "—",
    pageWidth / 2 - margin
  );
  doc.text(addrLines, margin, y);
  y += addrLines.length * 4 + 4;

  const metaX = pageWidth - margin;
  let metaY = y - addrLines.length * 4 - 14;
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Issued: ${formatInvoiceDate(invoice.issuedAt)}`, metaX, metaY, {
    align: "right",
  });
  metaY += 5;
  doc.text(`Due: ${formatInvoiceDate(invoice.dueAt)}`, metaX, metaY, {
    align: "right",
  });
  metaY += 5;
  doc.text(
    `Type: ${INVOICE_TYPE_LABELS[invoice.type] ?? invoice.type}`,
    metaX,
    metaY,
    { align: "right" }
  );
  if (invoice.engagementRef) {
    metaY += 5;
    doc.text(`Engagement: ${invoice.engagementRef}`, metaX, metaY, {
      align: "right",
    });
  }

  y = Math.max(y, metaY) + 6;

  if (invoice.catalogName) {
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text(`Service: ${invoice.catalogName}`, margin, y);
    y += 6;
  }

  autoTable(doc, {
    startY: y,
    head: [["Description", "Qty", "Unit", "Amount"]],
    body: invoice.lineItems.map((line) => [
      line.description,
      String(line.quantity),
      formatInvoiceAmount(invoice.currency, line.unitPrice),
      formatInvoiceAmount(
        invoice.currency,
        line.quantity * line.unitPrice
      ),
    ]),
    headStyles: {
      fillColor: [23, 23, 23],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: { fontSize: 9, cellPadding: 2.5 },
    margin: { left: margin, right: margin },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableEnd = (doc as any).lastAutoTable?.finalY as number | undefined;
  y = (tableEnd ?? y) + 8;

  const showVat = isVatIncluded(invoice);
  const balance = invoice.total - invoice.amountPaid;
  const totals: [string, string][] = [
    ["Subtotal", formatInvoiceAmount(invoice.currency, invoice.subtotal)],
  ];
  if (showVat) {
    totals.push([
      `VAT (${Math.round(invoice.taxRate * 100)}%)`,
      formatInvoiceAmount(invoice.currency, invoice.taxAmount),
    ]);
  }
  totals.push(["Total", formatInvoiceAmount(invoice.currency, invoice.total)]);
  if (invoice.amountPaid > 0) {
    totals.push([
      "Paid",
      formatInvoiceAmount(invoice.currency, invoice.amountPaid),
    ]);
  }
  if (balance > 0 && computeDisplayStatus(invoice) !== "PAID") {
    totals.push([
      "Balance due",
      formatInvoiceAmount(invoice.currency, balance),
    ]);
  }

  autoTable(doc, {
    startY: y,
    body: totals,
    theme: "plain",
    styles: { fontSize: 10, halign: "right" },
    columnStyles: {
      0: { halign: "right", cellWidth: 40 },
      1: { halign: "right", fontStyle: "bold" },
    },
    margin: { left: pageWidth - margin - 70, right: margin },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = ((doc as any).lastAutoTable?.finalY as number | undefined) ?? y;
  y += 8;

  if (invoice.notes?.trim()) {
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text("Notes", margin, y);
    y += 4;
    const noteLines = doc.splitTextToSize(invoice.notes.trim(), pageWidth - margin * 2);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4;
  }

  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text(
    "Thank you for your business. Payment terms as stated above.",
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 12,
    { align: "center" }
  );

  const arrayBuffer = doc.output("arraybuffer") as ArrayBuffer;
  const bytes = new Uint8Array(arrayBuffer);
  const filename = exportFilename(invoice, companyName);

  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }

  return {
    blob: new Blob([bytes.slice()], { type: "application/pdf" }),
    base64: btoa(binary),
    filename,
  };
}

export async function downloadInvoicePdf(
  invoice: InvoiceRecord,
  companyName: string
): Promise<void> {
  const { blob, filename } = await generateInvoicePdf(invoice, companyName);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
