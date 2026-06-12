"use client";

import type { WorkItemActivityLogDto } from "@/api/types/work-item-api";
import { statusLabel } from "@/components/setup/TaskStatusPicker";
import { History } from "lucide-react";

function humanAction(action: string) {
  switch (action) {
    case "STATUS_CHANGED":
      return "Status changed";
    case "CLOSURE_SUBMITTED":
      return "Closure submitted";
    case "CLOSURE_REOPENED":
      return "Closure reopened";
    default:
      return action.replaceAll("_", " ").toLowerCase();
  }
}

function prettyStatus(status?: string | null) {
  if (!status) return "—";
  return statusLabel(status as never);
}

export default function TaskActivityLog({ logs }: { logs: WorkItemActivityLogDto[] }) {
  return (
    <section className="mt-3 rounded-xl border border-gray-200 bg-white/70 p-3 dark:border-gray-700 dark:bg-gray-900/20">
      <div className="mb-2 flex items-center gap-2">
        <History className="size-4 text-gray-500" />
        <h6 className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
          Task activity
        </h6>
      </div>
      {logs.length === 0 ? (
        <p className="text-xs text-gray-500">No activity yet.</p>
      ) : (
        <ul className="space-y-2">
          {logs.slice(0, 10).map((log) => (
            <li
              key={log.id}
              className="rounded-lg border border-gray-100 bg-gray-50/70 px-2.5 py-2 text-xs dark:border-gray-800 dark:bg-gray-900/40"
            >
              <p className="font-medium text-gray-800 dark:text-white/90">
                {humanAction(log.actionType)} by {log.actorName ?? "System"}
              </p>
              <p className="mt-0.5 text-gray-500">
                {new Date(log.occurredAt).toLocaleString()}
              </p>
              {log.fromStatus || log.toStatus ? (
                <p className="mt-1 text-gray-600 dark:text-gray-300">
                  {prettyStatus(log.fromStatus)} → {prettyStatus(log.toStatus)}
                </p>
              ) : null}
              {log.remark ? (
                <p className="mt-1 rounded-md bg-white px-2 py-1 text-gray-600 dark:bg-gray-950/40 dark:text-gray-300">
                  {log.remark}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
