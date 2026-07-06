"use client";

import axios from "axios";
import { getApiErrorCode, getApiErrorMessage } from "@/api/errors";
import {
  getWorkItemExecution,
  getWorkItemFieldTemplate,
  patchWorkItemStatus,
  postWorkItemFieldFile,
  postWorkItemFormLink,
  postUseDefaultWorkItemFieldTemplate,
  patchWorkItemSubmissionControls,
  patchWorkItemFieldValues,
  putWorkItemFieldTemplate,
} from "@/api/work-item/work-item.api";
import type {
  PatchWorkItemSubmissionControlsRequest,
  WorkItemActivityLogDto,
  WorkItemFormLinkSummaryDto,
} from "@/api/types/work-item-api";
import {
  isStaffFieldEditLocked,
  syncSubmissionControlsFromExecution,
} from "@/lib/work-item-submission-controls";
import type {
  WorkItemFieldDefinition,
  WorkItemFieldGroup,
  WorkItemFieldValue,
} from "@/api/types/work-item-template";
import type { WorkItemStatus } from "@/api/types/template-config";
import { apiFileToAttachment } from "@/lib/work-item-api-files";
import { normalizeAttachmentFromApi } from "@/lib/work-item-file-utils";
import {
  findDuplicateFieldIds,
  findInvalidAttachmentIds,
  logTemplatePutPayload,
  prepareTemplateForPut,
  prepareFieldValuesForApi,
} from "@/lib/work-item-field-store";
import { useCallback, useEffect, useState } from "react";

function normalizeAttachments(values: WorkItemFieldValue[]): WorkItemFieldValue[] {
  return values.map((v) => {
    if (!v.attachments?.length) return v;
    return {
      ...v,
      attachments: v.attachments.map(normalizeAttachmentFromApi),
    };
  });
}

