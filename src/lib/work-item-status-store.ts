import type { WorkItemStatus } from "@/api/types/template-config";

function key(engagementId: string) {
  return `work-item-status:${engagementId}`;
}

export function loadStatusOverrides(
  engagementId: string
): Record<string, WorkItemStatus> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key(engagementId));
    return raw ? (JSON.parse(raw) as Record<string, WorkItemStatus>) : {};
  } catch {
    return {};
  }
}

export function saveStatusOverride(
  engagementId: string,
  workItemId: string,
  status: WorkItemStatus
) {
  if (typeof window === "undefined") return;
  const all = loadStatusOverrides(engagementId);
  all[workItemId] = status;
  localStorage.setItem(key(engagementId), JSON.stringify(all));
}
