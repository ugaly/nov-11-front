export type CompanyProfileAssetKind = "IMAGE" | "DOCUMENT";

export type CompanyProfileSectionAsset = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: CompanyProfileAssetKind;
  sortOrder: number;
  url: string;
};

export type CompanyProfileSection = {
  id: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  active: boolean;
  assets: CompanyProfileSectionAsset[];
};

export type CompanyManagementProfile = {
  id: string;
  name: string;
  registrationNumber?: string | null;
  taxVatNumber?: string | null;
  industry?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  website?: string | null;
  headquartersAddress?: string | null;
  headquartersCountry?: string | null;
  headquartersRegion?: string | null;
  headquartersCity?: string | null;
  description?: string | null;
  logoPath?: string | null;
  logoUrl?: string | null;
  bannerPath?: string | null;
  bannerUrl?: string | null;
  active: boolean;
  sections: CompanyProfileSection[];
};

export type UpdateCompanyManagementProfileRequest = {
  name?: string;
  registrationNumber?: string;
  taxVatNumber?: string;
  industry?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  headquartersAddress?: string;
  headquartersCountry?: string;
  headquartersRegion?: string;
  headquartersCity?: string;
  description?: string;
};

export type CreateCompanyProfileSectionRequest = {
  title: string;
  description?: string;
};

export type UpdateCompanyProfileSectionRequest = {
  title?: string;
  description?: string;
  active?: boolean;
};
