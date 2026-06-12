import { apiClient } from "@/api/client";
import { API_BASE_URL } from "@/api/config";
import { getAccessToken } from "@/lib/auth-storage";
import type {
  CompanyDriveBrowse,
  CompanyDriveFile,
  CompanyDriveFolder,
  CompanyDriveShareLink,
  CreateCompanyDriveFolderRequest,
  CreateCompanyDriveShareLinkRequest,
  PublicCompanyDriveShare,
  UpdateCompanyDriveFileRequest,
  UpdateCompanyDriveFolderRequest,
} from "@/api/types/company-files";

function driveBase(companyId: string) {
  return `/api/companies/${companyId}/drive`;
}

export async function browseCompanyDrive(
  companyId: string,
  folderId?: string | null
): Promise<CompanyDriveBrowse> {
  const params = folderId ? { folderId } : {};
  const { data } = await apiClient.get<CompanyDriveBrowse>(
    `${driveBase(companyId)}/browse`,
    { params }
  );
  return data;
}

export async function createCompanyDriveFolder(
  companyId: string,
  body: CreateCompanyDriveFolderRequest
): Promise<CompanyDriveFolder> {
  const { data } = await apiClient.post<CompanyDriveFolder>(
    `${driveBase(companyId)}/folders`,
    body
  );
  return data;
}

export async function updateCompanyDriveFolder(
  companyId: string,
  folderId: string,
  body: UpdateCompanyDriveFolderRequest
): Promise<CompanyDriveFolder> {
  const { data } = await apiClient.patch<CompanyDriveFolder>(
    `${driveBase(companyId)}/folders/${folderId}`,
    body
  );
  return data;
}

export async function deleteCompanyDriveFolder(
  companyId: string,
  folderId: string
): Promise<void> {
  await apiClient.delete(`${driveBase(companyId)}/folders/${folderId}`);
}

export async function uploadCompanyDriveFile(
  companyId: string,
  file: File,
  options?: {
    folderId?: string | null;
    name?: string;
    visibleToCompany?: boolean;
    onProgress?: (pct: number) => void;
  }
): Promise<CompanyDriveFile> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<CompanyDriveFile>(
    `${driveBase(companyId)}/files`,
    form,
    {
      params: {
        folderId: options?.folderId ?? undefined,
        name: options?.name ?? undefined,
        visibleToCompany: options?.visibleToCompany ?? false,
      },
      onUploadProgress: (e) => {
        if (!options?.onProgress || !e.total) return;
        options.onProgress(Math.round((e.loaded / e.total) * 100));
      },
    }
  );
  return data;
}

export async function updateCompanyDriveFile(
  companyId: string,
  fileId: string,
  body: UpdateCompanyDriveFileRequest
): Promise<CompanyDriveFile> {
  const { data } = await apiClient.patch<CompanyDriveFile>(
    `${driveBase(companyId)}/files/${fileId}`,
    body
  );
  return data;
}

export async function deleteCompanyDriveFile(
  companyId: string,
  fileId: string
): Promise<void> {
  await apiClient.delete(`${driveBase(companyId)}/files/${fileId}`);
}

export async function createCompanyDriveShareLink(
  companyId: string,
  body: CreateCompanyDriveShareLinkRequest
): Promise<CompanyDriveShareLink> {
  const { data } = await apiClient.post<CompanyDriveShareLink>(
    `${driveBase(companyId)}/share-links`,
    body
  );
  return data;
}

export async function revokeCompanyDriveShareLink(
  companyId: string,
  linkId: string
): Promise<void> {
  await apiClient.delete(`${driveBase(companyId)}/share-links/${linkId}`);
}

export async function fetchCompanyDriveFileBlob(
  companyId: string,
  fileId: string,
  mode: "download" | "preview" = "preview"
): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(
    `${driveBase(companyId)}/files/${fileId}/${mode}`,
    { responseType: "blob" }
  );
  return data;
}

export async function downloadCompanyDriveFile(
  companyId: string,
  fileId: string,
  fileName: string
): Promise<void> {
  const blob = await fetchCompanyDriveFileBlob(companyId, fileId, "download");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function getPublicCompanyDriveShare(
  publicToken: string,
  folderId?: string | null
): Promise<PublicCompanyDriveShare> {
  const params = folderId ? { folderId } : {};
  const { data } = await apiClient.get<PublicCompanyDriveShare>(
    `/api/public/company-files/${publicToken}`,
    { params }
  );
  return data;
}

export function publicCompanyDriveFileUrl(
  publicToken: string,
  fileId: string,
  mode: "download" | "preview" = "preview"
): string {
  return `${API_BASE_URL}/api/public/company-files/${publicToken}/files/${fileId}/${mode}`;
}

export async function fetchPublicCompanyDriveFileBlob(
  publicToken: string,
  fileId: string,
  mode: "download" | "preview" = "preview"
): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(
    `/api/public/company-files/${publicToken}/files/${fileId}/${mode}`,
    { responseType: "blob" }
  );
  return data;
}

export function companyDriveShareUrl(publicToken: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/company-files/${publicToken}`;
  }
  return `/company-files/${publicToken}`;
}

export function formatDriveBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  if (gb < 1024) return `${gb.toFixed(2)} GB`;
  return `${(gb / 1024).toFixed(2)} TB`;
}

/** Authenticated preview URL helper (requires token in fetch). */
export function authenticatedDrivePreviewPath(companyId: string, fileId: string) {
  return `${API_BASE_URL}${driveBase(companyId)}/files/${fileId}/preview`;
}

export async function fetchAuthenticatedPreviewBlob(
  companyId: string,
  fileId: string
): Promise<Blob> {
  const token = getAccessToken();
  const res = await fetch(authenticatedDrivePreviewPath(companyId, fileId), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Preview failed");
  return res.blob();
}
