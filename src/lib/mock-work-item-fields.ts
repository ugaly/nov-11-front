import type { WorkItemFieldDefinition } from "@/api/types/work-item-template";

/**
 * Placeholder field schemas until GET …/work-items/{id}/template exists.
 * Varies by task index so you can preview different widget types.
 */
export function mockFieldsForTask(
  taskId: string,
  taskIndex: number
): WorkItemFieldDefinition[] {
  const base = taskId.slice(-4);
  const sets: WorkItemFieldDefinition[][] = [
    [
      {
        id: `${base}-tin`,
        label: "TIN number",
        widget: "TEXT",
        required: true,
        customerFieldKey: "tin",
      },
      {
        id: `${base}-reg`,
        label: "Registration certificate",
        widget: "FILE",
        required: true,
        allowMultiple: true,
      },
      {
        id: `${base}-notes`,
        label: "Officer notes",
        widget: "TEXTAREA",
      },
    ],
    [
      {
        id: `${base}-method`,
        label: "Filing method",
        widget: "RADIO",
        required: true,
        options: [
          { value: "online", label: "Online portal" },
          { value: "walkin", label: "Walk-in" },
        ],
      },
      {
        id: `${base}-office`,
        label: "Responsible office",
        widget: "SELECT",
        options: [
          { value: "hq", label: "Head office" },
          { value: "branch", label: "Branch" },
        ],
      },
      {
        id: `${base}-contact`,
        label: "Primary contact",
        widget: "CUSTOMER_LINK",
        customerFieldKey: "contactEmail",
      },
    ],
    [
      {
        id: `${base}-confirm`,
        label: "Client confirmed requirements",
        widget: "CHECKBOX",
      },
      {
        id: `${base}-deadline`,
        label: "Target completion",
        widget: "DATE",
      },
      {
        id: `${base}-amount`,
        label: "Quoted amount",
        widget: "NUMBER",
      },
    ],
  ];

  return sets[taskIndex % sets.length]!;
}
