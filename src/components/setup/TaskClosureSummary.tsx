"use client";

import type {
  WorkItemFieldDefinition,
  WorkItemFieldValue,
} from "@/api/types/work-item-template";
import FileAttachmentField from "@/components/setup/FileAttachmentField";
import { statusLabel } from "@/components/setup/TaskStatusPicker";
import { getAttachments } from "@/lib/work-item-file-utils";
import type { ClosureStatus } from "@/lib/work-item-closure-store";
import {
  Ban,
  CheckCircle2,
  MinusCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const STATUS_META: Record<
  ClosureStatus,
  { icon: LucideIcon; badge: string; row: string }
> = {
  DONE: {
    icon: CheckCircle2,
    badge:
      "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800",
    row: "bg-emerald-50/50 dark:bg-emerald-950/20",
  },
  BLOCKED: {
    icon: Ban,
    badge:
      "bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800",
    row: "bg-rose-50/50 dark:bg-rose-950/20",
  },
  NOT_APPLICABLE: {
    icon: MinusCircle,
    badge:
      "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700",
    row: "bg-slate-50/80 dark:bg-slate-900/30",
  },
};

function formatValue(
  field: WorkItemFieldDefinition,
  value?: WorkItemFieldValue
): string {
  if (!value) return "—";
  switch (field.widget) {
    case "CHECKBOX":
      return value.value ? "Yes" : "No";
    case "FILE": {
      const files = getAttachments(value);
      return files.length > 0
        ? `${files.length} file${files.length === 1 ? "" : "s"}`
        : "—";
    }
    case "DATE":
      if (!value.value) return "—";
      try {
        return new Date(String(value.value)).toLocaleDateString(undefined, {
          dateStyle: "medium",
        });
      } catch {
        return String(value.value);
      }
    default:
      return value.value != null && String(value.value).trim() !== ""
        ? String(value.value)
        : "—";
  }
}

function isWideField(field: WorkItemFieldDefinition) {
  return (
    field.widget === "TEXTAREA" ||
    field.widget === "FILE" ||
    field.widget === "TABLE"
  );
}

export default function TaskClosureSummary({
  status,
  remark,
  submittedAt,
  fields,
  values,
  onReopen,
}: {
  status: ClosureStatus;
  remark: string;
  submittedAt: string;
  fields: WorkItemFieldDefinition[];
  values: WorkItemFieldValue[];
  onReopen?: () => void;
}) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  const valueMap = Object.fromEntries(values.map((v) => [v.fieldId, v]));
  const hasFields = fields.length > 0;
  const hasRemark = remark.trim().length > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className={`${meta.row} border-b border-gray-200 dark:border-gray-700`}>
            <th
              colSpan={2}
              className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white"
            >
              <span className="flex flex-wrap items-center gap-2">
                <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                Closure summary
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${meta.badge}`}
                >
                  {statusLabel(status)}
                </span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          <tr className="bg-white dark:bg-gray-900/20">
            <th
              scope="row"
              className="w-[38%] px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
            >
              Submitted
            </th>
            <td className="px-4 py-2.5 text-gray-800 dark:text-gray-200">
              {new Date(submittedAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </td>
          </tr>

          {hasRemark ? (
            <tr className="bg-gray-50/80 dark:bg-gray-900/40">
              <th
                scope="row"
                className="align-top px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                Remark
              </th>
              <td className="whitespace-pre-wrap px-4 py-2.5 text-gray-800 dark:text-gray-200">
                {remark.trim()}
              </td>
            </tr>
          ) : null}

          {hasFields ? (
            <>
              <tr className="bg-brand-50/40 dark:bg-brand-950/20">
                <th
                  colSpan={2}
                  className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300"
                >
                  Captured responses
                </th>
              </tr>
              {fields.flatMap((field) => {
                const fieldValue = valueMap[field.id];
                const display = formatValue(field, fieldValue);

                if (field.widget === "FILE") {
                  const files = getAttachments(fieldValue);
                  if (!files.length) {
                    return [
                      <tr key={field.id} className="bg-white dark:bg-gray-900/20">
                        <th
                          scope="row"
                          className="w-[38%] px-4 py-2.5 text-left text-xs font-medium text-gray-600 dark:text-gray-400"
                        >
                          {field.label}
                        </th>
                        <td className="px-4 py-2.5 text-gray-500">—</td>
                      </tr>,
                    ];
                  }
                  return [
                    <tr
                      key={`${field.id}-label`}
                      className="bg-white dark:bg-gray-900/20"
                    >
                      <th
                        colSpan={2}
                        className="border-t border-gray-100 px-4 pt-3 pb-1 text-left text-xs font-semibold text-gray-600 dark:border-gray-800 dark:text-gray-400"
                      >
                        {field.label}
                      </th>
                    </tr>,
                    <tr
                      key={`${field.id}-files`}
                      className="bg-white dark:bg-gray-900/20"
                    >
                      <td colSpan={2} className="px-4 pb-4 pt-1">
                        <FileAttachmentField
                          label={null}
                          value={fieldValue}
                          readOnly
                          allowMultiple={field.allowMultiple}
                          onChange={() => {}}
                        />
                      </td>
                    </tr>,
                  ];
                }

                if (isWideField(field)) {
                  return [
                    <tr
                      key={`${field.id}-label`}
                      className="bg-white dark:bg-gray-900/20"
                    >
                      <th
                        colSpan={2}
                        className="border-t border-gray-100 px-4 pt-3 pb-1 text-left text-xs font-semibold text-gray-600 dark:border-gray-800 dark:text-gray-400"
                      >
                        {field.label}
                      </th>
                    </tr>,
                    <tr key={`${field.id}-value`} className="bg-white dark:bg-gray-900/20">
                      <td
                        colSpan={2}
                        className="whitespace-pre-wrap px-4 pt-0 pb-3 text-gray-800 dark:text-gray-200"
                      >
                        {display}
                      </td>
                    </tr>,
                  ];
                }
                return [
                  <tr key={field.id} className="bg-white dark:bg-gray-900/20">
                    <th
                      scope="row"
                      className="w-[38%] px-4 py-2.5 text-left text-xs font-medium text-gray-600 dark:text-gray-400"
                    >
                      {field.label}
                    </th>
                    <td className="px-4 py-2.5 text-gray-800 dark:text-gray-200">
                      {display}
                    </td>
                  </tr>,
                ];
              })}
            </>
          ) : (
            <tr className="bg-white dark:bg-gray-900/20">
              <td
                colSpan={2}
                className="px-4 py-3 text-xs text-gray-500 italic"
              >
                No field responses configured for this task.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {onReopen ? (
        <div className="border-t border-gray-100 px-4 py-2 dark:border-gray-800">
          <button
            type="button"
            onClick={onReopen}
            className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            Edit closure
          </button>
        </div>
      ) : null}
    </div>
  );
}
