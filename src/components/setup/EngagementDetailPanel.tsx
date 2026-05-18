"use client";

import { getApiErrorMessage } from "@/api/errors";
import { getEngagement } from "@/api/template-config/template-config.api";
import type { CustomerEngagementResponse } from "@/api/types/template-config";
import EngagementDetailBody from "@/components/setup/EngagementDetailBody";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import Button from "@/components/ui/button/Button";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";

export default function EngagementDetailPanel({
  engagementId,
}: {
  engagementId: string;
}) {
  const { companyId, loading: ctxLoading, error: ctxError, reload } =
    useCompanyContext();
  const [engagement, setEngagement] =
    useState<CustomerEngagementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      setEngagement(await getEngagement(companyId, engagementId));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load engagement."));
    } finally {
      setLoading(false);
    }
  }, [companyId, engagementId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (ctxLoading) {
    return <p className="text-sm text-gray-500">Loading workspace…</p>;
  }
  if (ctxError || !companyId) {
    return (
      <div>
        <p className="text-sm text-error-600">{ctxError ?? "No company."}</p>
        <Button className="mt-2" size="sm" onClick={() => void reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/setup/engagements"
        className="text-sm text-brand-600 hover:underline"
      >
        ← Engagements
      </Link>
      {loading ? (
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading…
        </p>
      ) : error ? (
        <p className="text-sm text-error-600">{error}</p>
      ) : engagement ? (
        <EngagementDetailBody
          companyId={companyId}
          engagement={engagement}
          onEngagementRefresh={load}
        />
      ) : null}
    </div>
  );
}
