import PaymentsPanel from "@/components/payments/PaymentsPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payments",
};

export default function PaymentsPage() {
  return <PaymentsPanel />;
}
