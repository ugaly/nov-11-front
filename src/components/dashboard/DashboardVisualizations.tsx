"use client";

import DashboardSectionLead from "@/components/dashboard/DashboardSectionLead";
import {
  DUMMY_ENGAGEMENT_STATUS_MIX,
  DUMMY_ENGAGEMENTS_WEEKLY,
  DUMMY_WORK_BY_CATEGORY_HOURLY,
} from "@/lib/dashboard-dummy-data";
import { BarChart3, PieChart, TrendingUp } from "lucide-react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useMemo } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const CHART_COLORS = ["#111111", "#404040", "#737373", "#a3a3a3"];

const baseChartFont = { fontFamily: "Outfit, sans-serif" };

export default function DashboardVisualizations() {
  const stackedOptions: ApexOptions = useMemo(
    () => ({
      chart: { ...baseChartFont, type: "bar", stacked: true, toolbar: { show: false } },
      colors: CHART_COLORS,
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "52%",
          borderRadius: 4,
          borderRadiusApplication: "end",
        },
      },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 1, colors: ["#fff"] },
      xaxis: {
        categories: DUMMY_WORK_BY_CATEGORY_HOURLY.labels,
        labels: { style: { colors: "#64748b", fontSize: "11px" } },
      },
      yaxis: { labels: { style: { colors: "#64748b", fontSize: "11px" } } },
      grid: { borderColor: "#e5e7eb", strokeDashArray: 4 },
      legend: { position: "top", horizontalAlign: "left", fontSize: "12px" },
      tooltip: { theme: "light" },
    }),
    []
  );

  const donutOptions: ApexOptions = useMemo(
    () => ({
      chart: { ...baseChartFont, type: "donut" },
      labels: DUMMY_ENGAGEMENT_STATUS_MIX.labels,
      colors: ["#111111", "#525252", "#a3a3a3", "#d4d4d4"],
      legend: { position: "bottom", fontSize: "12px" },
      plotOptions: {
        pie: {
          donut: {
            size: "72%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Engagements",
                fontSize: "12px",
                color: "#64748b",
                formatter: () =>
                  String(
                    DUMMY_ENGAGEMENT_STATUS_MIX.series.reduce((a, b) => a + b, 0)
                  ),
              },
            },
          },
        },
      },
      dataLabels: { enabled: false },
      stroke: { width: 2, colors: ["#fff"] },
    }),
    []
  );

  const weeklyOptions: ApexOptions = useMemo(
    () => ({
      chart: { ...baseChartFont, type: "bar", toolbar: { show: false } },
      colors: ["#111111"],
      plotOptions: {
        bar: { borderRadius: 6, columnWidth: "45%", borderRadiusApplication: "end" },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: DUMMY_ENGAGEMENTS_WEEKLY.labels,
        labels: { style: { colors: "#64748b", fontSize: "11px" } },
      },
      yaxis: {
        tickAmount: 5,
        labels: { style: { colors: "#64748b", fontSize: "11px" } },
      },
      grid: { borderColor: "#e5e7eb", strokeDashArray: 4 },
      tooltip: { theme: "light" },
    }),
    []
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 lg:col-span-7">
          <DashboardSectionLead
            icon={<BarChart3 className="size-5" aria-hidden />}
            title="Work items by service category"
            subtitle="Tasks touched today · sample data"
          />
          <div className="min-h-[260px]">
            <ReactApexChart
              options={stackedOptions}
              series={DUMMY_WORK_BY_CATEGORY_HOURLY.series}
              type="bar"
              height={260}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 lg:col-span-5">
          <DashboardSectionLead
            icon={<PieChart className="size-5" aria-hidden />}
            title="Engagement status mix"
            subtitle="All open engagements · sample data"
          />
          <div className="flex min-h-[260px] items-center justify-center">
            <ReactApexChart
              options={donutOptions}
              series={DUMMY_ENGAGEMENT_STATUS_MIX.series}
              type="donut"
              height={280}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <DashboardSectionLead
          icon={<TrendingUp className="size-5" aria-hidden />}
          title="New engagements this week"
          subtitle="Opened per weekday · sample data"
        />
        <ReactApexChart
          options={weeklyOptions}
          series={DUMMY_ENGAGEMENTS_WEEKLY.series}
          type="bar"
          height={220}
        />
      </div>
    </div>
  );
}
