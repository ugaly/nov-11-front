"use client";

import { getApiErrorCode, getApiErrorMessage } from "@/api/errors";
import type { WorkItemFileAttachment } from "@/api/types/work-item-template";
import {
  deleteWorkItemOutputFile,
  getWorkItemOutputFiles,
  postWorkItemOutputFile,
} from "@/api/work-item/work-item.api";
import { apiFileToAttachment } from "@/lib/work-item-api-files";
import { useCallback, useEffect, useState } from "react";

export function useWorkItemOutputFiles(
  companyId: string | null,
  engagementId: string,
  workItemId: string,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled !== false && Boolean(companyId);
  const [files, setFiles] = useState<WorkItemFileAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!companyId || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      const dtos = await getWorkItemOutputFiles(
        companyId,
        engagementId,
        workItemId
      );
      setFiles(dtos.map(apiFileToAttachment));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load deliverable files."));
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, engagementId, workItemId, enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!companyId) throw new Error("No company context");
      setUploading(true);
      setError(null);
      try {
        const dto = await postWorkItemOutputFile(
          companyId,
          engagementId,
          workItemId,
          file
        );
        const att = apiFileToAttachment(dto);
        setFiles((prev) => [...prev, att]);
        return att;
      } catch (err) {
        const code = getApiErrorCode(err);
        const msg = getApiErrorMessage(
          err,
          code === "RESPONSES_LOCKED"
            ? "Cannot upload deliverables after closure is submitted."
            : "Could not upload deliverable."
        );
        setError(msg);
        throw new Error(msg);
      } finally {
        setUploading(false);
      }
    },
    [companyId, engagementId, workItemId]
  );

  const removeFile = useCallback(
    async (fileId: string, force = false) => {
      if (!companyId) return;
      setError(null);
      try {
        await deleteWorkItemOutputFile(
          companyId,
          engagementId,
          workItemId,
          fileId,
          force
        );
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      } catch (err) {
        const code = getApiErrorCode(err);
        const msg = getApiErrorMessage(
          err,
          code === "RESPONSES_LOCKED"
            ? "Cannot remove deliverables after closure. Reopen closure to edit."
            : "Could not remove deliverable."
        );
        setError(msg);
        throw new Error(msg);
      }
    },
    [companyId, engagementId, workItemId]
  );

  return {
    files,
    loading,
    uploading,
    error,
    reload,
    uploadFile,
    removeFile,
  };
}
