import PaymentMethodsConfigPanel from "@/components/payments/PaymentMethodsConfigPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment methods | Setup",
};

export default function PaymentMethodsPage() {
  return <PaymentMethodsConfigPanel />;
}
