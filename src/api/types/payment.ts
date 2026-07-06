import type { PaymentRecurrenceRequest } from "./payment-config";

export type PaymentWorkflowStatus =
  | "DRAFT"
  | "SUBMITTED_FOR_APPROVAL"
  | "APPROVED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CANCELLED";

export type PaymentReferenceKind =
  | "INVOICE"
  | "ENGAGEMENT"
  | "CONTROL_NUMBER"
  | "OTHER";

export type PaymentReferenceDto = {
  id?: string;
  kind: PaymentReferenceKind;
  value: string;
};

export type PaymentReminderSchedule =
  | "TWO_DAYS_BEFORE"
  | "ONE_WEEK_BEFORE"
  | "TWO_WEEKS_BEFORE"
  | "ONE_MONTH_BEFORE"
  | "ON_REFERENCE_DATE"
  | "EVERY_WEEK"
  | "EVERY_MONTH"
  | "CUSTOM";

export type PaymentAccessResponse = {
  officeId: string;
  visible: boolean;
  canCreate: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canMarkPaid: boolean;
  canManagePermissions: boolean;
};

export type PaymentPermissionDto = {
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

export type PaymentReminderDto = {
  id?: string;
  schedule: PaymentReminderSchedule;
  customAt?: string;
  note?: string;
};

export type PaymentAttachmentDto = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url?: string | null;
};

export type PaymentInstallmentDto = {
  id: string;
  amount: number;
  paidAt: string;
  paymentMethodName?: string | null;
  note?: string | null;
  recordedBy?: { id: string; fullName: string } | null;
  recordedAt?: string;
};

export type PaymentActivityDto = {
  id: string;
  at: string;
  action: string;
  detail?: string | null;
  actor?: { id: string; fullName: string } | null;
};

export type OfficePaymentResponse = {
  id: string;
  officeId: string;
  referenceNumber: string;
  payeeName: string;
  payeeAccount?: string | null;
  categoryId: string;
  categoryName: string;
  categoryRequiresReconciliationNote: boolean;
  purpose: string;
  currency: string;
  amountDue: number;
  amountPaid: number;
  amountRemaining?: number;
  status: PaymentWorkflowStatus;
  dueDate: string;
  paidAt?: string | null;
  paymentMethodId?: string | null;
  paymentMethodName?: string | null;
  reconciliationNote?: string | null;
  linkedInvoiceNumber?: string | null;
  createdAt: string;
  updatedAt?: string;
  createdBy?: { id: string; fullName: string } | null;
  submittedAt?: string | null;
  submittedBy?: { id: string; fullName: string } | null;
  approvedAt?: string | null;
  approvedBy?: { id: string; fullName: string } | null;
  paidBy?: { id: string; fullName: string } | null;
  reminders?: PaymentReminderDto[];
  references?: PaymentReferenceDto[];
  installments?: PaymentInstallmentDto[];
  attachments?: PaymentAttachmentDto[];
  attachmentCount?: number;
  activityLog?: PaymentActivityDto[];
};

export type CreateOfficePaymentRequest = {
  payeeName: string;
  payeeAccount?: string;
  categoryId: string;
  purpose: string;
  currency?: string;
  amountDue: number;
  dueDate: string;
  reconciliationNote?: string;
  linkedInvoiceNumber?: string;
  references?: PaymentReferenceDto[];
  reminders?: PaymentReminderDto[];
  recurrence?: PaymentRecurrenceRequest;
};

export type UpdateOfficePaymentRequest = CreateOfficePaymentRequest;

export type UpsertPaymentPermissionRequest = {
  userId: string;
  visible: boolean;
  canCreate: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canMarkPaid: boolean;
  canManagePermissions: boolean;
};

export type MarkPaymentPaidRequest = {
  paymentMethodId: string;
  /** Omit to pay the full remaining balance. */
  amount?: number;
  paidAt?: string;
  note?: string;
};
