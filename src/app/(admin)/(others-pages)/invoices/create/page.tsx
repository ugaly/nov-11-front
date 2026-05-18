import InvoiceCreatePanel from "@/components/invoices/InvoiceCreatePanel";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Create invoice",
};

export default function CreateInvoicePage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading form…</p>}>
      <InvoiceCreatePanel />
    </Suspense>
  );
}
