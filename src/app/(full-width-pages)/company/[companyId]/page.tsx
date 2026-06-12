"use client";

import { getPublicCompanyProfile } from "@/api/company/company-management.api";
import type { CompanyManagementProfile } from "@/api/types/company-management";
import CompanyPublicProfileView from "@/components/company/CompanyPublicProfileView";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PublicCompanyProfilePage() {
  const params = useParams();
  const companyId = typeof params.companyId === "string" ? params.companyId : "";
  const [profile, setProfile] = useState<CompanyManagementProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    void (async () => {
      setLoading(true);
      try {
        setProfile(await getPublicCompanyProfile(companyId));
      } catch {
        setError("Company profile not found or unavailable.");
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <p className="text-sm text-gray-500">{error ?? "Not found."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-950 sm:px-6 lg:px-8">
      <CompanyPublicProfileView profile={profile} />
    </div>
  );
}
