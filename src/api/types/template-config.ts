export type CatalogNodeType = "GROUP" | "TASK";

export type Currency = "TZS" | "USD";

export type TimelineUnit =
  | "DAY"
  | "WEEK"
  | "FORTNIGHT"
  | "MONTH"
  | "YEAR";

export type RecurrenceType =
  | "ONE_OFF"
  | "QUARTERLY"
  | "SEMI_ANNUAL"
  | "ANNUAL"
  | "CUSTOM";

export type RecurrenceIntervalUnit = "DAY" | "WEEK" | "MONTH" | "YEAR";

export interface EngagementPeriodDto {
  recurrenceType: RecurrenceType;
  recurrenceIntervalValue: number | null;
  recurrenceIntervalUnit: RecurrenceIntervalUnit | null;
  approximateCycleDays: number | null;
  periodStart: string | null;
  periodEnd: string | null;
  nextCycleStart: string | null;
  summary: string | null;
}

export type EngagementStatus =
  | "DRAFT"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export type WorkItemStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "DONE"
  | "BLOCKED"
  | "NOT_APPLICABLE";

export interface NormalizedDurationDto {
  unit: TimelineUnit;
  value: number;
}

export interface PricingTimelineDto {
  price: number | null;
  currency: Currency | null;
  /** Legacy catalog/category fields */
  timelineValue?: number | null;
  timelineUnit?: TimelineUnit | null;
  approximateDays?: number | null;
  /** Catalog node pricing from API */
  duration?: number | null;
  durationUnit?: TimelineUnit | null;
  normalizedDuration?: NormalizedDurationDto | null;
}

export interface TimelineUnitsResponse {
  timelineUnits: TimelineUnit[];
  currencies: Currency[];
  recurrenceTypes?: RecurrenceType[];
}

export interface RecurrenceInputFields {
  recurrenceType?: RecurrenceType;
  recurrenceIntervalValue?: number;
  recurrenceIntervalUnit?: RecurrenceIntervalUnit;
  catalogEffectiveFrom?: string | null;
  catalogEffectiveTo?: string | null;
}

export interface SoftDeleteResponse {
  id: string;
  message: string;
}

/** Flat pricing fields on create/update requests (not nested `pricing`). */
export interface PricingInputFields {
  price?: number;
  currency?: Currency;
  timelineValue?: number;
  timelineUnit?: TimelineUnit;
}

export interface ServiceCategoryResponse {
  id: string;
  companyId: string;
  name: string;
  code: string | null;
  description: string | null;
  sortOrder: number;
  pricing: PricingTimelineDto | null;
  active: boolean;
  catalogs: ServiceCatalogResponse[];
}

