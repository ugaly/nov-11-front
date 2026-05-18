import InvoiceDetailPanel from "@/components/invoices/InvoiceDetailPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoice detail",
};

type Props = { params: Promise<{ invoiceId: string }> };

export default async function InvoiceDetailPage({ params }: Props) {
  const { invoiceId } = await params;
  return <InvoiceDetailPanel invoiceId={invoiceId} />;
}
