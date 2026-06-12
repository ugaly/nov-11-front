"use client";

import { fetchPaymentAccess } from "@/api/payment/payment.api";
import type { PaymentAccessResponse } from "@/api/types/payment";
import { getStoredUser } from "@/lib/auth-storage";
import { useCallback, useEffect, useState } from "react";

export function usePaymentAccess() {
  const officeId = getStoredUser()?.officeId ?? null;
  const [access, setAccess] = useState<PaymentAccessResponse | null>(null);
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
      const data = await fetchPaymentAccess(officeId);
      setAccess(data);
    } catch (e) {
      setAccess(null);
      setError(e instanceof Error ? e.message : "Could not load payment access.");
    } finally {
      setLoading(false);
    }
  }, [officeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { officeId, access, loading, error, refresh };
}
