"use client";

import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import React, { useEffect, useMemo, useState } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type PortalChartColors = {
  primary: string;
  mid: string;
  light: string;
  pale: string;
  warm: string;
};

const CHART_FALLBACK: PortalChartColors = {
  primary: "#003399",
  mid: "#2563eb",
  light: "#93c5fd",
  pale: "#dbeafe",
  warm: "#e65100",
};

function readPortalChartColors(root: Element): PortalChartColors {
  const g = (name: string, fb: string) =>
    getComputedStyle(root).getPropertyValue(name).trim() || fb;
  return {
    primary: g("--color-portal-primary", CHART_FALLBACK.primary),
    mid: g("--color-portal-chart-mid", CHART_FALLBACK.mid),
    light: g("--color-portal-chart-light", CHART_FALLBACK.light),
    pale: g("--color-portal-chart-pale", CHART_FALLBACK.pale),
    warm: g("--color-portal-warm", CHART_FALLBACK.warm),
  };
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M2.29004 5.90393H17.7067"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.7075 14.0961H2.29085"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ExportIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M10 3.33331V12.5M10 12.5L13.3333 9.16665M10 12.5L6.66669 9.16665"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.33331 14.1666V15.8333C3.33331 16.7538 4.07952 17.5 5 17.5H15C15.9205 17.5 16.6667 16.7538 16.6667 15.8333V14.1666"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function toolbarBtnClass() {
  return "inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.05] dark:hover:text-white";
}

function SectionLead({
  icon,
  title,
  subtitle,
  actions,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-3.5 sm:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-portal-primary/10 text-portal-primary dark:bg-portal-accent/15 dark:text-portal-accent-icon">
          {icon}
        </div>
        <div className="min-w-0 pt-0.5">
          <h3 className="text-lg font-semibold leading-tight text-gray-800 dark:text-white/90">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-0.5">{actions}</div> : null}
    </div>
  );
}

const KPI = [
  {
    label: "Goods lines received",
    value: "1,284",
    delta: "+12.4%",
    up: true,
  },
  {
    label: "Customers served",
    value: "86",
    delta: "+4.1%",
    up: true,
  },
  {
    label: "Parcels received",
    value: "3,402",
    delta: "+8.2%",
    up: true,
  },
  {
    label: "Pending requests",
    value: "27",
    delta: "-3",
    up: false,
  },
  {
    label: "CBM cleared today",
    value: "482",
    delta: "+6.0%",
    up: true,
  },
  {
    label: "Staff portal logins",
    value: "42",
    delta: "+2",
    up: true,
  },
];

const RECENT_REQUESTS = [
  {
    id: "SHP-GZ-2026-08912",
    customer: "East Africa Imports Ltd",
    cbm: "12.4",
    route: "Guangzhou → Dar es Salaam",
    status: "Awaiting docs",
    time: "09:42",
  },
  {
    id: "SHP-GZ-2026-08904",
    customer: "Kilimanjaro Trading",
    cbm: "8.1",
    route: "Guangzhou → Dar es Salaam",
    status: "In review",
    time: "09:18",
  },
  {
    id: "SHP-GZ-2026-08897",
    customer: "Coastal Freight Co.",
    cbm: "22.0",
    route: "Guangzhou → Mombasa",
    status: "Quotation sent",
    time: "08:55",
  },
  {
    id: "SHP-GZ-2026-08888",
    customer: "Serengeti Logistics",
    cbm: "5.6",
    route: "Guangzhou → Dar es Salaam",
    status: "Pending payment",
    time: "08:30",
  },
  {
    id: "SHP-GZ-2026-08871",
    customer: "Urban Retail TZ",
    cbm: "3.2",
    route: "Guangzhou → Dar es Salaam",
    status: "New",
    time: "08:12",
  },
];

const LAST_PACKED = [
  {
    id: "SHP-GZ-2026-08840",
    skuLots: "184 cartons",
    cbm: "14.8",
    dock: "Bay C-12",
    status: "Staged for vessel",
    time: "10:01",
  },
  {
    id: "SHP-GZ-2026-08836",
    skuLots: "96 cartons",
    cbm: "9.2",
    dock: "Bay A-04",
    status: "Packed",
    time: "09:56",
  },
  {
    id: "SHP-GZ-2026-08829",
    skuLots: "220 cartons",
    cbm: "31.5",
    dock: "Bay B-07",
    status: "Loaded",
    time: "09:41",
  },
  {
    id: "SHP-GZ-2026-08821",
    skuLots: "44 cartons",
    cbm: "4.1",
    dock: "Bay C-02",
    status: "Packed",
    time: "09:22",
  },
  {
    id: "SHP-GZ-2026-08815",
    skuLots: "512 cartons",
    cbm: "68.0",
    dock: "Bay D-01",
    status: "Sealed",
    time: "09:05",
  },
];

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s.includes("packed") || s.includes("loaded") || s.includes("sealed") || s.includes("staged"))
    return { color: "success" as const, label: status };
  if (s.includes("pending") || s.includes("awaiting") || s.includes("new"))
    return { color: "warning" as const, label: status };
  if (s.includes("review") || s.includes("quotation"))
    return { color: "info" as const, label: status };
  return { color: "light" as const, label: status };
}

