import { apiClient } from "../client";
import { postMultipartJson } from "../multipart";
import type {
  DuplicateExpenseMonthRequest,
  ExpenseRecurrenceRequest,
  ExpenseRecurrenceResponse,
} from "../types/expense-config";
import type {
  CreateOfficeExpenseRequest,
  ExpenseAccessResponse,
  ExpensePermissionDto,
  MarkExpensePaidRequest,
  OfficeExpenseResponse,
  UpdateOfficeExpenseRequest,
  UpsertExpensePermissionRequest,
} from "../types/expense";

export async function fetchExpenseAccess(
  officeId: string
): Promise<ExpenseAccessResponse> {
  const { data } = await apiClient.get<ExpenseAccessResponse>(
    `/api/offices/${officeId}/expenses/access`
  );
  return data;
}

export async function listExpensePermissions(
  officeId: string
): Promise<ExpensePermissionDto[]> {
  const { data } = await apiClient.get<ExpensePermissionDto[]>(
    `/api/offices/${officeId}/expense-permissions`
  );
  return data;
}

export async function upsertExpensePermission(
  officeId: string,
  body: UpsertExpensePermissionRequest
): Promise<ExpensePermissionDto> {
  const { data } = await apiClient.put<ExpensePermissionDto>(
    `/api/offices/${officeId}/expense-permissions`,
    body
  );
  return data;
}

export async function listOfficeExpenses(
  officeId: string
): Promise<OfficeExpenseResponse[]> {
  const { data } = await apiClient.get<OfficeExpenseResponse[]>(
    `/api/offices/${officeId}/expenses`
  );
  return data;
}

export async function getOfficeExpense(
  officeId: string,
  expenseId: string
): Promise<OfficeExpenseResponse> {
  const { data } = await apiClient.get<OfficeExpenseResponse>(
    `/api/offices/${officeId}/expenses/${expenseId}`
  );
  return data;
}

export async function createOfficeExpense(
  officeId: string,
  body: CreateOfficeExpenseRequest
): Promise<OfficeExpenseResponse> {
  const { data } = await apiClient.post<OfficeExpenseResponse>(
    `/api/offices/${officeId}/expenses`,
    body
  );
  return data;
}

export async function updateOfficeExpense(
  officeId: string,
  expenseId: string,
  body: UpdateOfficeExpenseRequest
): Promise<OfficeExpenseResponse> {
  const { data } = await apiClient.put<OfficeExpenseResponse>(
    `/api/offices/${officeId}/expenses/${expenseId}`,
    body
  );
  return data;
}

export async function submitExpenseForApproval(
  officeId: string,
  expenseId: string
): Promise<OfficeExpenseResponse> {
  const { data } = await apiClient.post<OfficeExpenseResponse>(
    `/api/offices/${officeId}/expenses/${expenseId}/submit`
  );
  return data;
}

export async function approveOfficeExpense(
  officeId: string,
  expenseId: string
): Promise<OfficeExpenseResponse> {
  const { data } = await apiClient.post<OfficeExpenseResponse>(
    `/api/offices/${officeId}/expenses/${expenseId}/approve`
  );
  return data;
}

export async function rejectOfficeExpense(
  officeId: string,
  expenseId: string
): Promise<OfficeExpenseResponse> {
  const { data } = await apiClient.post<OfficeExpenseResponse>(
    `/api/offices/${officeId}/expenses/${expenseId}/reject`
  );
  return data;
}

export async function markOfficeExpensePaid(
  officeId: string,
  expenseId: string,
  body: MarkExpensePaidRequest
): Promise<OfficeExpenseResponse> {
  const { data } = await apiClient.post<OfficeExpenseResponse>(
    `/api/offices/${officeId}/expenses/${expenseId}/mark-paid`,
    body
  );
  return data;
}

export async function cancelOfficeExpense(
  officeId: string,
  expenseId: string
): Promise<OfficeExpenseResponse> {
  const { data } = await apiClient.post<OfficeExpenseResponse>(
    `/api/offices/${officeId}/expenses/${expenseId}/cancel`
  );
  return data;
}

export async function getExpenseRecurrence(
  officeId: string,
  expenseId: string
): Promise<ExpenseRecurrenceResponse | null> {
  const { data } = await apiClient.get<ExpenseRecurrenceResponse | null>(
    `/api/offices/${officeId}/expenses/${expenseId}/recurrence`
  );
  return data;
}

export async function upsertExpenseRecurrence(
  officeId: string,
  expenseId: string,
  body: ExpenseRecurrenceRequest
): Promise<ExpenseRecurrenceResponse> {
  const { data } = await apiClient.put<ExpenseRecurrenceResponse>(
    `/api/offices/${officeId}/expenses/${expenseId}/recurrence`,
    body
  );
  return data;
}

export async function duplicateExpenseToMonth(
  officeId: string,
  expenseId: string,
  body: DuplicateExpenseMonthRequest
): Promise<OfficeExpenseResponse> {
  const { data } = await apiClient.post<OfficeExpenseResponse>(
    `/api/offices/${officeId}/expenses/${expenseId}/duplicate-month`,
    body
  );
  return data;
}

export async function uploadExpenseAttachment(
  officeId: string,
  expenseId: string,
  file: File
): Promise<OfficeExpenseResponse> {
  return postMultipartJson<OfficeExpenseResponse>(
    `/api/offices/${officeId}/expenses/${expenseId}/attachments`,
    file
  );
}
