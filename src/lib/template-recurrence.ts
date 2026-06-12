import type {
  CreateServiceCatalogRequest,
  CustomerEngagementResponse,
  EngagementPeriodDto,
  EngagementPeriodInstanceDto,
  RecurrenceInputFields,
  RecurrenceIntervalUnit,
  RecurrenceType,
  ServiceCatalogNodeResponse,
  ServiceCatalogResponse,
} from "@/api/types/template-config";
import {
  findTopLevelRootForWorkItem,
  type WorkItemTreeNode,
} from "@/lib/work-item-tree";

export const DEFAULT_RECURRENCE_TYPES: RecurrenceType[] = [
  "ONE_OFF",
  "QUARTERLY",
  "SEMI_ANNUAL",
  "ANNUAL",
  "CUSTOM",
];

export const RECURRENCE_INTERVAL_UNITS: RecurrenceIntervalUnit[] = [
  "DAY",
  "WEEK",
  "MONTH",
  "YEAR",
];

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  ONE_OFF: "One-off",
  QUARTERLY: "Quarterly",
  SEMI_ANNUAL: "Semi-annual",
  ANNUAL: "Annual",
  CUSTOM: "Custom interval",
};

export type RecurrenceFormState = {
  recurrenceType: RecurrenceType;
  recurrenceIntervalValue: string;
  recurrenceIntervalUnit: RecurrenceIntervalUnit;
  catalogEffectiveFrom: string;
  catalogEffectiveTo: string;
};

export const emptyRecurrenceForm = (): RecurrenceFormState => ({
  recurrenceType: "ONE_OFF",
  recurrenceIntervalValue: "",
  recurrenceIntervalUnit: "DAY",
  catalogEffectiveFrom: "",
  catalogEffectiveTo: "",
});

export function appendRecurrenceFields<T extends RecurrenceInputFields>(
  body: T,
  form: RecurrenceFormState
): T {
  body.recurrenceType = form.recurrenceType;
  if (form.catalogEffectiveFrom.trim()) {
    body.catalogEffectiveFrom = form.catalogEffectiveFrom.trim();
  }
  if (form.catalogEffectiveTo.trim()) {
    body.catalogEffectiveTo = form.catalogEffectiveTo.trim();
  } else if (form.catalogEffectiveFrom.trim()) {
    body.catalogEffectiveTo = null;
  }
  if (form.recurrenceType === "CUSTOM") {
    const v = form.recurrenceIntervalValue.trim();
    if (v) {
      const n = Number.parseInt(v, 10);
      if (!Number.isNaN(n)) {
        body.recurrenceIntervalValue = n;
        body.recurrenceIntervalUnit = form.recurrenceIntervalUnit;
      }
    }
  }
  return body;
}

export function nodeRecurrenceType(
  node: Pick<ServiceCatalogNodeResponse, "recurrence">
): RecurrenceType {
  return node.recurrence?.recurrenceType ?? "ONE_OFF";
}

export function isRecurringType(
  type: RecurrenceType | null | undefined
): boolean {
  return type != null && type !== "ONE_OFF";
}

