"use client";

import { listOfficeExpenses } from "@/api/expense/expense.api";
import type { ExpenseWorkflowStatus } from "@/api/types/expense";
import ExpenseStatusBadge from "@/components/expenses/ExpenseStatusBadge";
import SetupEmptyState from "@/components/setup/SetupEmptyState";
import SetupPageShell from "@/components/setup/SetupPageShell";
import { SetupRowActionLink, SetupRowActions } from "@/components/setup/SetupRowActions";
import {
  setupListTableSectionClass,
  setupListTdClass,
  setupListThClass,
  setupTableClass,
  setupTableRowClass,
} from "@/components/setup/setup-table-styles";
import { SetupAvatar } from "@/components/setup/setup-pro-ui";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ExpenseListFilters, ExpenseRecord } from "@/lib/expenses/expense-types";
import { useExpenseAccess } from "@/lib/expenses/use-expense-access";
import { useExpenseOptions } from "@/lib/expenses/use-expense-options";
import {
  EXPENSE_STATUS_LABELS,
  expenseListStats,
  filterExpenses,
  formatExpenseAmount,
  formatExpenseDate,
} from "@/lib/expenses/expense-utils";
import {
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  PieChart,
  Plus,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const STATUS_OPTIONS: { value: ExpenseWorkflowStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  ...(
    Object.entries(EXPENSE_STATUS_LABELS) as [ExpenseWorkflowStatus, string][]
  ).map(([value, label]) => ({ value, label })),
];

export default function ExpensesPanel() {
  const { officeId, access, loading: accessLoading, error: accessError } =
    useExpenseAccess();

  if (accessLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
      </div>
    );
  }

  if (!officeId || !access?.visible) {
    return (
      <SetupPageShell
        title="Expenses"
        description="Office expense claims and reimbursements."
      >
        {() => (
          <SetupEmptyState
            icon={PieChart}
            title="Expenses not available"
            description={
              accessError ??
              "You do not have permission to view expenses for your office. Ask an administrator to enable expense access in Setup → Office permissions."
            }
          />
        )}
      </SetupPageShell>
    );
  }

  return (
    <SetupPageShell
      title="Expenses"
      description="Record office expenses, submit for approval, and track reimbursement."
    >
      {() => <ExpenseList officeId={officeId} canCreate={access.canCreate} />}
    </SetupPageShell>
  );
}

