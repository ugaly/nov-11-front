"use client";

import type { WorkItemActivityLogDto } from "@/api/types/work-item-api";
import { statusLabel } from "@/components/setup/TaskStatusPicker";
import { Modal } from "@/components/ui/modal";
import { Eye, History } from "lucide-react";
import { useMemo, useState } from "react";

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

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ActivityLogEntry({ log }: { log: WorkItemActivityLogDto }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/70 px-2.5 py-2 text-xs dark:border-gray-800 dark:bg-gray-900/40">
      <p className="font-medium text-gray-800 dark:text-white/90">
        {humanAction(log.actionType)} by {log.actorName ?? "System"}
      </p>
      <p className="mt-0.5 text-gray-500">{formatWhen(log.occurredAt)}</p>
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
    </div>
  );
}

export default function TaskActivityLog({ logs }: { logs: WorkItemActivityLogDto[] }) {
  const [open, setOpen] = useState(false);
  const sorted = useMemo(
    () =>
      [...logs].sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      ),
    [logs]
  );
  const latest = sorted[0];

  return (
    <>
      <section className="mb-3 flex items-start gap-2 rounded-lg border border-gray-200 bg-white/70 px-2.5 py-2 dark:border-gray-700 dark:bg-gray-900/20">
        <History
          className="mt-0.5 size-3.5 shrink-0 text-gray-400"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Task activity
          </p>
          {latest ? (
            <div className="mt-0.5 min-w-0">
              <p className="truncate text-xs font-medium text-gray-800 dark:text-white/90">
                {humanAction(latest.actionType)} · {latest.actorName ?? "System"}
              </p>
              <p className="truncate text-[11px] text-gray-500">
                {formatWhen(latest.occurredAt)}
                {latest.fromStatus || latest.toStatus
                  ? ` · ${prettyStatus(latest.fromStatus)} → ${prettyStatus(latest.toStatus)}`
                  : null}
              </p>
            </div>
          ) : (
            <p className="mt-0.5 text-xs text-gray-500">No activity yet.</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={sorted.length === 0}
          title={
            sorted.length === 0
              ? "No activity to show"
              : `View all activity (${sorted.length})`
          }
          aria-label={
            sorted.length === 0
              ? "No task activity"
              : `View all task activity (${sorted.length})`
          }
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <Eye className="size-4" aria-hidden />
        </button>
      </section>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        className="max-w-md p-0"
      >
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Task activity
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {sorted.length === 0
              ? "No entries yet."
              : `${sorted.length} ${sorted.length === 1 ? "entry" : "entries"}`}
          </p>
        </div>
        <div className="max-h-[min(60vh,24rem)] overflow-y-auto px-5 py-4">
          {sorted.length === 0 ? (
            <p className="text-sm text-gray-500">No activity recorded for this task.</p>
          ) : (
            <ul className="space-y-2">
              {sorted.map((log) => (
                <li key={log.id}>
                  <ActivityLogEntry log={log} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </>
  );
}
