"use client";

import type { WorkItemFieldDefinition } from "@/api/types/work-item-template";
import Label from "@/components/form/Label";
import { Upload } from "lucide-react";

export default function TaskFieldPreview({
  fields,
}: {
  fields: WorkItemFieldDefinition[];
}) {
  if (!fields.length) return null;

  return (
    <div className="mt-4 space-y-4 border-t border-dashed border-gray-200 pt-4 dark:border-gray-700">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Template fields (preview — API pending)
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <FieldPreview key={field.id} field={field} />
        ))}
      </div>
    </div>
  );
}

function FieldPreview({ field }: { field: WorkItemFieldDefinition }) {
  const label = (
    <Label>
      {field.label}
      {field.required ? <span className="text-error-500"> *</span> : null}
    </Label>
  );

  switch (field.widget) {
    case "TEXT":
    case "NUMBER":
    case "DATE":
      return (
        <div className="sm:col-span-1">
          {label}
          <input
            type={
              field.widget === "NUMBER"
                ? "number"
                : field.widget === "DATE"
                  ? "date"
                  : "text"
            }
            disabled
            placeholder={
              field.customerFieldKey
                ? `From customer · ${field.customerFieldKey}`
                : "Enter value…"
            }
            className="mt-1.5 h-10 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50"
          />
        </div>
      );
    case "TEXTAREA":
      return (
        <div className="sm:col-span-2">
          {label}
          <textarea
            disabled
            rows={2}
            placeholder="Notes…"
            className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50"
          />
        </div>
      );
    case "SELECT":
      return (
        <div>
          {label}
          <select
            disabled
            className="mt-1.5 h-10 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50"
          >
            <option>Select…</option>
            {field.options?.map((o) => (
              <option key={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      );
    case "RADIO":
      return (
        <div>
          {label}
          <div className="mt-2 space-y-2">
            {field.options?.map((o) => (
              <label
                key={o.value}
                className="flex cursor-not-allowed items-center gap-2 text-sm text-gray-500"
              >
                <input type="radio" disabled className="size-4" />
                {o.label}
              </label>
            ))}
          </div>
        </div>
      );
    case "CHECKBOX":
      return (
        <label className="flex cursor-not-allowed items-center gap-2 pt-6 text-sm text-gray-600">
          <input type="checkbox" disabled className="size-4 rounded" />
          {field.label}
        </label>
      );
    case "FILE":
      return (
        <div className="sm:col-span-2">
          {label}
          <div className="mt-1.5 flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-900/30">
            <Upload className="size-4" aria-hidden />
            {field.allowMultiple ? "Upload one or more files" : "Upload file"}
          </div>
        </div>
      );
    case "CUSTOMER_LINK":
      return (
        <div>
          {label}
          <div className="mt-1.5 rounded-lg border border-brand-200 bg-brand-50/50 px-3 py-2 text-sm text-brand-800 dark:border-brand-800 dark:bg-brand-950/30 dark:text-brand-200">
            Linked to customer ·{" "}
            <span className="font-mono text-xs">{field.customerFieldKey}</span>
          </div>
        </div>
      );
    case "TABLE":
      return (
        <div className="sm:col-span-2">
          {label}
          <div className="mt-1.5 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/60">
                <tr>
                  {(
                    field.tableColumns ?? [
                      { id: "c1", label: "Column A" },
                      { id: "c2", label: "Column B" },
                    ]
                  ).map((c) => (
                    <th
                      key={c.id}
                      className="border-b px-3 py-2 text-left font-medium text-gray-600"
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={2} className="px-3 py-4 text-center text-gray-400">
                    Table rows — editable when API is connected
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    default:
      return null;
  }
}
