import {
  EXPORT_SERVICES_DESCRIPTION,
  PDF_HEADER_RGB,
  PDF_MUTED_RGB,
  PDF_TABLE_HEAD_RGB,
  PDF_TEXT_RGB,
} from "@/lib/export/constants";
import { loadExportLogo, type LogoDataUrl } from "@/lib/export/logo";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type PdfReportMeta = {
  title: string;
  companyName: string;
  subtitle?: string;
  generatedAt?: Date;
};

let cachedLogo: LogoDataUrl | null | undefined;

async function getLogo(): Promise<LogoDataUrl | null> {
  if (cachedLogo !== undefined) return cachedLogo;
  cachedLogo = await loadExportLogo();
  return cachedLogo;
}

function formatGeneratedAt(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function centerText(
  doc: jsPDF,
  text: string,
  y: number,
  options?: { fontSize?: number; fontStyle?: "normal" | "bold"; color?: [number, number, number] }
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  if (options?.fontSize) doc.setFontSize(options.fontSize);
  doc.setFont("helvetica", options?.fontStyle ?? "normal");
  if (options?.color) doc.setTextColor(...options.color);
  doc.text(text, pageWidth / 2, y, { align: "center" });
}

export async function createBrandedPdf(
  meta: PdfReportMeta
): Promise<{ doc: jsPDF; startY: number }> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const headerHeight = 36;
  const [hr, hg, hb] = PDF_HEADER_RGB;

  doc.setFillColor(hr, hg, hb);
  doc.rect(0, 0, pageWidth, headerHeight, "F");

  const logo = await getLogo();
  if (logo) {
    const logoWidth = 44;
    const logoHeight = 14;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(
      logo.dataUrl,
      logo.format,
      logoX,
      10,
      logoWidth,
      logoHeight,
      undefined,
      "FAST"
    );
  }

  let y = headerHeight + 10;
  centerText(doc, meta.title, y, {
    fontSize: 16,
    fontStyle: "bold",
    color: PDF_TEXT_RGB,
  });
  y += 8;

  centerText(doc, EXPORT_SERVICES_DESCRIPTION, y, {
    fontSize: 11,
    color: PDF_MUTED_RGB,
  });
  y += 7;

  centerText(doc, meta.companyName, y, {
    fontSize: 12,
    fontStyle: "bold",
    color: PDF_TEXT_RGB,
  });
  y += 6;

  if (meta.subtitle) {
    centerText(doc, meta.subtitle, y, {
      fontSize: 10,
      color: PDF_MUTED_RGB,
    });
    y += 5;
  }

  const generatedAt = meta.generatedAt ?? new Date();
  centerText(doc, `Generated ${formatGeneratedAt(generatedAt)}`, y, {
    fontSize: 9,
    color: [156, 163, 175],
  });
  y += 10;

  return { doc, startY: y };
}

const tableTheme = {
  headStyles: {
    fillColor: PDF_TABLE_HEAD_RGB,
    textColor: [255, 255, 255] as [number, number, number],
    fontStyle: "bold" as const,
  },
  alternateRowStyles: { fillColor: [245, 245, 245] as [number, number, number] },
  styles: {
    fontSize: 9,
    cellPadding: 2.5,
    textColor: PDF_TEXT_RGB,
    lineColor: [229, 231, 235] as [number, number, number],
    lineWidth: 0.1,
  },
  margin: { left: 14, right: 14 },
};

export function addPdfTable(
  doc: jsPDF,
  startY: number,
  options: {
    head: string[][];
    body: string[][];
    title?: string;
  }
): number {
  let y = startY;
  if (options.title) {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...PDF_TEXT_RGB);
    doc.text(options.title, pageWidth / 2, y, { align: "center" });
    y += 5;
  }

  autoTable(doc, {
    startY: y,
    head: options.head,
    body: options.body,
    ...tableTheme,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastY = (doc as any).lastAutoTable?.finalY;
  return typeof lastY === "number" ? lastY + 10 : y + 20;
}

export function savePdf(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

export function slugifyFilename(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
