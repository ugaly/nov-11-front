"use client";

import type {
  WorkItemFieldDefinition,
  WorkItemFieldValue,
} from "@/api/types/work-item-template";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/form/date-picker";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { previewFormLink } from "@/lib/work-item-field-store";
import FileAttachmentField from "@/components/setup/FileAttachmentField";
import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const inputClass =
  "h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function TaskFieldForm({
  fields,
  values,
  savedAt,
  readOnly,
  workItemId,
  onSave,
  hideActions,
  registerGetValues,
}: {
  fields: WorkItemFieldDefinition[];
  values: WorkItemFieldValue[];
  savedAt: string | null;
  readOnly?: boolean;
  workItemId: string;
  onSave: (values: WorkItemFieldValue[]) => void;
  /** Hide save row — parent handles submit (e.g. closure flow). */
  hideActions?: boolean;
  registerGetValues?: (getter: () => WorkItemFieldValue[]) => void;
}) {
  const [draft, setDraft] = useState<Record<string, WorkItemFieldValue>>({});
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [copied, setCopied] = useState(false);
  const formLink = previewFormLink(workItemId);

  useEffect(() => {
    const map: Record<string, WorkItemFieldValue> = {};
    for (const v of values) map[v.fieldId] = v;
    for (const f of fields) {
      if (!map[f.id]) map[f.id] = { fieldId: f.id };
    }
    setDraft(map);
  }, [fields, values]);

  useEffect(() => {
    if (!registerGetValues) return;
    registerGetValues(() =>
      fields.map((f) => draft[f.id] ?? { fieldId: f.id })
    );
  }, [draft, fields, registerGetValues]);

  const setValue = useCallback(
    (fieldId: string, patch: Partial<WorkItemFieldValue>) => {
      setDraft((d) => ({
        ...d,
        [fieldId]: { ...d[fieldId], fieldId, ...patch },
      }));
    },
    []
  );

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    setSaving(true);
    const next = fields.map((f) => draft[f.id] ?? { fieldId: f.id });
    onSave(next);
    setSaving(false);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2500);
  }

  function copyLink() {
    void navigator.clipboard.writeText(formLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const body = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Capture data
        </p>
        {savedAt ? (
          <p className="text-xs text-gray-400">
            Last saved {new Date(savedAt).toLocaleString()}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-brand-200 bg-brand-50/40 px-3 py-2 dark:border-brand-800 dark:bg-brand-950/25">
        <span className="text-xs text-gray-600 dark:text-gray-400">
          Shareable form (preview):
        </span>
        <code className="max-w-[min(100%,14rem)] truncate text-xs text-brand-700 dark:text-brand-300">
          {formLink}
        </code>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-100 dark:hover:bg-brand-900/40"
        >
          {copied ? (
            <Check className="size-3.5" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <FieldInput
            key={field.id}
            field={field}
            value={draft[field.id]}
            readOnly={readOnly}
            onChange={(patch) => setValue(field.id, patch)}
          />
        ))}
      </div>

      {!hideActions ? (
        !readOnly ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving…" : "Save responses"}
            </Button>
            {savedFlash ? (
              <span className="text-sm text-emerald-600">Saved locally</span>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            Responses are read-only until status changes.
          </p>
        )
      ) : null}
    </>
  );

  const className =
    "mt-4 space-y-4 border-t border-gray-200 pt-4 dark:border-gray-700";

  if (hideActions) {
    return <div className={className}>{body}</div>;
  }

  return (
    <form className={className} onSubmit={handleSave}>
      {body}
    </form>
  );
}

function FieldInput({
  field,
  value,
  readOnly,
  onChange,
}: {
  field: WorkItemFieldDefinition;
  value?: WorkItemFieldValue;
  readOnly?: boolean;
  onChange: (patch: Partial<WorkItemFieldValue>) => void;
}) {
  const label = (
    <Label>
      {field.label}
      {field.required ? <span className="text-error-500"> *</span> : null}
    </Label>
  );
  const disabled = !!readOnly;

  switch (field.widget) {
    case "TEXT":
      return (
        <div>
          {label}
          <input
            type="text"
            disabled={disabled}
            required={field.required}
            value={String(value?.value ?? "")}
            onChange={(e) => onChange({ value: e.target.value })}
            className={inputClass}
            placeholder="Enter value…"
          />
        </div>
      );
    case "NUMBER":
      return (
        <div>
          {label}
          <input
            type="number"
            disabled={disabled}
            required={field.required}
            value={String(value?.value ?? "")}
            onChange={(e) => onChange({ value: e.target.value })}
            className={inputClass}
            placeholder="Enter number…"
          />
        </div>
      );
    case "DATE":
      return (
        <div>
          <DatePicker
            label={field.label + (field.required ? " *" : "")}
            placeholder="Select date"
            value={String(value?.value ?? "")}
            onValueChange={(v) => onChange({ value: v })}
            disabled={disabled}
          />
        </div>
      );
    case "TEXTAREA":
      return (
        <div className="sm:col-span-2">
          {label}
          <textarea
            disabled={disabled}
            required={field.required}
            rows={3}
            value={String(value?.value ?? "")}
            onChange={(e) => onChange({ value: e.target.value })}
            placeholder="Notes or description…"
            className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </div>
      );
    case "SELECT":
      return (
        <div>
          {label}
          <select
            disabled={disabled}
            required={field.required}
            value={String(value?.value ?? "")}
            onChange={(e) => onChange({ value: e.target.value })}
            className={inputClass}
          >
            <option value="">Select…</option>
            {field.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      );
    case "CHECKBOX":
      return (
        <label className="flex items-center gap-2 pt-6 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            disabled={disabled}
            checked={!!value?.value}
            onChange={(e) => onChange({ value: e.target.checked })}
            className="size-4 rounded"
          />
          {field.label}
          {field.required ? <span className="text-error-500"> *</span> : null}
        </label>
      );
    case "FILE":
      return (
        <FileAttachmentField
          label={label}
          value={value}
          readOnly={disabled}
          allowMultiple={field.allowMultiple}
          onChange={onChange}
        />
      );
    case "CUSTOMER_LINK":
      return (
        <div>
          {label}
          <Input
            disabled={disabled}
            value={String(value?.value ?? "")}
            onChange={(e) => onChange({ value: e.target.value })}
            placeholder={`Linked: ${field.customerFieldKey ?? "customer"}`}
          />
          <p className="mt-1 text-xs text-gray-500">
            Pre-fill from customer record when API is connected.
          </p>
        </div>
      );
    default:
      return null;
  }
}
