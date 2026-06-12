import ExpenseDetailPanel from "@/components/expenses/ExpenseDetailPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expense details",
};

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ expenseId: string }>;
}) {
  const { expenseId } = await params;
  return <ExpenseDetailPanel expenseId={expenseId} />;
}
