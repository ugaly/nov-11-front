"use client";

import {
  listPaymentCategories,
  listPaymentMethods,
} from "@/api/payment/payment-config.api";
import type {
  CompanyPaymentCategoryResponse,
  CompanyPaymentMethodResponse,
} from "@/api/types/payment-config";
import { getStoredUser } from "@/lib/auth-storage";
import { useCallback, useEffect, useState } from "react";

export function usePaymentOptions() {
  const companyId = getStoredUser()?.companyId ?? null;
  const [categories, setCategories] = useState<CompanyPaymentCategoryResponse[]>(
    []
  );
  const [methods, setMethods] = useState<CompanyPaymentMethodResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setCategories([]);
      setMethods([]);
      setLoading(false);
      setError("Company context is missing.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [cats, meths] = await Promise.all([
        listPaymentCategories(companyId, true),
        listPaymentMethods(companyId, true),
      ]);
      setCategories(cats);
      setMethods(meths);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load payment options.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { companyId, categories, methods, loading, error, refresh };
}
