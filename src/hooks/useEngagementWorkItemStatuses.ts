"use client";

import { getApiErrorMessage } from "@/api/errors";
import { patchWorkItemStatus } from "@/api/work-item/work-item.api";
import type {
  EngagementWorkItemResponse,
  WorkItemStatus,
} from "@/api/types/template-config";
import { useCallback, useState } from "react";

export function useEngagementWorkItemStatuses(
  companyId: string | null,
  engagementId: string,
  workItems: EngagementWorkItemResponse[],
  onRefresh?: () => void | Promise<void>
) {
  const [optimistic, setOptimistic] = useState<Record<string, WorkItemStatus>>(
    {}
  );
  const [statusError, setStatusError] = useState<string | null>(null);

  const getStatus = useCallback(
    (item: EngagementWorkItemResponse): WorkItemStatus =>
      optimistic[item.id] ?? item.status,
    [optimistic]
  );

  const setStatus = useCallback(
    async (workItemId: string, status: WorkItemStatus) => {
      if (!companyId) return;
      const previous = optimistic[workItemId];
      setOptimistic((prev) => ({ ...prev, [workItemId]: status }));
      setStatusError(null);
      try {
        await patchWorkItemStatus(companyId, engagementId, workItemId, {
          status,
        });
        // Keep optimistic status — no full engagement reload (avoids collapsing groups).
      } catch (err) {
        setOptimistic((prev) => {
          const next = { ...prev };
          if (previous !== undefined) next[workItemId] = previous;
          else delete next[workItemId];
          return next;
        });
        setStatusError(getApiErrorMessage(err, "Could not update status."));
      }
    },
    [companyId, engagementId]
  );

  const mergedWorkItems = workItems.map((w) => ({
    ...w,
    status: getStatus(w),
  }));

  return {
    getStatus,
    setStatus,
    mergedWorkItems,
    ready: !!companyId,
    statusError,
  };
}
