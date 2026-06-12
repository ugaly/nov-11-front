import ExpenseReminderConfigPanel from "@/components/expenses/ExpenseReminderConfigPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expense reminders | Setup",
};

export default function ExpenseRemindersPage() {
  return <ExpenseReminderConfigPanel />;
}
