"use client";

import { getCurrentUser } from "@/api/users/users.api";
import { useCallback, useEffect, useState } from "react";

export function useMyCompanyId() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await getCurrentUser();
      if (!me.companyId) {
        setCompanyId(null);
        setError("Your account is not linked to a company.");
        return;
      }
      setCompanyId(me.companyId);
    } catch {
      setCompanyId(null);
      setError("Could not load company for your account.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { companyId, loading, error, reload };
}
