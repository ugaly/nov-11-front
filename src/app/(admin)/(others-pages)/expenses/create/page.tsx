import ExpenseCreatePanel from "@/components/expenses/ExpenseCreatePanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "New expense",
};

export default function ExpenseCreatePage() {
  return <ExpenseCreatePanel />;
}