export function periodsForCatalogRoot(
  engagement: Pick<CustomerEngagementResponse, "periods">,
  catalogNodeId: string | null,
  singleRoot: boolean
): EngagementPeriodInstanceDto[] {
  if (!catalogNodeId) return [];
  return [...(engagement.periods ?? [])]
    .filter(
      (p) =>
        p.catalogNodeId === catalogNodeId ||
        (!p.catalogNodeId && singleRoot)
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Map the selected period tab to the period id for a task's recurring root (by sort order). */
export function resolveTaskPeriodId(
  taskId: string,
  tree: WorkItemTreeNode[],
  engagement: CustomerEngagementResponse,
  activePeriodId: string | null
): string | null {
  const topRoot = findTopLevelRootForWorkItem(taskId, tree);
  if (!topRoot?.catalogNodeId) return null;
  const rootGroups = tree.filter((n) => n.nodeType === "GROUP");
  const singleRoot = rootGroups.length === 1;
  if (
    !isRecurringWorkRoot(
      topRoot,
      engagement,
      topRoot.catalogNodeId,
      singleRoot
    )
  ) {
    return null;
  }
  const taskPeriods = periodsForCatalogRoot(
    engagement,
    topRoot.catalogNodeId,
    singleRoot
  );
  if (taskPeriods.length === 0) return null;
  if (!activePeriodId) return taskPeriods[0]!.id;

  const allPeriods = [...(engagement.periods ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
  const active = allPeriods.find((p) => p.id === activePeriodId);
  if (!active) return taskPeriods[0]!.id;

  const activeRootPeriods = periodsForCatalogRoot(
    engagement,
    active.catalogNodeId,
    singleRoot
  );
  const idx = activeRootPeriods.findIndex((p) => p.id === activePeriodId);
  if (idx < 0) return taskPeriods[0]!.id;
  return taskPeriods[idx]?.id ?? taskPeriods[0]!.id;
}

/** Detect recurring root from work item, engagement periods, or engagement summary. */
export function isRecurringWorkRoot(
  root: { recurrence?: { recurrenceType?: RecurrenceType } | null } | undefined,
  engagement: {
    period?: { recurrenceType?: RecurrenceType | null } | null;
    periods?: { catalogNodeId?: string | null }[] | null;
  },
  catalogNodeId: string | null,
  singleRoot: boolean
): boolean {
  if (!root) return false;
  if (isRecurringType(root.recurrence?.recurrenceType)) return true;
  if (
    catalogNodeId &&
    (engagement.periods ?? []).some((p) => p.catalogNodeId === catalogNodeId)
  ) {
    return true;
  }
  if (
    singleRoot &&
    isRecurringType(engagement.period?.recurrenceType ?? null)
  ) {
    return true;
  }
  return false;
}

export function formatNodeRecurrence(
  node: Pick<ServiceCatalogNodeResponse, "recurrence">
): string {
  if (!node.recurrence?.recurrenceType) return "—";
  const parts: string[] = [RECURRENCE_LABELS[node.recurrence.recurrenceType]];
  if (
    node.recurrence.recurrenceType === "CUSTOM" &&
    node.recurrence.recurrenceIntervalValue != null &&
    node.recurrence.recurrenceIntervalUnit
  ) {
    parts.push(
      `every ${node.recurrence.recurrenceIntervalValue} ${node.recurrence.recurrenceIntervalUnit}`
    );
  }
  if (node.recurrence.summary) {
    parts.push(node.recurrence.summary);
  } else if (node.recurrence.catalogEffectiveFrom) {
    const range = node.recurrence.catalogEffectiveTo
      ? `${node.recurrence.catalogEffectiveFrom} → ${node.recurrence.catalogEffectiveTo}`
      : `from ${node.recurrence.catalogEffectiveFrom}`;
    parts.push(range);
  }
  return parts.join(" · ");
}

export function formatCatalogRecurrence(
  catalog: Pick<
    ServiceCatalogResponse,
    | "recurrenceType"
    | "recurrenceIntervalValue"
    | "recurrenceIntervalUnit"
    | "catalogEffectiveFrom"
    | "catalogEffectiveTo"
  >
): string {
  if (!catalog.recurrenceType) return "—";
  const parts: string[] = [RECURRENCE_LABELS[catalog.recurrenceType]];
  if (
    catalog.recurrenceType === "CUSTOM" &&
    catalog.recurrenceIntervalValue != null &&
    catalog.recurrenceIntervalUnit
  ) {
    parts.push(
      `every ${catalog.recurrenceIntervalValue} ${catalog.recurrenceIntervalUnit}`
    );
  }
  if (catalog.catalogEffectiveFrom) {
    const range = catalog.catalogEffectiveTo
      ? `${catalog.catalogEffectiveFrom} → ${catalog.catalogEffectiveTo}`
      : `from ${catalog.catalogEffectiveFrom}`;
    parts.push(range);
  }
  return parts.join(" · ");
}

export function formatEngagementPeriod(
  period: EngagementPeriodDto | null | undefined
): string {
  if (!period) return "—";
  if (period.summary) return period.summary;
  const parts: string[] = [];
  if (period.periodStart) {
    parts.push(period.periodEnd
      ? `${period.periodStart} → ${period.periodEnd}`
      : `from ${period.periodStart}`);
  }
  if (period.nextCycleStart) {
    parts.push(`next ${period.nextCycleStart}`);
  }
  return parts.length > 0 ? parts.join(" · ") : RECURRENCE_LABELS[period.recurrenceType];
}

/** Recurring catalogs need an explicit period start when creating an engagement. */
export function engagementRequiresPeriodStart(
  recurrenceType: RecurrenceType | null | undefined
): boolean {
  return (
    recurrenceType != null &&
    recurrenceType !== "ONE_OFF"
  );
}

export function recurrenceHint(
  recurrenceType: RecurrenceType | null | undefined
): string {
  switch (recurrenceType) {
    case "ONE_OFF":
      return "Period start is optional (defaults to today). Period end is usually empty.";
    case "ANNUAL":
      return "Period start is required. Period end defaults to start + 12 months if omitted.";
    case "QUARTERLY":
      return "Period start is required for this cycle.";
    case "SEMI_ANNUAL":
      return "Period start is required for this cycle.";
    case "CUSTOM":
      return "Period start is required. The catalog defines the repeat interval.";
    default:
      return "";
  }
}
