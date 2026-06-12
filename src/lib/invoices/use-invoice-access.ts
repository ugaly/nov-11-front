"use client";

import { fetchInvoiceAccess } from "@/api/invoice/invoice.api";
import type { InvoiceAccessResponse } from "@/api/types/invoice";
import { getStoredUser } from "@/lib/auth-storage";
import { useCallback, useEffect, useState } from "react";

export function useInvoiceAccess() {
  const officeId = getStoredUser()?.officeId ?? null;
  const [access, setAccess] = useState<InvoiceAccessResponse | null>(null);
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
      setAccess(await fetchInvoiceAccess(officeId));
    } catch (e) {
      setAccess(null);
      setError(e instanceof Error ? e.message : "Could not load invoice access.");
    } finally {
      setLoading(false);
    }
  }, [officeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { officeId, access, loading, error, refresh };
}
