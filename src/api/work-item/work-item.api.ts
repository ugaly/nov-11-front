import { apiClient } from "@/api/client";
import type {
  CreateFormLinkRequest,
  PatchFormLinkRequest,
  PatchWorkItemSubmissionControlsRequest,
  PublicSubmitResponse,
  PublicWorkItemFormResponse,
  PutFieldTemplateRequest,
  ReopenClosureRequest,
  SaveFieldValuesRequest,
  SubmitClosureRequest,
  WorkItemClosureResponse,
  WorkItemExecutionBundleResponse,
  WorkItemFieldTemplateResponse,
  WorkItemFieldValuesResponse,
  WorkItemFileDto,
  WorkItemFormLinkResponse,
  WorkItemSubmissionControlsResponse,
} from "@/api/types/work-item-api";
import type { EngagementWorkItemResponse } from "@/api/types/template-config";

function workItemBase(
  companyId: string,
  engagementId: string,
  workItemId: string
) {
  return `/api/companies/${companyId}/engagements/${engagementId}/work-items/${workItemId}`;
}

function periodParams(periodId?: string | null) {
  return periodId ? { periodId } : undefined;
}

export async function getWorkItemExecution(
  companyId: string,
  engagementId: string,
  workItemId: string,
  periodId?: string | null
): Promise<WorkItemExecutionBundleResponse> {
  const { data } = await apiClient.get<WorkItemExecutionBundleResponse>(
    `${workItemBase(companyId, engagementId, workItemId)}/execution`,
    { params: periodParams(periodId) }
  );
  return data;
}

export async function getWorkItemFieldTemplate(
  companyId: string,
  engagementId: string,
  workItemId: string,
  periodId?: string | null
): Promise<WorkItemFieldTemplateResponse> {
  const { data } = await apiClient.get<WorkItemFieldTemplateResponse>(
    `${workItemBase(companyId, engagementId, workItemId)}/field-template`,
    { params: periodParams(periodId) }
  );
  return data;
}

export async function putWorkItemFieldTemplate(
  companyId: string,
  engagementId: string,
  workItemId: string,
  body: PutFieldTemplateRequest,
  periodId?: string | null
): Promise<WorkItemFieldTemplateResponse> {
  const { data } = await apiClient.put<WorkItemFieldTemplateResponse>(
    `${workItemBase(companyId, engagementId, workItemId)}/field-template`,
    body,
    { params: periodParams(periodId) }
  );
  return data;
}

export async function postUseDefaultWorkItemFieldTemplate(
  companyId: string,
  engagementId: string,
  workItemId: string,
  periodId?: string | null
): Promise<WorkItemFieldTemplateResponse> {
  const { data } = await apiClient.post<WorkItemFieldTemplateResponse>(
    `${workItemBase(companyId, engagementId, workItemId)}/field-template/use-default`,
    undefined,
    { params: periodParams(periodId) }
  );
  return data;
}

export async function deleteWorkItemFieldTemplate(
  companyId: string,
  engagementId: string,
  workItemId: string,
  periodId?: string | null
): Promise<void> {
  await apiClient.delete(
    `${workItemBase(companyId, engagementId, workItemId)}/field-template`,
    { params: periodParams(periodId) }
  );
}

export async function getWorkItemFieldValues(
  companyId: string,
  engagementId: string,
  workItemId: string,
  periodId?: string | null
): Promise<WorkItemFieldValuesResponse> {
  const { data } = await apiClient.get<WorkItemFieldValuesResponse>(
    `${workItemBase(companyId, engagementId, workItemId)}/field-values`,
    { params: periodParams(periodId) }
  );
  return data;
}

export async function putWorkItemFieldValues(
  companyId: string,
  engagementId: string,
  workItemId: string,
  body: SaveFieldValuesRequest,
  periodId?: string | null
): Promise<WorkItemFieldValuesResponse> {
  const { data } = await apiClient.put<WorkItemFieldValuesResponse>(
    `${workItemBase(companyId, engagementId, workItemId)}/field-values`,
    body,
    { params: periodParams(periodId) }
  );
  return data;
}

