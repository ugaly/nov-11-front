"use client";

import type {
  CustomerFieldKey,
  WorkItemFieldDefinition,
  WorkItemFieldGroup,
  WorkItemFieldWidgetType,
} from "@/api/types/work-item-template";
import { setupFormModalClass } from "@/components/setup/setupFormModal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { BUILDER_WIDGET_OPTIONS, isFileWidget } from "@/lib/field-widget-meta";
import {
  assignFieldLayoutSortOrders,
  assignGroupSortOrders,
} from "@/lib/work-item-field-layout";
import {
  findDuplicateFieldIds,
  newFieldId,
  newGroupId,
} from "@/lib/work-item-field-store";
import { Copy, GripVertical, Layers, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  groupId: string | null;
};

type DraftGroup = {
  id: string;
  name: string;
};

/** Where the inline field editor is open: standalone list or a specific group. */
type AddFieldTarget = "standalone" | string;

export type FieldBuilderSavePayload = {
  fields: WorkItemFieldDefinition[];
  groups: WorkItemFieldGroup[];
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
    groupId: f.groupId ?? null,
  };
}

function fromDraft(d: DraftField): WorkItemFieldDefinition {
  const base: WorkItemFieldDefinition = {
    id: d.id,
    label: d.label.trim(),
    widget: d.widget,
    required: d.required,
    groupId: d.groupId,
  };
  if (isFileWidget(d.widget)) {
    base.allowMultiple = d.allowMultiple;
  }
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

function emptyDraft(groupId: string | null = null): DraftField {
  return {
    id: newFieldId(),
    label: "",
    widget: "TEXT",
    required: false,
    allowMultiple: false,
    optionsText: "",
    customerFieldKey: "",
    groupId,
  };
}

function FieldEditor({
  draft,
  onChange,
  onCancel,
  onSubmit,
  submitLabel,
}: {
  draft: DraftField;
  onChange: (next: DraftField) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-brand-200 bg-brand-50/30 p-4 dark:border-brand-800 dark:bg-brand-950/20">
      <div>
        <Label>Field label *</Label>
        <Input
          value={draft.label}
          onChange={(e) => onChange({ ...draft, label: e.target.value })}
          placeholder="e.g. TIN number, Director name"
        />
      </div>
      <div>
        <Label>Input type</Label>
        <select
          className={selectClass}
          value={draft.widget}
          onChange={(e) =>
            onChange({
              ...draft,
              widget: e.target.value as WorkItemFieldWidgetType,
            })
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
            BUILDER_WIDGET_OPTIONS.find((o) => o.value === draft.widget)
              ?.hint
          }
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={draft.required}
          onChange={(e) => onChange({ ...draft, required: e.target.checked })}
          className="size-4 rounded"
        />
        Required field
      </label>
      {isFileWidget(draft.widget) ? (
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={draft.allowMultiple}
            onChange={(e) =>
              onChange({ ...draft, allowMultiple: e.target.checked })
            }
            className="size-4 rounded"
          />
          Allow more than one file
        </label>
      ) : null}
      {draft.widget === "SELECT" ? (
        <div>
          <Label>Dropdown options (one per line)</Label>
          <textarea
            value={draft.optionsText}
            onChange={(e) =>
              onChange({ ...draft, optionsText: e.target.value })
            }
            rows={3}
            placeholder={"Online portal\nWalk-in\nAgent"}
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
      ) : null}
      {draft.widget === "CUSTOMER_LINK" ? (
        <div>
          <Label>Customer data field</Label>
          <select
            className={selectClass}
            value={draft.customerFieldKey}
            onChange={(e) =>
              onChange({
                ...draft,
                customerFieldKey: e.target.value as CustomerFieldKey | "",
              })
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
        <Button type="button" size="sm" onClick={onSubmit}>
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function FieldBuilderModal({
  open,
  onClose,
  taskName,
  initialFields,
  initialGroups = [],
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  taskName: string;
  initialFields: WorkItemFieldDefinition[];
  initialGroups?: WorkItemFieldGroup[];
  onSave: (payload: FieldBuilderSavePayload) => void | Promise<void>;
}) {
  const [fieldDrafts, setFieldDrafts] = useState<DraftField[]>([]);
  const [groupDrafts, setGroupDrafts] = useState<DraftGroup[]>([]);
  const [addFieldTarget, setAddFieldTarget] = useState<AddFieldTarget | null>(
    null
  );
  const [newField, setNewField] = useState<DraftField>(emptyDraft());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFieldDrafts(initialFields.map(toDraft));
      setGroupDrafts(
        initialGroups.map((group) => ({ id: group.id, name: group.name }))
      );
      setAddFieldTarget(null);
      setNewField(emptyDraft());
      setError(null);
    }
  }, [open, initialFields, initialGroups]);

  const standaloneFields = useMemo(
    () => fieldDrafts.filter((field) => !field.groupId),
    [fieldDrafts]
  );

  function fieldsInGroup(groupId: string) {
    return fieldDrafts.filter((field) => field.groupId === groupId);
  }

  function openStandaloneFieldEditor() {
    setAddFieldTarget("standalone");
    setNewField(emptyDraft(null));
    setError(null);
  }

  function openGroupFieldEditor(groupId: string) {
    setAddFieldTarget(groupId);
    setNewField(emptyDraft(groupId));
    setError(null);
  }

  function closeFieldEditor() {
    setAddFieldTarget(null);
    setNewField(emptyDraft());
  }

  function addGroup() {
    const group: DraftGroup = { id: newGroupId(), name: "" };
    setGroupDrafts((current) => [...current, group]);
    setAddFieldTarget(group.id);
    setNewField(emptyDraft(group.id));
    setError(null);
  }

  function duplicateGroup(groupId: string) {
    const sourceGroup = groupDrafts.find((group) => group.id === groupId);
    if (!sourceGroup) return;
    const newGroup: DraftGroup = {
      id: newGroupId(),
      name: `${sourceGroup.name.trim() || "Group"} (copy)`,
    };
    const clones = fieldDrafts
      .filter((field) => field.groupId === groupId)
      .map((field) => ({
        ...field,
        id: newFieldId(),
        groupId: newGroup.id,
      }));
    setGroupDrafts((current) => [...current, newGroup]);
    setFieldDrafts((current) => [...current, ...clones]);
  }

  function removeGroup(groupId: string) {
    setGroupDrafts((current) => current.filter((group) => group.id !== groupId));
    setFieldDrafts((current) =>
      current.filter((field) => field.groupId !== groupId)
    );
    if (addFieldTarget === groupId) {
      closeFieldEditor();
    }
  }

  function updateGroupName(groupId: string, name: string) {
    setGroupDrafts((current) =>
      current.map((group) => (group.id === groupId ? { ...group, name } : group))
    );
  }

  function removeField(id: string) {
    setFieldDrafts((current) => current.filter((field) => field.id !== id));
  }

  function updateFieldLabel(id: string, label: string) {
    setFieldDrafts((current) =>
      current.map((field) => (field.id === id ? { ...field, label } : field))
    );
  }

  function commitNewField() {
    const label = newField.label.trim();
    if (!label) {
      setError("Enter a field label (e.g. TIN number).");
      return;
    }

    const groupId =
      addFieldTarget === "standalone" || addFieldTarget == null
        ? null
        : addFieldTarget;

    if (groupId) {
      const group = groupDrafts.find((item) => item.id === groupId);
      if (!group?.name.trim()) {
        setError("Enter a group name before adding fields to this group.");
        return;
      }
    }

    setFieldDrafts((current) => [
      ...current,
      {
        ...newField,
        id: newFieldId(),
        label,
        groupId,
      },
    ]);
    setNewField(emptyDraft(groupId));
    setError(null);
    if (addFieldTarget === "standalone") {
      setAddFieldTarget(null);
    }
  }

  function renderFieldRow(field: DraftField) {
    return (
      <li
        key={field.id}
        className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900/40"
      >
        <GripVertical className="size-4 shrink-0 text-gray-300" aria-hidden />
        <div className="min-w-0 flex-1">
          <input
            value={field.label}
            onChange={(e) => updateFieldLabel(field.id, e.target.value)}
            placeholder="Field label"
            className="h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-sm font-medium text-gray-900 focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white dark:focus:bg-gray-900"
          />
          <p className="mt-0.5 text-xs text-gray-500">
            {BUILDER_WIDGET_OPTIONS.find((option) => option.value === field.widget)
              ?.label ?? field.widget}
            {isFileWidget(field.widget) && field.allowMultiple
              ? " · multiple files"
              : ""}
            {field.required ? " · required" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => removeField(field.id)}
          className="rounded p-1.5 text-gray-400 hover:bg-error-50 hover:text-error-600"
          aria-label={`Remove ${field.label}`}
        >
          <Trash2 className="size-4" />
        </button>
      </li>
    );
  }

  async function handleSave() {
    const validGroups = groupDrafts
      .map((group) => ({ ...group, name: group.name.trim() }))
      .filter((group) => {
        const hasFields = fieldsInGroup(group.id).some((field) =>
          field.label.trim()
        );
        return group.name && hasFields;
      });

    const validFields = fieldDrafts.filter((draft) => draft.label.trim());
    if (!validFields.length) {
      setError("Add at least one field before saving.");
      return;
    }

    for (const group of validGroups) {
      const unnamedWithFields = groupDrafts.some(
        (item) =>
          item.id === group.id &&
          !item.name.trim() &&
          fieldsInGroup(item.id).some((field) => field.label.trim())
      );
      if (unnamedWithFields) {
        setError("Every group with fields needs a name.");
        return;
      }
    }

    const groups = assignGroupSortOrders(
      validGroups.map((group, index) => ({
        id: group.id,
        name: group.name,
        sortOrder: index,
      }))
    );
    const fields = assignFieldLayoutSortOrders(
      validFields.map(fromDraft),
      groups
    );
    const dupes = findDuplicateFieldIds(fields);
    if (dupes.length) {
      setError("Two fields share the same id. Remove one and add it again.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({ fields, groups });
      onClose();
    } catch {
      setError("Could not save fields. Try again or refresh the page.");
    } finally {
      setSaving(false);
    }
  }

  const hasAnyContent =
    standaloneFields.some((field) => field.label.trim()) ||
    groupDrafts.length > 0;

  return (
    <Modal isOpen={open} onClose={onClose} className={setupFormModalClass}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Choose fields to capture
          </h3>
          <p className="mt-1 text-sm text-gray-500">{taskName}</p>
          <p className="mt-2 text-xs text-gray-500">
            Use <strong>Add field</strong> for standalone inputs (same as
            before). Use <strong>Add group</strong> when several fields belong
            together — name the group, then add fields inside it.
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

      <div className="mt-5 space-y-5">
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Standalone fields
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openStandaloneFieldEditor}
            >
              <Plus className="mr-1 size-3.5" aria-hidden />
              Add field
            </Button>
          </div>
          {standaloneFields.length ? (
            <ul className="space-y-2">
              {standaloneFields.map((field) => renderFieldRow(field))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-xs text-gray-500 dark:border-gray-700">
              No standalone fields yet. Click Add field to define one (label,
              type, required, etc.).
            </p>
          )}
          {addFieldTarget === "standalone" ? (
            <div className="mt-3">
              <FieldEditor
                draft={newField}
                onChange={setNewField}
                onCancel={closeFieldEditor}
                onSubmit={commitNewField}
                submitLabel="Add field"
              />
            </div>
          ) : null}
        </section>

        {groupDrafts.map((group) => {
          const groupFields = fieldsInGroup(group.id);
          const isAddingHere = addFieldTarget === group.id;

          return (
            <section
              key={group.id}
              className="rounded-xl border border-brand-200/80 bg-brand-50/20 p-4 dark:border-brand-900 dark:bg-brand-950/15"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Layers className="size-4 shrink-0 text-brand-500" aria-hidden />
                <div className="min-w-[12rem] flex-1">
                  <Label className="sr-only">Group name</Label>
                  <Input
                    value={group.name}
                    onChange={(e) => updateGroupName(group.id, e.target.value)}
                    placeholder="Group name (e.g. Local director)"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openGroupFieldEditor(group.id)}
                >
                  <Plus className="mr-1 size-3.5" aria-hidden />
                  Add field to group
                </Button>
                {groupFields.length ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateGroup(group.id)}
                  >
                    <Copy className="mr-1 size-3.5" aria-hidden />
                    Duplicate group
                  </Button>
                ) : null}
                <button
                  type="button"
                  onClick={() => removeGroup(group.id)}
                  className="rounded p-1.5 text-gray-400 hover:bg-error-50 hover:text-error-600"
                  aria-label={`Remove group ${group.name || "untitled"}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <p className="mb-3 text-xs text-gray-500">
                Fields you add here appear under this group heading on the form.
              </p>
              {groupFields.length ? (
                <ul className="space-y-2">
                  {groupFields.map((field) => renderFieldRow(field))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500 italic">
                  Name this group, then use “Add field to group”.
                </p>
              )}
              {isAddingHere ? (
                <div className="mt-3">
                  <FieldEditor
                    draft={newField}
                    onChange={setNewField}
                    onCancel={closeFieldEditor}
                    onSubmit={commitNewField}
                    submitLabel="Add field to group"
                  />
                </div>
              ) : null}
            </section>
          );
        })}

        {!hasAnyContent ? (
          <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-600">
            Start with a standalone field, or create a group for related inputs.
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={openStandaloneFieldEditor}>
          <Plus className="mr-1.5 size-4" aria-hidden />
          Add field
        </Button>
        <Button type="button" variant="outline" onClick={addGroup}>
          <Layers className="mr-1.5 size-4" aria-hidden />
          Add group
        </Button>
      </div>

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