export function useWorkItemFieldState(
  companyId: string | null,
  engagementId: string,
  workItemId: string,
  periodId?: string | null
) {
  const [fields, setFields] = useState<WorkItemFieldDefinition[]>([]);
  const [groups, setGroups] = useState<WorkItemFieldGroup[]>([]);
  const [configuredAt, setConfiguredAt] = useState<string | null>(null);
  const [values, setValues] = useState<WorkItemFieldValue[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [responsesLocked, setResponsesLocked] = useState(false);
  const [internalEditEnabled, setInternalEditEnabled] = useState(true);
  const [publicSubmitEnabled, setPublicSubmitEnabled] = useState(true);
  const [controlsSaving, setControlsSaving] = useState(false);
  const [formLink, setFormLink] = useState<WorkItemFormLinkSummaryDto | null>(
    null
  );
  const [closureInitial, setClosureInitial] = useState<{
    remark: string | null;
    submittedAt: string | null;
    status: import("@/api/types/template-config").WorkItemStatus | null;
  }>({ remark: null, submittedAt: null, status: null });
  const [activityLogs, setActivityLogs] = useState<WorkItemActivityLogDto[]>([]);
  const [executionStatus, setExecutionStatus] = useState<WorkItemStatus>("PENDING");
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!companyId) return;
    setError(null);
    try {
      const bundle = await getWorkItemExecution(
        companyId,
        engagementId,
        workItemId,
        periodId
      );
      const template = bundle.template;
      setFields(template?.fields ?? []);
      setGroups(template?.groups ?? []);
      setConfiguredAt(template?.configuredAt ?? null);
      const closureValues = bundle.closure?.values;
      const valueRows =
        bundle.closure?.submittedAt && closureValues?.length
          ? closureValues
          : bundle.values?.values ?? [];
      setValues(normalizeAttachments(valueRows));
      setSavedAt(bundle.values?.savedAt ?? null);
      const controls = syncSubmissionControlsFromExecution(bundle);
      setResponsesLocked(controls.responsesLocked);
      setInternalEditEnabled(controls.internalEditEnabled);
      setPublicSubmitEnabled(controls.publicSubmitEnabled);
      setFormLink(bundle.formLink ?? template?.formLink ?? null);
      setClosureInitial({
        remark: bundle.closure?.remark ?? null,
        submittedAt: bundle.closure?.submittedAt ?? null,
        status: bundle.closure?.status ?? null,
      });
      setExecutionStatus(bundle.status ?? "PENDING");
      setActivityLogs(bundle.activityLogs ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load task fields."));
      setFields([]);
      setGroups([]);
      setConfiguredAt(null);
      setValues([]);
      setSavedAt(null);
      setFormLink(null);
      setActivityLogs([]);
    } finally {
      setHydrated(true);
    }
  }, [companyId, engagementId, workItemId, periodId]);

  useEffect(() => {
    setHydrated(false);
    void reload();
  }, [reload]);

  const isConfigured = fields.length > 0 && configuredAt != null;

  const persistTemplate = useCallback(
    async (
      next: WorkItemFieldDefinition[],
      nextGroups: WorkItemFieldGroup[] = []
    ) => {
      if (!companyId) return;
      setError(null);
      try {
        let serverFields: WorkItemFieldDefinition[] = [];
        let serverGroups: WorkItemFieldGroup[] = [];
        let from404 = false;
        try {
          const current = await getWorkItemFieldTemplate(
            companyId,
            engagementId,
            workItemId,
            periodId
          );
          serverFields = current.fields ?? [];
          serverGroups = current.groups ?? [];
        } catch (fetchErr) {
          if (
            axios.isAxiosError(fetchErr) &&
            fetchErr.response?.status === 404
          ) {
            serverFields = [];
            serverGroups = [];
            from404 = true;
          } else {
            throw fetchErr;
          }
        }

        const clientDupes = findDuplicateFieldIds(next);
        if (clientDupes.length) {
          const msg =
            "Duplicate field ids in the builder. Remove and re-add the affected fields.";
          setError(msg);
          if (process.env.NODE_ENV !== "production") {
            console.warn("[work-item] duplicate ids before prepare", clientDupes);
          }
          throw new Error(msg);
        }

        const prepared = prepareTemplateForPut(
          serverFields,
          serverGroups,
          next,
          nextGroups
        );
        logTemplatePutPayload(workItemId, prepared.fields, {
          serverFieldCount: serverFields.length,
          from404,
        });

        const res = await putWorkItemFieldTemplate(
          companyId,
          engagementId,
          workItemId,
          prepared,
          periodId
        );
        setFields(res.fields);
        setGroups(res.groups ?? []);
        setConfiguredAt(res.configuredAt);
        if (res.formLink) setFormLink(res.formLink);
        await reload();
      } catch (err) {
        const code = getApiErrorCode(err);
        setError(
          getApiErrorMessage(
            err,
            code === "duplicate_field_id"
              ? "Two fields share the same id. Remove and re-add fields, then save again."
              : code === "field_id_in_use"
                ? "A field id is already in use. Refresh the page and save again (backend will re-link orphans after restart)."
                : "Could not save field template."
          )
        );
        throw err;
      }
    },
    [companyId, engagementId, workItemId, periodId, reload]
  );

  const applyDefaultTemplate = useCallback(async () => {
    if (!companyId) return;
    setError(null);
    try {
      const res = await postUseDefaultWorkItemFieldTemplate(
        companyId,
        engagementId,
        workItemId,
        periodId
      );
      setFields(res.fields);
      setGroups(res.groups ?? []);
      setConfiguredAt(res.configuredAt);
      if (res.formLink) setFormLink(res.formLink);
      await reload();
    } catch (err) {
      setError(
        getApiErrorMessage(err, "No default form found yet. Configure one manually.")
      );
      throw err;
    }
  }, [companyId, engagementId, workItemId, periodId, reload]);

  const persistValues = useCallback(
    async (next: WorkItemFieldValue[], options?: { force?: boolean }) => {
      if (!companyId) return;
      setError(null);
      try {
        const invalidFiles = findInvalidAttachmentIds(next);
        if (invalidFiles.length) {
          const msg =
            "Some files were not uploaded to the server. Remove those file tiles and add them again.";
          setError(msg);
          throw new Error(msg);
        }

        const valuesForApi = prepareFieldValuesForApi(next, fields);
        const res = await patchWorkItemFieldValues(
          companyId,
          engagementId,
          workItemId,
          { values: valuesForApi, force: options?.force },
          periodId
        );
        setValues(normalizeAttachments(res.values));
        setSavedAt(res.savedAt);
        const controls = syncSubmissionControlsFromExecution({
          responsesLocked: res.responsesLocked,
          internalEditEnabled: res.internalEditEnabled,
        });
        setResponsesLocked(controls.responsesLocked);
        setInternalEditEnabled(controls.internalEditEnabled);
      } catch (err) {
        const code = getApiErrorCode(err);
        setError(
          getApiErrorMessage(
            err,
            code === "INTERNAL_EDIT_DISABLED"
              ? "Staff editing is disabled for this task. Turn on “Allow staff to edit responses” in Form access."
              : code === "RESPONSES_LOCKED"
                ? "Responses are locked after office closure."
                : code === "invalid_field_id"
                  ? "Invalid file reference. Remove file attachments and upload again."
                  : "Could not save responses."
          )
        );
        throw err;
      }
    },
    [companyId, engagementId, workItemId, periodId, fields]
  );

  const uploadFieldFile = useCallback(
    async (fieldId: string, file: File) => {
      if (!companyId) throw new Error("No company context");
      const dto = await postWorkItemFieldFile(
        companyId,
        engagementId,
        workItemId,
        fieldId,
        file,
        periodId
      );
      return apiFileToAttachment(dto);
    },
    [companyId, engagementId, workItemId, periodId]
  );

  const ensureFormLink = useCallback(async () => {
    if (!companyId) return null;
    try {
      const link = await postWorkItemFormLink(
        companyId,
        engagementId,
        workItemId,
        {
          regenerateToken: false,
          ...(periodId ? { engagementPeriodId: periodId } : {}),
        }
      );
      const summary: WorkItemFormLinkSummaryDto = {
        url: link.url,
        publicToken: link.publicToken,
        linkScope: link.linkScope,
        edited: link.edited,
        publicSubmitEnabled: link.publicSubmitEnabled,
        enabled: link.enabled,
        expiresAt: link.expiresAt,
      };
      setFormLink(summary);
      return summary;
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create form link."));
      return null;
    }
  }, [companyId, engagementId, workItemId, periodId]);

  const patchSubmissionControls = useCallback(
    async (patch: PatchWorkItemSubmissionControlsRequest) => {
      if (!companyId) return;
      setControlsSaving(true);
      setError(null);
      try {
        const res = await patchWorkItemSubmissionControls(
          companyId,
          engagementId,
          workItemId,
          patch,
          periodId
        );
        setResponsesLocked(res.responsesLocked);
        setInternalEditEnabled(res.internalEditEnabled);
        setPublicSubmitEnabled(res.publicSubmitEnabled);
        await reload();
      } catch (err) {
        setError(
          getApiErrorMessage(err, "Could not update form access settings.")
        );
        throw err;
      } finally {
        setControlsSaving(false);
      }
    },
    [companyId, engagementId, workItemId, periodId, reload]
  );

  const staffEditLocked = isStaffFieldEditLocked({
    internalEditEnabled,
    responsesLocked,
  });

  const updateExecutionStatus = useCallback(
    async (status: WorkItemStatus) => {
      if (!companyId) return false;
      setError(null);
      const previous = executionStatus;
      setExecutionStatus(status);
      try {
        await patchWorkItemStatus(
          companyId,
          engagementId,
          workItemId,
          { status },
          periodId
        );
        return true;
      } catch (err) {
        setExecutionStatus(previous);
        setError(getApiErrorMessage(err, "Could not update status."));
        return false;
      }
    },
    [companyId, engagementId, executionStatus, periodId, workItemId]
  );

  return {
    fields,
    groups,
    values,
    configuredAt,
    savedAt,
    hydrated,
    isConfigured,
    responsesLocked,
    internalEditEnabled,
    publicSubmitEnabled,
    staffEditLocked,
    controlsSaving,
    patchSubmissionControls,
    formLink,
    formLinkUrl: formLink?.url ?? null,
    error,
    persistTemplate,
    applyDefaultTemplate,
    persistValues,
    uploadFieldFile,
    ensureFormLink,
    reload,
    closureInitial,
    activityLogs,
    executionStatus,
    updateExecutionStatus,
  };
}
