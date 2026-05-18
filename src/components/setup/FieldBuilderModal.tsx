"use client";

import type {
  CustomerFieldKey,
  WorkItemFieldDefinition,
  WorkItemFieldWidgetType,
} from "@/api/types/work-item-template";
import { setupFormModalClass } from "@/components/setup/setupFormModal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { BUILDER_WIDGET_OPTIONS } from "@/lib/field-widget-meta";
import { findDuplicateFieldIds, newFieldId } from "@/lib/work-item-field-store";
import { GripVertical, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

const selectClass =
  "h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const CUSTOMER_KEYS: { value: CustomerFieldKey; label: string }[] = [
  { value: "tin", label: "TIN" },
  { value: "registrationNumber", label: "Registration number" },
  { value: "name", label: "Customer name" },
  { value: "legalName", label: "Legal name" },
  { value: "contactEmail", label: "Email" },
  { value: "contactPhone", label: "Phone" },
  { value: "address", label: "Address" },
  { value: "city", label: "City" },
  { value: "country", label: "Country" },
];

type DraftField = {
  id: string;
  label: string;
  widget: WorkItemFieldWidgetType;
  required: boolean;
  allowMultiple: boolean;
  optionsText: string;
  customerFieldKey: CustomerFieldKey | "";
};

function toDraft(f: WorkItemFieldDefinition): DraftField {
  return {
    id: f.id,
    label: f.label,
    widget: f.widget,
    required: !!f.required,
    allowMultiple: !!f.allowMultiple,
    optionsText: f.options?.map((o) => o.label).join("\n") ?? "",
    customerFieldKey: f.customerFieldKey ?? "",
  };
}

function fromDraft(d: DraftField, sortOrder: number): WorkItemFieldDefinition {
  const base: WorkItemFieldDefinition = {
    id: d.id,
    label: d.label.trim(),
    widget: d.widget,
    required: d.required,
    sortOrder,
    allowMultiple: d.widget === "FILE" ? d.allowMultiple : undefined,
  };
  if (d.widget === "CUSTOMER_LINK" && d.customerFieldKey) {
    base.customerFieldKey = d.customerFieldKey;
  }
  if (d.widget === "SELECT" && d.optionsText.trim()) {
    base.options = d.optionsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, i) => ({ value: `opt_${i}`, label: line }));
  }
  return base;
}

function emptyDraft(): DraftField {
  return {
    id: newFieldId(),
    label: "",
    widget: "TEXT",
    required: false,
    allowMultiple: false,
    optionsText: "",
    customerFieldKey: "",
  };
}

