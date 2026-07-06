import type {
  CustomerEngagementResponse,
  CustomerResponse,
} from "@/api/types/template-config";
import type {
  WorkItemFieldDefinition,
  WorkItemFieldGroup,
} from "@/api/types/work-item-template";
import {
  PDF_HEADER_RGB,
  PDF_MUTED_RGB,
  PDF_TABLE_HEAD_RGB,
  PDF_TEXT_RGB,
} from "@/lib/export/constants";
import {
  addPdfTable,
  createExportCoverCardPdf,
  slugifyFilename,
} from "@/lib/export/pdf-document";
import { formatEngagementPeriod } from "@/lib/template-recurrence";
import { buildFieldLayout } from "@/lib/work-item-field-layout";
import type { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type GroupPrintableTaskSection = {
  taskName: string;
  taskRoman: string;
  fields: WorkItemFieldDefinition[];
  groups?: WorkItemFieldGroup[];
};

export type GroupPrintableFormInput = {
  companyName: string;
  customer: CustomerResponse;
  engagement: CustomerEngagementResponse;
  groupTitle: string;
  tasks: GroupPrintableTaskSection[];
};

const PAGE_MARGIN = 14;

const tableTheme = {
  headStyles: {
    fillColor: PDF_TABLE_HEAD_RGB,
    textColor: [255, 255, 255] as [number, number, number],
    fontStyle: "bold" as const,
  },
  alternateRowStyles: {
    fillColor: [245, 245, 245] as [number, number, number],
  },
  styles: {
    fontSize: 9,
    cellPadding: 3,
    textColor: PDF_TEXT_RGB,
    lineColor: [229, 231, 235] as [number, number, number],
    lineWidth: 0.1,
    valign: "top" as const,
  },
  margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
};

/** Blank response cells — height comes from minCellHeight, not dash placeholders. */
function responsePlaceholder(field: WorkItemFieldDefinition): string {
  switch (field.widget) {
    case "CHECKBOX":
      return "☐ Yes    ☐ No";
    case "DATE":
      return "DD / MM / YYYY";
    case "SELECT":
    case "RADIO":
      if (field.options?.length) {
        return field.options.map((o) => `○ ${o.label}`).join("\n");
      }
      return "";
    case "FILE":
      return `Attachment required — provide “${field.label}” separately when returning this form.`;
    case "INTERNAL_FILE":
      return `Staff document — “${field.label}” is provided by your service team.`;
    case "TABLE":
      if (field.tableColumns?.length) {
        return field.tableColumns.map((c) => c.label).join("  ·  ");
      }
      return "";
    default:
      return "";
  }
}

function minCellHeightForField(field: WorkItemFieldDefinition): number {
  switch (field.widget) {
    case "TEXTAREA":
      return 40;
    case "TABLE":
      return 32;
    case "TEXT":
    case "NUMBER":
      return 22;
    case "SELECT":
    case "RADIO":
      return Math.max(18, (field.options?.length ?? 2) * 5);
    case "CHECKBOX":
      return 14;
    case "DATE":
      return 18;
    default:
      return 20;
  }
}

function fieldLabelCell(field: WorkItemFieldDefinition): string {
  const label = `${field.label}${field.required ? " *" : ""}`;
  const desc = field.description?.trim();
  return desc ? `${label}\n${desc}` : label;
}

function formContextRows(input: GroupPrintableFormInput): string[][] {
  const period = input.engagement.period
    ? formatEngagementPeriod(input.engagement.period)
    : "—";
  const rows: [string, string][] = [
    ["Customer", input.customer.name],
    ["Email", input.customer.contactEmail ?? "—"],
    ["Phone", input.customer.contactPhone ?? "—"],
    ["TIN / tax ID", input.customer.tin ?? "—"],
    ["Engagement", input.engagement.title],
    ["Reference", input.engagement.referenceNumber ?? "—"],
    ["Period", period],
    ["Form section", input.groupTitle],
  ];
  if (input.customer.officeName) {
    rows.splice(1, 0, ["Office", input.customer.officeName]);
  }
  return rows.map(([a, b]) => [a, b]);
}

function getLastAutoTableY(doc: jsPDF): number | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (doc as any).lastAutoTable?.finalY as number | undefined;
}

