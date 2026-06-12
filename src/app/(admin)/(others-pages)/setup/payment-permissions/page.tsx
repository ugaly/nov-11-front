import PaymentPermissionsPanel from "@/components/payments/PaymentPermissionsPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Office permissions",
};

export default function PaymentPermissionsPage() {
  return <PaymentPermissionsPanel />;
}
