"use client";

import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  setupListTableSectionClass,
  setupListTdClass,
  setupListThClass,
  setupTableClass,
  setupTableRowClass,
} from "@/components/setup/setup-table-styles";
import { Modal } from "@/components/ui/modal";
import type { CustomerEngagementResponse } from "@/api/types/template-config";
import type { OfficeInvoiceResponse } from "@/api/types/invoice";
import type { OfficePaymentResponse } from "@/api/types/payment";
import { loadCustomerBillingSummary } from "@/lib/customers/customer-billing";
import { getStoredUser } from "@/lib/auth-storage";
import {
  formatInvoiceAmount,
  formatInvoiceDate,
} from "@/lib/invoices/invoice-utils";
import { PAYMENT_STATUS_LABELS, formatPaymentAmount } from "@/lib/payments/payment-utils";
import {
  AlertCircle,
  BarChart3,
  FileText,
  History,
  Loader2,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  engagements?: CustomerEngagementResponse[];
};

type TabId = "overview" | "invoices" | "payments";

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent: string;
}) {
  return (
    <div className={`rounded-xl px-4 py-3.5 ${accent}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      {hint ? <p className="mt-0.5 text-xs opacity-75">{hint}</p> : null}
    </div>
  );
}

const TABS: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "payments", label: "Payments", icon: Wallet },
];

export default function CustomerPaymentHistoryModal({
  isOpen,
  onClose,
  customerId,
  customerName,
  engagements = [],
}: Props) {
  const officeId = getStoredUser()?.officeId ?? null;
  const [tab, setTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<OfficeInvoiceResponse[]>([]);
  const [payments, setPayments] = useState<OfficePaymentResponse[]>([]);
  const [stats, setStats] = useState<{
    invoicePaid: number;
    invoiceUnpaid: number;
    invoiceDraft: number;
    invoicePaidAmount: number;
    invoiceUnpaidAmount: number;
    paymentsCount: number;
    paymentsPaidCount: number;
    paymentsPaidAmount: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setTab("overview");
      return;
    }
    if (!officeId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void loadCustomerBillingSummary(officeId, customerId, customerName, engagements)
      .then((data) => {
        if (cancelled) return;
        setInvoices(data.invoices);
        setPayments(data.payments);
        setStats({
          invoicePaid: data.stats.invoicePaid,
          invoiceUnpaid: data.stats.invoiceUnpaid,
          invoiceDraft: data.stats.invoiceDraft,
          invoicePaidAmount: data.stats.invoicePaidAmount,
          invoiceUnpaidAmount: data.stats.invoiceUnpaidAmount,
          paymentsCount: data.stats.paymentsCount,
          paymentsPaidCount: data.stats.paymentsPaidCount,
          paymentsPaidAmount: data.stats.paymentsPaidAmount,
        });
      })
      .catch(() => {
        if (!cancelled) setError("Could not load billing history.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, officeId, customerId, customerName, engagements]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-6xl p-0">
      <div className="flex max-h-[min(92vh,52rem)] flex-col">
        <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 text-white shadow-md">
                <History className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Billing & payments
                </h2>
                <p className="text-sm text-gray-500">{customerName}</p>
              </div>
            </div>
          </div>

          <div
            className="mt-5 flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1 dark:bg-gray-900/60"
            role="tablist"
            aria-label="Billing sections"
          >
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              const count =
                t.id === "invoices"
                  ? invoices.length
                  : t.id === "payments"
                    ? payments.length
                    : null;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  <Icon className="size-4" aria-hidden />
                  {t.label}
                  {count != null ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        active
                          ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                          : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5" role="tabpanel">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
            </div>
          ) : error ? (
            <p className="flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
              <AlertCircle className="size-4 shrink-0" aria-hidden />
              {error}
            </p>
          ) : stats ? (
            <>
              {tab === "overview" ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                    <StatCard
                      label="Paid invoices"
                      value={String(stats.invoicePaid)}
                      hint={formatInvoiceAmount("TZS", stats.invoicePaidAmount)}
                      accent="bg-emerald-600 text-white"
                    />
                    <StatCard
                      label="Unpaid (sent)"
                      value={String(stats.invoiceUnpaid)}
                      hint={formatInvoiceAmount("TZS", stats.invoiceUnpaidAmount)}
                      accent="bg-amber-500 text-white"
                    />
                    <StatCard
                      label="Draft invoices"
                      value={String(stats.invoiceDraft)}
                      hint="Not yet emailed"
                      accent="bg-slate-600 text-white"
                    />
                    <StatCard
                      label="Linked payments"
                      value={String(stats.paymentsCount)}
                      hint={`${stats.paymentsPaidCount} with money recorded`}
                      accent="bg-blue-600 text-white"
                    />
                    <StatCard
                      label="Paid out"
                      value={formatInvoiceAmount("TZS", stats.paymentsPaidAmount)}
                      hint="Office disbursements"
                      accent="bg-gray-900 text-white dark:bg-gray-800"
                    />
                    <StatCard
                      label="Total invoices"
                      value={String(invoices.length)}
                      hint="All statuses"
                      accent="bg-violet-600 text-white"
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Use the <strong>Invoices</strong> and <strong>Payments</strong> tabs
                    for full lists and links to each record.
                  </p>
                </div>
              ) : null}

              {tab === "invoices" ? (
                invoices.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-gray-200 px-6 py-12 text-center text-sm text-gray-500 dark:border-gray-700">
                    No invoices for this customer yet.
                  </p>
                ) : (
                  <div className={setupListTableSectionClass}>
                    <Table className={setupTableClass}>
                      <TableHeader>
                        <TableRow>
                          {["Reference", "Bill to", "Due", "Total", "Status"].map(
                            (h) => (
                              <TableCell key={h} isHeader className={setupListThClass}>
                                {h}
                              </TableCell>
                            )
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((inv) => (
                          <TableRow key={inv.id} className={setupTableRowClass}>
                            <TableCell className={setupListTdClass}>
                              <Link
                                href={`/invoices/${inv.id}`}
                                className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                                onClick={onClose}
                              >
                                {inv.referenceNumber}
                              </Link>
                            </TableCell>
                            <TableCell className={setupListTdClass}>
                              <span className="block truncate max-w-[10rem]">
                                {inv.billToName}
                              </span>
                            </TableCell>
                            <TableCell className={setupListTdClass}>
                              {formatInvoiceDate(inv.dueDate)}
                            </TableCell>
                            <TableCell className={setupListTdClass}>
                              {formatInvoiceAmount(inv.currency, inv.totalAmount)}
                            </TableCell>
                            <TableCell className={setupListTdClass}>
                              <InvoiceStatusBadge status={inv.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              ) : null}

              {tab === "payments" ? (
                payments.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-gray-200 px-6 py-12 text-center text-sm text-gray-500 dark:border-gray-700">
                    No office payments linked to this customer yet.
                  </p>
                ) : (
                  <div className={setupListTableSectionClass}>
                    <Table className={setupTableClass}>
                      <TableHeader>
                        <TableRow>
                          {[
                            "Reference",
                            "Purpose",
                            "Due",
                            "Paid",
                            "Status",
                          ].map((h) => (
                            <TableCell key={h} isHeader className={setupListThClass}>
                              {h}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((p) => (
                          <TableRow key={p.id} className={setupTableRowClass}>
                            <TableCell className={`${setupListTdClass} font-mono text-xs`}>
                              <Link
                                href={`/payments/${p.id}`}
                                className="text-brand-600 hover:underline dark:text-brand-400"
                                onClick={onClose}
                              >
                                {p.referenceNumber}
                              </Link>
                            </TableCell>
                            <TableCell className={setupListTdClass}>
                              <span
                                className="block max-w-[14rem] truncate"
                                title={p.purpose}
                              >
                                {p.purpose}
                              </span>
                            </TableCell>
                            <TableCell className={setupListTdClass}>
                              {formatInvoiceDate(p.dueDate)}
                            </TableCell>
                            <TableCell className={setupListTdClass}>
                              {formatPaymentAmount(p.currency, p.amountPaid)}
                            </TableCell>
                            <TableCell className={setupListTdClass}>
                              <Badge
                                size="sm"
                                color={
                                  p.status === "PAID"
                                    ? "success"
                                    : p.status === "PARTIALLY_PAID"
                                      ? "warning"
                                      : "light"
                                }
                              >
                                {PAYMENT_STATUS_LABELS[p.status]}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              ) : null}
            </>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
