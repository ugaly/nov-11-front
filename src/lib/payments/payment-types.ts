import type { OfficePaymentResponse, PaymentWorkflowStatus } from "@/api/types/payment";

export type { PaymentWorkflowStatus };

export type PaymentStatus = PaymentWorkflowStatus;

export type PaymentListFilters = {
  search: string;
  status: PaymentWorkflowStatus | "";
  categoryId: string;
};

export type PaymentRecord = OfficePaymentResponse;

export type PaymentHistoryEntry = {
  id: string;
  at: string;
  label: string;
  detail?: string;
};

export type { PaymentReminderDto as PaymentReminderEntry } from "@/api/types/payment";
