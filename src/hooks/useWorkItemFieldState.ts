"use client";

import axios from "axios";
import { getApiErrorCode, getApiErrorMessage } from "@/api/errors";
import {
  getWorkItemExecution,
  getWorkItemFieldTemplate,
  postWorkItemFieldFile,
  postWorkItemFormLink,
  putWorkItemFieldTemplate,
  putWorkItemFieldValues,
} from "@/api/work-item/work-item.api";
import type { WorkItemFormLinkSummaryDto } from "@/api/types/work-item-api";
import type {
  WorkItemFieldDefinition,
  WorkItemFieldValue,
} from "@/api/types/work-item-template";
import { apiFileToAttachment } from "@/lib/work-item-api-files";
import { normalizeAttachmentFromApi } from "@/lib/work-item-file-utils";
import {
  findDuplicateFieldIds,
  findInvalidAttachmentIds,
  logTemplatePutPayload,
  prepareFieldsForTemplatePut,
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
  workItemId: string
) {
  const [fields, setFields] = useState<WorkItemFieldDefinition[]>([]);
  const [configuredAt, setConfiguredAt] = useState<string | null>(null);
  const [values, setValues] = useState<WorkItemFieldValue[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [responsesLocked, setResponsesLocked] = useState(false);
  const [formLink, setFormLink] = useState<WorkItemFormLinkSummaryDto | null>(
    null
  );
  const [closureInitial, setClosureInitial] = useState<{
    remark: string | null;
    submittedAt: string | null;
    status: import("@/api/types/template-config").WorkItemStatus | null;
  }>({ remark: null, submittedAt: null, status: null });
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!companyId) return;
    setError(null);
    try {
      const bundle = await getWorkItemExecution(
        companyId,
        engagementId,
        workItemId
      );
      const template = bundle.template;
      setFields(template?.fields ?? []);
      setConfiguredAt(template?.configuredAt ?? null);
      setValues(normalizeAttachments(bundle.values?.values ?? []));
      setSavedAt(bundle.values?.savedAt ?? null);
      setResponsesLocked(
        bundle.responsesLocked ?? bundle.values?.responsesLocked ?? false
      );
      setFormLink(bundle.formLink ?? template?.formLink ?? null);
      setClosureInitial({
        remark: bundle.closure?.remark ?? null,
        submittedAt: bundle.closure?.submittedAt ?? null,
        status: bundle.closure?.status ?? null,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load task fields."));
      setFields([]);
      setConfiguredAt(null);
      setValues([]);
      setSavedAt(null);
      setFormLink(null);
    } finally {
      setHydrated(true);
    }
  }, [companyId, engagementId, workItemId]);

  useEffect(() => {
    setHydrated(false);
    void reload();
  }, [reload]);

  const isConfigured = fields.length > 0 && configuredAt != null;

  const persistTemplate = useCallback(
    async (next: WorkItemFieldDefinition[]) => {
      if (!companyId) return;
      setError(null);
      try {
        let serverFields: WorkItemFieldDefinition[] = [];
        let from404 = false;
        try {
          const current = await getWorkItemFieldTemplate(
            companyId,
            engagementId,
            workItemId
          );
          serverFields = current.fields ?? [];
        } catch (fetchErr) {
          if (
            axios.isAxiosError(fetchErr) &&
            fetchErr.response?.status === 404
          ) {
            // No template yet — treat every field as new (fresh UUIDs on PUT).
            serverFields = [];
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

        const fieldsForApi = prepareFieldsForTemplatePut(serverFields, next);
        logTemplatePutPayload(workItemId, fieldsForApi, {
          serverFieldCount: serverFields.length,
          from404,
        });

        const res = await putWorkItemFieldTemplate(
          companyId,
          engagementId,
          workItemId,
          { fields: fieldsForApi }
        );
        setFields(res.fields);
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
    [companyId, engagementId, workItemId, reload]
  );

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

        const valuesForApi = prepareFieldValuesForApi(next);
        const res = await putWorkItemFieldValues(
          companyId,
          engagementId,
          workItemId,
          { values: valuesForApi, force: options?.force }
        );
        setValues(normalizeAttachments(res.values));
        setSavedAt(res.savedAt);
        setResponsesLocked(res.responsesLocked);
      } catch (err) {
        const code = getApiErrorCode(err);
        setError(
          getApiErrorMessage(
            err,
            code === "invalid_field_id"
              ? "Invalid file reference. Remove file attachments and upload again."
              : "Could not save responses."
          )
        );
        throw err;
      }
    },
    [companyId, engagementId, workItemId]
  );

  const uploadFieldFile = useCallback(
    async (fieldId: string, file: File) => {
      if (!companyId) throw new Error("No company context");
      const dto = await postWorkItemFieldFile(
        companyId,
        engagementId,
        workItemId,
        fieldId,
        file
      );
      return apiFileToAttachment(dto);
    },
    [companyId, engagementId, workItemId]
  );

  const ensureFormLink = useCallback(async () => {
    if (!companyId) return null;
    try {
      const link = await postWorkItemFormLink(
        companyId,
        engagementId,
        workItemId,
        { regenerateToken: false }
      );
      const summary: WorkItemFormLinkSummaryDto = {
        url: link.url,
        publicToken: link.publicToken,
        linkScope: link.linkScope,
        edited: link.edited,
        enabled: link.enabled,
        expiresAt: link.expiresAt,
      };
      setFormLink(summary);
      return summary;
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create form link."));
      return null;
    }
  }, [companyId, engagementId, workItemId]);

  return {
    fields,
    values,
    configuredAt,
    savedAt,
    hydrated,
    isConfigured,
    responsesLocked,
    formLink,
    formLinkUrl: formLink?.url ?? null,
    error,
    persistTemplate,
    persistValues,
    uploadFieldFile,
    ensureFormLink,
    reload,
    closureInitial,
  };
}