export default function TodayDashboard() {
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState<string>("");
  const [chartColors, setChartColors] =
    useState<PortalChartColors>(CHART_FALLBACK);

  useEffect(() => {
    const tickId = window.setInterval(() => setTick((t) => t + 1), 4000);
    const fmt = () =>
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setNow(fmt());
    const clockId = window.setInterval(() => setNow(fmt()), 30_000);
    return () => {
      window.clearInterval(tickId);
      window.clearInterval(clockId);
    };
  }, []);

  useEffect(() => {
    setChartColors(readPortalChartColors(document.documentElement));
  }, []);

  const stackedOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "bar",
        stacked: true,
        toolbar: { show: false },
        animations: { enabled: true, speed: 600 },
      },
      colors: [
        chartColors.primary,
        chartColors.mid,
        chartColors.light,
        chartColors.pale,
      ],
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
        categories: [
          "06:00",
          "07:00",
          "08:00",
          "09:00",
          "10:00",
          "11:00",
          "12:00",
          "Now",
        ],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: "#64748b", fontSize: "11px" } },
      },
      yaxis: {
        labels: { style: { colors: "#64748b", fontSize: "11px" } },
      },
      grid: {
        borderColor: "#e2e8f0",
        strokeDashArray: 4,
        yaxis: { lines: { show: true } },
      },
      legend: {
        position: "top",
        horizontalAlign: "left",
        fontSize: "12px",
      },
      tooltip: { theme: "light" },
    }),
    [chartColors]
  );

  const stackedSeries = [
    { name: "Air uplift", data: [12, 18, 24, 32, 28, 36, 30, 22 + (tick % 3)] },
    { name: "Sea FCL", data: [28, 34, 40, 52, 48, 55, 50, 44 + (tick % 4)] },
    { name: "Sea LCL", data: [16, 22, 26, 30, 34, 28, 32, 26 + (tick % 2)] },
    { name: "Courier / express", data: [8, 10, 14, 18, 20, 22, 18, 16 + (tick % 2)] },
  ];

  const donutOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "donut",
        animations: { enabled: true },
      },
      labels: ["Released", "In progress", "On hold", "HQ review"],
      colors: [
        chartColors.primary,
        chartColors.mid,
        chartColors.warm,
        chartColors.light,
      ],
      legend: {
        position: "bottom",
        fontSize: "12px",
      },
      plotOptions: {
        pie: {
          donut: {
            size: "72%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Shipments",
                fontSize: "12px",
                color: "#64748b",
                formatter: () => "186",
              },
            },
          },
        },
      },
      dataLabels: { enabled: false },
      stroke: { width: 2, colors: ["#fff"] },
    }),
    [chartColors]
  );

  const donutSeries = [72, 58, 14, 42];

  const hourlyOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "bar",
        toolbar: { show: false },
        sparkline: { enabled: false },
      },
      colors: [chartColors.mid],
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: "45%",
          borderRadiusApplication: "end",
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        axisBorder: { show: false },
        labels: { style: { colors: "#64748b", fontSize: "11px" } },
      },
      yaxis: {
        max: 500,
        tickAmount: 5,
        labels: { style: { colors: "#64748b", fontSize: "11px" } },
      },
      grid: { borderColor: "#e2e8f0", strokeDashArray: 4 },
      tooltip: { theme: "light", y: { formatter: (v) => `${v} CBM` } },
    }),
    [chartColors]
  );

  const hourlySeries = [
    {
      name: "CBM (branch)",
      data: [280, 320, 290, 410, 380, 240, 180],
    },
  ];

  const iconStacked = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 18V14M4 14V10M4 14H8M8 14V18M8 14V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 18V8M12 8V6M12 8H20M20 8V18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
  const iconDonut = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
  const iconCbm = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 19V5L12 9L20 5V19L12 15L4 19Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
  const iconInbox = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 13h5l2 3h2l2-3h5v8H4V13Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M4 13V8h16v5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
  const iconBox = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3L20 7V17L12 21L4 17V7L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 12L20 8M12 12V21M12 12L4 8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Branch bar — single clean row, no side snapshot card */}
      <div className="overflow-hidden rounded-2xl border border-portal-primary/15 bg-gradient-to-br from-portal-primary via-portal-800 to-portal-900 px-6 py-7 text-white shadow-lg shadow-portal-card sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="flex min-w-0 items-start gap-4 sm:items-center sm:gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/12 text-base font-bold tracking-tight ring-1 ring-white/25 sm:h-16 sm:w-16 sm:text-lg">
              LW
            </div>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2.5 gap-y-2">
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  Li Wei
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-xs font-medium text-emerald-50 ring-1 ring-emerald-300/35">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-200" />
                  </span>
                  Live session
                </span>
              </div>
              <p className="text-sm leading-snug text-white/90 sm:text-base">
                <span className="font-semibold text-white">Guangzhou consolidation hub</span>
                <span className="text-white/65"> · China</span>
              </p>
              <p className="max-w-xl text-xs leading-relaxed text-white/65 sm:text-sm">
                Branch workspace · Data route to headquarters · Dar es Salaam, Tanzania
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 border-t border-white/10 pt-5 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2.5 text-sm font-medium text-white ring-1 ring-white/15">
              <ClockIcon className="text-white/80" />
              <span className="tabular-nums">{now || "—"}</span>
              <span className="text-white/50">local</span>
            </div>
          </div>
        </div>
      </div>

      {/* Page intro */}
      <div className="space-y-1.5">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-[1.65rem]">
          Today
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          Receipts, packing, and outbound shipments for this branch.
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-6">
        {KPI.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <span className="text-sm leading-snug text-gray-500 dark:text-gray-400">
              {k.label}
            </span>
            <div className="mt-4 flex items-end justify-between gap-3">
              <span className="text-2xl font-bold tracking-tight text-gray-900 tabular-nums dark:text-white">
                {k.value}
              </span>
              <Badge color={k.up ? "success" : "error"}>
                {k.up ? <ArrowUpIcon /> : <ArrowDownIcon className="text-error-500" />}
                {k.delta}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 pb-6 pt-7 dark:border-gray-800 dark:bg-white/[0.03] sm:px-7 sm:pb-7 sm:pt-8 lg:col-span-7">
          <SectionLead
            icon={iconStacked}
            title="Inbound by channel"
            subtitle="Stacked units · last 8 hours · Guangzhou branch"
            actions={
              <>
                <div className="inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
                  {["Hourly", "Shift", "Day"].map((t, i) => (
                    <button
                      key={t}
                      type="button"
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                        i === 0
                          ? "bg-white text-portal-primary shadow-sm dark:bg-gray-800 dark:text-white"
                          : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <button type="button" className={toolbarBtnClass()} aria-label="Chart options">
                  <FilterIcon className="text-gray-500 dark:text-gray-400" />
                  Filter
                </button>
              </>
            }
          />
          <div className="-mx-1 min-h-[280px]">
            <ReactApexChart
              options={stackedOptions}
              series={stackedSeries}
              type="bar"
              height={280}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white px-6 pb-6 pt-7 dark:border-gray-800 dark:bg-white/[0.03] sm:px-7 sm:pb-7 sm:pt-8 lg:col-span-5">
          <SectionLead
            icon={iconDonut}
            title="Shipment status mix"
            subtitle="Today · HQ cut-off window"
            actions={
              <button type="button" className={toolbarBtnClass()} aria-label="Filter statuses">
                <FilterIcon className="text-gray-500 dark:text-gray-400" />
                Filter
              </button>
            }
          />
          <div className="flex min-h-[280px] items-center justify-center">
            <ReactApexChart
              options={donutOptions}
              series={donutSeries}
              type="donut"
              height={300}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white px-6 pb-7 pt-7 dark:border-gray-800 dark:bg-white/[0.03] sm:px-8 sm:pb-8 sm:pt-8">
        <SectionLead
          icon={iconCbm}
          title="CBM cleared · branch trend"
          subtitle="Cubic meters released toward Tanzania corridor"
          actions={
            <>
              <button type="button" className={toolbarBtnClass()}>
                <FilterIcon className="text-gray-500 dark:text-gray-400" />
                Filter
              </button>
              <button type="button" className={toolbarBtnClass()}>
                <ExportIcon className="text-gray-500 dark:text-gray-400" />
                Export
              </button>
            </>
          }
        />
        <ReactApexChart
          options={hourlyOptions}
          series={hourlySeries}
          type="bar"
          height={228}
        />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-8">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
            <div className="flex min-w-0 gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-portal-primary/10 text-portal-primary dark:bg-portal-accent/15 dark:text-portal-accent-icon">
                {iconInbox}
              </div>
              <div className="min-w-0 pt-0.5">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Recent requests
                </h3>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  Shipment files awaiting action
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button type="button" className={toolbarBtnClass()}>
                <FilterIcon className="text-gray-500 dark:text-gray-400" />
                Filter
              </button>
              <button type="button" className={toolbarBtnClass()}>
                <ExportIcon className="text-gray-500 dark:text-gray-400" />
                Export
              </button>
            </div>
          </div>
          <div className="max-w-full overflow-x-auto px-4 pb-6 pt-1 sm:px-7">
            <Table>
              <TableHeader className="border-y border-gray-100 dark:border-gray-800">
                <TableRow>
                  {["Shipment #", "Customer", "CBM (m³)", "Route", "Status", "Time"].map(
                    (h) => (
                      <TableCell
                        key={h}
                        isHeader
                        className="whitespace-nowrap py-3.5 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        {h}
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {RECENT_REQUESTS.map((r) => {
                  const b = statusBadge(r.status);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="py-3.5 font-mono text-theme-sm font-semibold text-portal-primary dark:text-portal-accent-soft">
                        {r.id}
                      </TableCell>
                      <TableCell className="py-3.5 text-theme-sm text-gray-800 dark:text-white/90">
                        {r.customer}
                      </TableCell>
                      <TableCell className="py-3.5 text-theme-sm text-gray-600 dark:text-gray-400">
                        {r.cbm}
                      </TableCell>
                      <TableCell className="py-3.5 text-theme-sm text-gray-600 dark:text-gray-400">
                        {r.route}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge size="sm" color={b.color}>
                          {b.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5 text-theme-xs text-gray-500 dark:text-gray-400">
                        {r.time}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between lg:px-7 lg:py-6">
            <div className="flex min-w-0 gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-portal-primary/10 text-portal-primary dark:bg-portal-accent/15 dark:text-portal-accent-icon">
                {iconBox}
              </div>
              <div className="min-w-0 pt-0.5">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Last packed items
                </h3>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  Dock · vessel / truck ready
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
              <div className="inline-flex flex-wrap gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
                {["All", "Packed", "Staged", "Loaded"].map((t, i) => (
                  <button
                    key={t}
                    type="button"
                    className={`rounded-md px-2.5 py-1.5 text-theme-xs font-medium transition ${
                      i === 0
                        ? "bg-white text-portal-primary shadow-sm dark:bg-gray-800 dark:text-white"
                        : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button type="button" className={toolbarBtnClass()}>
                <FilterIcon className="text-gray-500 dark:text-gray-400" />
                Filter
              </button>
            </div>
          </div>
          <div className="max-w-full overflow-x-auto px-4 pb-6 pt-1 sm:px-7">
            <Table>
              <TableHeader className="border-y border-gray-100 dark:border-gray-800">
                <TableRow>
                  {["Shipment #", "Lots", "CBM (m³)", "Dock", "Status", "Time"].map(
                    (h) => (
                      <TableCell
                        key={h}
                        isHeader
                        className="whitespace-nowrap py-3.5 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        {h}
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {LAST_PACKED.map((r) => {
                  const b = statusBadge(r.status);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="py-3.5 font-mono text-theme-sm font-semibold text-portal-primary dark:text-portal-accent-soft">
                        {r.id}
                      </TableCell>
                      <TableCell className="py-3.5 text-theme-sm text-gray-800 dark:text-white/90">
                        {r.skuLots}
                      </TableCell>
                      <TableCell className="py-3.5 text-theme-sm text-gray-600 dark:text-gray-400">
                        {r.cbm}
                      </TableCell>
                      <TableCell className="py-3.5 text-theme-sm text-gray-600 dark:text-gray-400">
                        {r.dock}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge size="sm" color={b.color}>
                          {b.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5 text-theme-xs text-gray-500 dark:text-gray-400">
                        {r.time}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