export interface CreateServiceCategoryRequest extends PricingInputFields {
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface PatchServiceCategoryRequest extends PricingInputFields {
  name?: string;
  description?: string;
  sortOrder?: number;
}

export interface ServiceCatalogNodeResponse {
  id: string;
  catalogId: string;
  parentId: string | null;
  departmentId: string | null;
  departmentName: string | null;
  name: string;
  code: string | null;
  description: string | null;
  nodeType: CatalogNodeType;
  sortOrder: number;
  requiresParentCompletion: boolean;
  pricing: PricingTimelineDto | null;
  active: boolean;
  children: ServiceCatalogNodeResponse[];
}

export interface ServiceCatalogResponse {
  id: string;
  companyId: string;
  categoryId: string;
  categoryName: string;
  name: string;
  code: string | null;
  description: string | null;
  sortOrder: number;
  pricing: PricingTimelineDto | null;
  recurrenceType: RecurrenceType | null;
  recurrenceIntervalValue: number | null;
  recurrenceIntervalUnit: RecurrenceIntervalUnit | null;
  catalogEffectiveFrom: string | null;
  catalogEffectiveTo: string | null;
  active: boolean;
  nodes: ServiceCatalogNodeResponse[];
}

export interface CreateServiceCatalogRequest
  extends PricingInputFields,
    RecurrenceInputFields {
  name: string;
  description?: string;
  sortOrder?: number;
  recurrenceType: RecurrenceType;
}

export interface PatchServiceCatalogRequest
  extends PricingInputFields,
    RecurrenceInputFields {
  name?: string;
  description?: string;
  sortOrder?: number;
}

/** Catalog node create/patch pricing & SLA (flat fields on the request body). */
export interface CatalogNodeInputFields {
  price?: number;
  currency?: Currency;
  duration?: number;
  durationUnit?: TimelineUnit;
}

export interface CreateCatalogNodeRequest extends CatalogNodeInputFields {
  parentId?: string;
  departmentId?: string;
  name: string;
  description?: string;
  nodeType: CatalogNodeType;
  sortOrder?: number;
  requiresParentCompletion?: boolean;
}

export interface PatchCatalogNodeRequest extends CatalogNodeInputFields {
  parentId?: string;
  departmentId?: string;
  name?: string;
  description?: string;
  nodeType?: CatalogNodeType;
  sortOrder?: number;
  requiresParentCompletion?: boolean;
}

export interface MoneyAmountDto {
  currency: Currency;
  amount: number;
}

export interface CustomerCatalogAssignmentDto {
  catalogId: string;
  catalogName: string;
  catalogCode: string | null;
  categoryId: string;
  categoryName: string;
  catalogPrice: number | null;
  currency: Currency | null;
  engagementCount: number;
  latestEngagementStatus: EngagementStatus | null;
}

export interface CustomerCategoryAssignmentDto {
  categoryId: string;
  categoryName: string;
  categoryCode: string | null;
  engagementCount: number;
  catalogsPriceTotals: MoneyAmountDto[];
  catalogs: CustomerCatalogAssignmentDto[];
}

export interface CustomerListItemResponse {
  id: string;
  companyId: string;
  officeId: string | null;
  officeName: string | null;
  name: string;
  contactPhone: string | null;
  active: boolean;
  totalEngagementCount: number;
  categories: CustomerCategoryAssignmentDto[];
  assignedCatalogsPriceTotals: MoneyAmountDto[];
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export type CustomerPageSize = 50 | 100 | 200;

export interface CustomerListParams {
  page?: number;
  size?: CustomerPageSize;
  search?: string;
  categoryId?: string;
  catalogId?: string;
  officeId?: string;
  engagementStatus?: EngagementStatus;
  hasEngagements?: boolean;
  city?: string;
  country?: string;
}

export interface CustomerResponse {
  id: string;
  companyId: string;
  officeId: string | null;
  officeName: string | null;
  name: string;
  legalName: string | null;
  registrationNumber: string | null;
  tin: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  active: boolean;
}

export interface CreateCustomerRequest {
  officeId?: string;
  name: string;
  legalName?: string;
  registrationNumber?: string;
  tin?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
}

export interface PatchCustomerRequest {
  officeId?: string;
  name?: string;
  legalName?: string;
  registrationNumber?: string;
  tin?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
}

export interface EngagementWorkItemResponse {
  id: string;
  engagementId: string;
  parentId: string | null;
  catalogNodeId: string;
  departmentId: string | null;
  departmentName: string | null;
  name: string;
  code: string | null;
  description: string | null;
  nodeType: CatalogNodeType;
  sortOrder: number;
  treeDepth: number;
  status: WorkItemStatus;
  requiresParentCompletion: boolean;
  pricing: PricingTimelineDto | null;
  active: boolean;
}

export interface CustomerEngagementResponse {
  id: string;
  companyId: string;
  customerId: string;
  customerName: string;
  categoryId: string;
  categoryName: string;
  catalogId: string;
  catalogName: string;
  catalogEntryNodeId: string | null;
  officeId: string | null;
  officeName: string | null;
  title: string;
  referenceNumber: string | null;
  description: string | null;
  status: EngagementStatus;
  active: boolean;
  startedAt: string | null;
  completedAt: string | null;
  period: EngagementPeriodDto | null;
  workItems: EngagementWorkItemResponse[];
}

export interface CreateEngagementRequest {
  customerId: string;
  catalogId: string;
  catalogEntryNodeId?: string;
  officeId?: string;
  title: string;
  description?: string;
  periodStart?: string;
  periodEnd?: string;
}
