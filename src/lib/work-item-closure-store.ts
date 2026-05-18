import type { WorkItemStatus } from "@/api/types/template-config";

export interface WorkItemClosureState {
  remark: string;
  submittedAt: string | null;
  submittedStatus: WorkItemStatus | null;
}

function key(engagementId: string, workItemId: string) {
  return `work-item-closure:${engagementId}:${workItemId}`;
}

export const CLOSURE_STATUSES = [
  "DONE",
  "BLOCKED",
  "NOT_APPLICABLE",
] as const satisfies readonly WorkItemStatus[];

export type ClosureStatus = (typeof CLOSURE_STATUSES)[number];

export function isClosureStatus(
  status: WorkItemStatus
): status is ClosureStatus {
  return (CLOSURE_STATUSES as readonly WorkItemStatus[]).includes(status);
}

export function loadWorkItemClosure(
  engagementId: string,
  workItemId: string
): WorkItemClosureState {
  if (typeof window === "undefined") {
    return { remark: "", submittedAt: null, submittedStatus: null };
  }
  try {
    const raw = localStorage.getItem(key(engagementId, workItemId));
    if (!raw) {
      return { remark: "", submittedAt: null, submittedStatus: null };
    }
    return JSON.parse(raw) as WorkItemClosureState;
  } catch {
    return { remark: "", submittedAt: null, submittedStatus: null };
  }
}

export function saveWorkItemClosure(
  engagementId: string,
  workItemId: string,
  state: WorkItemClosureState
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key(engagementId, workItemId), JSON.stringify(state));
}

export function clearWorkItemClosure(engagementId: string, workItemId: string) {
  saveWorkItemClosure(engagementId, workItemId, {
    remark: "",
    submittedAt: null,
    submittedStatus: null,
  });
}
