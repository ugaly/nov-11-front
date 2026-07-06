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
import { useCallback, useEffect, useRef, useState } from "react";

export interface WorkItemClosureView {
  remark: string;
  submittedAt: string | null;
  submittedStatus: WorkItemStatus | null;
}

function mergeRemark(
  fromServer: string | null | undefined,
  previous: string,
  lastSubmitted: string
): string {
  if (fromServer != null && fromServer.trim() !== "") {
    return fromServer;
  }
  if (lastSubmitted.trim() !== "") {
    return lastSubmitted;
  }
  return previous;
}

export function useWorkItemClosure(
  engagementId: string,
  workItemId: string,
  currentStatus: WorkItemStatus,
  companyId: string | null,
  periodId?: string | null,
  options: {
    initialClosure?: {
      remark: string | null;
      submittedAt: string | null;
      status: WorkItemStatus | null;
    };
    onAfterSubmit?: () => void | Promise<void>;
  } = {}
) {
  const lastSubmittedRemarkRef = useRef("");
  const [closure, setClosure] = useState<WorkItemClosureView>({
    remark: options.initialClosure?.remark ?? "",
    submittedAt: options.initialClosure?.submittedAt ?? null,
    submittedStatus: options.initialClosure?.status ?? null,
  });
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setClosure((prev) => {
      const submittedAt =
        options.initialClosure?.submittedAt ?? prev.submittedAt;
      const remark = mergeRemark(
        options.initialClosure?.remark,
        prev.remark,
        lastSubmittedRemarkRef.current
      );
      if (remark.trim()) {
        lastSubmittedRemarkRef.current = remark;
      }
      return {
        remark,
        submittedAt,
        submittedStatus:
          options.initialClosure?.status ?? prev.submittedStatus,
      };
    });
    setHydrated(true);
  }, [
    workItemId,
    engagementId,
    periodId,
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
    if (!hydrated || !isSubmitted || closure.submittedAt) return;
    if (
      !isClosureStatus(currentStatus) ||
      closure.submittedStatus !== currentStatus
    ) {
      lastSubmittedRemarkRef.current = "";
      setClosure({
        remark: "",
        submittedAt: null,
        submittedStatus: null,
      });
    }
  }, [
    currentStatus,
    closure.submittedAt,
    closure.submittedStatus,
    hydrated,
    isSubmitted,
  ]);

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
      const trimmed = remark.trim();
      try {
        const res = await postWorkItemClosure(
          companyId,
          engagementId,
          workItemId,
          {
            status,
            remark: trimmed,
            values,
            outputFileIds,
          },
          periodId
        );
        const savedRemark = res.remark ?? trimmed;
        lastSubmittedRemarkRef.current = savedRemark;
        setClosure({
          remark: savedRemark,
          submittedAt: res.submittedAt,
          submittedStatus: res.status ?? status,
        });
        await options.onAfterSubmit?.();
      } catch (err) {
        setError(getApiErrorMessage(err, "Could not submit closure."));
        throw err;
      }
    },
    [companyId, engagementId, workItemId, periodId, options]
  );

  const reopenClosure = useCallback(async () => {
    if (!companyId) return;
    setError(null);
    try {
      await postWorkItemClosureReopen(
        companyId,
        engagementId,
        workItemId,
        {},
        periodId
      );
      lastSubmittedRemarkRef.current = "";
      setClosure({
        remark: "",
        submittedAt: null,
        submittedStatus: null,
      });
      await options.onAfterSubmit?.();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not reopen closure."));
      throw err;
    }
  }, [companyId, engagementId, options, periodId, workItemId]);

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
