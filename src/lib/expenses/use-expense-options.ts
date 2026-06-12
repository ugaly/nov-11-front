"use client";

import { listExpenseTypes } from "@/api/expense/expense-config.api";
import type { CompanyExpenseTypeResponse } from "@/api/types/expense-config";
import { getStoredUser } from "@/lib/auth-storage";
import { useCallback, useEffect, useState } from "react";

export function useExpenseOptions() {
  const companyId = getStoredUser()?.companyId ?? null;
  const [types, setTypes] = useState<CompanyExpenseTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setTypes([]);
      setLoading(false);
      setError("Company context is missing.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setTypes(await listExpenseTypes(companyId, true));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load expense types.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { companyId, types, loading, error, refresh };
}