export async function patchWorkItemFieldValues(
  companyId: string,
  engagementId: string,
  workItemId: string,
  body: SaveFieldValuesRequest,
  periodId?: string | null
): Promise<WorkItemFieldValuesResponse> {
  const { data } = await apiClient.patch<WorkItemFieldValuesResponse>(
    `${workItemBase(companyId, engagementId, workItemId)}/field-values`,
    body,
    { params: periodParams(periodId) }
  );
  return data;
}

export async function deleteWorkItemFieldValues(
  companyId: string,
  engagementId: string,
  workItemId: string,
  force = false,
  periodId?: string | null
): Promise<void> {
  await apiClient.delete(
    `${workItemBase(companyId, engagementId, workItemId)}/field-values`,
    {
      params: {
        ...periodParams(periodId),
        ...(force ? { force: true } : {}),
      },
    }
  );
}

export async function getWorkItemSubmissionControls(
  companyId: string,
  engagementId: string,
  workItemId: string,
  periodId?: string | null
): Promise<WorkItemSubmissionControlsResponse> {
  const { data } = await apiClient.get<WorkItemSubmissionControlsResponse>(
    `${workItemBase(companyId, engagementId, workItemId)}/submission-controls`,
    { params: periodParams(periodId) }
  );
  return data;
}

export async function patchWorkItemSubmissionControls(
  companyId: string,
  engagementId: string,
  workItemId: string,
  body: PatchWorkItemSubmissionControlsRequest,
  periodId?: string | null
): Promise<WorkItemSubmissionControlsResponse> {
  const { data } = await apiClient.patch<WorkItemSubmissionControlsResponse>(
    `${workItemBase(companyId, engagementId, workItemId)}/submission-controls`,
    body,
    { params: periodParams(periodId) }
  );
  return data;
}

export async function patchWorkItemStatus(
  companyId: string,
  engagementId: string,
  workItemId: string,
  body: { status: EngagementWorkItemResponse["status"] },
  periodId?: string | null
): Promise<EngagementWorkItemResponse> {
  const { data } = await apiClient.patch<EngagementWorkItemResponse>(
    workItemBase(companyId, engagementId, workItemId),
    body,
    { params: periodParams(periodId) }
  );
  return data;
}

export async function getWorkItemClosure(
  companyId: string,
  engagementId: string,
  workItemId: string,
  periodId?: string | null
): Promise<WorkItemClosureResponse> {
  const { data } = await apiClient.get<WorkItemClosureResponse>(
    `${workItemBase(companyId, engagementId, workItemId)}/closure`,
    { params: periodParams(periodId) }
  );
  return data;
}

export async function postWorkItemClosure(
  companyId: string,
  engagementId: string,
  workItemId: string,
  body: SubmitClosureRequest,
  periodId?: string | null
): Promise<WorkItemClosureResponse> {
  const { data } = await apiClient.post<WorkItemClosureResponse>(
    `${workItemBase(companyId, engagementId, workItemId)}/closure`,
    body,
    { params: periodParams(periodId) }
  );
  return data;
}

export async function postWorkItemClosureReopen(
  companyId: string,
  engagementId: string,
  workItemId: string,
  body: ReopenClosureRequest = {},
  periodId?: string | null
): Promise<WorkItemClosureResponse> {
  const { data } = await apiClient.post<WorkItemClosureResponse>(
    `${workItemBase(companyId, engagementId, workItemId)}/closure/reopen`,
    body,
    { params: periodParams(periodId) }
  );
  return data;
}

export async function getWorkItemOutputFiles(
  companyId: string,
  engagementId: string,
  workItemId: string,
  periodId?: string | null
): Promise<WorkItemFileDto[]> {
  const { data } = await apiClient.get<WorkItemFileDto[]>(
    `${workItemBase(companyId, engagementId, workItemId)}/output-files`,
    { params: periodParams(periodId) }
  );
  return data;
}

export async function postWorkItemOutputFile(
  companyId: string,
  engagementId: string,
  workItemId: string,
  file: File,
  periodId?: string | null
): Promise<WorkItemFileDto> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<WorkItemFileDto>(
    `${workItemBase(companyId, engagementId, workItemId)}/output-files`,
    form,
    { params: periodParams(periodId) }
  );
  return data;
}

