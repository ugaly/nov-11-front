export type CompanyDriveBreadcrumbItem = {
  id: string;
  name: string;
};

export type CompanyDriveStorageUsage = {
  usedBytes: number;
  quotaBytes: number;
  usedPercent: number;
  usedLabel: string;
  quotaLabel: string;
};

export type CompanyDriveFolder = {
  id: string;
  parentFolderId: string | null;
  name: string;
  visibleToCompany: boolean;
  createdByUserId: string;
  createdByUserName: string;
  createdAt: string;
  ownedByCurrentUser: boolean;
  canManage: boolean;
};

export type CompanyDriveFile = {
  id: string;
  folderId: string | null;
  name: string;
  mimeType: string;
  sizeBytes: number;
  visibleToCompany: boolean;
  uploadedByUserId: string;
  uploadedByUserName: string;
  uploadedAt: string;
  previewable: boolean;
  ownedByCurrentUser: boolean;
  canManage: boolean;
  sharePublicUrl: string | null;
};

export type CompanyDriveBrowse = {
  currentFolderId: string | null;
  breadcrumbs: CompanyDriveBreadcrumbItem[];
  folders: CompanyDriveFolder[];
  files: CompanyDriveFile[];
  storage: CompanyDriveStorageUsage;
};

export type CompanyDriveShareLink = {
  id: string;
  fileId: string | null;
  folderId: string | null;
  publicToken: string;
  publicUrl: string;
  enabled: boolean;
  expiresAt: string | null;
  createdAt: string;
};

export type PublicCompanyDriveShare = {
  shareType: "FILE" | "FOLDER";
  folderId: string | null;
  fileId: string | null;
  name: string;
  folders: CompanyDriveFolder[];
  files: CompanyDriveFile[];
  file: CompanyDriveFile | null;
};

export type CreateCompanyDriveFolderRequest = {
  parentFolderId?: string | null;
  name: string;
  visibleToCompany?: boolean;
};

export type UpdateCompanyDriveFolderRequest = {
  name?: string;
  visibleToCompany?: boolean;
};

export type UpdateCompanyDriveFileRequest = {
  name?: string;
  visibleToCompany?: boolean;
};

export type CreateCompanyDriveShareLinkRequest = {
  fileId?: string;
  folderId?: string;
};
