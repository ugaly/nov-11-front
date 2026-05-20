import type { ReminderEntry } from "@/lib/reminders/reminder-types";

export type ExpenseStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "PAID"
  | "REJECTED";

export type ExpenseCategory =
  | "TRAVEL"
  | "OFFICE"
  | "SOFTWARE"
  | "MARKETING"
  | "PAYROLL"
  | "UTILITIES"
  | "OTHER";

export type ExpenseAttachment = {
  id: string;
  name: string;
  mimeType: string;
  uploadedAt: string;
  dataUrl?: string;
};

export type ExpenseHistoryEntry = {
  id: string;
  at: string;
  label: string;
  detail?: string;
};

export type ExpenseRecord = {
  id: string;
  referenceNumber: string;
  title: string;
  vendor: string;
  category: ExpenseCategory;
  description: string;
  currency: string;
  amount: number;
  status: ExpenseStatus;
  expenseDate: string;
  createdAt: string;
  paidAt?: string;
  paymentMethod?: string;
  linkedPaymentId?: string;
  linkedPaymentRef?: string;
  receipt?: ExpenseAttachment;
  notes?: string;
  reminders?: ReminderEntry[];
  history: ExpenseHistoryEntry[];
};

export type ExpenseListFilters = {
  search: string;
  status: ExpenseStatus | "";
  category: ExpenseCategory | "";
};
