import type { UserResponse } from "@/api/types/auth";

const TOKEN_KEY = "portal_access_token";
const USER_KEY = "portal_user_json";

export const AUTH_USER_CHANGED_EVENT = "portal-user-changed";

function notifyUserChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_USER_CHANGED_EVENT));
}

function clearSessionAuthKeys() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

/**
 * Persists JWT and user snapshot in **sessionStorage** only (tab lifetime;
 * cleared when the tab/window closes). Also removes any legacy keys from
 * localStorage from older builds.
 */
export function setAuthSession(params: {
  accessToken: string;
  user: UserResponse;
}): void {
  if (typeof window === "undefined") return;
  clearAuthSession();
  sessionStorage.setItem(TOKEN_KEY, params.accessToken);
  sessionStorage.setItem(USER_KEY, JSON.stringify(params.user));
  notifyUserChanged();
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  clearSessionAuthKeys();
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  notifyUserChanged();
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): UserResponse | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserResponse;
  } catch {
    return null;
  }
}

/** After `PATCH /api/users/me`, keep session snapshot in sync with the server. */
export function updateStoredUser(user: UserResponse): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  notifyUserChanged();
}
