"use client";

import { getApiErrorMessage } from "@/api/errors";
import {
  postWorkItemClosure,
  postWorkItemClosureReopen,
} from "@/api/work-item/work-item.api";
import type { WorkItemFieldValue } from "@/api/types/work-item-template";
import type { WorkItemStatus } from "@/api/types/template-config";
import {
  isClosureStatus,
  type ClosureStatus,
} from "@/lib/work-item-closure-store";
import { useCallback, useEffect, useState } from "react";

export interface WorkItemClosureView {
  remark: string;
  submittedAt: string | null;
  submittedStatus: WorkItemStatus | null;
}

export function useWorkItemClosure(
  engagementId: string,
  workItemId: string,
  currentStatus: WorkItemStatus,
  companyId: string | null,
  options: {
    initialClosure?: {
      remark: string | null;
      submittedAt: string | null;
      status: WorkItemStatus | null;
    };
    onAfterSubmit?: () => void | Promise<void>;
  } = {}
) {
  const [closure, setClosure] = useState<WorkItemClosureView>({
    remark: options.initialClosure?.remark ?? "",
    submittedAt: options.initialClosure?.submittedAt ?? null,
    submittedStatus: options.initialClosure?.status ?? null,
  });
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setClosure({
      remark: options.initialClosure?.remark ?? "",
      submittedAt: options.initialClosure?.submittedAt ?? null,
      submittedStatus: options.initialClosure?.status ?? null,
    });
    setHydrated(true);
  }, [
    workItemId,
    engagementId,
    options.initialClosure?.remark,
    options.initialClosure?.submittedAt,
    options.initialClosure?.status,
  ]);

  const isSubmitted =
    closure.submittedAt != null &&
    closure.submittedStatus != null &&
    isClosureStatus(closure.submittedStatus);

  const showSummary =
    isSubmitted &&
    isClosureStatus(currentStatus) &&
    closure.submittedStatus === currentStatus;

  useEffect(() => {
    if (!hydrated || !isSubmitted) return;
    if (
      !isClosureStatus(currentStatus) ||
      closure.submittedStatus !== currentStatus
    ) {
      setClosure({
        remark: "",
        submittedAt: null,
        submittedStatus: null,
      });
    }
  }, [currentStatus, closure.submittedStatus, hydrated, isSubmitted]);

  const setRemark = useCallback((remark: string) => {
    setClosure((c) => ({ ...c, remark }));
  }, []);

  const submitClosure = useCallback(
    async (
      status: ClosureStatus,
      remark: string,
      values?: WorkItemFieldValue[],
      outputFileIds?: string[]
    ) => {
      if (!companyId) return;
      setError(null);
      try {
        const res = await postWorkItemClosure(
          companyId,
          engagementId,
          workItemId,
          {
            status,
            remark: remark.trim(),
            values,
            outputFileIds,
          }
        );
        setClosure({
          remark: res.remark ?? remark.trim(),
          submittedAt: res.submittedAt,
          submittedStatus: res.status ?? status,
        });
        await options.onAfterSubmit?.();
      } catch (err) {
        setError(getApiErrorMessage(err, "Could not submit closure."));
        throw err;
      }
    },
    [companyId, engagementId, workItemId, options]
  );

  const reopenClosure = useCallback(async () => {
    if (!companyId) return;
    setError(null);
    try {
      await postWorkItemClosureReopen(companyId, engagementId, workItemId, {});
      setClosure({
        remark: closure.remark,
        submittedAt: null,
        submittedStatus: null,
      });
      await options.onAfterSubmit?.();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not reopen closure."));
      throw err;
    }
  }, [closure.remark, companyId, engagementId, options, workItemId]);

  return {
    closure,
    hydrated,
    showSummary,
    isClosure: isClosureStatus(currentStatus),
    error,
    setRemark,
    submitClosure,
    reopenClosure,
  };
}
