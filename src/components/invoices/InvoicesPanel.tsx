"use client";

import ExportListMenu from "@/components/setup/ExportListMenu";
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
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
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
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { DUMMY_INVOICES } from "@/lib/invoices/invoice-dummy-data";
import type { InvoiceListFilters, InvoiceStatus } from "@/lib/invoices/invoice-types";
import {
  computeDisplayStatus,
  filterInvoices,
  formatInvoiceAmount,
  formatInvoiceDate,
  invoiceListStats,
  INVOICE_STATUS_LABELS,
  INVOICE_TYPE_LABELS,
} from "@/lib/invoices/invoice-utils";
import {
  exportInvoicesExcel,
  exportInvoicesPdf,
} from "@/lib/export/invoices-export";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const STATUS_OPTIONS: { value: InvoiceStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "PAID", label: INVOICE_STATUS_LABELS.PAID },
  { value: "UNPAID", label: INVOICE_STATUS_LABELS.UNPAID },
  { value: "DUE_7_DAYS", label: INVOICE_STATUS_LABELS.DUE_7_DAYS },
  { value: "DUE_30_DAYS", label: INVOICE_STATUS_LABELS.DUE_30_DAYS },
  { value: "OVERDUE", label: INVOICE_STATUS_LABELS.OVERDUE },
  { value: "DRAFT", label: INVOICE_STATUS_LABELS.DRAFT },
  { value: "CANCELLED", label: INVOICE_STATUS_LABELS.CANCELLED },
];

const emptyFilters = (): InvoiceListFilters => ({
  search: "",
  status: "",
  type: "",
  sort: "newest",
});

function activeFilterCount(f: InvoiceListFilters): number {
  let n = 0;
  if (f.status) n++;
  if (f.type) n++;
  if (f.sort !== "newest") n++;
  return n;
}

export default function InvoicesPanel() {
  return (
    <SetupPageShell
      title="Invoices"
      description="Billing, payments, and customer invoices. Sample data until API is connected."
    >
      {() => <InvoiceList />}
    </SetupPageShell>
  );
}

