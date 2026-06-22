"use client";

import { getCurrentUser } from "@/api/users/users.api";
import { getStoredUser, updateStoredUser } from "@/lib/auth-storage";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type CompanyContextValue = {
  companyId: string | null;
  companyName: string | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useCompanyContext(): CompanyContextValue {
  const router = useRouter();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await getCurrentUser();
      updateStoredUser(me);
      if (!me.companyId) {
        setCompanyId(null);
        setCompanyName(null);
        setError("Your account is not linked to a company.");
        return;
      }
      setCompanyId(me.companyId);
      setCompanyName(me.companyName ?? getStoredUser()?.companyName ?? null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.replace("/");
        return;
      }
      const cached = getStoredUser();
      if (cached?.companyId) {
        setCompanyId(cached.companyId);
        setCompanyName(cached.companyName ?? null);
        return;
      }
      setCompanyId(null);
      setCompanyName(null);
      setError("Could not load company context.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { companyId, companyName, loading, error, reload };
}
