const PREFIX = "work-groups-expanded:";

export function loadExpandedGroups(engagementId: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`${PREFIX}${engagementId}`);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function saveExpandedGroups(
  engagementId: string,
  expanded: Record<string, boolean>
) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${PREFIX}${engagementId}`, JSON.stringify(expanded));
  } catch {
    /* quota / private mode */
  }
}
