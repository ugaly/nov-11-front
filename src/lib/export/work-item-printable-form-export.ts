import type {
  CustomerEngagementResponse,
  CustomerResponse,
} from "@/api/types/template-config";
import type { WorkItemFieldDefinition } from "@/api/types/work-item-template";
import {
  createExportCoverCardPdf,
  slugifyFilename,
} from "@/lib/export/pdf-document";
import { PDF_MUTED_RGB, PDF_TEXT_RGB } from "@/lib/export/constants";
import autoTable from "jspdf-autotable";

export type GroupPrintableTaskSection = {
  taskName: string;
  taskRoman: string;
  fields: WorkItemFieldDefinition[];
};

export type GroupPrintableFormInput = {
  companyName: string;
  customer: CustomerResponse;
  engagement: CustomerEngagementResponse;
  groupTitle: string;
  tasks: GroupPrintableTaskSection[];
};

function responsePlaceholder(field: WorkItemFieldDefinition): string {
  switch (field.widget) {
    case "TEXTAREA":
      return "\n\n\n\n\n";
    case "CHECKBOX":
      return "☐ Yes    ☐ No";
    case "DATE":
      return "______________________________";
    case "SELECT":
    case "RADIO":
      if (field.options?.length) {
        return field.options.map((o) => `○ ${o.label}`).join("\n");
      }
      return "\n\n";
    case "FILE":
      return `Attachment required — please provide “${field.label}” separately when returning this form.\n\n`;
    case "TABLE":
      if (field.tableColumns?.length) {
        const header = field.tableColumns.map((c) => c.label).join(" | ");
        return `Complete table:\n${header}\n\n\n\n`;
      }
      return "Complete table below:\n\n\n\n";
    case "NUMBER":
      return "______________________________";
    default:
      return "\n\n\n";
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

  let y = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_MUTED_RGB);
  const intro =
    "Manual completion form — fill in the response column. Return the completed form to our office. Attachments noted below must be provided separately.";
  const introLines = doc.splitTextToSize(intro, pageWidth - margin * 2);
  doc.text(introLines, margin, y);
  y += introLines.length * 4 + 6;

  for (const task of input.tasks) {
    if (task.fields.length === 0) continue;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...PDF_TEXT_RGB);
    doc.text(`${task.taskRoman}. ${task.taskName}`, margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Field", "Your response"]],
      body: task.fields.map((field) => {
        const label = `${field.label}${field.required ? " *" : ""}`;
        const desc = field.description?.trim();
        const left = desc ? `${label}\n${desc}` : label;
        return [left, responsePlaceholder(field)];
      }),
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: PDF_TEXT_RGB,
        lineColor: [229, 231, 235],
        lineWidth: 0.1,
        valign: "top",
      },
      headStyles: {
        fillColor: [23, 23, 23],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 62, fontStyle: "bold" },
        1: { cellWidth: "auto", minCellHeight: 14 },
      },
      margin: { left: margin, right: margin },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastY = (doc as any).lastAutoTable?.finalY;
    y = typeof lastY === "number" ? lastY + 8 : y + 20;
  }

  const fileFields = collectFileFields(input.tasks);
  if (fileFields.length > 0) {
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PDF_TEXT_RGB);
    doc.text("Required attachments (provide separately)", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_MUTED_RGB);
    fileFields.forEach((line, i) => {
      doc.text(`${i + 1}. ${line}`, margin + 2, y);
      y += 5;
    });
  }

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
