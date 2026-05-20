import type {
  CustomerEngagementResponse,
  CustomerResponse,
  EngagementWorkItemResponse,
  WorkItemStatus,
} from "@/api/types/template-config";
import type {
  WorkItemFieldDefinition,
  WorkItemFieldValue,
  WorkItemFileAttachment,
} from "@/api/types/work-item-template";
import { downloadExcel } from "@/lib/export/excel";
import {
  fetchAttachmentBytes,
  imageBytesForPdfEmbed,
} from "@/lib/export/export-media-fetch";
import {
  addPdfTable,
  createExportCoverCardPdf,
  slugifyFilename,
} from "@/lib/export/pdf-document";
import { formatFieldValueForExport } from "@/lib/export/work-item-field-format";
import { formatEngagementPeriod } from "@/lib/template-recurrence";
import { getAttachments } from "@/lib/work-item-file-utils";
import { statusLabel } from "@/components/setup/TaskStatusPicker";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/** Full customer when on customer detail; otherwise minimal row from engagement. */
export function customerForTaskExport(
  engagement: CustomerEngagementResponse,
  customer?: CustomerResponse | null
): CustomerResponse {
  if (customer) return customer;
  return {
    id: engagement.customerId,
    companyId: engagement.companyId,
    officeId: engagement.officeId,
    officeName: engagement.officeName,
    name: engagement.customerName,
    legalName: null,
    registrationNumber: null,
    tin: null,
    contactEmail: null,
    contactPhone: null,
    address: null,
    city: null,
    country: null,
    notes: null,
    active: true,
  };
}

export type WorkItemTaskExportInput = {
  companyName: string;
  customer: CustomerResponse;
  engagement: CustomerEngagementResponse;
  task: EngagementWorkItemResponse;
  groupLabel?: string | null;
  fields: WorkItemFieldDefinition[];
  values: WorkItemFieldValue[];
  status: WorkItemStatus;
  closureRemark?: string | null;
  closureSubmittedAt?: string | null;
  outputFiles?: WorkItemFileAttachment[];
};

type LabeledAttachment = {
  section: string;
  file: WorkItemFileAttachment;
};

function exportBasename(input: WorkItemTaskExportInput): string {
  const company = slugifyFilename(input.companyName) || "company";
  const customer = slugifyFilename(input.customer.name) || "customer";
  const task = slugifyFilename(input.task.name) || "task";
  const date = new Date().toISOString().slice(0, 10);
  return `task-capture-${task}-${customer}-${company}-${date}`;
}

function customerRows(customer: CustomerResponse): string[][] {
  const rows: [string, string][] = [
    ["Customer name", customer.name],
    ["Legal name", customer.legalName ?? "—"],
    ["Registration no.", customer.registrationNumber ?? "—"],
    ["TIN / tax ID", customer.tin ?? "—"],
    ["Email", customer.contactEmail ?? "—"],
    ["Phone", customer.contactPhone ?? "—"],
    ["Address", customer.address ?? "—"],
    ["City", customer.city ?? "—"],
    ["Country", customer.country ?? "—"],
  ];
  if (customer.officeName) {
    rows.splice(1, 0, ["Office", customer.officeName]);
  }
  return rows.map(([a, b]) => [a, b]);
}

function engagementRows(
  engagement: CustomerEngagementResponse,
  task: EngagementWorkItemResponse,
  groupLabel: string | null | undefined,
  status: WorkItemStatus
): string[][] {
  const period = engagement.period
    ? formatEngagementPeriod(engagement.period)
    : "—";
  const rows: [string, string][] = [
    ["Engagement", engagement.title],
    ["Catalog", `${engagement.categoryName} · ${engagement.catalogName}`],
    ["Reference", engagement.referenceNumber ?? "—"],
    ["Period", period],
    ["Engagement status", engagement.status],
    ["Task", task.name],
    ["Task code", task.code ?? "—"],
    ["Task status", statusLabel(status)],
  ];
  if (groupLabel) {
    rows.splice(6, 0, ["Group", groupLabel]);
  }
  if (task.description) {
    rows.push(["Task description", task.description]);
  }
  return rows.map(([a, b]) => [a, b]);
}

function fieldResponseRows(
  fields: WorkItemFieldDefinition[],
  values: WorkItemFieldValue[]
): string[][] {
  const map = Object.fromEntries(values.map((v) => [v.fieldId, v]));
  return fields.map((f) => [f.label, formatFieldValueForExport(f, map[f.id])]);
}