function ExpenseList({
  officeId,
  canCreate,
}: {
  officeId: string;
  canCreate: boolean;
}) {
  const [items, setItems] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { types } = useExpenseOptions();
  const [filters, setFilters] = useState<ExpenseListFilters>({
    search: "",
    status: "",
    expenseTypeId: "",
  });
  const [applied, setApplied] = useState(filters);
  const [showFilters, setShowFilters] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setItems(await listOfficeExpenses(officeId));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load expenses.");
    } finally {
      setLoading(false);
    }
  }, [officeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(
    () => filterExpenses(items, applied),
    [items, applied]
  );
  const stats = useMemo(() => expenseListStats(items), [items]);
  const filterCount =
    (applied.status ? 1 : 0) + (applied.expenseTypeId ? 1 : 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatMini
          icon={Wallet}
          label="Outstanding"
          value={formatExpenseAmount("TZS", stats.outstandingAmount)}
          hint={`${stats.draft + stats.pendingApproval + stats.approved} open`}
          accent="from-gray-900 to-gray-800 text-white"
        />
        <StatMini
          icon={CheckCircle2}
          label="Paid"
          value={String(stats.paid)}
          hint="Reimbursed"
          accent="from-emerald-500 to-emerald-600 text-white"
        />
        <StatMini
          icon={Clock}
          label="Pending approval"
          value={String(stats.pendingApproval)}
          hint="Awaiting approver"
          accent="from-amber-500 to-amber-600 text-white"
        />
        <StatMini
          icon={PieChart}
          label="Approved"
          value={String(stats.approved)}
          hint="Ready to pay"
          accent="from-blue-500 to-blue-600 text-white"
        />
      </div>

      {loadError ? (
        <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
          {loadError}
        </p>
      ) : null}

      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-gray-50/80 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950/30">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200/80 px-5 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-gray-900 text-white shadow-lg dark:bg-white dark:text-gray-900">
              <PieChart className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Office expenses
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {filtered.length} of {items.length} records
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => void refresh()}
            >
              <RefreshCw className="mr-1.5 size-4" aria-hidden />
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowFilters((v) => !v)}
            >
              <Filter className="mr-1.5 size-4" aria-hidden />
              Filters
              {filterCount > 0 ? (
                <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-gray-900 px-1.5 py-0.5 text-[10px] font-bold text-white dark:bg-white dark:text-gray-900">
                  {filterCount}
                </span>
              ) : null}
            </Button>
            {canCreate ? (
              <Link href="/expenses/create">
                <Button size="sm">
                  <Plus className="mr-1.5 size-4" aria-hidden />
                  New expense
                </Button>
              </Link>
            ) : null}
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <Input
                value={filters.search}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, search: e.target.value }))
                }
                placeholder="Search reference, title, vendor…"
                className="pl-10"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() =>
                setApplied((prev) => ({ ...prev, search: filters.search }))
              }
            >
              Search
            </Button>
          </div>

          {showFilters ? (
            <div className="grid gap-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-900/40 sm:grid-cols-2">
              <div>
                <Label>Status</Label>
                <select
                  className={`${selectClass} mt-1.5`}
                  value={applied.status}
                  onChange={(e) =>
                    setApplied((f) => ({
                      ...f,
                      status: e.target.value as ExpenseWorkflowStatus | "",
                    }))
                  }
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value || "all"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Expense type</Label>
                <select
                  className={`${selectClass} mt-1.5`}
                  value={applied.expenseTypeId}
                  onChange={(e) =>
                    setApplied((f) => ({
                      ...f,
                      expenseTypeId: e.target.value,
                    }))
                  }
                >
                  <option value="">All types</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}
        </div>

        <div
          className={`border-t border-gray-100 dark:border-gray-800 ${setupListTableSectionClass}`}
        >
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
            </div>
          ) : filtered.length === 0 ? (
            <SetupEmptyState
              icon={PieChart}
              title="No expenses match"
              description="Create a draft expense for your office."
              action={
                canCreate ? (
                  <Link href="/expenses/create">
                    <Button size="sm">
                      <Plus className="mr-1.5 size-4" aria-hidden />
                      New expense
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <Table className={setupTableClass}>
              <TableHeader>
                <TableRow>
                  {["Reference", "Title", "Type", "Amount", "Date", "Status", ""].map(
                    (h) => (
                      <TableCell
                        key={h || "actions"}
                        isHeader
                        className={`${setupListThClass} ${h === "" ? "w-12" : ""}`}
                      >
                        {h}
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id} className={setupTableRowClass}>
                    <TableCell className={setupListTdClass}>
                      <Link
                        href={`/expenses/${e.id}`}
                        className="font-mono text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                      >
                        {e.referenceNumber}
                      </Link>
                      {e.vendor ? (
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500">
                          {e.vendor}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className={setupListTdClass}>
                      <div className="flex items-center gap-2.5">
                        <SetupAvatar name={e.title} size="xs" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900 dark:text-white">
                            {e.title}
                          </p>
                          {e.description ? (
                            <p className="truncate text-xs text-gray-500">
                              {e.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={`${setupListTdClass} text-xs`}>
                      {e.expenseTypeName}
                    </TableCell>
                    <TableCell className={`${setupListTdClass} font-semibold`}>
                      {formatExpenseAmount(e.currency, Number(e.amount))}
                    </TableCell>
                    <TableCell className={`${setupListTdClass} text-xs`}>
                      {formatExpenseDate(e.expenseDate)}
                    </TableCell>
                    <TableCell className={setupListTdClass}>
                      <ExpenseStatusBadge status={e.status} />
                    </TableCell>
                    <TableCell className={setupListTdClass}>
                      <SetupRowActions>
                        <SetupRowActionLink
                          href={`/expenses/${e.id}`}
                          title="View"
                        />
                      </SetupRowActions>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatMini({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint: string;
  accent: string;
}) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br p-5 shadow-sm ${accent}`}>
      <Icon className="size-5 opacity-80" aria-hidden />
      <p className="mt-3 text-xs font-medium uppercase tracking-wide opacity-80">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      <p className="mt-1 text-xs opacity-75">{hint}</p>
    </div>
  );
}
