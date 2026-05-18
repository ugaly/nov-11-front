import type {
  CatalogNodeInputFields,
  Currency,
  PricingInputFields,
  PricingTimelineDto,
  TimelineUnit,
} from "@/api/types/template-config";

export type PricingFormState = {
  price: string;
  currency: Currency;
  timelineValue: string;
  timelineUnit: TimelineUnit;
};

const TIMELINE_UNIT_LABEL: Record<TimelineUnit, { one: string; other: string }> =
  {
    DAY: { one: "day", other: "days" },
    WEEK: { one: "week", other: "weeks" },
    FORTNIGHT: { one: "fortnight", other: "fortnights" },
    MONTH: { one: "month", other: "months" },
    YEAR: { one: "year", other: "years" },
  };

export const emptyPricingForm = (): PricingFormState => ({
  price: "",
  currency: "TZS",
  timelineValue: "",
  timelineUnit: "DAY",
});

export function appendPricingFields<T extends PricingInputFields>(
  body: T,
  form: PricingFormState
): T {
  const priceTrim = form.price.trim();
  if (priceTrim) {
    const n = Number.parseFloat(priceTrim);
    if (!Number.isNaN(n)) {
      body.price = n;
      body.currency = form.currency;
    }
  }
  const tv = form.timelineValue.trim();
  if (tv) {
    const n = Number.parseInt(tv, 10);
    if (!Number.isNaN(n)) {
      body.timelineValue = n;
      body.timelineUnit = form.timelineUnit;
    }
  }
  return body;
}

/** Catalog nodes: `duration` + `durationUnit` (not timelineValue). */
export function appendCatalogNodeFields<T extends CatalogNodeInputFields>(
  body: T,
  form: PricingFormState
): T {
  const priceTrim = form.price.trim();
  if (priceTrim) {
    const n = Number.parseFloat(priceTrim);
    if (!Number.isNaN(n)) {
      body.price = n;
      body.currency = form.currency;
    }
  }
  const dv = form.timelineValue.trim();
  if (dv) {
    const n = Number.parseInt(dv, 10);
    if (!Number.isNaN(n)) {
      body.duration = n;
      body.durationUnit = form.timelineUnit;
    }
  }
  return body;
}

export function validateCatalogNodePricingForm(
  form: PricingFormState
): string | null {
  const hasPrice = form.price.trim() !== "";
  const hasDuration = form.timelineValue.trim() !== "";
  if (hasPrice && !form.currency) {
    return "Currency is required when price is set.";
  }
  if (hasDuration && !form.timelineUnit) {
    return "Duration unit is required when duration is set.";
  }
  return null;
}

/** Sum `price` on work items that have a numeric price (list/detail workItems). */
export function sumWorkItemPrices(
  items: { pricing?: PricingTimelineDto | null }[]
): { total: number; currency: string | null } {
  let total = 0;
  let currency: string | null = null;
  for (const item of items) {
    const p = item.pricing?.price;
    const c = item.pricing?.currency;
    if (p != null && !Number.isNaN(p)) {
      total += p;
      if (c) currency = c;
    }
  }
  return { total, currency };
}

function pluralUnit(
  value: number,
  unit: TimelineUnit
): string {
  const labels = TIMELINE_UNIT_LABEL[unit];
  return value === 1 ? labels.one : labels.other;
}

export function formatPricing(
  pricing: PricingTimelineDto | null | undefined
): string {
  if (!pricing) return "—";
  const parts: string[] = [];
  if (pricing.price != null && pricing.currency) {
    parts.push(
      `${pricing.currency} ${pricing.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    );
  }
  const duration = formatDurationOnly(pricing);
  if (duration !== "—") parts.push(duration);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

export function formatPriceOnly(
  pricing: PricingTimelineDto | null | undefined
): string {
  if (!pricing || pricing.price == null || !pricing.currency) return "—";
  return `${pricing.currency} ${pricing.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export type DurationDisplay = {
  primary: string | null;
  /** Normalized total in days when different from a simple day count */
  normalizedDays: number | null;
};

export function getDurationDisplay(
  pricing: PricingTimelineDto | null | undefined
): DurationDisplay {
  if (!pricing) return { primary: null, normalizedDays: null };

  let primary: string | null = null;
  if (pricing.duration != null && pricing.durationUnit) {
    const n = pricing.duration;
    primary = `${n} ${pluralUnit(n, pricing.durationUnit)}`;
  } else if (pricing.timelineValue != null && pricing.timelineUnit) {
    const n = pricing.timelineValue;
    primary = `${n} ${pluralUnit(n, pricing.timelineUnit)}`;
  } else if (pricing.approximateDays != null) {
    const n = pricing.approximateDays;
    primary = `${n} ${n === 1 ? "day" : "days"}`;
  }

  const norm = pricing.normalizedDuration;
  const normalizedDays =
    norm?.unit === "DAY" && norm.value != null && !Number.isNaN(norm.value)
      ? norm.value
      : null;

  if (!primary && normalizedDays != null) {
    primary = `${normalizedDays} ${normalizedDays === 1 ? "day" : "days"}`;
    return { primary, normalizedDays: null };
  }

  if (
    normalizedDays != null &&
    pricing.durationUnit &&
    pricing.durationUnit !== "DAY"
  ) {
    return { primary, normalizedDays };
  }

  if (
    normalizedDays != null &&
    pricing.duration != null &&
    pricing.durationUnit === "DAY" &&
    pricing.duration !== normalizedDays
  ) {
    return { primary, normalizedDays };
  }

  return { primary, normalizedDays: null };
}

/** Duration with value + unit (e.g. `45 weeks (315 days total)`). */
export function formatDurationOnly(
  pricing: PricingTimelineDto | null | undefined
): string {
  const { primary, normalizedDays } = getDurationDisplay(pricing);
  if (!primary) return "—";
  if (normalizedDays != null) {
    return `${primary} (${normalizedDays} days total)`;
  }
  return primary;
}

/** @deprecated Use formatDurationOnly */
export const formatDaysOnly = formatDurationOnly;
