import InvoicesPanel from "@/components/invoices/InvoicesPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoices",
};

export default function InvoicesPage() {
  return <InvoicesPanel />;
}
