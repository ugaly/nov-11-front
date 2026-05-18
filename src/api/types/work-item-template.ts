/**
 * Frontend contract for per-task template fields (backend TBD).
 * Drives component-based rendering: inputs, files, tables, customer links.
 */
export type WorkItemFieldWidgetType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "DATE"
  | "SELECT"
  | "RADIO"
  | "CHECKBOX"
  | "FILE"
  | "TABLE"
  | "CUSTOMER_LINK";

/** Keys on CustomerResponse that can pre-fill or display read-only. */
export type CustomerFieldKey =
  | "name"
  | "legalName"
  | "registrationNumber"
  | "tin"
  | "contactEmail"
  | "contactPhone"
  | "address"
  | "city"
  | "country";

export interface WorkItemFieldOption {
  value: string;
  label: string;
}

export interface WorkItemFieldDefinition {
  id: string;
  label: string;
  description?: string | null;
  widget: WorkItemFieldWidgetType;
  required?: boolean;
  sortOrder?: number;
  /** For SELECT / RADIO */
  options?: WorkItemFieldOption[];
  /** Pre-fill or show customer data when present */
  customerFieldKey?: CustomerFieldKey;
  /** FILE: allow multiple uploads */
  allowMultiple?: boolean;
  /** TABLE: column definitions (future) */
  tableColumns?: { id: string; label: string }[];
}

export type WorkItemFileKind =
  | "image"
  | "pdf"
  | "spreadsheet"
  | "document"
  | "other";

/** Local file metadata + data URL for preview until upload API exists. */
export interface WorkItemFileAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  kind: WorkItemFileKind;
  /** Base64 data URL for preview / download in-session and localStorage. */
  dataUrl: string;
}

export interface WorkItemFieldValue {
  fieldId: string;
  value?: string | number | boolean | null;
  /** @deprecated Use `attachments` — kept for older saved values. */
  fileNames?: string[];
  attachments?: WorkItemFileAttachment[];
}

export interface WorkItemExecutionDto {
  workItemId: string;
  status: import("@/api/types/template-config").WorkItemStatus;
  fields: WorkItemFieldDefinition[];
  values: WorkItemFieldValue[];
}