export default function FieldBuilderModal({
  open,
  onClose,
  taskName,
  initialFields,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  taskName: string;
  initialFields: WorkItemFieldDefinition[];
  onSave: (fields: WorkItemFieldDefinition[]) => void | Promise<void>;
}) {
  const [drafts, setDrafts] = useState<DraftField[]>([]);
  const [adding, setAdding] = useState(false);
  const [newField, setNewField] = useState<DraftField>(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDrafts(initialFields.map(toDraft));
      setAdding(false);
      setNewField(emptyDraft());
      setError(null);
    }
  }, [open, initialFields]);

  function addField() {
    const label = newField.label.trim();
    if (!label) {
      setError("Enter a field label (e.g. TIN number).");
      return;
    }
    setDrafts((d) => [...d, { ...newField, id: newFieldId(), label }]);
    setNewField(emptyDraft());
    setAdding(false);
    setError(null);
  }

  function removeField(id: string) {
    setDrafts((d) => d.filter((f) => f.id !== id));
  }

  async function handleSave() {
    const valid = drafts.filter((d) => d.label.trim());
    if (!valid.length) {
      setError("Add at least one field before saving.");
      return;
    }
    const payload = valid.map((d, i) => fromDraft(d, i));
    const dupes = findDuplicateFieldIds(payload);
    if (dupes.length) {
      setError("Two fields share the same id. Remove one and add it again.");
      if (process.env.NODE_ENV !== "production") {
        console.warn("[work-item] duplicate field ids in builder", dupes);
      }
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(payload);
      onClose();
    } catch {
      setError("Could not save fields. Try again or refresh the page.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} className={setupFormModalClass}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Choose fields to capture
          </h3>
          <p className="mt-1 text-sm text-gray-500">{taskName}</p>
          <p className="mt-2 text-xs text-gray-500">
            Decide what information this task needs. After saving, staff can fill
            the form here (a shareable link will come from the API later).
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-error-600">{error}</p> : null}

      <ul className="mt-5 space-y-2">
        {drafts.length === 0 ? (
          <li className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-600">
            No fields yet. Add your first field below.
          </li>
        ) : (
          drafts.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900/40"
            >
              <GripVertical
                className="size-4 shrink-0 text-gray-300"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {f.label}
                  {f.required ? (
                    <span className="text-error-500"> *</span>
                  ) : null}
                </p>
                <p className="text-xs text-gray-500">
                  {BUILDER_WIDGET_OPTIONS.find((w) => w.value === f.widget)
                    ?.label ?? f.widget}
                  {f.widget === "FILE" && f.allowMultiple
                    ? " · multiple files"
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeField(f.id)}
                className="rounded p-1.5 text-gray-400 hover:bg-error-50 hover:text-error-600"
                aria-label={`Remove ${f.label}`}
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))
        )}
      </ul>

      {adding ? (
        <div className="mt-4 space-y-3 rounded-xl border border-brand-200 bg-brand-50/30 p-4 dark:border-brand-800 dark:bg-brand-950/20">
          <div>
            <Label>Field label *</Label>
            <Input
              value={newField.label}
              onChange={(e) =>
                setNewField((f) => ({ ...f, label: e.target.value }))
              }
              placeholder="e.g. TIN number, Registration certificate"
            />
          </div>
          <div>
            <Label>Input type</Label>
            <select
              className={selectClass}
              value={newField.widget}
              onChange={(e) =>
                setNewField((f) => ({
                  ...f,
                  widget: e.target.value as WorkItemFieldWidgetType,
                }))
              }
            >
              {BUILDER_WIDGET_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {
                BUILDER_WIDGET_OPTIONS.find((o) => o.value === newField.widget)
                  ?.hint
              }
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={newField.required}
              onChange={(e) =>
                setNewField((f) => ({ ...f, required: e.target.checked }))
              }
              className="size-4 rounded"
            />
            Required field
          </label>
          {newField.widget === "FILE" ? (
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={newField.allowMultiple}
                onChange={(e) =>
                  setNewField((f) => ({
                    ...f,
                    allowMultiple: e.target.checked,
                  }))
                }
                className="size-4 rounded"
              />
              Allow more than one file
            </label>
          ) : null}
          {newField.widget === "SELECT" ? (
            <div>
              <Label>Dropdown options (one per line)</Label>
              <textarea
                value={newField.optionsText}
                onChange={(e) =>
                  setNewField((f) => ({ ...f, optionsText: e.target.value }))
                }
                rows={3}
                placeholder={"Online portal\nWalk-in\nAgent"}
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
          ) : null}
          {newField.widget === "CUSTOMER_LINK" ? (
            <div>
              <Label>Customer data field</Label>
              <select
                className={selectClass}
                value={newField.customerFieldKey}
                onChange={(e) =>
                  setNewField((f) => ({
                    ...f,
                    customerFieldKey: e.target.value as CustomerFieldKey | "",
                  }))
                }
              >
                <option value="">Select…</option>
                {CUSTOMER_KEYS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={addField}>
              Add field
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAdding(false);
                setNewField(emptyDraft());
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="mt-4 w-full"
          onClick={() => setAdding(true)}
        >
          <Plus className="mr-1.5 size-4" aria-hidden />
          Add field
        </Button>
      )}

      <div className="mt-6 flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-800">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? "Saving…" : "Save field setup"}
        </Button>
      </div>
    </Modal>
  );
}
