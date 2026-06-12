import type { ExpenseRecurrenceRequest } from "./expense-config";
import type { PaymentReminderSchedule } from "./payment";

export type ExpenseWorkflowStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "PAID"
  | "REJECTED";

export type ExpenseAccessResponse = {
  officeId: string;
  visible: boolean;
  canCreate: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canMarkPaid: boolean;
  canManagePermissions: boolean;
};

export type ExpensePermissionDto = {
  id?: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  visible: boolean;
  canCreate: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canMarkPaid: boolean;
  canManagePermissions: boolean;
};

export type ExpenseReminderDto = {
  id?: string;
  schedule: PaymentReminderSchedule;
  customAt?: string;
  note?: string;
};

export type ExpenseAttachmentDto = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url?: string | null;
};

export type ExpenseActivityDto = {
  id: string;
  at: string;
  action: string;
  detail?: string | null;
  actor?: { id: string; fullName: string } | null;
};

export type OfficeExpenseResponse = {
  id: string;
  officeId: string;
  referenceNumber: string;
  title: string;
  vendor?: string | null;
  expenseTypeId: string;
  expenseTypeName: string;
  description?: string | null;
  notes?: string | null;
  currency: string;
  amount: number;
  status: ExpenseWorkflowStatus;
  expenseDate: string;
  paidAt?: string | null;
  paymentMethod?: string | null;
  linkedPaymentReference?: string | null;
  createdAt: string;
  updatedAt?: string;
  createdBy?: { id: string; fullName: string } | null;
  submittedAt?: string | null;
  submittedBy?: { id: string; fullName: string } | null;
  approvedAt?: string | null;
  approvedBy?: { id: string; fullName: string } | null;
  rejectedAt?: string | null;
  rejectedBy?: { id: string; fullName: string } | null;
  paidBy?: { id: string; fullName: string } | null;
  reminders?: ExpenseReminderDto[];
  attachments?: ExpenseAttachmentDto[];
  activityLog?: ExpenseActivityDto[];
};

export type CreateOfficeExpenseRequest = {
  title: string;
  vendor?: string;
  expenseTypeId: string;
  description?: string;
  notes?: string;
  currency?: string;
  amount: number;
  expenseDate: string;
  reminders?: ExpenseReminderDto[];
  recurrence?: ExpenseRecurrenceRequest;
};

export type UpdateOfficeExpenseRequest = CreateOfficeExpenseRequest;

export type UpsertExpensePermissionRequest = {
  userId: string;
  visible: boolean;
  canCreate: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canMarkPaid: boolean;
  canManagePermissions: boolean;
};

export type MarkExpensePaidRequest = {
  paymentMethod: string;
  paidAt?: string;
  linkedPaymentReference?: string;
};
