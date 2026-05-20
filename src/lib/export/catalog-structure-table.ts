import type { ServiceCatalogNodeResponse } from "@/api/types/template-config";
import {
  buildCatalogTableRows,
  catalogNodeLeafCount,
  type CatalogTableRenderRow,
} from "@/lib/catalog-node-table";
import { formatPriceOnly, getDurationDisplay } from "@/lib/template-pricing";

export type ExcelMergeRange = {
  s: { r: number; c: number };
  e: { r: number; c: number };
};

export type CatalogStructureExportData = {
  headers: string[];
  /** Plain rows for Excel (empty cells under row spans). */
  excelRows: string[][];
  merges: ExcelMergeRange[];
  /** Rows for jspdf-autotable (rowSpan on group cells). */
  pdfBody: (string | { content: string; rowSpan: number })[][];
};

function hierarchyHeader(depthIndex: number, maxDepth: number): string {
  if (maxDepth <= 1) return "Item";
  if (depthIndex === 0) return "Group";
  if (depthIndex === 1) return "Item";
  return depthIndex === 2 ? "Sub-item" : `Level ${depthIndex + 1}`;
}

function durationExportText(
  pricing: ServiceCatalogNodeResponse["pricing"]
): string {
  const { primary, normalizedDays } = getDurationDisplay(pricing);
  if (!primary) return "—";
  if (normalizedDays != null) {
    return `${primary} · ${normalizedDays}d total`;
  }
  return primary;
}

function buildRows(
  tableRows: CatalogTableRenderRow[],
  maxDepth: number
): {
  excelRows: string[][];
  merges: ExcelMergeRange[];
  pdfBody: (string | { content: string; rowSpan: number })[][];
} {
  const excelRows: string[][] = [];
  const merges: ExcelMergeRange[] = [];
  const pdfBody: (string | { content: string; rowSpan: number })[][] = [];

  tableRows.forEach((row, rowIndex) => {
    const excelCells: string[] = [];
    const pdfCells: (string | { content: string; rowSpan: number })[] = [];

    for (let colIndex = 0; colIndex < maxDepth; colIndex++) {
      const node = row.path[colIndex];
      if (!node) {
        excelCells.push("");
        pdfCells.push("");
        continue;
      }

      const prev =
        rowIndex > 0 ? tableRows[rowIndex - 1]!.path[colIndex] : null;
      if (prev?.id === node.id) {
        excelCells.push("");
        continue;
      }

      const span = catalogNodeLeafCount(node);
      excelCells.push(node.name);
      pdfCells.push({ content: node.name, rowSpan: span });

      if (span > 1) {
        const excelRow = excelRows.length + 1;
        merges.push({
          s: { r: excelRow, c: colIndex },
          e: { r: excelRow + span - 1, c: colIndex },
        });
      }
    }

    excelCells.push(formatPriceOnly(row.leaf.pricing));
    excelCells.push(durationExportText(row.leaf.pricing));
    pdfCells.push(formatPriceOnly(row.leaf.pricing));
    pdfCells.push(durationExportText(row.leaf.pricing));

    excelRows.push(excelCells);
    pdfBody.push(pdfCells);
  });

  return { excelRows, merges, pdfBody };
}

export function buildCatalogStructureExportData(
  nodes: ServiceCatalogNodeResponse[]
): CatalogStructureExportData {
  const { maxDepth, rows } = buildCatalogTableRows(nodes);
  const hierarchyHeaders = Array.from({ length: maxDepth }, (_, i) =>
    hierarchyHeader(i, maxDepth)
  );
  const headers = [...hierarchyHeaders, "Price", "Duration"];
  const built = buildRows(rows, maxDepth);

  return {
    headers,
    excelRows: built.excelRows,
    merges: built.merges,
    pdfBody: built.pdfBody,
  };
}
