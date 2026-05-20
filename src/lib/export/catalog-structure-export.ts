import type { ServiceCatalogNodeResponse } from "@/api/types/template-config";
import { buildCatalogStructureExportData } from "@/lib/export/catalog-structure-table";
import { downloadExcel } from "@/lib/export/excel";
import {
  addPdfTable,
  createBrandedPdf,
  savePdf,
  slugifyFilename,
} from "@/lib/export/pdf-document";

function exportBasename(companyName: string, catalogName: string) {
  const company = slugifyFilename(companyName) || "company";
  const catalog = slugifyFilename(catalogName) || "catalog";
  const date = new Date().toISOString().slice(0, 10);
  return `catalog-structure-${catalog}-${company}-${date}`;
}

export async function exportCatalogStructurePdf(
  companyName: string,
  catalogName: string,
  categoryName: string,
  nodes: ServiceCatalogNodeResponse[]
): Promise<void> {
  const data = buildCatalogStructureExportData(nodes);
  const { doc, startY } = await createBrandedPdf({
    title: "Service catalog structure",
    companyName,
    subtitle: `${categoryName} · ${catalogName} · ${data.excelRows.length} item${data.excelRows.length === 1 ? "" : "s"}`,
  });

  addPdfTable(doc, startY, {
    head: [data.headers],
    body: data.pdfBody,
  });

  savePdf(doc, `${exportBasename(companyName, catalogName)}.pdf`);
}

export function exportCatalogStructureExcel(
  companyName: string,
  catalogName: string,
  nodes: ServiceCatalogNodeResponse[]
): void {
  const data = buildCatalogStructureExportData(nodes);
  downloadExcel(`${exportBasename(companyName, catalogName)}.xlsx`, [
    {
      name: "Structure",
      headers: data.headers,
      rows: data.excelRows,
      merges: data.merges,
    },
  ]);
}
