import ExpenseDetailPanel from "@/components/expenses/ExpenseDetailPanel";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ expenseId: string }>;
}) {
  const { expenseId } = await params;
  return <ExpenseDetailPanel expenseId={expenseId} />;
}
