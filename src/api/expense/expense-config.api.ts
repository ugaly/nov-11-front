import { apiClient } from "../client";
import type {
  CompanyExpenseSettingsResponse,
  CompanyExpenseTypeResponse,
  CreateCompanyExpenseTypeRequest,
  UpdateCompanyExpenseSettingsRequest,
  UpdateCompanyExpenseTypeRequest,
} from "../types/expense-config";

export async function listExpenseTypes(
  companyId: string,
  activeOnly = false
): Promise<CompanyExpenseTypeResponse[]> {
  const { data } = await apiClient.get<CompanyExpenseTypeResponse[]>(
    `/api/companies/${companyId}/expense-types`,
    { params: { activeOnly } }
  );
  return data;
}

export async function createExpenseType(
  companyId: string,
  body: CreateCompanyExpenseTypeRequest
): Promise<CompanyExpenseTypeResponse> {
  const { data } = await apiClient.post<CompanyExpenseTypeResponse>(
    `/api/companies/${companyId}/expense-types`,
    body
  );
  return data;
}

export async function updateExpenseType(
  companyId: string,
  typeId: string,
  body: UpdateCompanyExpenseTypeRequest
): Promise<CompanyExpenseTypeResponse> {
  const { data } = await apiClient.patch<CompanyExpenseTypeResponse>(
    `/api/companies/${companyId}/expense-types/${typeId}`,
    body
  );
  return data;
}

export async function deactivateExpenseType(
  companyId: string,
  typeId: string
): Promise<void> {
  await apiClient.delete(
    `/api/companies/${companyId}/expense-types/${typeId}`
  );
}

export async function getExpenseSettings(
  companyId: string
): Promise<CompanyExpenseSettingsResponse> {
  const { data } = await apiClient.get<CompanyExpenseSettingsResponse>(
    `/api/companies/${companyId}/expense-settings`
  );
  return data;
}

export async function updateExpenseSettings(
  companyId: string,
  body: UpdateCompanyExpenseSettingsRequest
): Promise<CompanyExpenseSettingsResponse> {
  const { data } = await apiClient.patch<CompanyExpenseSettingsResponse>(
    `/api/companies/${companyId}/expense-settings`,
    body
  );
  return data;
}
