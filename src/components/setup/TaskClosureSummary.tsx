"use client";

import type {
  WorkItemFieldDefinition,
  WorkItemFieldGroup,
  WorkItemFieldValue,
  WorkItemFileAttachment,
} from "@/api/types/work-item-template";
import ClosureOutputFilesField from "@/components/setup/ClosureOutputFilesField";
import FileAttachmentField from "@/components/setup/FileAttachmentField";
import FormFieldGroupSection from "@/components/setup/FormFieldGroupSection";
import { statusLabel } from "@/components/setup/TaskStatusPicker";
import { getAttachments } from "@/lib/work-item-file-utils";
import { isFileWidget } from "@/lib/field-widget-meta";
import { buildFieldLayout } from "@/lib/work-item-field-layout";
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
    case "FILE":
    case "INTERNAL_FILE": {
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
    isFileWidget(field.widget) ||
    field.widget === "TABLE"
  );
}

export default function TaskClosureSummary({
  status,
  remark,
  submittedAt,
  fields,
  groups = [],
  values,
  outputFiles = [],
  onReopen,
}: {
  status: ClosureStatus;
  remark: string;
  submittedAt: string;
  fields: WorkItemFieldDefinition[];
  groups?: WorkItemFieldGroup[];
  values: WorkItemFieldValue[];
  outputFiles?: WorkItemFileAttachment[];
  onReopen?: () => void;
}) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  const valueMap = Object.fromEntries(values.map((v) => [v.fieldId, v]));
  const hasFields = fields.length > 0;
  const remarkText = remark.trim();
  const hasOutputFiles = outputFiles.length > 0;
  const sections = buildFieldLayout(fields, groups);

  function renderFieldBlock(field: WorkItemFieldDefinition) {
    const fieldValue = valueMap[field.id];
    const display = formatValue(field, fieldValue);

    if (isFileWidget(field.widget)) {
      const files = getAttachments(fieldValue);
      return (
        <div key={field.id} className="space-y-1">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {field.label}
          </p>
          {files.length ? (
            <FileAttachmentField
              label={null}
              value={fieldValue}
              readOnly
              allowMultiple={field.allowMultiple}
              onChange={() => {}}
            />
          ) : (
            <p className="text-sm text-gray-500">—</p>
          )}
        </div>
      );
    }

    if (isWideField(field)) {
      return (
        <div key={field.id} className="sm:col-span-2 space-y-1">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {field.label}
          </p>
          <p className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
            {display}
          </p>
        </div>
      );
    }

    return (
      <div key={field.id} className="space-y-1">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {field.label}
        </p>
        <p className="text-sm text-gray-800 dark:text-gray-200">{display}</p>
      </div>
    );
  }

  function renderCapturedResponses() {
    if (!hasFields) {
      return (
        <p className="text-xs text-gray-500 italic">
          No field responses configured for this task.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {sections.map((section) => {
          if (section.kind === "group" && section.group?.name) {
            return (
              <FormFieldGroupSection
                key={section.group.id}
                title={section.group.name}
              >
                {section.fields.map((field) => renderFieldBlock(field))}
              </FormFieldGroupSection>
            );
          }

          return (
            <div
              key="ungrouped"
              className="grid gap-4 sm:grid-cols-2"
            >
              {section.fields.map((field) => renderFieldBlock(field))}
            </div>
          );
        })}
      </div>
    );
  }

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

          <tr className="bg-brand-50/40 dark:bg-brand-950/20">
            <th
              colSpan={2}
              className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300"
            >
              Captured responses
            </th>
          </tr>
          <tr className="bg-white dark:bg-gray-900/20">
            <td colSpan={2} className="px-4 py-4">
              {renderCapturedResponses()}
            </td>
          </tr>

          <tr className="bg-gray-50/80 dark:bg-gray-900/40">
            <th
              scope="row"
              className="align-top px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
            >
              Remark
            </th>
            <td className="whitespace-pre-wrap px-4 py-2.5 text-gray-800 dark:text-gray-200">
              {remarkText || "—"}
            </td>
          </tr>

          {hasOutputFiles ? (
            <>
              <tr className="bg-brand-50/40 dark:bg-brand-950/20">
                <th
                  colSpan={2}
                  className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300"
                >
                  Deliverables
                </th>
              </tr>
              <tr className="bg-white dark:bg-gray-900/20">
                <td colSpan={2} className="px-4 pb-4 pt-1">
                  <ClosureOutputFilesField
                    files={outputFiles}
                    readOnly
                    compact
                    hideLabel
                  />
                </td>
              </tr>
            </>
          ) : null}
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
