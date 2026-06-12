export type CompanyExpenseTypeResponse = {
  id: string;
  companyId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  sortOrder: number;
  active: boolean;
  recurringAutoCreateDefault?: boolean;
  recurringDayOfMonth?: number;
  recurringReminderDaysBefore?: number;
};

export type CreateCompanyExpenseTypeRequest = {
  name: string;
  code?: string;
  description?: string;
  sortOrder?: number;
  recurringAutoCreateDefault?: boolean;
  recurringDayOfMonth?: number;
  recurringReminderDaysBefore?: number;
};

export type UpdateCompanyExpenseTypeRequest = {
  name: string;
  code?: string;
  description?: string;
  sortOrder: number;
  active: boolean;
  recurringAutoCreateDefault?: boolean;
  recurringDayOfMonth?: number;
  recurringReminderDaysBefore?: number;
};

export type CompanyExpenseSettingsResponse = {
  companyId: string;
  expenseRemindersEnabled: boolean;
  expenseReminderDaysBefore: number;
  recurringReminderTime?: string;
};

export type UpdateCompanyExpenseSettingsRequest = {
  expenseRemindersEnabled: boolean;
  expenseReminderDaysBefore: number;
  recurringReminderTime?: string;
};

export type ExpenseRecurrenceRequest = {
  autoCreateEnabled: boolean;
  dayOfMonth: number;
  reminderDaysBefore: number;
};

export type ExpenseRecurrenceResponse = {
  id: string;
  officeId: string;
  sourceExpenseId?: string | null;
  autoCreateEnabled: boolean;
  dayOfMonth: number;
  reminderDaysBefore: number;
  lastGeneratedPeriod?: string | null;
  lastGeneratedExpenseId?: string | null;
};

export type DuplicateExpenseMonthRequest = {
  year: number;
  month: number;
};
