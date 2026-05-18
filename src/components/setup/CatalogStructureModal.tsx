"use client";

import type { EngagementWorkItemResponse } from "@/api/types/template-config";
import { setupFormModalClass } from "@/components/setup/setupFormModal";
import SetupEmptyState from "@/components/setup/SetupEmptyState";
import WorkItemStatusBadge from "@/components/setup/WorkItemStatusBadge";
import { Modal } from "@/components/ui/modal";
import {
  buildWorkItemTree,
  countWorkItems,
  toRoman,
  type WorkItemTreeNode,
} from "@/lib/work-item-tree";
import { formatPricing } from "@/lib/template-pricing";
import { FolderTree, ListTree, X } from "lucide-react";

export default function CatalogStructureModal({
  open,
  onClose,
  catalogName,
  workItems,
}: {
  open: boolean;
  onClose: () => void;
  catalogName: string;
  workItems: EngagementWorkItemResponse[];
}) {
  const tree = buildWorkItemTree(workItems);
  const counts = countWorkItems(workItems);

  return (
    <Modal isOpen={open} onClose={onClose} className={setupFormModalClass}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <FolderTree className="size-5 text-brand-500" aria-hidden />
            Service structure
          </h3>
          <p className="mt-1 text-sm text-gray-500">{catalogName}</p>
          <p className="mt-2 text-xs text-gray-500">
            {counts.groups} group{counts.groups === 1 ? "" : "s"} · {counts.tasks}{" "}
            task{counts.tasks === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="mt-6 max-h-[min(60vh,28rem)] overflow-y-auto rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-900/30">
        {tree.length === 0 ? (
          <SetupEmptyState
            icon={ListTree}
            title="No structure defined."
            variant="inline"
            className="py-6"
          />
        ) : (
          <ol className="space-y-4">
            {tree.map((node, index) => (
              <StructureGroup
                key={node.id}
                node={node}
                roman={node.nodeType === "GROUP" ? toRoman(index) : null}
                depth={0}
              />
            ))}
          </ol>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        This is the catalog template outline. Complete each task in the work area
        below the tabs.
      </p>
    </Modal>
  );
}

function StructureGroup({
  node,
  roman,
  depth,
}: {
  node: WorkItemTreeNode;
  roman: string | null;
  depth: number;
}) {
  if (node.nodeType === "TASK") {
    return (
      <li className="ml-6 list-none">
        <TaskOutline item={node} />
      </li>
    );
  }

  return (
    <li>
      <p className="flex flex-wrap items-center gap-2 font-semibold text-gray-900 dark:text-white">
        {roman ? (
          <span className="font-serif text-brand-600 dark:text-brand-400">
            {roman}.
          </span>
        ) : null}
        {node.name}
        <span className="rounded bg-gray-200 px-1.5 py-px text-[10px] font-medium uppercase text-gray-600 dark:bg-gray-700 dark:text-gray-400">
          Group
        </span>
        <WorkItemStatusBadge status={node.status} />
      </p>
      {node.description ? (
        <p className="mt-1 text-sm text-gray-500">{node.description}</p>
      ) : null}
      {node.children.length > 0 ? (
        <ol className="mt-3 space-y-2 border-l-2 border-gray-200 pl-4 dark:border-gray-700">
          {node.children.map((child, i) => (
            <StructureGroup
              key={child.id}
              node={child}
              roman={null}
              depth={depth + 1}
            />
          ))}
        </ol>
      ) : null}
    </li>
  );
}

function TaskOutline({ item }: { item: EngagementWorkItemResponse }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900/50">
      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-800 dark:text-white/90">
        {item.name}
        <WorkItemStatusBadge status={item.status} />
      </p>
      {item.description ? (
        <p className="mt-1 text-xs text-gray-500">{item.description}</p>
      ) : null}
      <p className="mt-1 text-xs text-gray-400">
        {item.departmentName ? `${item.departmentName} · ` : ""}
        {formatPricing(item.pricing)}
      </p>
    </div>
  );
}
