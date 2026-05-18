"use client";

import type { CustomerEngagementResponse } from "@/api/types/template-config";
import { formatEngagementPeriod } from "@/lib/template-recurrence";
import EngagementWorkPanel from "@/components/setup/EngagementWorkPanel";
import { EngagementStatusBadge } from "@/components/setup/setup-pro-ui";
import Link from "next/link";
import { CalendarRange, ExternalLink } from "lucide-react";

export default function EngagementDetailBody({
  companyId,
  engagement,
  showOpenLink = false,
  onEngagementRefresh,
}: {
  companyId: string;
  engagement: CustomerEngagementResponse;
  showOpenLink?: boolean;
  onEngagementRefresh?: () => void | Promise<void>;
}) {
  const periodText = engagement.period
    ? formatEngagementPeriod(engagement.period)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
              {engagement.title}
            </h4>
            <EngagementStatusBadge status={engagement.status} />
          </div>
          {engagement.description ? (
            <p className="mt-1.5 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
              {engagement.description}
            </p>
          ) : null}
          {periodText ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <CalendarRange
                className="size-3.5 shrink-0 text-gray-400"
                aria-hidden
              />
              <span>{periodText}</span>
            </p>
          ) : null}
        </div>
        {showOpenLink ? (
          <Link
            href={`/setup/engagements/${engagement.id}`}
            className="inline-flex shrink-0 items-center gap-1 text-xs text-brand-600 hover:underline"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Full page
          </Link>
        ) : null}
      </div>

      <EngagementWorkPanel
        companyId={companyId}
        engagement={engagement}
        onEngagementRefresh={onEngagementRefresh}
      />
    </div>
  );
}
