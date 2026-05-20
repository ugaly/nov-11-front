"use client";

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
import { listExpenses } from "@/lib/expenses/expense-storage";
import type {
  ExpenseCategory,
  ExpenseListFilters,
  ExpenseStatus,
} from "@/lib/expenses/expense-types";
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
  expenseListStats,
  filterExpenses,
  formatExpenseAmount,
  formatExpenseDate,
} from "@/lib/expenses/expense-utils";
import {
  CheckCircle2,
  ClipboardList,
  Filter,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function ExpensesPanel() {
  return (
    <SetupPageShell
      title="Expenses"
      description="Track company expenses, receipts, approval workflow, and payment linkage."
    >
      {() => <ExpenseList />}
    </SetupPageShell>
  );
}

function ExpenseList() {
  const [items, setItems] = useState(() => listExpenses());
  const [filters, setFilters] = useState<ExpenseListFilters>({
    search: "",
    status: "",
    category: "",
  });
  const [applied, setApplied] = useState(filters);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setItems(listExpenses());
  }, []);

  const filtered = useMemo(
    () => filterExpenses(items, applied),
    [items, applied]
  );
  const stats = useMemo(() => expenseListStats(items), [items]);
  const filterCount =
    (applied.status ? 1 : 0) + (applied.category ? 1 : 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatMini
          icon={Wallet}
          label="Paid total"
          value={formatExpenseAmount("TZS", stats.totalAmount)}
          hint={`${stats.paid} settled`}
          accent="from-emerald-500 to-emerald-600 text-white"
        />
        <StatMini
          icon={ClipboardList}
          label="Pending"
          value={String(stats.pending)}
          hint="Submitted or approved"
          accent="from-amber-500 to-amber-600 text-white"
        />
        <StatMini
          icon={Receipt}
          label="Drafts"
          value={String(stats.draft)}
          hint="Not yet submitted"
          accent="from-gray-700 to-gray-800 text-white"
        />
        <StatMini
          icon={CheckCircle2}
          label="All expenses"
          value={String(stats.total)}
          hint="This workspace"
          accent="from-blue-500 to-blue-600 text-white"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-gray-50/80 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950/30">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200/80 px-5 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-gray-900 text-white shadow-lg dark:bg-white dark:text-gray-900">
              <Receipt className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                All expenses
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setApplied({ search: "", status: "", category: "" });
                setFilters({ search: "", status: "", category: "" });
              }}
            >
              <RefreshCw className="mr-1.5 size-4" aria-hidden />
              Reset
            </Button>
            <Link href="/expenses/create">
              <Button size="sm">
                <Plus className="mr-1.5 size-4" aria-hidden />
                New expense
              </Button>
            </Link>
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
                      status: e.target.value as ExpenseStatus | "",
                    }))
                  }
                >
                  <option value="">All statuses</option>
                  {(
                    Object.entries(EXPENSE_STATUS_LABELS) as [
                      ExpenseStatus,
                      string,
                    ][]
                  ).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Category</Label>
                <select
                  className={`${selectClass} mt-1.5`}
                  value={applied.category}
                  onChange={(e) =>
                    setApplied((f) => ({
                      ...f,
                      category: e.target.value as ExpenseCategory | "",
                    }))
                  }
                >
                  <option value="">All categories</option>
                  {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
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
          {filtered.length === 0 ? (
            <SetupEmptyState
              icon={Receipt}
              title="No expenses match"
              description="Add an expense with vendor, amount, and receipt."
              action={
                <Link href="/expenses/create">
                  <Button size="sm">
                    <Plus className="mr-1.5 size-4" aria-hidden />
                    New expense
                  </Button>
                </Link>
              }
            />
          ) : (
            <Table className={setupTableClass}>
              <TableHeader>
                <TableRow>
                  {["Reference", "Title", "Vendor", "Category", "Amount", "Date", "Status", ""].map(
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
                    </TableCell>
                    <TableCell className={setupListTdClass}>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {e.title}
                      </p>
                      <p className="line-clamp-1 text-[11px] text-gray-500">
                        {e.description}
                      </p>
                    </TableCell>
                    <TableCell className={setupListTdClass}>
                      <div className="flex items-center gap-2">
                        <SetupAvatar name={e.vendor} size="xs" />
                        <span className="truncate text-sm">{e.vendor}</span>
                      </div>
                    </TableCell>
                    <TableCell className={`${setupListTdClass} text-xs`}>
                      {EXPENSE_CATEGORY_LABELS[e.category]}
                    </TableCell>
                    <TableCell className={`${setupListTdClass} font-semibold`}>
                      {formatExpenseAmount(e.currency, e.amount)}
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
