"use client";

import { fetchExpenseAccess } from "@/api/expense/expense.api";
import type { ExpenseAccessResponse } from "@/api/types/expense";
import { getStoredUser } from "@/lib/auth-storage";
import { useCallback, useEffect, useState } from "react";

export function useExpenseAccess() {
  const officeId = getStoredUser()?.officeId ?? null;
  const [access, setAccess] = useState<ExpenseAccessResponse | null>(null);
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
      const data = await fetchExpenseAccess(officeId);
      setAccess(data);
    } catch (e) {
      setAccess(null);
      setError(e instanceof Error ? e.message : "Could not load expense access.");
    } finally {
      setLoading(false);
    }
  }, [officeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { officeId, access, loading, error, refresh };
}
