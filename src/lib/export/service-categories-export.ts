import type { ServiceCategoryResponse } from "@/api/types/template-config";
import { downloadExcel } from "@/lib/export/excel";
import {
  addPdfTable,
  createBrandedPdf,
  savePdf,
  slugifyFilename,
} from "@/lib/export/pdf-document";
import { formatCatalogRecurrence } from "@/lib/template-recurrence";
import { formatPricing } from "@/lib/template-pricing";

function buildCategorySummaryRows(categories: ServiceCategoryResponse[]) {
  return categories.map((c) => [
    c.name,
    formatPricing(c.pricing),
    String(c.catalogs?.length ?? 0),
  ]);
}

function buildCatalogDetailRows(categories: ServiceCategoryResponse[]) {
  const rows: string[][] = [];
  for (const category of categories) {
    for (const catalog of category.catalogs ?? []) {
      rows.push([
        category.name,
        catalog.name,
        formatCatalogRecurrence(catalog),
        formatPricing(catalog.pricing),
      ]);
    }
  }
  return rows;
}

function exportBasename(companyName: string) {
  const slug = slugifyFilename(companyName) || "company";
  const date = new Date().toISOString().slice(0, 10);
  return `service-categories-${slug}-${date}`;
}

export async function exportServiceCategoriesPdf(
  companyName: string,
  categories: ServiceCategoryResponse[]
): Promise<void> {
  const { doc, startY } = await createBrandedPdf({
    title: "Service categories",
    companyName,
    subtitle: `${categories.length} categor${categories.length === 1 ? "y" : "ies"}`,
  });

  let y = addPdfTable(doc, startY, {
    title: "Categories",
    head: [["Category", "Pricing", "Catalogs"]],
    body: buildCategorySummaryRows(categories),
  });

  const catalogRows = buildCatalogDetailRows(categories);
  if (catalogRows.length > 0) {
    addPdfTable(doc, y, {
      title: "Catalogs by category",
      head: [["Category", "Catalog", "Recurrence", "Pricing"]],
      body: catalogRows,
    });
  }

  savePdf(doc, `${exportBasename(companyName)}.pdf`);
}

export function exportServiceCategoriesExcel(
  companyName: string,
  categories: ServiceCategoryResponse[]
): void {
  downloadExcel(`${exportBasename(companyName)}.xlsx`, [
    {
      name: "Categories",
      headers: ["Category", "Pricing", "Catalogs"],
      rows: buildCategorySummaryRows(categories),
    },
    {
      name: "Catalogs",
      headers: ["Category", "Catalog", "Recurrence", "Pricing"],
      rows: buildCatalogDetailRows(categories),
    },
  ]);
}
