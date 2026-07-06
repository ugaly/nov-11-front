import type {
  CustomerFieldKey,
  WorkItemFieldDefinition,
  WorkItemFieldGroup,
  WorkItemFieldValue,
  WorkItemFileAttachment,
} from "@/api/types/work-item-template";
import type { WorkItemStatus } from "@/api/types/template-config";

export type WorkItemLinkScope = "TASK" | "GROUP";

export interface WorkItemFileDto {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface WorkItemFormLinkSummaryDto {
  url: string;
  publicToken: string;
  linkScope: WorkItemLinkScope;
  edited: boolean;
  /** When false, customer cannot submit or save draft (synced with `edited` after submit). */
  publicSubmitEnabled?: boolean;
  enabled: boolean;
  expiresAt: string | null;
}

export interface WorkItemSubmissionControlsResponse {
  workItemId: string;
  internalEditEnabled: boolean;
  publicSubmitEnabled: boolean;
  responsesLocked: boolean;
}

export interface PatchWorkItemSubmissionControlsRequest {
  publicSubmitEnabled?: boolean;
  internalEditEnabled?: boolean;
}

export interface WorkItemFormLinkResponse extends WorkItemFormLinkSummaryDto {
  id: string;
  anchorWorkItemId: string;
  includedTaskIds?: string[];
  createdAt: string;
}

export interface WorkItemFieldTemplateResponse {
  workItemId: string;
  engagementId: string;
  configuredAt: string | null;
  configuredByUserId?: string | null;
  version: number;
  groups?: WorkItemFieldGroup[];
  fields: WorkItemFieldDefinition[];
  formLink: WorkItemFormLinkSummaryDto | null;
}

export interface WorkItemFieldValuesResponse {
  workItemId: string;
  savedAt: string | null;
  responsesLocked: boolean;
  internalEditEnabled?: boolean;
  publicSubmitEnabled?: boolean;
  values: WorkItemFieldValue[];
}

export interface WorkItemClosureResponse {
  workItemId: string;
  status: WorkItemStatus | null;
  remark: string | null;
  submittedAt: string | null;
  submittedByUserId?: string | null;
  responsesLocked: boolean;
  values?: WorkItemFieldValue[];
  outputFiles?: WorkItemFileDto[];
}

export interface WorkItemExecutionBundleResponse {
  workItemId: string;
  status: WorkItemStatus;
  template: WorkItemFieldTemplateResponse | null;
  values: WorkItemFieldValuesResponse;
  formLink: WorkItemFormLinkSummaryDto | null;
  closure: WorkItemClosureResponse;
  activityLogs?: WorkItemActivityLogDto[];
  responsesLocked: boolean;
  internalEditEnabled?: boolean;
  publicSubmitEnabled?: boolean;
}

export interface WorkItemActivityLogDto {
  id: string;
  actionType: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  remark?: string | null;
  occurredAt: string;
  actorUserId?: string | null;
  actorName?: string | null;
}

export interface SaveFieldValuesRequest {
  values: WorkItemFieldValue[];
  force?: boolean;
}

export interface PutFieldTemplateRequest {
  groups?: WorkItemFieldGroup[];
  fields: WorkItemFieldDefinition[];
}

export interface CreateFormLinkRequest {
  regenerateToken?: boolean;
  expiresAt?: string | null;
  /** Recurring period tab whose field templates this link uses. */
  engagementPeriodId?: string | null;
}

export interface PatchFormLinkRequest {
  enabled?: boolean;
  edited?: boolean;
  publicSubmitEnabled?: boolean;
  expiresAt?: string | null;
  steps?: {
    taskWorkItemId: string;
    edited?: boolean;
    publicSubmitEnabled?: boolean;
  }[];
}

export interface SubmitClosureRequest {
  status: "DONE" | "BLOCKED" | "NOT_APPLICABLE";
  remark?: string;
  values?: WorkItemFieldValue[];
  outputFileIds?: string[];
}

export interface ReopenClosureRequest {
  resetTaskWorkItemIds?: string[];
}

export interface PublicFormStepDto {
  stepIndex: number;
  workItemId: string;
  taskName: string;
  taskDescription?: string | null;
  configured: boolean;
  edited: boolean;
  publicSubmitEnabled?: boolean;
  readOnly: boolean;
  groups?: WorkItemFieldGroup[];
  fields: WorkItemFieldDefinition[];
  values: WorkItemFieldValue[];
  skipReason?: string | null;
}

export interface PublicWorkItemFormResponse {
  linkScope: WorkItemLinkScope;
  publicToken: string;
  engagementTitle: string;
  customerName: string;
  anchorName: string;
  edited: boolean;
  publicSubmitEnabled?: boolean;
  enabled: boolean;
  readOnly: boolean;
  workItemId?: string;
  groups?: WorkItemFieldGroup[];
  fields?: WorkItemFieldDefinition[];
  values?: WorkItemFieldValue[];
  steps?: PublicFormStepDto[];
  customerPrefill?: Partial<Record<CustomerFieldKey, string>>;
}

export interface PublicSubmitResponse {
  success: boolean;
  linkScope: WorkItemLinkScope;
  workItemId: string;
  submittedAt: string;
  edited: boolean;
  readOnly: boolean;
  stepIndex?: number;
  stepEdited?: boolean;
  linkEdited?: boolean;
  nextStepIndex?: number | null;
}

export type ApiFileAttachment = WorkItemFileAttachment;
