import type { InvoiceWorkflowStatus, OfficeInvoiceResponse } from "@/api/types/invoice";

export type InvoiceRecord = OfficeInvoiceResponse;

export type InvoiceListFilters = {
  search: string;
  status: InvoiceWorkflowStatus | "";
};
