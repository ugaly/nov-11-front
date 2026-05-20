import PaymentCreatePanel from "@/components/payments/PaymentCreatePanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Record payment",
};

export default function PaymentCreatePage() {
  return <PaymentCreatePanel />;
}
