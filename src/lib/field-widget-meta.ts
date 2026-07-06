import type { WorkItemFieldWidgetType } from "@/api/types/work-item-template";

export const BUILDER_WIDGET_OPTIONS: {
  value: WorkItemFieldWidgetType;
  label: string;
  hint: string;
}[] = [
  { value: "TEXT", label: "Short text", hint: "e.g. TIN number, reference ID" },
  {
    value: "TEXTAREA",
    label: "Long text / notes",
    hint: "e.g. office notes, description",
  },
  { value: "NUMBER", label: "Number", hint: "Amounts, counts" },
  { value: "DATE", label: "Date", hint: "Deadlines, filing date" },
  {
    value: "FILE",
    label: "Documents",
    hint: "Customer can upload on shared form links",
  },
  {
    value: "INTERNAL_FILE",
    label: "Staff document",
    hint: "You upload; customer can view only on shared links",
  },
  { value: "CHECKBOX", label: "Yes / No", hint: "Confirmation checkbox" },
  {
    value: "SELECT",
    label: "Dropdown",
    hint: "Choose one option from a list",
  },
  {
    value: "CUSTOMER_LINK",
    label: "From customer record",
    hint: "Show or collect linked customer data",
  },
];

export function isFileWidget(widget: WorkItemFieldWidgetType): boolean {
  return widget === "FILE" || widget === "INTERNAL_FILE";
}

/** Customer-facing public forms cannot edit staff document fields. */
export function isStaffOnlyFileWidget(widget: WorkItemFieldWidgetType): boolean {
  return widget === "INTERNAL_FILE";
}

export function widgetLabel(widget: WorkItemFieldWidgetType): string {
  return (
    BUILDER_WIDGET_OPTIONS.find((o) => o.value === widget)?.label ?? widget
  );
}
