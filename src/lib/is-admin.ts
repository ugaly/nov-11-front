import { getStoredUser } from "@/lib/auth-storage";

export function isAdminUser(): boolean {
  return getStoredUser()?.userType === "ADMIN";
}

/** Show setup create/edit actions for any signed-in active user. */
export function canManageSetup(): boolean {
  const user = getStoredUser();
  return user != null && user.status === "ACTIVE";
}
