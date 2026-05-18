"use client";

import Button from "@/components/ui/button/Button";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import React from "react";

const cardClass =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6";

type SetupPageShellProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: (ctx: { companyId: string; companyName: string | null }) => React.ReactNode;
};

export default function SetupPageShell({
  title,
  description,
  actions,
  children,
}: SetupPageShellProps) {
  const { companyId, companyName, loading, error, reload } = useCompanyContext();

  if (loading) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading workspace…</p>
    );
  }

  if (error || !companyId) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-error-700 dark:text-error-100">
          {error ?? "Company context is unavailable."}
        </p>
        <Button className="mt-3" size="sm" onClick={() => void reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          ) : null}
          {companyName ? (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Company:{" "}
              <span className="font-medium text-gray-600 dark:text-gray-300">
                {companyName}
              </span>
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children({ companyId, companyName })}
    </div>
  );
}
