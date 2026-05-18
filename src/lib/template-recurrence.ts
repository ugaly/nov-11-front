import type {
  CreateServiceCatalogRequest,
  EngagementPeriodDto,
  RecurrenceInputFields,
  RecurrenceIntervalUnit,
  RecurrenceType,
  ServiceCatalogResponse,
} from "@/api/types/template-config";

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
