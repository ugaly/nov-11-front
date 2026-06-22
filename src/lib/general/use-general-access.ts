"use client";

import { fetchGeneralAccess } from "@/api/general/general.api";
import type { GeneralAccessResponse } from "@/api/types/general";
import { getStoredUser } from "@/lib/auth-storage";
import { isAdminUser } from "@/lib/is-admin";
import { useCallback, useEffect, useState } from "react";

export function useGeneralAccess() {
  const officeId = getStoredUser()?.officeId ?? null;
  const [access, setAccess] = useState<GeneralAccessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!officeId) {
      setAccess(null);
      setLoading(false);
      setError("Your account is not assigned to an office.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGeneralAccess(officeId);
      setAccess(data);
    } catch (e) {
      setAccess(null);
      setError(e instanceof Error ? e.message : "Could not load module access.");
    } finally {
      setLoading(false);
    }
  }, [officeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { officeId, access, loading, error, refresh };
}

export function useCanManageSetup() {
  const { access, loading } = useGeneralAccess();
  if (loading) return false;
  return isAdminUser() || Boolean(access?.canManageSetup);
}

export function useCanManageGeneralPermissions() {
  const { access, loading } = useGeneralAccess();
  if (loading) return false;
  return isAdminUser() || Boolean(access?.canManageGeneralPermissions);
}
