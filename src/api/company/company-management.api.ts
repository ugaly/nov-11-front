import { apiClient } from "@/api/client";
import type {
  CompanyManagementProfile,
  CompanyProfileSection,
  CompanyProfileSectionAsset,
  CreateCompanyProfileSectionRequest,
  UpdateCompanyManagementProfileRequest,
  UpdateCompanyProfileSectionRequest,
} from "@/api/types/company-management";

function managementBase(companyId: string) {
  return `/api/companies/${companyId}/management`;
}

export async function getCompanyManagementProfile(
  companyId: string
): Promise<CompanyManagementProfile> {
  const { data } = await apiClient.get<CompanyManagementProfile>(
    `${managementBase(companyId)}/profile`
  );
  return data;
}

export async function getPublicCompanyProfile(
  companyId: string
): Promise<CompanyManagementProfile> {
  const { data } = await apiClient.get<CompanyManagementProfile>(
    `/api/public/companies/${companyId}/profile`
  );
  return data;
}

export async function updateCompanyManagementProfile(
  companyId: string,
  body: UpdateCompanyManagementProfileRequest
): Promise<CompanyManagementProfile> {
  const { data } = await apiClient.patch<CompanyManagementProfile>(
    `${managementBase(companyId)}/profile`,
    body
  );
  return data;
}

export async function uploadCompanyLogo(
  companyId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<CompanyManagementProfile> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<CompanyManagementProfile>(
    `${managementBase(companyId)}/logo`,
    form,
    {
      onUploadProgress: (e) => {
        if (!onProgress || !e.total) return;
        onProgress(Math.round((e.loaded / e.total) * 100));
      },
    }
  );
  return data;
}

export async function uploadCompanyBanner(
  companyId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<CompanyManagementProfile> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<CompanyManagementProfile>(
    `${managementBase(companyId)}/banner`,
    form,
    {
      onUploadProgress: (e) => {
        if (!onProgress || !e.total) return;
        onProgress(Math.round((e.loaded / e.total) * 100));
      },
    }
  );
  return data;
}

export async function removeCompanyLogo(
  companyId: string
): Promise<CompanyManagementProfile> {
  const { data } = await apiClient.delete<CompanyManagementProfile>(
    `${managementBase(companyId)}/logo`
  );
  return data;
}

export async function removeCompanyBanner(
  companyId: string
): Promise<CompanyManagementProfile> {
  const { data } = await apiClient.delete<CompanyManagementProfile>(
    `${managementBase(companyId)}/banner`
  );
  return data;
}

export async function createCompanyProfileSection(
  companyId: string,
  body: CreateCompanyProfileSectionRequest
): Promise<CompanyProfileSection> {
  const { data } = await apiClient.post<CompanyProfileSection>(
    `${managementBase(companyId)}/sections`,
    body
  );
  return data;
}

export async function updateCompanyProfileSection(
  companyId: string,
  sectionId: string,
  body: UpdateCompanyProfileSectionRequest
): Promise<CompanyProfileSection> {
  const { data } = await apiClient.patch<CompanyProfileSection>(
    `${managementBase(companyId)}/sections/${sectionId}`,
    body
  );
  return data;
}

export async function deleteCompanyProfileSection(
  companyId: string,
  sectionId: string
): Promise<void> {
  await apiClient.delete(`${managementBase(companyId)}/sections/${sectionId}`);
}

export async function reorderCompanyProfileSections(
  companyId: string,
  sectionIds: string[]
): Promise<CompanyProfileSection[]> {
  const { data } = await apiClient.patch<CompanyProfileSection[]>(
    `${managementBase(companyId)}/sections/reorder`,
    { sectionIds }
  );
  return data;
}

export async function uploadCompanySectionAsset(
  companyId: string,
  sectionId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<CompanyProfileSectionAsset> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<CompanyProfileSectionAsset>(
    `${managementBase(companyId)}/sections/${sectionId}/assets`,
    form,
    {
      onUploadProgress: (e) => {
        if (!onProgress || !e.total) return;
        onProgress(Math.round((e.loaded / e.total) * 100));
      },
    }
  );
  return data;
}

export async function deleteCompanySectionAsset(
  companyId: string,
  sectionId: string,
  assetId: string
): Promise<void> {
  await apiClient.delete(
    `${managementBase(companyId)}/sections/${sectionId}/assets/${assetId}`
  );
}
