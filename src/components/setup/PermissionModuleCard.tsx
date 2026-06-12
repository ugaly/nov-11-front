"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type PermissionToggle = {
  key: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

export default function PermissionModuleCard({
  title,
  description,
  icon: Icon,
  enabled,
  onEnabledChange,
  permissions,
  footer,
  comingSoon = false,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  permissions: PermissionToggle[];
  footer?: ReactNode;
  comingSoon?: boolean;
}) {
  const moduleDisabled = comingSoon || (onEnabledChange != null && !enabled);

  return (
    <section
      className={`overflow-hidden rounded-2xl border shadow-sm ${
        comingSoon
          ? "border-gray-200 bg-gray-50/50 opacity-80 dark:border-gray-800 dark:bg-gray-900/20"
          : "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <Icon className="size-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {title}
              {comingSoon ? (
                <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  Soon
                </span>
              ) : null}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {description}
            </p>
          </div>
        </div>
        {onEnabledChange && !comingSoon ? (
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              className="size-4 rounded border-gray-300"
              checked={enabled}
              onChange={(e) => onEnabledChange(e.target.checked)}
            />
            Module access
          </label>
        ) : null}
      </div>
      <div className="grid gap-px bg-gray-100 dark:bg-gray-800 sm:grid-cols-2">
        {permissions.map((perm) => (
          <label
            key={perm.key}
            className={`flex cursor-pointer items-start gap-3 bg-white px-4 py-3.5 transition-colors dark:bg-gray-900/40 ${
              moduleDisabled ? "cursor-not-allowed opacity-50" : "hover:bg-gray-50 dark:hover:bg-gray-900/70"
            }`}
          >
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 rounded border-gray-300"
              checked={perm.checked}
              disabled={moduleDisabled || perm.disabled}
              onChange={(e) => perm.onChange(e.target.checked)}
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-gray-900 dark:text-white">
                {perm.label}
              </span>
              {perm.description ? (
                <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                  {perm.description}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
      {footer ? (
        <div className="border-t border-gray-200 px-5 py-3 dark:border-gray-800">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
