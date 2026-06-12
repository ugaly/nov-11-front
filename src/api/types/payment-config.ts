export type CompanyPaymentCategoryResponse = {
  id: string;
  companyId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  sortOrder: number;
  requiresReconciliationNote: boolean;
  active: boolean;
  recurringAutoCreateDefault?: boolean;
  recurringDayOfMonth?: number;
  recurringReminderDaysBefore?: number;
};

export type CompanyPaymentMethodResponse = {
  id: string;
  companyId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  sortOrder: number;
  active: boolean;
};

export type CreateCompanyPaymentCategoryRequest = {
  name: string;
  code?: string;
  description?: string;
  sortOrder?: number;
  requiresReconciliationNote?: boolean;
  recurringAutoCreateDefault?: boolean;
  recurringDayOfMonth?: number;
  recurringReminderDaysBefore?: number;
};

export type UpdateCompanyPaymentCategoryRequest = {
  name: string;
  code?: string;
  description?: string;
  sortOrder: number;
  requiresReconciliationNote: boolean;
  active: boolean;
  recurringAutoCreateDefault?: boolean;
  recurringDayOfMonth?: number;
  recurringReminderDaysBefore?: number;
};

export type PaymentRecurrenceRequest = {
  autoCreateEnabled: boolean;
  dayOfMonth: number;
  reminderDaysBefore: number;
};

export type PaymentRecurrenceResponse = {
  id: string;
  officeId: string;
  sourcePaymentId?: string | null;
  autoCreateEnabled: boolean;
  dayOfMonth: number;
  reminderDaysBefore: number;
  lastGeneratedPeriod?: string | null;
  lastGeneratedPaymentId?: string | null;
};

export type DuplicatePaymentMonthRequest = {
  year: number;
  month: number;
};

export type CreateCompanyPaymentMethodRequest = {
  name: string;
  code?: string;
  description?: string;
  sortOrder?: number;
};

export type UpdateCompanyPaymentMethodRequest = {
  name: string;
  code?: string;
  description?: string;
  sortOrder: number;
  active: boolean;
};

export type CompanyPaymentSettingsResponse = {
  companyId: string;
  partialRemindersEnabled: boolean;
  partialReminderDaysBeforeDue: number;
  recurringReminderTime?: string;
};

export type UpdateCompanyPaymentSettingsRequest = {
  partialRemindersEnabled: boolean;
  partialReminderDaysBeforeDue: number;
  recurringReminderTime?: string;
};
