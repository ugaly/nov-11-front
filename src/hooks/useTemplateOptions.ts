"use client";

import { getServiceTemplateOptions } from "@/api/template-config/template-config.api";
import type {
  Currency,
  RecurrenceType,
  TimelineUnit,
} from "@/api/types/template-config";
import { DEFAULT_RECURRENCE_TYPES } from "@/lib/template-recurrence";
import { useCallback, useEffect, useState } from "react";

const DEFAULT_CURRENCIES: Currency[] = ["TZS", "USD"];
const DEFAULT_UNITS: TimelineUnit[] = [
  "DAY",
  "WEEK",
  "FORTNIGHT",
  "MONTH",
  "YEAR",
];

export function useTemplateOptions(companyId: string | null) {
  const [currencies, setCurrencies] = useState<Currency[]>(DEFAULT_CURRENCIES);
  const [timelineUnits, setTimelineUnits] =
    useState<TimelineUnit[]>(DEFAULT_UNITS);
  const [recurrenceTypes, setRecurrenceTypes] = useState<RecurrenceType[]>(
    DEFAULT_RECURRENCE_TYPES
  );
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const opts = await getServiceTemplateOptions(companyId);
      if (opts.currencies?.length) setCurrencies(opts.currencies);
      if (opts.timelineUnits?.length) setTimelineUnits(opts.timelineUnits);
      if (opts.recurrenceTypes?.length)
        setRecurrenceTypes(opts.recurrenceTypes);
    } catch {
      setCurrencies(DEFAULT_CURRENCIES);
      setTimelineUnits(DEFAULT_UNITS);
      setRecurrenceTypes(DEFAULT_RECURRENCE_TYPES);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    currencies,
    timelineUnits,
    recurrenceTypes,
    loading,
    reload: load,
  };
}
