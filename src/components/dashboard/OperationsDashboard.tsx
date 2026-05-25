"use client";

import Button from "@/components/ui/button/Button";
import DashboardStatCard from "@/components/dashboard/DashboardStatCard";
import CategoryPerformanceChart from "@/components/dashboard/CategoryPerformanceChart";
import DashboardTablesSection from "@/components/dashboard/DashboardTablesSection";
import DashboardVisualizations from "@/components/dashboard/DashboardVisualizations";
import UserAvatar from "@/components/common/UserAvatar";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  AUTH_USER_CHANGED_EVENT,
  getStoredUser,
} from "@/lib/auth-storage";
import type { UserResponse } from "@/api/types/auth";
import {
  DASHBOARD_PERIOD_LABELS,
  type DashboardPeriod,
} from "@/lib/dashboard-period";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Receipt,
  RefreshCw,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const PERIODS: DashboardPeriod[] = ["today", "week", "month"];

export default function OperationsDashboard() {
  const { companyId, companyName, loading: ctxLoading, error: ctxError, reload: reloadCtx } =
    useCompanyContext();
  const [period, setPeriod] = useState<DashboardPeriod>("today");
  const [now, setNow] = useState("");

  const [user, setUser] = useState<UserResponse | null>(() => getStoredUser());

  const refreshUser = useCallback(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    refreshUser();
    window.addEventListener(AUTH_USER_CHANGED_EVENT, refreshUser);
    return () =>
      window.removeEventListener(AUTH_USER_CHANGED_EVENT, refreshUser);
  }, [refreshUser]);

  const displayName = user?.fullName?.trim() || user?.username || "User";
  const roleLabel =
    user?.profile?.jobTitle?.trim() ||
    user?.userType?.replace(/_/g, " ") ||
    "Team member";
  const orgLabel =
    companyName || user?.profile?.companyName?.trim() || "Your company";

  const {
    loading,
    error,
    stats,
    categorySeries,
    categorySeriesIsSample,
    reload,
  } = useDashboardData(
    companyId,
    period
  );

  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    setNow(fmt());
    const id = window.setInterval(() => setNow(fmt()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (ctxLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading workspace…
      </p>
    );
  }

  if (ctxError || !companyId) {
    return (
      <div>
        <p className="text-sm text-error-600">{ctxError ?? "No company."}</p>
        <Button className="mt-2" size="sm" onClick={() => void reloadCtx()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero — black, avatar + name */}
      <div className="overflow-hidden rounded-2xl bg-[#111111] text-white shadow-lg ring-1 ring-black/10">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <div className="relative shrink-0 ring-2 ring-white/20 rounded-2xl">
              <UserAvatar
                fullName={user?.fullName ?? user?.username}
                avatarUrl={user?.avatarUrl}
                sizeClass="size-16 sm:size-[4.5rem]"
                textClass="text-xl sm:text-2xl"
                shape="rounded"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-white/50">
                Dashboard
              </p>
              <h1 className="mt-1 truncate text-xl font-semibold tracking-tight sm:text-2xl">
                {displayName}
              </h1>
              <p className="mt-1 text-sm text-white/75">{roleLabel}</p>
              <p className="mt-0.5 truncate text-sm font-medium text-white/90">
                {orgLabel}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <p className="text-xs tabular-nums text-white/55">{now}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/25 bg-white/10 text-white hover:bg-white/15"
              onClick={() => void reload()}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-1.5 size-4 ${loading ? "animate-spin" : ""}`}
                aria-hidden
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Period tabs — not a dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-900/50"
          role="tablist"
          aria-label="Dashboard period"
        >
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={period === p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                period === p
                  ? "bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {DASHBOARD_PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-800 dark:text-white">
            {stats.engagementsInPeriod}
          </span>{" "}
          engagement{stats.engagementsInPeriod === 1 ? "" : "s"} {DASHBOARD_PERIOD_LABELS[period].toLowerCase()}
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-900 dark:bg-error-950/40 dark:text-error-300">
          {error}
          <Button className="ml-3" size="sm" variant="outline" onClick={() => void reload()}>
            Retry
          </Button>
        </div>
      ) : null}

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <DashboardStatCard
          icon={Users}
          label="Total customers"
          value={loading ? "—" : stats.totalCustomers.toLocaleString()}
        />
        <DashboardStatCard
          icon={UserCheck}
          label="Active customers"
          value={loading ? "—" : stats.activeCustomers.toLocaleString()}
          hint="Currently active accounts"
        />
        <DashboardStatCard
          icon={UserX}
          label="Inactive customers"
          value={loading ? "—" : stats.inactiveCustomers.toLocaleString()}
        />
        <DashboardStatCard
          icon={Receipt}
          label="Unpaid invoices"
          value={loading ? "—" : stats.unpaidInvoices.toLocaleString()}
          hint="Awaiting payment"
        />
        <DashboardStatCard
          icon={CheckCircle2}
          label="Paid invoices"
          value={loading ? "—" : stats.paidInvoices.toLocaleString()}
          hint="Settled in full"
        />
        <DashboardStatCard
          icon={Clock}
          label="Due within 7 days"
          value={loading ? "—" : stats.invoicesDueSoon.toLocaleString()}
          hint="Invoices nearing due date"
        />
      </div>

      {/* Category performance — live API data */}
      {!loading ? (
        <CategoryPerformanceChart
          data={categorySeries}
          periodLabel={DASHBOARD_PERIOD_LABELS[period]}
          isSample={categorySeriesIsSample}
        />
      ) : (
        <div className="flex items-center justify-center rounded-2xl border border-gray-200 py-24 dark:border-gray-800">
          <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
        </div>
      )}

      {/* Charts — sample data until API is connected */}
      <DashboardVisualizations />

      {/* Tables — sample data until API is connected */}
      <DashboardTablesSection />
    </div>
  );
}