function drawDocumentTitle(doc: jsPDF, y: number, groupTitle: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...PDF_TEXT_RGB);
  doc.text("Customer information form", pageWidth / 2, y, { align: "center" });
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...PDF_MUTED_RGB);
  doc.text(groupTitle, pageWidth / 2, y, { align: "center" });
  return y + 10;
}

function drawInstructionsCallout(doc: jsPDF, y: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const boxW = pageWidth - PAGE_MARGIN * 2;
  const pad = 4;
  const steps = [
    "Complete every field in the “Your response” column. Required fields are marked with *.",
    "Write clearly or type where space allows.",
    "Provide attachments listed at the end of this form separately.",
    "Return the completed form to our office by the agreed deadline.",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const wrapped: string[] = [];
  for (const [index, step] of steps.entries()) {
    const lines = doc.splitTextToSize(`${index + 1}. ${step}`, boxW - pad * 2);
    wrapped.push(...lines);
  }

  const boxH = wrapped.length * 4 + pad * 2 + 8;

  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.roundedRect(PAGE_MARGIN, y, boxW, boxH, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_TEXT_RGB);
  doc.text("How to complete this form", PAGE_MARGIN + pad, y + pad + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_MUTED_RGB);
  doc.text(wrapped, PAGE_MARGIN + pad, y + pad + 10);

  return y + boxH + 8;
}

function drawTaskSectionHeader(
  doc: jsPDF,
  y: number,
  taskRoman: string,
  taskName: string
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const bandW = pageWidth - PAGE_MARGIN * 2;

  doc.setFillColor(...PDF_HEADER_RGB);
  doc.roundedRect(PAGE_MARGIN, y, bandW, 9, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`${taskRoman}. ${taskName}`, PAGE_MARGIN + 4, y + 6);

  return y + 13;
}

function drawGroupSectionHeader(doc: jsPDF, y: number, groupName: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const bandW = pageWidth - PAGE_MARGIN * 2;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.roundedRect(PAGE_MARGIN, y, bandW, 8, 2, 2, "FD");

  doc.setFillColor(249, 250, 251);
  doc.rect(PAGE_MARGIN, y, bandW, 8, "F");

  doc.setDrawColor(229, 231, 235);
  doc.line(PAGE_MARGIN, y + 8, PAGE_MARGIN + bandW, y + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_TEXT_RGB);
  doc.text(groupName, PAGE_MARGIN + 4, y + 5.5);

  return y + 10;
}

function renderFieldTable(
  doc: jsPDF,
  y: number,
  fields: WorkItemFieldDefinition[],
  options?: { inset?: boolean }
): number {
  if (fields.length === 0) return y;

  const inset = options?.inset ?? false;
  const leftMargin = inset ? PAGE_MARGIN + 3 : PAGE_MARGIN;
  const rightMargin = inset ? PAGE_MARGIN + 3 : PAGE_MARGIN;

  autoTable(doc, {
    startY: y,
    head: [["Field", "Your response"]],
    body: fields.map((field) => [
      fieldLabelCell(field),
      responsePlaceholder(field),
    ]),
    ...tableTheme,
    margin: { left: leftMargin, right: rightMargin },
    columnStyles: {
      0: { cellWidth: 62, fontStyle: "bold" },
      1: { cellWidth: "auto" },
    },
    bodyStyles: {
      minCellHeight: 14,
    },
    didParseCell: (data) => {
      if (data.section !== "body" || data.column.index !== 1) return;
      const field = fields[data.row.index];
      if (!field) return;
      data.cell.styles.minCellHeight = minCellHeightForField(field);
      data.cell.styles.fillColor = [252, 252, 252];
    },
  });

  const finalY = getLastAutoTableY(doc);
  return typeof finalY === "number" ? finalY + 6 : y + 6;
}

function drawAttachmentsSection(doc: jsPDF, y: number, fileFields: string[]): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y > pageHeight - 50) {
    doc.addPage();
    y = 20;
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const boxW = pageWidth - PAGE_MARGIN * 2;
  const pad = 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const lines: string[] = [];
  fileFields.forEach((line, index) => {
    lines.push(...doc.splitTextToSize(`${index + 1}. ${line}`, boxW - pad * 2));
  });

  const boxH = lines.length * 4 + pad * 2 + 10;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.roundedRect(PAGE_MARGIN, y, boxW, boxH, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_TEXT_RGB);
  doc.text("Required attachments (provide separately)", PAGE_MARGIN + pad, y + pad + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_MUTED_RGB);
  doc.text(lines, PAGE_MARGIN + pad, y + pad + 10);

  return y + boxH + 8;
}