export async function deleteWorkItemOutputFile(
  companyId: string,
  engagementId: string,
  workItemId: string,
  fileId: string,
  force = false,
  periodId?: string | null
): Promise<void> {
  await apiClient.delete(
    `${workItemBase(companyId, engagementId, workItemId)}/output-files/${fileId}`,
    {
      params: {
        ...(force ? { force: true } : {}),
        ...periodParams(periodId),
      },
    }
  );
}

export async function postWorkItemFieldFile(
  companyId: string,
  engagementId: string,
  workItemId: string,
  fieldId: string,
  file: File,
  periodId?: string | null
): Promise<WorkItemFileDto> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<WorkItemFileDto>(
    `${workItemBase(companyId, engagementId, workItemId)}/field-files`,
    form,
    { params: { fieldId, ...periodParams(periodId) } }
  );
  return data;
}

export async function deleteWorkItemFieldFile(
  companyId: string,
  engagementId: string,
  workItemId: string,
  fileId: string,
  periodId?: string | null
): Promise<void> {
  await apiClient.delete(
    `${workItemBase(companyId, engagementId, workItemId)}/field-files/${fileId}`,
    { params: periodParams(periodId) }
  );
}

export async function getWorkItemFormLink(
  companyId: string,
  engagementId: string,
  workItemId: string
): Promise<WorkItemFormLinkResponse> {
  const { data } = await apiClient.get<WorkItemFormLinkResponse>(
    `${workItemBase(companyId, engagementId, workItemId)}/form-link`
  );
  return data;
}

export async function postWorkItemFormLink(
  companyId: string,
  engagementId: string,
  workItemId: string,
  body: CreateFormLinkRequest = {}
): Promise<WorkItemFormLinkResponse> {
  const { data } = await apiClient.post<WorkItemFormLinkResponse>(
    `${workItemBase(companyId, engagementId, workItemId)}/form-link`,
    body
  );
  return data;
}

export async function patchWorkItemFormLink(
  companyId: string,
  engagementId: string,
  workItemId: string,
  body: PatchFormLinkRequest
): Promise<WorkItemFormLinkResponse> {
  const { data } = await apiClient.patch<WorkItemFormLinkResponse>(
    `${workItemBase(companyId, engagementId, workItemId)}/form-link`,
    body
  );
  return data;
}

export async function deleteWorkItemFormLink(
  companyId: string,
  engagementId: string,
  workItemId: string
): Promise<void> {
  await apiClient.delete(
    `${workItemBase(companyId, engagementId, workItemId)}/form-link`
  );
}

// —— Public (no auth required) ——

export async function getPublicWorkItemForm(
  publicToken: string
): Promise<PublicWorkItemFormResponse> {
  const { data } = await apiClient.get<PublicWorkItemFormResponse>(
    `/api/public/work-item-forms/${publicToken}`
  );
  return data;
}

export async function putPublicWorkItemFormDraft(
  publicToken: string,
  body: { values: WorkItemFieldValuesResponse["values"]; taskWorkItemId?: string }
): Promise<void> {
  await apiClient.put(`/api/public/work-item-forms/${publicToken}/draft`, body);
}

export async function postPublicWorkItemFormSubmit(
  publicToken: string,
  body: { values: WorkItemFieldValuesResponse["values"] }
): Promise<PublicSubmitResponse> {
  const { data } = await apiClient.post<PublicSubmitResponse>(
    `/api/public/work-item-forms/${publicToken}/submit`,
    body
  );
  return data;
}

export async function postPublicWorkItemFormStepSubmit(
  publicToken: string,
  taskWorkItemId: string,
  body: { values: WorkItemFieldValuesResponse["values"] }
): Promise<PublicSubmitResponse> {
  const { data } = await apiClient.post<PublicSubmitResponse>(
    `/api/public/work-item-forms/${publicToken}/steps/${taskWorkItemId}/submit`,
    body
  );
  return data;
}

export async function postPublicWorkItemFieldFile(
  publicToken: string,
  fieldId: string,
  file: File,
  taskWorkItemId?: string
): Promise<WorkItemFileDto> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<WorkItemFileDto>(
    `/api/public/work-item-forms/${publicToken}/field-files`,
    form,
    {
      params: {
        fieldId,
        ...(taskWorkItemId ? { taskWorkItemId } : {}),
      },
    }
  );
  return data;
}
