export type Gender = "MALE" | "FEMALE";

export type UserType =
  | "AUDITOR"
  | "ACCOUNTANT"
  | "LAWYER"
  | "TAX_ADVISOR"
  | "COMPLIANCE_OFFICER"
  | "LEGAL_COUNSEL"
  | "ADMIN"
  | "OTHER";

export type UserStatus =
  | "PENDING_VERIFICATION"
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED";

export interface UserProfileResponse {
  jobTitle: string | null;
  department: string | null;
  companyName: string | null;
  bio: string | null;
  locale: string | null;
  timeZone: string | null;
  avatarUrl: string | null;
  professionalLicenseNumber: string | null;
  regulatoryBody: string | null;
  practiceJurisdictions: string | null;
  yearsExperience: number | null;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  fullName: string;
  gender: Gender;
  countryCode: string;
  phoneNumber: string;
  userType: UserType;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  dateOfBirth: string | null;
  nationality: string | null;
  preferredLanguage: string | null;
  avatarPath: string | null;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string | null;
  profile: UserProfileResponse | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInMs: number;
  user: UserResponse;
}

export interface RegisterRequest {
  username: string;
  email: string;
  fullName: string;
  gender: Gender;
  countryCode: string;
  phoneNumber: string;
  userType: UserType;
  dateOfBirth?: string;
  nationality?: string;
  preferredLanguage?: string;
  officeId?: string;
  departmentIds?: string[];
}

export interface RegisterResponse {
  message: string;
  email: string;
  activationEmailConfigured: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetEmailConfigured: boolean;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
  username: string;
}
