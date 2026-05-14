export interface CompanyResponse {
  id: string;
  name: string;
  legalName: string | null;
  headquartersAddress: string | null;
  headquartersCity: string | null;
  headquartersCountry: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  ceoName: string | null;
  website: string | null;
  active: boolean;
}

export interface CreateCompanyRequest {
  name: string;
  legalName?: string;
  headquartersAddress?: string;
  headquartersCity?: string;
  headquartersCountry?: string;
  contactEmail?: string;
  contactPhone?: string;
  ceoName?: string;
  website?: string;
}

export interface OfficeResponse {
  id: string;
  companyId: string;
  name: string;
  addressLine: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  contactEmail: string | null;
  contactPhone: string | null;
  headquarters: boolean;
}

export interface CreateOfficeRequest {
  name: string;
  addressLine?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  contactEmail?: string;
  contactPhone?: string;
  headquarters?: boolean;
}

export interface DepartmentResponse {
  id: string;
  companyId: string;
  name: string;
  code: string | null;
  description: string | null;
  active: boolean;
}

export interface CreateDepartmentRequest {
  name: string;
  code?: string;
  description?: string;
}
