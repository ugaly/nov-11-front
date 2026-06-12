export type InvoiceWorkflowStatus =
  | "DRAFT"
  | "SENT"
  | "PARTIALLY_PAID"
  | "PAID"
  | "VOID";

export type InvoiceAccessResponse = {
  officeId: string;
  visible: boolean;
  canCreate: boolean;
  canSend: boolean;
  canMarkPaid: boolean;
  canManagePermissions: boolean;
};

export type InvoicePermissionDto = {
  id?: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  visible: boolean;
  canCreate: boolean;
  canSend: boolean;
  canMarkPaid: boolean;
  canManagePermissions: boolean;
};

export type UpsertInvoicePermissionRequest = {
  userId: string;
  visible: boolean;
  canCreate: boolean;
  canSend: boolean;
  canMarkPaid: boolean;
  canManagePermissions: boolean;
};

export type InvoiceRecipientKind = "CUSTOMER" | "USER";

export type InvoiceRecipientSearchResult = {
  kind: InvoiceRecipientKind;
  customerId?: string | null;
  userId?: string | null;
  displayName: string;
  email: string;
  subtitle?: string | null;
};

export type InvoiceLineItemDto = {
  id?: string;
  lineOrder: number;
  description: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
};

export type OfficeInvoiceResponse = {
  id: string;
  officeId: string;
  referenceNumber: string;
  customerId?: string | null;
  customerName?: string | null;
  billToName: string;
  billToEmail: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  taxIncluded: boolean;
  amountPaid: number;
  amountRemaining?: number;
  notes?: string | null;
  terms?: string | null;
  status: InvoiceWorkflowStatus;
  sentAt?: string | null;
  paidAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: { id: string; fullName: string } | null;
  sentBy?: { id: string; fullName: string } | null;
  paidBy?: { id: string; fullName: string } | null;
  lineItems: InvoiceLineItemDto[];
  payments?: InvoicePaymentDto[];
  reminders?: InvoiceReminderDto[];
};

export type InvoicePaymentDto = {
  id: string;
  amount: number;
  paidAt: string;
  note?: string | null;
  recordedBy?: { id: string; fullName: string } | null;
};

export type InvoiceReminderDto = {
  id?: string;
  schedule: string;
  customAt?: string | null;
  note?: string | null;
  lastSentAt?: string | null;
};

export type InvoiceReminderRequest = {
  schedule: string;
  customAt?: string;
  note?: string;
};

export type InvoiceLineItemRequest = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type CreateOfficeInvoiceRequest = {
  customerId?: string;
  billToName: string;
  billToEmail: string;
  issueDate: string;
  dueDate: string;
  currency?: string;
  taxRate?: number;
  taxIncluded?: boolean;
  reminders?: InvoiceReminderRequest[];
  notes?: string;
  terms?: string;
  lineItems: InvoiceLineItemRequest[];
};

export type UpdateOfficeInvoiceRequest = CreateOfficeInvoiceRequest;

export type MarkInvoicePaidRequest = {
  amount?: number;
  paidAt?: string;
  note?: string;
};
