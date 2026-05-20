import type { ReminderEntry } from "@/lib/reminders/reminder-types";

export type PaymentStatus =
  | "UNPAID"
  | "PAID"
  | "PARTIAL"
  | "SCHEDULED"
  | "CANCELLED";

export type PaymentCategory =
  | "SUPPLIER"
  | "TAX"
  | "SALARY"
  | "UTILITY"
  | "LOAN"
  | "RECONCILIATION"
  | "OTHER";

export type PaymentMethod =
  | "BANK_TRANSFER"
  | "MOBILE_MONEY"
  | "CASH"
  | "CHEQUE"
  | "CARD"
  | "OTHER";

export type PaymentAttachment = {
  id: string;
  name: string;
  mimeType: string;
  uploadedAt: string;
  /** Data URL for demo preview (local only). */
  dataUrl?: string;
};

export type PaymentHistoryEntry = {
  id: string;
  at: string;
  label: string;
  detail?: string;
  amount?: number;
};

export type PaymentRecord = {
  id: string;
  referenceNumber: string;
  /** External entity / payee. */
  payeeName: string;
  payeeAccount?: string;
  category: PaymentCategory;
  purpose: string;
  currency: string;
  amountDue: number;
  amountPaid: number;
  status: PaymentStatus;
  dueAt: string;
  createdAt: string;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  reconciliationNote?: string;
  linkedInvoiceId?: string;
  linkedInvoiceNumber?: string;
  attachments: PaymentAttachment[];
  reminders?: ReminderEntry[];
  history: PaymentHistoryEntry[];
};

export type PaymentListFilters = {
  search: string;
  status: PaymentStatus | "";
  category: PaymentCategory | "";
};