function collectAttachments(input: WorkItemTaskExportInput): LabeledAttachment[] {
  const out: LabeledAttachment[] = [];
  const map = Object.fromEntries(input.values.map((v) => [v.fieldId, v]));

  for (const field of input.fields) {
    if (field.widget !== "FILE") continue;
    for (const file of getAttachments(map[field.id])) {
      if (file.url || file.dataUrl) {
        out.push({ section: field.label, file });
      }
    }
  }

  for (const file of input.outputFiles ?? []) {
    if (file.url || file.dataUrl) {
      out.push({ section: "Deliverable", file });
    }
  }

  return out;
}

function downloadPdfBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes.slice()], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

async function appendAttachmentPages(
  pdf: PDFDocument,
  items: LabeledAttachment[]
): Promise<void> {
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const A4: [number, number] = [595.28, 841.89];

  for (const item of items) {
    let bytes: ArrayBuffer;
    try {
      bytes = await fetchAttachmentBytes(item.file);
    } catch {
      const page = pdf.addPage(A4);
      const { height } = page.getSize();
      page.drawText(`${item.section} — ${item.file.name}`, {
        x: 40,
        y: height - 60,
        size: 12,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      page.drawText("File could not be loaded for this export.", {
        x: 40,
        y: height - 80,
        size: 10,
        font,
        color: rgb(0.45, 0.45, 0.45),
      });
      continue;
    }

    const isPdf =
      item.file.kind === "pdf" ||
      item.file.mimeType === "application/pdf";

    if (isPdf) {
      try {
        const src = await PDFDocument.load(bytes);
        const copied = await pdf.copyPages(src, src.getPageIndices());
        for (const page of copied) {
          pdf.addPage(page);
        }
        const last = pdf.getPage(pdf.getPageCount() - 1);
        const { width, height } = last.getSize();
        last.drawText(`${item.section}: ${item.file.name}`, {
          x: 24,
          y: height - 20,
          size: 9,
          font,
          color: rgb(0.35, 0.35, 0.35),
        });
      } catch {
        const page = pdf.addPage(A4);
        const { height } = page.getSize();
        page.drawText(`${item.section} — ${item.file.name}`, {
          x: 40,
          y: height - 60,
          size: 12,
          font: fontBold,
        });
        page.drawText("PDF could not be merged into this export.", {
          x: 40,
          y: height - 78,
          size: 10,
          font,
        });
      }
      continue;
    }

    const isImage =
      item.file.kind === "image" ||
      item.file.mimeType.startsWith("image/");

    if (isImage) {
      try {
        const { data, format } = await imageBytesForPdfEmbed(item.file, bytes);
        const page = pdf.addPage(A4);
        const { width, height } = page.getSize();
        const margin = 36;
        const headerH = 28;
        const imgBoxW = width - margin * 2;
        const imgBoxH = height - margin * 2 - headerH;

        page.drawText(`${item.section}`, {
          x: margin,
          y: height - margin - 4,
          size: 11,
          font: fontBold,
          color: rgb(0.15, 0.15, 0.15),
        });
        page.drawText(item.file.name, {
          x: margin,
          y: height - margin - 18,
          size: 9,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });

        const embedded =
          format === "png"
            ? await pdf.embedPng(data)
            : await pdf.embedJpg(data);
        const scale = Math.min(
          imgBoxW / embedded.width,
          imgBoxH / embedded.height,
          1
        );
        const w = embedded.width * scale;
        const h = embedded.height * scale;
        page.drawImage(embedded, {
          x: margin + (imgBoxW - w) / 2,
          y: margin + (imgBoxH - h) / 2,
          width: w,
          height: h,
        });
      } catch {
        const page = pdf.addPage(A4);
        const { height } = page.getSize();
        page.drawText(`${item.section} — ${item.file.name}`, {
          x: 40,
          y: height - 60,
          size: 12,
          font: fontBold,
        });
        page.drawText("Image could not be embedded.", {
          x: 40,
          y: height - 78,
          size: 10,
          font,
        });
      }
      continue;
    }

    const page = pdf.addPage(A4);
    const { height } = page.getSize();
    page.drawText(`${item.section} — ${item.file.name}`, {
      x: 40,
      y: height - 60,
      size: 12,
      font: fontBold,
    });
    page.drawText(
      `${item.file.mimeType || "File"} — open the original in the portal.`,
      {
        x: 40,
        y: height - 78,
        size: 10,
        font,
        color: rgb(0.45, 0.45, 0.45),
      }
    );
  }
}

export async function exportWorkItemTaskPdf(
  input: WorkItemTaskExportInput
): Promise<void> {
  const subtitle = [
    input.customer.name,
    input.engagement.title,
    input.task.name,
  ].join(" · ");

  const { doc, startY } = await createExportCoverCardPdf({
    companyName: input.companyName,
    subtitle,
  });

  let y = startY;
  y = addPdfTable(doc, y, {
    title: "Customer details",
    head: [["Field", "Value"]],
    body: customerRows(input.customer),
  });

  y = addPdfTable(doc, y, {
    title: "Engagement & task",
    head: [["Field", "Value"]],
    body: engagementRows(
      input.engagement,
      input.task,
      input.groupLabel,
      input.status
    ),
  });

  if (input.fields.length > 0) {
    y = addPdfTable(doc, y, {
      title: "Captured responses",
      head: [["Field", "Value"]],
      body: fieldResponseRows(input.fields, input.values),
    });
  }

  const closureRows: string[][] = [];
  if (input.closureSubmittedAt) {
    closureRows.push([
      "Submitted",
      new Date(input.closureSubmittedAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    ]);
  }
  closureRows.push([
    "Remark",
    (input.closureRemark ?? "").trim() || "—",
  ]);
  const deliverableNames = (input.outputFiles ?? [])
    .map((f) => f.name)
    .join(", ");
  if (deliverableNames) {
    closureRows.push(["Deliverables (listed)", deliverableNames]);
  }

  if (
    input.closureSubmittedAt ||
    (input.closureRemark ?? "").trim() ||
    deliverableNames
  ) {
    y = addPdfTable(doc, y, {
      title: "Closure",
      head: [["Field", "Value"]],
      body: closureRows,
    });
  }

  const attachments = collectAttachments(input);
  const summaryBytes = doc.output("arraybuffer") as ArrayBuffer;
  const merged = await PDFDocument.load(summaryBytes);

  if (attachments.length > 0) {
    const divider = merged.addPage([595.28, 841.89]);
    const fontBold = await merged.embedFont(StandardFonts.HelveticaBold);
    const { height } = divider.getSize();
    divider.drawText("File attachments", {
      x: 40,
      y: height / 2 + 10,
      size: 16,
      font: fontBold,
      color: rgb(0.12, 0.12, 0.12),
    });
    divider.drawText(
      "Each file follows on the next page(s). PDFs are included in full.",
      {
        x: 40,
        y: height / 2 - 10,
        size: 10,
        font: await merged.embedFont(StandardFonts.Helvetica),
        color: rgb(0.4, 0.4, 0.4),
      }
    );
    await appendAttachmentPages(merged, attachments);
  }

  const out = await merged.save();
  downloadPdfBytes(out, `${exportBasename(input)}.pdf`);
}

export function exportWorkItemTaskExcel(input: WorkItemTaskExportInput): void {
  const attachments = collectAttachments(input);
  const fileRows = attachments.map((a) => [
    a.section,
    a.file.name,
    a.file.mimeType,
    String(a.file.size),
    a.file.url ?? "",
  ]);

  downloadExcel(`${exportBasename(input)}.xlsx`, [
    {
      name: "Customer",
      headers: ["Field", "Value"],
      rows: customerRows(input.customer),
    },
    {
      name: "Engagement",
      headers: ["Field", "Value"],
      rows: engagementRows(
        input.engagement,
        input.task,
        input.groupLabel,
        input.status
      ),
    },
    {
      name: "Responses",
      headers: ["Field", "Value"],
      rows: fieldResponseRows(input.fields, input.values),
    },
    {
      name: "Closure",
      headers: ["Field", "Value"],
      rows: [
        [
          "Remark",
          (input.closureRemark ?? "").trim() || "—",
        ],
        [
          "Submitted",
          input.closureSubmittedAt
            ? new Date(input.closureSubmittedAt).toLocaleString()
            : "—",
        ],
      ],
    },
    {
      name: "Files",
      headers: ["Section", "File name", "Type", "Size", "URL"],
      rows:
        fileRows.length > 0
          ? fileRows
          : [["—", "No files", "", "", ""]],
    },
  ]);
}
