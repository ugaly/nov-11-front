import type { ServiceCatalogNodeResponse } from "@/api/types/template-config";

export type CatalogTableRenderRow = {
  path: (ServiceCatalogNodeResponse | null)[];
  leaf: ServiceCatalogNodeResponse;
};

/** Leaf rows under a node (node alone counts as one leaf if it has no children). */
export function catalogNodeLeafCount(
  node: ServiceCatalogNodeResponse
): number {
  if (!node.children?.length) return 1;
  return node.children.reduce((sum, c) => sum + catalogNodeLeafCount(c), 0);
}

export function buildCatalogTableRows(
  roots: ServiceCatalogNodeResponse[]
): { maxDepth: number; rows: CatalogTableRenderRow[] } {
  const leafPaths: ServiceCatalogNodeResponse[][] = [];

  function collect(
    node: ServiceCatalogNodeResponse,
    ancestors: ServiceCatalogNodeResponse[]
  ) {
    const path = [...ancestors, node];
    if (!node.children?.length) {
      leafPaths.push(path);
      return;
    }
    for (const child of node.children) collect(child, path);
  }

  for (const root of roots) collect(root, []);

  const maxDepth = Math.max(1, ...leafPaths.map((p) => p.length), 0);

  const rows: CatalogTableRenderRow[] = leafPaths.map((path) => ({
    path: Array.from({ length: maxDepth }, (_, i) => path[i] ?? null),
    leaf: path[path.length - 1]!,
  }));

  return { maxDepth, rows };
}

export function catalogTableColumnLabel(depthIndex: number): string {
  if (depthIndex === 0) return "Item";
  if (depthIndex === 1) return "Sub-item";
  return `Level ${depthIndex + 1}`;
}
