"use client";

import type { WorkItemStatus } from "@/api/types/template-config";
import {
  clearWorkItemClosure,
  isClosureStatus,
  loadWorkItemClosure,
  saveWorkItemClosure,
  type WorkItemClosureState,
} from "@/lib/work-item-closure-store";
import { useCallback, useEffect, useState } from "react";

export function useWorkItemClosure(
  engagementId: string,
  workItemId: string,
  currentStatus: WorkItemStatus
) {
  const [closure, setClosure] = useState<WorkItemClosureState>({
    remark: "",
    submittedAt: null,
    submittedStatus: null,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setClosure(loadWorkItemClosure(engagementId, workItemId));
    setHydrated(true);
  }, [engagementId, workItemId]);

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
      clearWorkItemClosure(engagementId, workItemId);
      setClosure({
        remark: "",
        submittedAt: null,
        submittedStatus: null,
      });
    }
  }, [
    currentStatus,
    closure.submittedStatus,
    engagementId,
    hydrated,
    isSubmitted,
    workItemId,
  ]);

  const setRemark = useCallback(
    (remark: string) => {
      const next = { ...closure, remark };
      saveWorkItemClosure(engagementId, workItemId, next);
      setClosure(next);
    },
    [closure, engagementId, workItemId]
  );

  const submitClosure = useCallback(
    (status: WorkItemStatus, remark: string) => {
      const next: WorkItemClosureState = {
        remark: remark.trim(),
        submittedAt: new Date().toISOString(),
        submittedStatus: status,
      };
      saveWorkItemClosure(engagementId, workItemId, next);
      setClosure(next);
    },
    [engagementId, workItemId]
  );

  const reopenClosure = useCallback(() => {
    const next: WorkItemClosureState = {
      remark: closure.remark,
      submittedAt: null,
      submittedStatus: null,
    };
    saveWorkItemClosure(engagementId, workItemId, next);
    setClosure(next);
  }, [closure.remark, engagementId, workItemId]);

  return {
    closure,
    hydrated,
    showSummary,
    isClosure: isClosureStatus(currentStatus),
    setRemark,
    submitClosure,
    reopenClosure,
  };
}
