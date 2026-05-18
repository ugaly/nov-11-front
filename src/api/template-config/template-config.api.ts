import { apiClient } from "../client";
import type {
  CreateCatalogNodeRequest,
  CreateCustomerRequest,
  CreateEngagementRequest,
  CreateServiceCatalogRequest,
  CreateServiceCategoryRequest,
  CustomerEngagementResponse,
  CustomerListItemResponse,
  CustomerListParams,
  CustomerResponse,
  PageResponse,
  PatchCatalogNodeRequest,
  PatchCustomerRequest,
  PatchServiceCatalogRequest,
  PatchServiceCategoryRequest,
  ServiceCatalogNodeResponse,
  ServiceCatalogResponse,
  ServiceCategoryResponse,
  SoftDeleteResponse,
  TimelineUnitsResponse,
} from "../types/template-config";

function companyPath(companyId: string) {
  return `/api/companies/${companyId}`;
}

// —— Template options ——

export async function getServiceTemplateOptions(
  companyId: string
): Promise<TimelineUnitsResponse> {
  const { data } = await apiClient.get<TimelineUnitsResponse>(
    `${companyPath(companyId)}/service-template-options`
  );
  return data;
}

// —— Service categories ——

export async function listServiceCategories(
  companyId: string,
  params?: { search?: string }
): Promise<ServiceCategoryResponse[]> {
  const { data } = await apiClient.get<ServiceCategoryResponse[]>(
    `${companyPath(companyId)}/service-categories`,
    {
      params:
        params?.search?.trim() ? { search: params.search.trim() } : undefined,
    }
  );
  return data;
}

export async function getServiceCategory(
  companyId: string,
  categoryId: string
): Promise<ServiceCategoryResponse> {
  const { data } = await apiClient.get<ServiceCategoryResponse>(
    `${companyPath(companyId)}/service-categories/${categoryId}`
  );
  return data;
}

export async function createServiceCategory(
  companyId: string,
  body: CreateServiceCategoryRequest
): Promise<ServiceCategoryResponse> {
  const { data } = await apiClient.post<ServiceCategoryResponse>(
    `${companyPath(companyId)}/service-categories`,
    body
  );
  return data;
}

export async function patchServiceCategory(
  companyId: string,
  categoryId: string,
  body: PatchServiceCategoryRequest
): Promise<ServiceCategoryResponse> {
  const { data } = await apiClient.patch<ServiceCategoryResponse>(
    `${companyPath(companyId)}/service-categories/${categoryId}`,
    body
  );
  return data;
}

export async function deleteServiceCategory(
  companyId: string,
  categoryId: string
): Promise<SoftDeleteResponse> {
  const { data } = await apiClient.delete<SoftDeleteResponse>(
    `${companyPath(companyId)}/service-categories/${categoryId}`
  );
  return data;
}

// —— Service catalogs ——

export async function listServiceCatalogs(
  companyId: string
): Promise<ServiceCatalogResponse[]> {
  const { data } = await apiClient.get<ServiceCatalogResponse[]>(
    `${companyPath(companyId)}/service-catalogs`
  );
  return data;
}

export async function listServiceCatalogsByCategory(
  companyId: string,
  categoryId: string
): Promise<ServiceCatalogResponse[]> {
  const { data } = await apiClient.get<ServiceCatalogResponse[]>(
    `${companyPath(companyId)}/service-categories/${categoryId}/service-catalogs`
  );
  return data;
}

export async function getServiceCatalog(
  companyId: string,
  catalogId: string
): Promise<ServiceCatalogResponse> {
  const { data } = await apiClient.get<ServiceCatalogResponse>(
    `${companyPath(companyId)}/service-catalogs/${catalogId}`
  );
  return data;
}

export async function createServiceCatalog(
  companyId: string,
  categoryId: string,
  body: CreateServiceCatalogRequest
): Promise<ServiceCatalogResponse> {
  const { data } = await apiClient.post<ServiceCatalogResponse>(
    `${companyPath(companyId)}/service-categories/${categoryId}/service-catalogs`,
    body
  );
  return data;
}

export async function patchServiceCatalog(
  companyId: string,
  catalogId: string,
  body: PatchServiceCatalogRequest
): Promise<ServiceCatalogResponse> {
  const { data } = await apiClient.patch<ServiceCatalogResponse>(
    `${companyPath(companyId)}/service-catalogs/${catalogId}`,
    body
  );
  return data;
}

export async function deleteServiceCatalog(
  companyId: string,
  catalogId: string
): Promise<SoftDeleteResponse> {
  const { data } = await apiClient.delete<SoftDeleteResponse>(
    `${companyPath(companyId)}/service-catalogs/${catalogId}`
  );
  return data;
}

