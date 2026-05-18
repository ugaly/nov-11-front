"use client";

import type { EngagementStatus } from "@/api/types/template-config";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const AVATAR_PALETTES = [
  "bg-brand-500 text-white",
  "bg-violet-500 text-white",
  "bg-emerald-500 text-white",
  "bg-amber-500 text-white",
  "bg-rose-500 text-white",
  "bg-cyan-600 text-white",
] as const;

export function customerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function avatarPalette(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length]!;
}

export function SetupAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg"
      ? "size-14 text-lg"
      : size === "sm"
        ? "size-8 text-[11px]"
        : size === "xs"
          ? "size-7 text-[10px]"
          : "size-11 text-sm";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold shadow-sm ${sizeClass} ${avatarPalette(name)}`}
      aria-hidden
    >
      {customerInitials(name)}
    </span>
  );
}

const STATUS_STYLES: Record<
  EngagementStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Draft",
    className:
      "bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700",
  },
  ACTIVE: {
    label: "Active",
    className:
      "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800",
  },
  ON_HOLD: {
    label: "On hold",
    className:
      "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800",
  },
  COMPLETED: {
    label: "Completed",
    className:
      "bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800",
  },
  CANCELLED: {
    label: "Cancelled",
    className:
      "bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800",
  },
};

export function EngagementStatusBadge({
  status,
  className = "",
}: {
  status: EngagementStatus;
  className?: string;
}) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.className} ${className}`}
    >
      {s.label}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700">
      Inactive
    </span>
  );
}

export function SetupStatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-0.5 text-lg font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
          {hint ? (
            <p className="mt-0.5 truncate text-xs text-gray-500">{hint}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function SetupContactLine({
  icon: Icon,
  href,
  children,
  muted = false,
  compact = false,
}: {
  icon: LucideIcon;
  href?: string;
  children: ReactNode;
  muted?: boolean;
  compact?: boolean;
}) {
  const className = `flex items-center gap-1.5 ${compact ? "text-xs" : "text-sm"} ${
    muted ? "text-gray-400" : "text-gray-700 dark:text-gray-300"
  }`;
  const content = (
    <>
      <Icon
        className={`shrink-0 text-gray-400 ${compact ? "size-3.5" : "size-4"}`}
        aria-hidden
      />
      <span className="truncate">{children}</span>
    </>
  );
  if (href && !muted) {
    return (
      <a href={href} className={`${className} hover:text-brand-600`}>
        {content}
      </a>
    );
  }
  return <div className={className}>{content}</div>;
}

export function SetupSectionCard({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          {Icon ? <Icon className="size-5 text-brand-500" aria-hidden /> : null}
          {title}
        </h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function SetupBackLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
    >
      {children}
    </Link>
  );
}
