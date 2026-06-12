import { apiClient } from "../client";
import { postMultipartJson } from "../multipart";
import type {
  CreateOfficePaymentRequest,
  MarkPaymentPaidRequest,
  OfficePaymentResponse,
  PaymentAccessResponse,
  PaymentPermissionDto,
  PaymentReferenceDto,
  UpdateOfficePaymentRequest,
  UpsertPaymentPermissionRequest,
} from "../types/payment";
import type {
  DuplicatePaymentMonthRequest,
  PaymentRecurrenceRequest,
  PaymentRecurrenceResponse,
} from "../types/payment-config";

export async function fetchPaymentAccess(
  officeId: string
): Promise<PaymentAccessResponse> {
  const { data } = await apiClient.get<PaymentAccessResponse>(
    `/api/offices/${officeId}/payments/access`
  );
  return data;
}

export async function listPaymentPermissions(
  officeId: string
): Promise<PaymentPermissionDto[]> {
  const { data } = await apiClient.get<PaymentPermissionDto[]>(
    `/api/offices/${officeId}/payment-permissions`
  );
  return data;
}

export async function upsertPaymentPermission(
  officeId: string,
  body: UpsertPaymentPermissionRequest
): Promise<PaymentPermissionDto> {
  const { data } = await apiClient.put<PaymentPermissionDto>(
    `/api/offices/${officeId}/payment-permissions`,
    body
  );
  return data;
}

export async function listOfficePayments(
  officeId: string
): Promise<OfficePaymentResponse[]> {
  const { data } = await apiClient.get<OfficePaymentResponse[]>(
    `/api/offices/${officeId}/payments`
  );
  return data;
}

export async function getOfficePayment(
  officeId: string,
  paymentId: string
): Promise<OfficePaymentResponse> {
  const { data } = await apiClient.get<OfficePaymentResponse>(
    `/api/offices/${officeId}/payments/${paymentId}`
  );
  return data;
}

export async function createOfficePayment(
  officeId: string,
  body: CreateOfficePaymentRequest
): Promise<OfficePaymentResponse> {
  const { data } = await apiClient.post<OfficePaymentResponse>(
    `/api/offices/${officeId}/payments`,
    body
  );
  return data;
}

export async function updateOfficePayment(
  officeId: string,
  paymentId: string,
  body: UpdateOfficePaymentRequest
): Promise<OfficePaymentResponse> {
  const { data } = await apiClient.put<OfficePaymentResponse>(
    `/api/offices/${officeId}/payments/${paymentId}`,
    body
  );
  return data;
}

export async function updateOfficePaymentReferences(
  officeId: string,
  paymentId: string,
  references: PaymentReferenceDto[]
): Promise<OfficePaymentResponse> {
  const { data } = await apiClient.put<OfficePaymentResponse>(
    `/api/offices/${officeId}/payments/${paymentId}/references`,
    references
  );
  return data;
}

export async function submitPaymentForApproval(
  officeId: string,
  paymentId: string
): Promise<OfficePaymentResponse> {
  const { data } = await apiClient.post<OfficePaymentResponse>(
    `/api/offices/${officeId}/payments/${paymentId}/submit`
  );
  return data;
}

export async function approveOfficePayment(
  officeId: string,
  paymentId: string
): Promise<OfficePaymentResponse> {
  const { data } = await apiClient.post<OfficePaymentResponse>(
    `/api/offices/${officeId}/payments/${paymentId}/approve`
  );
  return data;
}

export async function markOfficePaymentPaid(
  officeId: string,
  paymentId: string,
  body: MarkPaymentPaidRequest
): Promise<OfficePaymentResponse> {
  const { data } = await apiClient.post<OfficePaymentResponse>(
    `/api/offices/${officeId}/payments/${paymentId}/mark-paid`,
    body
  );
  return data;
}

export async function cancelOfficePayment(
  officeId: string,
  paymentId: string
): Promise<OfficePaymentResponse> {
  const { data } = await apiClient.post<OfficePaymentResponse>(
    `/api/offices/${officeId}/payments/${paymentId}/cancel`
  );
  return data;
}

export async function reopenCancelledOfficePayment(
  officeId: string,
  paymentId: string
): Promise<OfficePaymentResponse> {
  const { data } = await apiClient.post<OfficePaymentResponse>(
    `/api/offices/${officeId}/payments/${paymentId}/reopen`
  );
  return data;
}

export async function getPaymentRecurrence(
  officeId: string,
  paymentId: string
): Promise<PaymentRecurrenceResponse | null> {
  const { data } = await apiClient.get<PaymentRecurrenceResponse | null>(
    `/api/offices/${officeId}/payments/${paymentId}/recurrence`
  );
  return data;
}

export async function upsertPaymentRecurrence(
  officeId: string,
  paymentId: string,
  body: PaymentRecurrenceRequest
): Promise<PaymentRecurrenceResponse> {
  const { data } = await apiClient.put<PaymentRecurrenceResponse>(
    `/api/offices/${officeId}/payments/${paymentId}/recurrence`,
    body
  );
  return data;
}

export async function duplicatePaymentToMonth(
  officeId: string,
  paymentId: string,
  body: DuplicatePaymentMonthRequest
): Promise<OfficePaymentResponse> {
  const { data } = await apiClient.post<OfficePaymentResponse>(
    `/api/offices/${officeId}/payments/${paymentId}/duplicate-month`,
    body
  );
  return data;
}

export async function uploadPaymentAttachment(
  officeId: string,
  paymentId: string,
  file: File
): Promise<OfficePaymentResponse> {
  return postMultipartJson<OfficePaymentResponse>(
    `/api/offices/${officeId}/payments/${paymentId}/attachments`,
    file
  );
}