function InvoiceList() {
  const { companyName } = useCompanyContext();
  const [items] = useState(DUMMY_INVOICES);
  const [filters, setFilters] = useState<InvoiceListFilters>(emptyFilters);
  const [applied, setApplied] = useState<InvoiceListFilters>(emptyFilters);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(
    () => filterInvoices(items, applied),
    [items, applied]
  );

  const stats = useMemo(() => invoiceListStats(items), [items]);
  const filterCount = activeFilterCount(applied);

  function applySearch() {
    setApplied((prev) => ({ ...prev, search: filters.search }));
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatMini
          icon={Wallet}
          label="Outstanding"
          value={formatInvoiceAmount("TZS", stats.outstandingAmount)}
          hint={`${stats.totalCount - stats.paidCount} open invoices`}
          accent="from-gray-900 to-gray-800 text-white"
        />
        <StatMini
          icon={CheckCircle2}
          label="Paid"
          value={String(stats.paidCount)}
          hint="This sample period"
          accent="from-emerald-500 to-emerald-600 text-white"
        />
        <StatMini
          icon={Clock}
          label="Due in 7 days"
          value={String(stats.due7Count)}
          hint="Needs follow-up"
          accent="from-amber-500 to-amber-600 text-white"
        />
        <StatMini
          icon={CalendarClock}
          label="Due in 30 days"
          value={String(stats.due30Count)}
          hint="Upcoming payments"
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
                All invoices
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {filtered.length} of {items.length} invoices
                {stats.overdueCount > 0 ? (
                  <span className="ml-1 text-rose-600 dark:text-rose-400">
                    · {stats.overdueCount} overdue
                  </span>
                ) : null}
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
            <ExportListMenu
              disabled={filtered.length === 0}
              onExportPdf={() =>
                exportInvoicesPdf(companyName ?? "Company", filtered)
              }
              onExportExcel={() =>
                exportInvoicesExcel(companyName ?? "Company", filtered)
              }
            />
            <Button type="button" variant="outline" size="sm" onClick={() => setApplied(emptyFilters())}>
              <RefreshCw className="mr-1.5 size-4" aria-hidden />
              Reset
            </Button>
            <Link href="/invoices/create">
              <Button size="sm">
                <Plus className="mr-1.5 size-4" aria-hidden />
                Create invoice
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
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Search invoice #, customer, email…"
                className="pl-10"
              />
            </div>
            <Button type="button" size="sm" onClick={applySearch}>
              Search
            </Button>
          </div>

          {showFilters ? (
            <div className="grid gap-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-900/40 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Status</Label>
                <select
                  className={`${selectClass} mt-1.5`}
                  value={applied.status}
                  onChange={(e) =>
                    setApplied((f) => ({
                      ...f,
                      status: e.target.value as InvoiceStatus | "",
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
                <Label>Type</Label>
                <select
                  className={`${selectClass} mt-1.5`}
                  value={applied.type}
                  onChange={(e) =>
                    setApplied((f) => ({
                      ...f,
                      type: e.target.value as InvoiceListFilters["type"],
                    }))
                  }
                >
                  <option value="">All types</option>
                  {Object.entries(INVOICE_TYPE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label>Sort</Label>
                <select
                  className={`${selectClass} mt-1.5`}
                  value={applied.sort}
                  onChange={(e) =>
                    setApplied((f) => ({
                      ...f,
                      sort: e.target.value as InvoiceListFilters["sort"],
                    }))
                  }
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="due-soon">Due date (soonest)</option>
                  <option value="amount-desc">Amount (high → low)</option>
                  <option value="amount-asc">Amount (low → high)</option>
                </select>
              </div>
            </div>
          ) : null}
        </div>

        <div className={`border-t border-gray-100 dark:border-gray-800 ${setupListTableSectionClass}`}>
          {filtered.length === 0 ? (
            <SetupEmptyState
              icon={Receipt}
              title="No invoices match"
              description="Try adjusting filters or create a manual invoice."
              action={
                <Link href="/invoices/create">
                  <Button size="sm">
                    <Plus className="mr-1.5 size-4" aria-hidden />
                    Create invoice
                  </Button>
                </Link>
              }
            />
          ) : (
            <Table className={setupTableClass}>
              <TableHeader>
                <TableRow>
                  {["Invoice", "Customer", "Type", "Amount", "Due", "Status", ""].map(
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
                {filtered.map((inv) => {
                  const status = computeDisplayStatus(inv);
                  return (
                    <TableRow key={inv.id} className={setupTableRowClass}>
                      <TableCell className={setupListTdClass}>
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-mono text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                        >
                          {inv.number}
                        </Link>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          Issued {formatInvoiceDate(inv.issuedAt)}
                        </p>
                      </TableCell>
                      <TableCell className={setupListTdClass}>
                        <div className="flex items-center gap-2.5">
                          <SetupAvatar name={inv.customerName} size="xs" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900 dark:text-white">
                              {inv.customerName}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {inv.customerEmail}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={`${setupListTdClass} text-xs`}>
                        {INVOICE_TYPE_LABELS[inv.type] ?? inv.type}
                      </TableCell>
                      <TableCell className={`${setupListTdClass} font-semibold`}>
                        {formatInvoiceAmount(inv.currency, inv.total)}
                      </TableCell>
                      <TableCell className={`${setupListTdClass} text-xs`}>
                        {formatInvoiceDate(inv.dueAt)}
                        {status === "OVERDUE" ? (
                          <span className="mt-0.5 flex items-center gap-1 text-rose-600">
                            <AlertCircle className="size-3" aria-hidden />
                            Overdue
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className={setupListTdClass}>
                        <InvoiceStatusBadge status={status} />
                      </TableCell>
                      <TableCell className={setupListTdClass}>
                        <SetupRowActions>
                          <SetupRowActionLink href={`/invoices/${inv.id}`} title="View" />
                        </SetupRowActions>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
  icon: typeof Receipt;
  label: string;
  value: string;
  hint: string;
  accent: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br p-5 shadow-sm ${accent}`}
    >
      <Icon className="size-5 opacity-80" aria-hidden />
      <p className="mt-3 text-xs font-medium uppercase tracking-wide opacity-80">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      <p className="mt-1 text-xs opacity-75">{hint}</p>
    </div>
  );
}
