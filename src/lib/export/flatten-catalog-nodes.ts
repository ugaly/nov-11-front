import type { ServiceCatalogNodeResponse } from "@/api/types/template-config";
import { formatPricing } from "@/lib/template-pricing";

export type CatalogNodeExportRow = {
  level: number;
  type: string;
  parentPath: string;
  name: string;
  department: string;
  pricing: string;
  sortOrder: string;
};

export function flattenCatalogNodes(
  nodes: ServiceCatalogNodeResponse[],
  parentPath = "",
  depth = 0
): CatalogNodeExportRow[] {
  const rows: CatalogNodeExportRow[] = [];

  for (const node of nodes) {
    rows.push({
      level: depth + 1,
      type: node.nodeType,
      parentPath: parentPath || "—",
      name: node.name,
      department: node.departmentName ?? "—",
      pricing: formatPricing(node.pricing),
      sortOrder: String(node.sortOrder),
    });

    if (node.children?.length) {
      const path = parentPath ? `${parentPath} › ${node.name}` : node.name;
      rows.push(...flattenCatalogNodes(node.children, path, depth + 1));
    }
  }

  return rows;
}

export function catalogNodeRowsToMatrix(
  rows: CatalogNodeExportRow[]
): string[][] {
  return rows.map((r) => [
    String(r.level),
    r.type,
    r.parentPath,
    r.name,
    r.department,
    r.pricing,
    r.sortOrder,
  ]);
}

export const CATALOG_NODE_HEADERS = [
  "Level",
  "Type",
  "Parent path",
  "Name",
  "Department",
  "Pricing",
  "Sort",
] as const;
