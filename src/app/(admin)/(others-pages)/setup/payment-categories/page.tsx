import PaymentCategoriesConfigPanel from "@/components/payments/PaymentCategoriesConfigPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment categories | Setup",
};

export default function PaymentCategoriesPage() {
  return <PaymentCategoriesConfigPanel />;
}
