export type GeneralAccessResponse = {
  officeId: string;
  visibleDashboard: boolean;
  visibleCustomers: boolean;
  canCreateCustomers: boolean;
  canUpdateCustomers: boolean;
  canDeleteCustomers: boolean;
  visibleMail: boolean;
  canSendMail: boolean;
  visibleCompanyFiles: boolean;
  canUploadCompanyFiles: boolean;
  canManageCompanyFiles: boolean;
  visibleSetup: boolean;
  canManageSetup: boolean;
  visibleCompanyProfile: boolean;
  canEditCompanyProfile: boolean;
  canManageGeneralPermissions: boolean;
};

export type GeneralPermissionDto = {
  id?: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  visibleDashboard: boolean;
  visibleCustomers: boolean;
  canCreateCustomers: boolean;
  canUpdateCustomers: boolean;
  canDeleteCustomers: boolean;
  visibleMail: boolean;
  canSendMail: boolean;
  visibleCompanyFiles: boolean;
  canUploadCompanyFiles: boolean;
  canManageCompanyFiles: boolean;
  visibleSetup: boolean;
  canManageSetup: boolean;
  visibleCompanyProfile: boolean;
  canEditCompanyProfile: boolean;
  canManageGeneralPermissions: boolean;
};

export type UpsertGeneralPermissionRequest = Omit<
  GeneralPermissionDto,
  "id" | "userFullName" | "userEmail"
>;
