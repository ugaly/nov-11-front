import { apiClient } from "../client";
import type {
  CompanyResponse,
  CreateCompanyRequest,
  CreateDepartmentRequest,
  CreateOfficeRequest,
  DepartmentResponse,
  OfficeResponse,
} from "../types/organization";

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function listCompanies(
  accessToken: string
): Promise<CompanyResponse[]> {
  const { data } = await apiClient.get<CompanyResponse[]>("/api/companies", {
    headers: authHeader(accessToken),
  });
  return data;
}

export async function getCompany(
  accessToken: string,
  companyId: string
): Promise<CompanyResponse> {
  const { data } = await apiClient.get<CompanyResponse>(
    `/api/companies/${companyId}`,
    { headers: authHeader(accessToken) }
  );
  return data;
}

export async function createCompany(
  accessToken: string,
  body: CreateCompanyRequest
): Promise<CompanyResponse> {
  const { data } = await apiClient.post<CompanyResponse>(
    "/api/companies",
    body,
    { headers: authHeader(accessToken) }
  );
  return data;
}

export async function listOffices(
  accessToken: string,
  companyId: string
): Promise<OfficeResponse[]> {
  const { data } = await apiClient.get<OfficeResponse[]>(
    `/api/companies/${companyId}/offices`,
    { headers: authHeader(accessToken) }
  );
  return data;
}

export async function createOffice(
  accessToken: string,
  companyId: string,
  body: CreateOfficeRequest
): Promise<OfficeResponse> {
  const { data } = await apiClient.post<OfficeResponse>(
    `/api/companies/${companyId}/offices`,
    body,
    { headers: authHeader(accessToken) }
  );
  return data;
}

export async function listDepartments(
  accessToken: string,
  companyId: string
): Promise<DepartmentResponse[]> {
  const { data } = await apiClient.get<DepartmentResponse[]>(
    `/api/companies/${companyId}/departments`,
    { headers: authHeader(accessToken) }
  );
  return data;
}

export async function createDepartment(
  accessToken: string,
  companyId: string,
  body: CreateDepartmentRequest
): Promise<DepartmentResponse> {
  const { data } = await apiClient.post<DepartmentResponse>(
    `/api/companies/${companyId}/departments`,
    body,
    { headers: authHeader(accessToken) }
  );
  return data;
}
