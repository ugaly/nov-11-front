export type InvoiceStatus =
  | "PAID"
  | "UNPAID"
  | "DUE_7_DAYS"
  | "DUE_30_DAYS"
  | "OVERDUE"
  | "DRAFT"
  | "CANCELLED";

export type InvoiceType =
  | "SUBSCRIPTION"
  | "RENEWAL"
  | "UPGRADE"
  | "ONE_TIME"
  | "MANUAL";

export type InvoiceLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceActivity = {
  id: string;
  at: string;
  label: string;
  detail?: string;
};

export type InvoiceRecord = {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  engagementRef?: string;
  catalogName?: string;
  type: InvoiceType;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  /** When true, VAT at taxRate is added to subtotal. Default false on new invoices. */
  vatIncluded: boolean;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
  lineItems: InvoiceLineItem[];
  notes?: string;
  billingAddress: string;
  activities: InvoiceActivity[];
};

export type InvoiceCustomerOption = {
  id: string;
  name: string;
  email: string;
  billingAddress: string;
};

export type InvoiceListFilters = {
  search: string;
  status: InvoiceStatus | "";
  type: InvoiceType | "";
  sort: "newest" | "oldest" | "amount-desc" | "amount-asc" | "due-soon";
};
