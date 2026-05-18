"use client";

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
import {
  getDummyPaymentHistory,
  type CustomerPaymentRecord,
} from "@/lib/customers/customer-dummy-data";
import {
  formatInvoiceAmount,
  formatInvoiceDate,
} from "@/lib/invoices/invoice-utils";
import { History, Wallet } from "lucide-react";
import { useMemo } from "react";

function statusBadge(status: CustomerPaymentRecord["status"]) {
  switch (status) {
    case "Paid":
      return { color: "success" as const };
    case "Pending":
      return { color: "warning" as const };
    case "Failed":
      return { color: "error" as const };
    default:
      return { color: "light" as const };
  }
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
};

export default function CustomerPaymentHistoryModal({
  isOpen,
  onClose,
  customerId,
  customerName,
}: Props) {
  const payments = useMemo(
    () => getDummyPaymentHistory(customerId),
    [customerId]
  );

  const totalPaid = payments
    .filter((p) => p.status === "Paid")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl p-0">
      <div className="flex max-h-[min(90vh,36rem)] flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <History className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Payment history
              </h2>
              <p className="text-sm text-gray-500">{customerName}</p>
            </div>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-xs text-gray-500">Total paid (sample)</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {formatInvoiceAmount("TZS", totalPaid)}
            </p>
          </div>
        </div>

        <div className={`min-h-0 flex-1 overflow-y-auto px-2 pb-2 ${setupListTableSectionClass}`}>
          <p className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
            Sample data — connect billing API for live payments.
          </p>
          <Table className={setupTableClass}>
            <TableHeader>
              <TableRow>
                {["Date", "Reference", "Description", "Amount", "Method", "Status"].map(
                  (h) => (
                    <TableCell
                      key={h}
                      isHeader
                      className={`${setupListThClass} whitespace-nowrap`}
                    >
                      {h}
                    </TableCell>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => {
                const b = statusBadge(p.status);
                return (
                  <TableRow key={p.id} className={setupTableRowClass}>
                    <TableCell className={`${setupListTdClass} text-xs`}>
                      {formatInvoiceDate(p.date)}
                    </TableCell>
                    <TableCell
                      className={`${setupListTdClass} font-mono text-xs`}
                    >
                      {p.reference}
                    </TableCell>
                    <TableCell className={`${setupListTdClass} max-w-[12rem]`}>
                      <span className="block truncate" title={p.description}>
                        {p.description}
                      </span>
                    </TableCell>
                    <TableCell className={`${setupListTdClass} font-semibold`}>
                      {formatInvoiceAmount(p.currency, p.amount)}
                    </TableCell>
                    <TableCell className={`${setupListTdClass} text-xs`}>
                      {p.method}
                    </TableCell>
                    <TableCell className={setupListTdClass}>
                      <Badge size="sm" color={b.color}>
                        {p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <p className="flex items-center gap-1.5 text-xs text-gray-500 sm:hidden">
            <Wallet className="size-3.5" aria-hidden />
            Paid: {formatInvoiceAmount("TZS", totalPaid)}
          </p>
          <Button type="button" variant="outline" onClick={onClose} className="ml-auto">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
