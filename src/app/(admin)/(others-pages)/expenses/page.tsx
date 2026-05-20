import ExpensesPanel from "@/components/expenses/ExpensesPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expenses",
};

export default function ExpensesPage() {
  return <ExpensesPanel />;
}
