const PREFIX = "customer-engagement-tab:";

function storageKey(companyId: string, customerId: string) {
  return `${PREFIX}${companyId}:${customerId}`;
}

/** Last engagement tab selected on the customer detail page. */
export function loadLastEngagementTab(
  companyId: string,
  customerId: string
): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(companyId, customerId));
    return raw && raw.trim() ? raw : null;
  } catch {
    return null;
  }
}

export function saveLastEngagementTab(
  companyId: string,
  customerId: string,
  engagementId: string
) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(companyId, customerId), engagementId);
  } catch {
    /* quota / private mode */
  }
}
