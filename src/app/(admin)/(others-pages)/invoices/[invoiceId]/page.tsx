import InvoiceDetailPanel from "@/components/invoices/InvoiceDetailPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoice",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  return <InvoiceDetailPanel invoiceId={invoiceId} />;
}
