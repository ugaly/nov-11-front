import type { OfficeExpenseResponse, ExpenseWorkflowStatus } from "@/api/types/expense";

export type { ExpenseWorkflowStatus };

export type ExpenseStatus = ExpenseWorkflowStatus;

export type ExpenseListFilters = {
  search: string;
  status: ExpenseWorkflowStatus | "";
  expenseTypeId: string;
};

export type ExpenseRecord = OfficeExpenseResponse;

export type { ExpenseReminderDto as ExpenseReminderEntry } from "@/api/types/expense";