function drawSignatureBlock(doc: jsPDF, y: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y > pageHeight - 36) {
    doc.addPage();
    y = 20;
  }

  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.2);
  doc.line(PAGE_MARGIN, y, doc.internal.pageSize.getWidth() - PAGE_MARGIN, y);
  y += 8;

  const pageWidth = doc.internal.pageSize.getWidth();
  const lineEnd = pageWidth - PAGE_MARGIN;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_TEXT_RGB);
  doc.text("Customer name (print)", PAGE_MARGIN, y);
  y += 5;
  doc.setDrawColor(209, 213, 219);
  doc.line(PAGE_MARGIN, y, lineEnd, y);
  y += 10;

  doc.text("Signature", PAGE_MARGIN, y);
  const dateX = pageWidth - PAGE_MARGIN - 42;
  doc.text("Date", dateX, y);
  y += 5;
  doc.line(PAGE_MARGIN, y, dateX - 8, y);
  doc.line(dateX, y, lineEnd, y);
  return y + 8;
}

function addPageNumbers(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_MUTED_RGB);
    doc.text(`Page ${page} of ${pageCount}`, pageWidth / 2, pageHeight - 8, {
      align: "center",
    });
  }
}

function collectFileFields(tasks: GroupPrintableTaskSection[]): string[] {
  const labels: string[] = [];
  for (const task of tasks) {
    for (const field of task.fields) {
      if (field.widget === "FILE") {
        labels.push(`${task.taskName}: ${field.label}`);
      }
    }
  }
  return labels;
}

function exportBasename(input: GroupPrintableFormInput): string {
  const company = slugifyFilename(input.companyName) || "company";
  const customer = slugifyFilename(input.customer.name) || "customer";
  const group = slugifyFilename(input.groupTitle) || "group";
  const date = new Date().toISOString().slice(0, 10);
  return `manual-form-${group}-${customer}-${company}-${date}`;
}

export async function generateGroupPrintableFormPdf(
  input: GroupPrintableFormInput
): Promise<{ blob: Blob; filename: string; base64: string }> {
  const subtitle = [
    input.customer.name,
    input.engagement.title,
    input.groupTitle,
  ].join(" · ");

  const { doc, startY } = await createExportCoverCardPdf({
    companyName: input.companyName,
    subtitle,
  });

  let y = drawDocumentTitle(doc, startY, input.groupTitle);
  y = addPdfTable(doc, y, {
    title: "Customer & engagement details",
    head: [["Detail", "Value"]],
    body: formContextRows(input),
  });
  y = drawInstructionsCallout(doc, y);

  for (const task of input.tasks) {
    if (task.fields.length === 0) continue;

    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 20;
    }

    y = drawTaskSectionHeader(doc, y, task.taskRoman, task.taskName);

    const sections = buildFieldLayout(task.fields, task.groups ?? []);
    for (const section of sections) {
      if (section.fields.length === 0) continue;

      if (section.kind === "group" && section.group?.name) {
        y = drawGroupSectionHeader(doc, y, section.group.name);
        y = renderFieldTable(doc, y, section.fields, { inset: true });
      } else {
        y = renderFieldTable(doc, y, section.fields);
      }
    }

    y += 4;
  }

  const fileFields = collectFileFields(input.tasks);
  if (fileFields.length > 0) {
    y = drawAttachmentsSection(doc, y, fileFields);
  }

  y = drawSignatureBlock(doc, y);
  addPageNumbers(doc);

  const arrayBuffer = doc.output("arraybuffer") as ArrayBuffer;
  const bytes = new Uint8Array(arrayBuffer);
  const filename = `${exportBasename(input)}.pdf`;
  const blob = new Blob([bytes.slice()], { type: "application/pdf" });

  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  const base64 = btoa(binary);

  return { blob, filename, base64 };
}

export function downloadPrintableFormBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printPrintableFormBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error("Pop-up blocked — allow pop-ups to print the form.");
  }
  win.onload = () => {
    win.focus();
    win.print();
  };
}
