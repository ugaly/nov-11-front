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
    hint: "Upload one or more files",
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

export function widgetLabel(widget: WorkItemFieldWidgetType): string {
  return (
    BUILDER_WIDGET_OPTIONS.find((o) => o.value === widget)?.label ?? widget
  );
}
