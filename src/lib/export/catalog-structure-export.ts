import type { ServiceCatalogNodeResponse } from "@/api/types/template-config";
import {
  CATALOG_NODE_HEADERS,
  catalogNodeRowsToMatrix,
  flattenCatalogNodes,
} from "@/lib/export/flatten-catalog-nodes";
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
  const flat = flattenCatalogNodes(nodes);
  const { doc, startY } = await createBrandedPdf({
    title: "Service catalog structure",
    companyName,
    subtitle: `${categoryName} · ${catalogName} · ${flat.length} node${flat.length === 1 ? "" : "s"}`,
  });

  addPdfTable(doc, startY, {
    head: [Array.from(CATALOG_NODE_HEADERS)],
    body: catalogNodeRowsToMatrix(flat),
  });

  savePdf(doc, `${exportBasename(companyName, catalogName)}.pdf`);
}

export function exportCatalogStructureExcel(
  companyName: string,
  catalogName: string,
  nodes: ServiceCatalogNodeResponse[]
): void {
  const flat = flattenCatalogNodes(nodes);
  downloadExcel(`${exportBasename(companyName, catalogName)}.xlsx`, [
    {
      name: "Structure",
      headers: Array.from(CATALOG_NODE_HEADERS),
      rows: catalogNodeRowsToMatrix(flat),
    },
  ]);
}
