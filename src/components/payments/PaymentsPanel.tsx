"use client";

import PaymentStatusBadge from "@/components/payments/PaymentStatusBadge";
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
import { listPayments } from "@/lib/payments/payment-storage";
import type { PaymentCategory, PaymentListFilters, PaymentStatus } from "@/lib/payments/payment-types";
import {
  filterPayments,
  formatPaymentAmount,
  formatPaymentDate,
  PAYMENT_CATEGORY_LABELS,
  PAYMENT_STATUS_LABELS,
  paymentBalance,
  paymentListStats,
} from "@/lib/payments/payment-utils";
import {
  Banknote,
  CheckCircle2,
  Filter,
  Landmark,
  Plus,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const STATUS_OPTIONS: { value: PaymentStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  ...(
    Object.entries(PAYMENT_STATUS_LABELS) as [PaymentStatus, string][]
  ).map(([value, label]) => ({ value, label })),
];

export default function PaymentsPanel() {
  return (
    <SetupPageShell
      title="Payments"
      description="Record outgoing payments to external entities, attach references, and reconcile against invoices."
    >
      {() => <PaymentList />}
    </SetupPageShell>
  );
}

function PaymentList() {
  const [items, setItems] = useState(() => listPayments());
  const [filters, setFilters] = useState<PaymentListFilters>({
    search: "",
    status: "",
    category: "",
  });
  const [applied, setApplied] = useState(filters);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setItems(listPayments());
  }, []);

  const filtered = useMemo(
    () => filterPayments(items, applied),
    [items, applied]
  );
  const stats = useMemo(() => paymentListStats(items), [items]);
  const filterCount =
    (applied.status ? 1 : 0) + (applied.category ? 1 : 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatMini
          icon={Wallet}
          label="Outstanding"
          value={formatPaymentAmount("TZS", stats.outstandingAmount)}
          hint={`${stats.unpaid + stats.partial} open`}
          accent="from-gray-900 to-gray-800 text-white"
        />
        <StatMini
          icon={CheckCircle2}
          label="Paid"
          value={String(stats.paid)}
          hint="Settled in full"
          accent="from-emerald-500 to-emerald-600 text-white"
        />
        <StatMini
          icon={Banknote}
          label="Unpaid"
          value={String(stats.unpaid)}
          hint="Awaiting disbursement"
          accent="from-rose-500 to-rose-600 text-white"
        />
        <StatMini
          icon={Landmark}
          label="Partial"
          value={String(stats.partial)}
          hint="Instalments in progress"
          accent="from-amber-500 to-amber-600 text-white"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-gray-50/80 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950/30">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200/80 px-5 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-gray-900 text-white shadow-lg dark:bg-white dark:text-gray-900">
              <Landmark className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                All payments
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {filtered.length} of {items.length} transactions
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
            <Link href="/payments/create">
              <Button size="sm">
                <Plus className="mr-1.5 size-4" aria-hidden />
                Record payment
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
                placeholder="Search reference, payee, purpose, reconciliation…"
                className="pl-10"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setApplied((prev) => ({ ...prev, search: filters.search }))}
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
                      status: e.target.value as PaymentStatus | "",
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
                <Label>Category</Label>
                <select
                  className={`${selectClass} mt-1.5`}
                  value={applied.category}
                  onChange={(e) =>
                    setApplied((f) => ({
                      ...f,
                      category: e.target.value as PaymentCategory | "",
                    }))
                  }
                >
                  <option value="">All categories</option>
                  {Object.entries(PAYMENT_CATEGORY_LABELS).map(([k, label]) => (
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
              icon={Landmark}
              title="No payments match"
              description="Record a payment to an external entity with purpose and reference."
              action={
                <Link href="/payments/create">
                  <Button size="sm">
                    <Plus className="mr-1.5 size-4" aria-hidden />
                    Record payment
                  </Button>
                </Link>
              }
            />
          ) : (
            <Table className={setupTableClass}>
              <TableHeader>
                <TableRow>
                  {["Reference", "Payee", "Category", "Amount", "Due", "Status", ""].map(
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
                {filtered.map((p) => {
                  const balance = paymentBalance(p);
                  return (
                    <TableRow key={p.id} className={setupTableRowClass}>
                      <TableCell className={setupListTdClass}>
                        <Link
                          href={`/payments/${p.id}`}
                          className="font-mono text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                        >
                          {p.referenceNumber}
                        </Link>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500">
                          {p.purpose}
                        </p>
                      </TableCell>
                      <TableCell className={setupListTdClass}>
                        <div className="flex items-center gap-2.5">
                          <SetupAvatar name={p.payeeName} size="xs" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900 dark:text-white">
                              {p.payeeName}
                            </p>
                            {p.payeeAccount ? (
                              <p className="truncate text-xs text-gray-500">
                                {p.payeeAccount}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={`${setupListTdClass} text-xs`}>
                        {PAYMENT_CATEGORY_LABELS[p.category]}
                      </TableCell>
                      <TableCell className={`${setupListTdClass} font-semibold`}>
                        {formatPaymentAmount(p.currency, p.amountDue)}
                        {p.status === "PARTIAL" ? (
                          <p className="text-[11px] font-normal text-amber-700 dark:text-amber-400">
                            {formatPaymentAmount(p.currency, balance)} due
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className={`${setupListTdClass} text-xs`}>
                        {formatPaymentDate(p.dueAt)}
                      </TableCell>
                      <TableCell className={setupListTdClass}>
                        <PaymentStatusBadge status={p.status} />
                      </TableCell>
                      <TableCell className={setupListTdClass}>
                        <SetupRowActions>
                          <SetupRowActionLink
                            href={`/payments/${p.id}`}
                            title="View"
                          />
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