// —— Catalog nodes ——

export async function listCatalogNodes(
  companyId: string,
  catalogId: string
): Promise<ServiceCatalogNodeResponse[]> {
  const { data } = await apiClient.get<ServiceCatalogNodeResponse[]>(
    `${companyPath(companyId)}/service-catalogs/${catalogId}/nodes`
  );
  return data;
}

export async function createCatalogNode(
  companyId: string,
  catalogId: string,
  body: CreateCatalogNodeRequest
): Promise<ServiceCatalogNodeResponse> {
  const { data } = await apiClient.post<ServiceCatalogNodeResponse>(
    `${companyPath(companyId)}/service-catalogs/${catalogId}/nodes`,
    body
  );
  return data;
}

export async function patchCatalogNode(
  companyId: string,
  catalogId: string,
  nodeId: string,
  body: PatchCatalogNodeRequest
): Promise<ServiceCatalogNodeResponse> {
  const { data } = await apiClient.patch<ServiceCatalogNodeResponse>(
    `${companyPath(companyId)}/service-catalogs/${catalogId}/nodes/${nodeId}`,
    body
  );
  return data;
}

export async function deleteCatalogNode(
  companyId: string,
  catalogId: string,
  nodeId: string
): Promise<SoftDeleteResponse> {
  const { data } = await apiClient.delete<SoftDeleteResponse>(
    `${companyPath(companyId)}/service-catalogs/${catalogId}/nodes/${nodeId}`
  );
  return data;
}

// —— Customers ——

export async function listCustomersPaginated(
  companyId: string,
  params?: CustomerListParams
): Promise<PageResponse<CustomerListItemResponse>> {
  const { data } = await apiClient.get<PageResponse<CustomerListItemResponse>>(
    `${companyPath(companyId)}/customers`,
    { params }
  );
  return data;
}

/** First page (up to 200) — for dropdowns and simple selects. */
export async function listCustomers(
  companyId: string
): Promise<CustomerListItemResponse[]> {
  const { content } = await listCustomersPaginated(companyId, {
    page: 0,
    size: 200,
  });
  return content;
}

export async function getCustomer(
  companyId: string,
  customerId: string
): Promise<CustomerResponse> {
  const { data } = await apiClient.get<CustomerResponse>(
    `${companyPath(companyId)}/customers/${customerId}`
  );
  return data;
}

export async function createCustomer(
  companyId: string,
  body: CreateCustomerRequest
): Promise<CustomerResponse> {
  const { data } = await apiClient.post<CustomerResponse>(
    `${companyPath(companyId)}/customers`,
    body
  );
  return data;
}

export async function patchCustomer(
  companyId: string,
  customerId: string,
  body: PatchCustomerRequest
): Promise<CustomerResponse> {
  const { data } = await apiClient.patch<CustomerResponse>(
    `${companyPath(companyId)}/customers/${customerId}`,
    body
  );
  return data;
}

export async function deleteCustomer(
  companyId: string,
  customerId: string
): Promise<SoftDeleteResponse> {
  const { data } = await apiClient.delete<SoftDeleteResponse>(
    `${companyPath(companyId)}/customers/${customerId}`
  );
  return data;
}

// —— Engagements ——

export async function listEngagements(
  companyId: string
): Promise<CustomerEngagementResponse[]> {
  const { data } = await apiClient.get<CustomerEngagementResponse[]>(
    `${companyPath(companyId)}/engagements`
  );
  return data;
}

export async function listCustomerEngagements(
  companyId: string,
  customerId: string
): Promise<CustomerEngagementResponse[]> {
  const { data } = await apiClient.get<CustomerEngagementResponse[]>(
    `${companyPath(companyId)}/customers/${customerId}/engagements`
  );
  return data;
}

export async function getEngagement(
  companyId: string,
  engagementId: string
): Promise<CustomerEngagementResponse> {
  const { data } = await apiClient.get<CustomerEngagementResponse>(
    `${companyPath(companyId)}/engagements/${engagementId}`
  );
  return data;
}

export async function createEngagement(
  companyId: string,
  body: CreateEngagementRequest
): Promise<CustomerEngagementResponse> {
  const { data } = await apiClient.post<CustomerEngagementResponse>(
    `${companyPath(companyId)}/engagements`,
    body
  );
  return data;
}

export async function deleteEngagement(
  companyId: string,
  engagementId: string
): Promise<SoftDeleteResponse> {
  const { data } = await apiClient.delete<SoftDeleteResponse>(
    `${companyPath(companyId)}/engagements/${engagementId}`
  );
  return data;
}
