import ExpenseTypesConfigPanel from "@/components/expenses/ExpenseTypesConfigPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expense types | Setup",
};

export default function ExpenseTypesPage() {
  return <ExpenseTypesConfigPanel />;
}
