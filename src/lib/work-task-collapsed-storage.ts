const PREFIX = "work-tasks-collapsed:";

function key(engagementId: string) {
  return `${PREFIX}${engagementId}`;
}

export function loadCollapsedTasks(engagementId: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key(engagementId));
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function saveCollapsedTasks(
  engagementId: string,
  collapsed: Record<string, boolean>
) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key(engagementId), JSON.stringify(collapsed));
  } catch {
    /* quota / private mode */
  }
}

export function setTaskCollapsed(
  engagementId: string,
  taskId: string,
  isCollapsed: boolean
) {
  const current = loadCollapsedTasks(engagementId);
  const next = { ...current, [taskId]: isCollapsed };
  saveCollapsedTasks(engagementId, next);
}
