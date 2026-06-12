import { apiClient } from "../client";
import type {
  CreateOfficeInvoiceRequest,
  InvoiceAccessResponse,
  InvoicePermissionDto,
  InvoiceRecipientSearchResult,
  MarkInvoicePaidRequest,
  OfficeInvoiceResponse,
  UpdateOfficeInvoiceRequest,
  UpsertInvoicePermissionRequest,
} from "../types/invoice";

export async function fetchInvoiceAccess(
  officeId: string
): Promise<InvoiceAccessResponse> {
  const { data } = await apiClient.get<InvoiceAccessResponse>(
    `/api/offices/${officeId}/invoices/access`
  );
  return data;
}

export async function listInvoicePermissions(
  officeId: string
): Promise<InvoicePermissionDto[]> {
  const { data } = await apiClient.get<InvoicePermissionDto[]>(
    `/api/offices/${officeId}/invoice-permissions`
  );
  return data;
}

export async function upsertInvoicePermission(
  officeId: string,
  body: UpsertInvoicePermissionRequest
): Promise<InvoicePermissionDto> {
  const { data } = await apiClient.put<InvoicePermissionDto>(
    `/api/offices/${officeId}/invoice-permissions`,
    body
  );
  return data;
}

export async function searchInvoiceRecipients(
  officeId: string,
  q: string
): Promise<InvoiceRecipientSearchResult[]> {
  const { data } = await apiClient.get<InvoiceRecipientSearchResult[]>(
    `/api/offices/${officeId}/invoices/recipients/search`,
    { params: { q } }
  );
  return data;
}

export async function listOfficeInvoices(
  officeId: string
): Promise<OfficeInvoiceResponse[]> {
  const { data } = await apiClient.get<OfficeInvoiceResponse[]>(
    `/api/offices/${officeId}/invoices`
  );
  return data;
}

export async function getOfficeInvoice(
  officeId: string,
  invoiceId: string
): Promise<OfficeInvoiceResponse> {
  const { data } = await apiClient.get<OfficeInvoiceResponse>(
    `/api/offices/${officeId}/invoices/${invoiceId}`
  );
  return data;
}

export async function createOfficeInvoice(
  officeId: string,
  body: CreateOfficeInvoiceRequest
): Promise<OfficeInvoiceResponse> {
  const { data } = await apiClient.post<OfficeInvoiceResponse>(
    `/api/offices/${officeId}/invoices`,
    body
  );
  return data;
}

export async function updateOfficeInvoice(
  officeId: string,
  invoiceId: string,
  body: UpdateOfficeInvoiceRequest
): Promise<OfficeInvoiceResponse> {
  const { data } = await apiClient.put<OfficeInvoiceResponse>(
    `/api/offices/${officeId}/invoices/${invoiceId}`,
    body
  );
  return data;
}

export async function sendOfficeInvoice(
  officeId: string,
  invoiceId: string
): Promise<OfficeInvoiceResponse> {
  const { data } = await apiClient.post<OfficeInvoiceResponse>(
    `/api/offices/${officeId}/invoices/${invoiceId}/send`
  );
  return data;
}

export async function resendOfficeInvoice(
  officeId: string,
  invoiceId: string
): Promise<OfficeInvoiceResponse> {
  const { data } = await apiClient.post<OfficeInvoiceResponse>(
    `/api/offices/${officeId}/invoices/${invoiceId}/resend`
  );
  return data;
}

export async function downloadOfficeInvoicePdf(
  officeId: string,
  invoiceId: string
): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(
    `/api/offices/${officeId}/invoices/${invoiceId}/pdf`,
    { responseType: "blob" }
  );
  return data;
}

export async function markOfficeInvoicePaid(
  officeId: string,
  invoiceId: string,
  body: MarkInvoicePaidRequest = {}
): Promise<OfficeInvoiceResponse> {
  const { data } = await apiClient.post<OfficeInvoiceResponse>(
    `/api/offices/${officeId}/invoices/${invoiceId}/mark-paid`,
    body
  );
  return data;
}

export async function voidOfficeInvoice(
  officeId: string,
  invoiceId: string
): Promise<OfficeInvoiceResponse> {
  const { data } = await apiClient.post<OfficeInvoiceResponse>(
    `/api/offices/${officeId}/invoices/${invoiceId}/void`
  );
  return data;
}
