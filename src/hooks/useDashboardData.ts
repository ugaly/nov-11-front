"use client";

import {
  listCustomersPaginated,
  listEngagements,
  listServiceCategories,
} from "@/api/template-config/template-config.api";
import { DUMMY_INVOICES } from "@/lib/invoices/invoice-dummy-data";
import { dashboardInvoiceCounts } from "@/lib/invoices/invoice-utils";
import type { CustomerEngagementResponse } from "@/api/types/template-config";
import type { DashboardPeriod } from "@/lib/dashboard-period";
import {
  isDateInPeriod,
  lastNDays,
  lastNMonths,
  dayKey,
  monthKey,
} from "@/lib/dashboard-period";
import { getDummyCategorySeries } from "@/lib/dashboard-dummy-data";
import { useCallback, useEffect, useMemo, useState } from "react";

export type DashboardStats = {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  unpaidInvoices: number;
  paidInvoices: number;
  invoicesDueSoon: number;
  engagementsInPeriod: number;
};

export type { CategorySeries } from "@/lib/dashboard-chart-types";
import type { CategorySeries } from "@/lib/dashboard-chart-types";

type DashboardDataState = {
  loading: boolean;
  error: string | null;
  stats: DashboardStats;
  categorySeries: CategorySeries;
  categorySeriesIsSample: boolean;
  reload: () => Promise<void>;
};

function categorySeriesHasData(series: CategorySeries): boolean {
  const hasValues = (block: { series: { data: number[] }[] }) =>
    block.series.some((row) => row.data.some((n) => n > 0));
  return hasValues(series.daily) || hasValues(series.monthly);
}

const emptyStats = (): DashboardStats => ({
  totalCustomers: 0,
  activeCustomers: 0,
  inactiveCustomers: 0,
  unpaidInvoices: 0,
  paidInvoices: 0,
  invoicesDueSoon: 0,
  engagementsInPeriod: 0,
});

function buildCategorySeries(
  engagements: CustomerEngagementResponse[],
  period: DashboardPeriod
): CategorySeries {
  const inPeriod = engagements.filter((e) =>
    isDateInPeriod(e.startedAt, period)
  );
  const categoryNames = [
    ...new Set(inPeriod.map((e) => e.categoryName).filter(Boolean)),
  ].sort();

  const days = lastNDays(7);
  const dayLabels = days.map((d) =>
    d.toLocaleDateString(undefined, { weekday: "short" })
  );
  const dayKeys = days.map((d) => d.toISOString().slice(0, 10));

  const dailySeries = categoryNames.map((name) => ({
    name,
    data: dayKeys.map((key) =>
      inPeriod.filter(
        (e) => e.categoryName === name && dayKey(e.startedAt ?? "") === key
      ).length
    ),
  }));

  const months = lastNMonths(6);
  const monthlyLabels = months.map((m) => m.label);
  const monthlySeries = categoryNames.map((name) => ({
    name,
    data: months.map(({ key }) =>
      engagements.filter(
        (e) =>
          e.categoryName === name && monthKey(e.startedAt ?? "") === key
      ).length
    ),
  }));

  if (categoryNames.length === 0) {
    const catsFromAll = [
      ...new Set(engagements.map((e) => e.categoryName).filter(Boolean)),
    ].sort();
    return {
      categories: catsFromAll,
      daily: {
        labels: dayLabels,
        series: catsFromAll.map((name) => ({
          name,
          data: dayKeys.map((key) =>
            engagements.filter(
              (e) =>
                e.categoryName === name && dayKey(e.startedAt ?? "") === key
            ).length
          ),
        })),
      },
      monthly: {
        labels: monthlyLabels,
        series: catsFromAll.map((name) => ({
          name,
          data: months.map(({ key }) =>
            engagements.filter(
              (e) =>
                e.categoryName === name && monthKey(e.startedAt ?? "") === key
            ).length
          ),
        })),
      },
    };
  }

  return {
    categories: categoryNames,
    daily: { labels: dayLabels, series: dailySeries },
    monthly: { labels: monthlyLabels, series: monthlySeries },
  };
}

export function useDashboardData(
  companyId: string | null,
  period: DashboardPeriod
): DashboardDataState {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [activeCustomers, setActiveCustomers] = useState(0);
  const [inactiveCustomers, setInactiveCustomers] = useState(0);
  const [engagements, setEngagements] = useState<CustomerEngagementResponse[]>(
    []
  );

  const invoiceCounts = useMemo(
    () => dashboardInvoiceCounts(DUMMY_INVOICES),
    []
  );

  const reload = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const [customerPage, engagementList] = await Promise.all([
        listCustomersPaginated(companyId, { page: 0, size: 200 }),
        listEngagements(companyId),
      ]);

      setTotalCustomers(customerPage.totalElements);
      const active = customerPage.content.filter((c) => c.active).length;
      const inactiveOnPage = customerPage.content.filter((c) => !c.active).length;
      if (customerPage.totalElements <= customerPage.content.length) {
        setActiveCustomers(active);
        setInactiveCustomers(inactiveOnPage);
      } else {
        const ratio = customerPage.content.length / customerPage.totalElements;
        setActiveCustomers(Math.round(active / ratio) || active);
        setInactiveCustomers(
          Math.max(0, customerPage.totalElements - Math.round(active / ratio))
        );
      }

      setEngagements(engagementList);
      await listServiceCategories(companyId).catch(() => undefined);
    } catch {
      setError("Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const stats = useMemo((): DashboardStats => {
    const engagementsInPeriod = engagements.filter((e) =>
      isDateInPeriod(e.startedAt, period)
    ).length;
    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      unpaidInvoices: invoiceCounts.unpaidInvoices,
      paidInvoices: invoiceCounts.paidInvoices,
      invoicesDueSoon: invoiceCounts.invoicesDueSoon,
      engagementsInPeriod,
    };
  }, [
    totalCustomers,
    activeCustomers,
    inactiveCustomers,
    invoiceCounts,
    engagements,
    period,
  ]);

  const liveCategorySeries = useMemo(
    () => buildCategorySeries(engagements, period),
    [engagements, period]
  );

  const categorySeriesIsSample = useMemo(
    () => !categorySeriesHasData(liveCategorySeries),
    [liveCategorySeries]
  );

  const categorySeries = useMemo(
    () =>
      categorySeriesIsSample
        ? getDummyCategorySeries()
        : liveCategorySeries,
    [categorySeriesIsSample, liveCategorySeries]
  );

  return {
    loading,
    error,
    stats,
    categorySeries,
    categorySeriesIsSample,
    reload,
  };
}
