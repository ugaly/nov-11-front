import CustomersPanel from "@/components/setup/CustomersPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customers | Setup",
  description: "Manage customers for engagements.",
};

export default function CustomersPage() {
  return <CustomersPanel />;
}
