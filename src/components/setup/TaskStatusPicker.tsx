"use client";

import type { WorkItemStatus } from "@/api/types/template-config";
import type { LucideIcon } from "lucide-react";
import {
  Ban,
  CheckCircle2,
  CircleDashed,
  MinusCircle,
  PlayCircle,
} from "lucide-react";

const OPTIONS: {
  status: WorkItemStatus;
  label: string;
  icon: LucideIcon;
  activeClass: string;
}[] = [
  {
    status: "PENDING",
    label: "Pending",
    icon: CircleDashed,
    activeClass:
      "border-gray-400 bg-gray-100 text-gray-700 ring-gray-300 dark:bg-gray-800 dark:text-gray-300",
  },
  {
    status: "IN_PROGRESS",
    label: "In progress",
    icon: PlayCircle,
    activeClass:
      "border-blue-400 bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300",
  },
  {
    status: "DONE",
    label: "Done",
    icon: CheckCircle2,
    activeClass:
      "border-emerald-400 bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  {
    status: "BLOCKED",
    label: "Blocked",
    icon: Ban,
    activeClass:
      "border-rose-400 bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-300",
  },
  {
    status: "NOT_APPLICABLE",
    label: "Not applicable",
    icon: MinusCircle,
    activeClass:
      "border-slate-400 bg-slate-50 text-slate-600 ring-slate-200 dark:bg-slate-900 dark:text-slate-400",
  },
];

export function statusLabel(status: WorkItemStatus): string {
  return OPTIONS.find((o) => o.status === status)?.label ?? status;
}

/** Status control — icon + label on each button (active state is highlighted). */
export default function TaskStatusPicker({
  value,
  onChange,
  disabled,
}: {
  value: WorkItemStatus;
  onChange: (status: WorkItemStatus) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="flex min-w-0 flex-wrap items-center justify-end gap-1"
      role="group"
      aria-label={`Task status: ${statusLabel(value)}`}
    >
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.status;
        return (
          <button
            key={opt.status}
            type="button"
            aria-label={`Set status to ${opt.label}`}
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(opt.status)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-3 text-sm transition-all ring-1 ring-inset disabled:cursor-not-allowed disabled:opacity-50 ${
              active
                ? opt.activeClass
                : "border-transparent text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="font-medium leading-tight">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
