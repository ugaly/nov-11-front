"use client";

import { apiClient } from "@/api/client";
import type { CompanyResponse } from "@/api/types/organization";
import { getStoredUser } from "@/lib/auth-storage";
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

async function fetchCompanies(): Promise<CompanyResponse[]> {
  const { data } = await apiClient.get<CompanyResponse[]>("/api/companies");
  return data;
}

function pickCompany(
  companies: CompanyResponse[],
  preferredId?: string | null
): CompanyResponse | null {
  if (companies.length === 0) return null;
  if (preferredId) {
    const match = companies.find((c) => c.id === preferredId && c.active);
    if (match) return match;
  }
  return companies.find((c) => c.active) ?? companies[0];
}

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
      const companies = await fetchCompanies();
      const user = getStoredUser() as { companyId?: string } | null;
      const picked = pickCompany(companies, user?.companyId);
      if (!picked) {
        setCompanyId(null);
        setCompanyName(null);
        setError("No company found for your account.");
        return;
      }
      setCompanyId(picked.id);
      setCompanyName(picked.name);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.replace("/");
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
