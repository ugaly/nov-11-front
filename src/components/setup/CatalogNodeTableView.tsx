"use client";

import type { ServiceCatalogNodeResponse } from "@/api/types/template-config";
import {
  buildCatalogTableRows,
  catalogNodeLeafCount,
  catalogTableColumnLabel,
} from "@/lib/catalog-node-table";
import SetupEmptyState from "@/components/setup/SetupEmptyState";
import {
  formatPriceOnly,
  getDurationDisplay,
} from "@/lib/template-pricing";
import { ListTree } from "lucide-react";

const thClass =
  "border border-gray-300 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:border-gray-600 dark:bg-gray-900/70 dark:text-gray-400";
const tdClass =
  "border border-gray-300 px-4 py-3 align-top text-gray-800 dark:border-gray-600 dark:text-white/90";
const tdMutedClass = `${tdClass} text-gray-400 dark:text-gray-500`;

export default function CatalogNodeTableView({
  nodes,
}: {
  nodes: ServiceCatalogNodeResponse[];
}) {
  const { maxDepth, rows } = buildCatalogTableRows(nodes);

  if (rows.length === 0) {
    return (
      <SetupEmptyState
        icon={ListTree}
        title="No template nodes yet."
        variant="bordered"
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border-2 border-gray-300 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-900/20">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            {Array.from({ length: maxDepth }, (_, i) => (
              <th key={i} className={thClass}>
                {catalogTableColumnLabel(i)}
              </th>
            ))}
            <th className={thClass}>Price</th>
            <th className={thClass}>Duration</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-transparent">
          {rows.map((row, rowIndex) => (
            <tr
              key={row.leaf.id}
              className="even:bg-gray-50/60 dark:even:bg-gray-900/30"
            >
              {row.path.map((node, colIndex) => {
                if (!node) {
                  return (
                    <td key={colIndex} className={tdMutedClass}>
                      —
                    </td>
                  );
                }
                const prev =
                  rowIndex > 0 ? rows[rowIndex - 1]!.path[colIndex] : null;
                if (prev?.id === node.id) return null;
                return (
                  <td
                    key={colIndex}
                    rowSpan={catalogNodeLeafCount(node)}
                    className={tdClass}
                  >
                    <div className="font-medium text-gray-800 dark:text-white/90">
                      {node.name}
                    </div>
                    {colIndex === 0 ? (
                      node.nodeType === "GROUP" ? (
                        <NodeDurationHint pricing={node.pricing} />
                      ) : null
                    ) : (
                      <>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                          <span className="rounded bg-gray-100 px-1.5 dark:bg-gray-800">
                            {node.nodeType}
                          </span>
                          {node.departmentName ? (
                            <span>{node.departmentName}</span>
                          ) : null}
                        </div>
                        {node.nodeType === "GROUP" ? (
                          <NodeDurationHint pricing={node.pricing} />
                        ) : null}
                      </>
                    )}
                  </td>
                );
              })}
              <td className={`${tdClass} tabular-nums`}>
                {formatPriceOnly(row.leaf.pricing)}
              </td>
              <td className={tdClass}>
                <DurationCell pricing={row.leaf.pricing} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NodeDurationHint({
  pricing,
}: {
  pricing: ServiceCatalogNodeResponse["pricing"];
}) {
  const { primary, normalizedDays } = getDurationDisplay(pricing);
  if (!primary) return null;
  return (
    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
      {primary}
      {normalizedDays != null ? ` · ${normalizedDays}d total` : null}
    </p>
  );
}

function DurationCell({
  pricing,
}: {
  pricing: ServiceCatalogNodeResponse["pricing"];
}) {
  const { primary, normalizedDays } = getDurationDisplay(pricing);
  if (!primary) {
    return <span className="text-gray-400">—</span>;
  }
  return (
    <div className="min-w-[5rem]">
      <p className="font-medium tabular-nums text-gray-800 dark:text-white/90">
        {primary}
      </p>
      {normalizedDays != null ? (
        <p className="mt-0.5 text-xs tabular-nums text-gray-500 dark:text-gray-400">
          {normalizedDays} days total
        </p>
      ) : null}
    </div>
  );
}
