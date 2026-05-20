import type {
  WorkItemFieldDefinition,
  WorkItemFieldValue,
  WorkItemFileAttachment,
} from "@/api/types/work-item-template";
import { getAttachments } from "@/lib/work-item-file-utils";

function fieldValueHasData(
  field: WorkItemFieldDefinition,
  value?: WorkItemFieldValue
): boolean {
  if (!value) return false;
  switch (field.widget) {
    case "CHECKBOX":
      return Boolean(value.value);
    case "FILE":
      return getAttachments(value).length > 0;
    case "TABLE":
      return (value.tableRows?.length ?? 0) > 0;
    default:
      return value.value != null && String(value.value).trim() !== "";
  }
}

/** True when execution/closure from the API has something worth exporting. */
export function workItemHasExportableData(
  fields: WorkItemFieldDefinition[],
  values: WorkItemFieldValue[],
  options?: {
    closureRemark?: string | null;
    closureSubmittedAt?: string | null;
    outputFiles?: WorkItemFileAttachment[];
  }
): boolean {
  if (options?.closureSubmittedAt) return true;
  if ((options?.closureRemark ?? "").trim()) return true;
  if ((options?.outputFiles?.length ?? 0) > 0) return true;

  const map = Object.fromEntries(values.map((v) => [v.fieldId, v]));
  return fields.some((f) => fieldValueHasData(f, map[f.id]));
}

export function formatFieldValueForExport(
  field: WorkItemFieldDefinition,
  value?: WorkItemFieldValue
): string {
  if (!value) return "—";
  switch (field.widget) {
    case "CHECKBOX":
      return value.value ? "Yes" : "No";
    case "FILE": {
      const files = getAttachments(value);
      if (!files.length) return "—";
      return files.map((f) => f.name).join(", ");
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
    case "TABLE":
      if (value.tableRows?.length) {
        return `${value.tableRows.length} row(s)`;
      }
      return "—";
    default:
      return value.value != null && String(value.value).trim() !== ""
        ? String(value.value)
        : "—";
  }
}
