import type { ServiceCatalogResponse } from "@/api/types/template-config";
import { downloadExcel } from "@/lib/export/excel";
import {
  addPdfTable,
  createBrandedPdf,
  savePdf,
  slugifyFilename,
} from "@/lib/export/pdf-document";
import { formatCatalogRecurrence } from "@/lib/template-recurrence";
import { formatPricing } from "@/lib/template-pricing";

function buildCatalogRows(catalogs: ServiceCatalogResponse[]): string[][] {
  return catalogs.map((c) => [
    c.categoryName,
    c.name,
    formatCatalogRecurrence(c),
    formatPricing(c.pricing),
  ]);
}

const HEADERS = ["Category", "Catalog", "Recurrence", "Pricing"];

function exportBasename(companyName: string, prefix: string) {
  const slug = slugifyFilename(companyName) || "company";
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${slug}-${date}`;
}

export async function exportServiceCatalogsPdf(
  companyName: string,
  catalogs: ServiceCatalogResponse[],
  options?: { title?: string; subtitle?: string; filePrefix?: string }
): Promise<void> {
  const title = options?.title ?? "Service catalogs";
  const { doc, startY } = await createBrandedPdf({
    title,
    companyName,
    subtitle:
      options?.subtitle ??
      `${catalogs.length} catalog${catalogs.length === 1 ? "" : "s"}`,
  });

  addPdfTable(doc, startY, {
    head: [HEADERS],
    body: buildCatalogRows(catalogs),
  });

  const prefix = options?.filePrefix ?? "service-catalogs";
  savePdf(doc, `${exportBasename(companyName, prefix)}.pdf`);
}

export function exportServiceCatalogsExcel(
  companyName: string,
  catalogs: ServiceCatalogResponse[],
  options?: { filePrefix?: string; sheetName?: string }
): void {
  const prefix = options?.filePrefix ?? "service-catalogs";
  downloadExcel(`${exportBasename(companyName, prefix)}.xlsx`, [
    {
      name: options?.sheetName ?? "Catalogs",
      headers: HEADERS,
      rows: buildCatalogRows(catalogs),
    },
  ]);
}
