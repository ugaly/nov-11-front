import type {
  WorkItemFieldDefinition,
  WorkItemFieldGroup,
} from "@/api/types/work-item-template";

export type FieldLayoutSection = {
  kind: "ungrouped" | "group";
  group?: WorkItemFieldGroup;
  fields: WorkItemFieldDefinition[];
};

function sortByOrder<T extends { sortOrder?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

/** Ungrouped fields first, then groups by sortOrder; fields within each section by sortOrder. */
export function buildFieldLayout(
  fields: WorkItemFieldDefinition[],
  groups: WorkItemFieldGroup[] = []
): FieldLayoutSection[] {
  const groupMap = new Map(groups.map((g) => [g.id, g]));
  const sections: FieldLayoutSection[] = [];

  const ungrouped = sortByOrder(
    fields.filter((f) => !f.groupId || !groupMap.has(f.groupId))
  );
  if (ungrouped.length) {
    sections.push({ kind: "ungrouped", fields: ungrouped });
  }

  for (const group of sortByOrder(groups)) {
    const groupFields = sortByOrder(fields.filter((f) => f.groupId === group.id));
    if (groupFields.length) {
      sections.push({ kind: "group", group, fields: groupFields });
    }
  }

  return sections;
}

export function assignFieldLayoutSortOrders(
  fields: WorkItemFieldDefinition[],
  groups: WorkItemFieldGroup[] = []
): WorkItemFieldDefinition[] {
  const sections = buildFieldLayout(fields, groups);
  const next: WorkItemFieldDefinition[] = [];
  let order = 0;
  for (const section of sections) {
    for (const field of section.fields) {
      next.push({ ...field, sortOrder: order++ });
    }
  }
  return next;
}

export function assignGroupSortOrders(
  groups: WorkItemFieldGroup[]
): WorkItemFieldGroup[] {
  return groups.map((group, index) => ({
    ...group,
    sortOrder: index,
  }));
}
