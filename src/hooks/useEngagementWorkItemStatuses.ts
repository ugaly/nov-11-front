"use client";

import type {
  EngagementWorkItemResponse,
  WorkItemStatus,
} from "@/api/types/template-config";
import {
  loadStatusOverrides,
  saveStatusOverride,
} from "@/lib/work-item-status-store";
import { useCallback, useEffect, useState } from "react";

export function useEngagementWorkItemStatuses(
  engagementId: string,
  workItems: EngagementWorkItemResponse[]
) {
  const [overrides, setOverrides] = useState<Record<string, WorkItemStatus>>(
    {}
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOverrides(loadStatusOverrides(engagementId));
    setReady(true);
  }, [engagementId]);

  const getStatus = useCallback(
    (item: EngagementWorkItemResponse): WorkItemStatus =>
      overrides[item.id] ?? item.status,
    [overrides]
  );

  const setStatus = useCallback(
    (workItemId: string, status: WorkItemStatus) => {
      saveStatusOverride(engagementId, workItemId, status);
      setOverrides((prev) => ({ ...prev, [workItemId]: status }));
    },
    [engagementId]
  );

  const mergedWorkItems = workItems.map((w) => ({
    ...w,
    status: getStatus(w),
  }));

  return { getStatus, setStatus, mergedWorkItems, ready };
}
