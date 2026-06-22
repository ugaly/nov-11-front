import type { GeneralAccessResponse } from "@/api/types/general";
import { getStoredUser } from "@/lib/auth-storage";

export function isAdminUser(): boolean {
  return getStoredUser()?.userType === "ADMIN";
}

/** Show setup create/edit actions when admin or office setup permission is granted. */
export function canManageSetup(access?: GeneralAccessResponse | null): boolean {
  return isAdminUser() || Boolean(access?.canManageSetup);
}
