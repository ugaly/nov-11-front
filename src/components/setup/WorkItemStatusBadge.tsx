"use client";

import type { WorkItemStatus } from "@/api/types/template-config";

const STYLES: Record<WorkItemStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className:
      "bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700",
  },
  IN_PROGRESS: {
    label: "In progress",
    className:
      "bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800",
  },
  DONE: {
    label: "Done",
    className:
      "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800",
  },
  BLOCKED: {
    label: "Blocked",
    className:
      "bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800",
  },
  NOT_APPLICABLE: {
    label: "N/A",
    className:
      "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700",
  },
};

export default function WorkItemStatusBadge({
  status,
  className = "",
}: {
  status: WorkItemStatus;
  className?: string;
}) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.className} ${className}`}
    >
      {s.label}
    </span>
  );
}
