"use client";

import CustomerEmailModal from "@/components/customers/CustomerEmailModal";
import CustomerPaymentHistoryModal from "@/components/customers/CustomerPaymentHistoryModal";
import CustomerRenewalInvoiceModal from "@/components/customers/CustomerRenewalInvoiceModal";
import type { CustomerEngagementResponse } from "@/api/types/template-config";
import Button from "@/components/ui/button/Button";
import {
  FileText,
  History,
  Mail,
  Receipt,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type ModalKey = "email" | "payment" | "renewal" | null;

type Props = {
  companyId: string;
  customerId: string;
  customerName: string;
  customerEmail?: string | null;
  engagements: CustomerEngagementResponse[];
};

export default function CustomerDetailActions({
  companyId,
  customerId,
  customerName,
  customerEmail,
  engagements,
}: Props) {
  const [openModal, setOpenModal] = useState<ModalKey>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Customer actions
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setOpenModal("email")}
          >
            <Mail className="mr-1.5 size-4" aria-hidden />
            Send email
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setOpenModal("renewal")}
          >
            <RotateCcw className="mr-1.5 size-4" aria-hidden />
            Renewal invoice
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setOpenModal("payment")}
          >
            <History className="mr-1.5 size-4" aria-hidden />
            Payment history
          </Button>
          <Link href="/invoices">
            <Button type="button" size="sm" variant="outline">
              <Receipt className="mr-1.5 size-4" aria-hidden />
              All invoices
            </Button>
          </Link>
          <Link href={`/invoices/create?from=inv-002`}>
            <Button type="button" size="sm" variant="outline">
              <FileText className="mr-1.5 size-4" aria-hidden />
              New invoice
            </Button>
          </Link>
        </div>
      </div>

      {toast ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          {toast}
        </p>
      ) : null}

      <CustomerEmailModal
        isOpen={openModal === "email"}
        onClose={() => setOpenModal(null)}
        companyId={companyId}
        customerId={customerId}
        customerName={customerName}
        defaultEmail={customerEmail}
        onSent={() => showToast(`Email sent to ${customerEmail ?? "customer"}.`)}
      />

      <CustomerPaymentHistoryModal
        isOpen={openModal === "payment"}
        onClose={() => setOpenModal(null)}
        customerId={customerId}
        customerName={customerName}
      />

      <CustomerRenewalInvoiceModal
        isOpen={openModal === "renewal"}
        onClose={() => setOpenModal(null)}
        customerName={customerName}
        customerEmail={customerEmail}
        engagements={engagements}
        onCreated={() =>
          showToast("Renewal invoice created (sample). Connect billing API for live data.")
        }
      />
    </>
  );
}
