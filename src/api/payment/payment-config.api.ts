import { apiClient } from "../client";
import type {
  CompanyPaymentCategoryResponse,
  CompanyPaymentMethodResponse,
  CompanyPaymentSettingsResponse,
  CreateCompanyPaymentCategoryRequest,
  CreateCompanyPaymentMethodRequest,
  UpdateCompanyPaymentCategoryRequest,
  UpdateCompanyPaymentMethodRequest,
  UpdateCompanyPaymentSettingsRequest,
} from "../types/payment-config";

export async function listPaymentCategories(
  companyId: string,
  activeOnly = false
): Promise<CompanyPaymentCategoryResponse[]> {
  const { data } = await apiClient.get<CompanyPaymentCategoryResponse[]>(
    `/api/companies/${companyId}/payment-categories`,
    { params: { activeOnly } }
  );
  return data;
}

export async function createPaymentCategory(
  companyId: string,
  body: CreateCompanyPaymentCategoryRequest
): Promise<CompanyPaymentCategoryResponse> {
  const { data } = await apiClient.post<CompanyPaymentCategoryResponse>(
    `/api/companies/${companyId}/payment-categories`,
    body
  );
  return data;
}

export async function updatePaymentCategory(
  companyId: string,
  categoryId: string,
  body: UpdateCompanyPaymentCategoryRequest
): Promise<CompanyPaymentCategoryResponse> {
  const { data } = await apiClient.patch<CompanyPaymentCategoryResponse>(
    `/api/companies/${companyId}/payment-categories/${categoryId}`,
    body
  );
  return data;
}

export async function deactivatePaymentCategory(
  companyId: string,
  categoryId: string
): Promise<void> {
  await apiClient.delete(
    `/api/companies/${companyId}/payment-categories/${categoryId}`
  );
}

export async function listPaymentMethods(
  companyId: string,
  activeOnly = false
): Promise<CompanyPaymentMethodResponse[]> {
  const { data } = await apiClient.get<CompanyPaymentMethodResponse[]>(
    `/api/companies/${companyId}/payment-methods`,
    { params: { activeOnly } }
  );
  return data;
}

export async function createPaymentMethod(
  companyId: string,
  body: CreateCompanyPaymentMethodRequest
): Promise<CompanyPaymentMethodResponse> {
  const { data } = await apiClient.post<CompanyPaymentMethodResponse>(
    `/api/companies/${companyId}/payment-methods`,
    body
  );
  return data;
}

export async function updatePaymentMethod(
  companyId: string,
  methodId: string,
  body: UpdateCompanyPaymentMethodRequest
): Promise<CompanyPaymentMethodResponse> {
  const { data } = await apiClient.patch<CompanyPaymentMethodResponse>(
    `/api/companies/${companyId}/payment-methods/${methodId}`,
    body
  );
  return data;
}

export async function deactivatePaymentMethod(
  companyId: string,
  methodId: string
): Promise<void> {
  await apiClient.delete(
    `/api/companies/${companyId}/payment-methods/${methodId}`
  );
}

export async function getPaymentSettings(
  companyId: string
): Promise<CompanyPaymentSettingsResponse> {
  const { data } = await apiClient.get<CompanyPaymentSettingsResponse>(
    `/api/companies/${companyId}/payment-settings`
  );
  return data;
}

export async function updatePaymentSettings(
  companyId: string,
  body: UpdateCompanyPaymentSettingsRequest
): Promise<CompanyPaymentSettingsResponse> {
  const { data } = await apiClient.patch<CompanyPaymentSettingsResponse>(
    `/api/companies/${companyId}/payment-settings`,
    body
  );
  return data;
}
