import type { Gender, UserResponse } from "./auth";

/** `GET /api/users/me` — extends login snapshot with org context when present. */
export interface CurrentUserResponse extends UserResponse {
  /** Shown read-only; not sent on PATCH. */
  displayName?: string | null;
  companyId?: string | null;
  /** Tenant display name from API (not the same as `profile.companyName`). */
  companyName?: string | null;
  officeId?: string | null;
  assignedDepartments?: unknown[] | null;
}

/** `POST /api/users/me/change-password` */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  message?: string;
}

export interface PatchUserProfileBody {
  jobTitle?: string | null;
  department?: string | null;
  companyName?: string | null;
  bio?: string | null;
  locale?: string | null;
  timeZone?: string | null;
  avatarUrl?: string | null;
  professionalLicenseNumber?: string | null;
  regulatoryBody?: string | null;
  practiceJurisdictions?: string | null;
  yearsExperience?: number | null;
}

/** `PATCH /api/users/me` JSON body — only keys you send are applied. */
export interface PatchCurrentUserRequest {
  fullName?: string;
  gender?: Gender;
  countryCode?: string;
  phoneNumber?: string;
  dateOfBirth?: string | null;
  nationality?: string | null;
  preferredLanguage?: string | null;
  profile?: PatchUserProfileBody;
}
