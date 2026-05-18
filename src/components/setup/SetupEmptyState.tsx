"use client";

import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

type SetupEmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /** Centered in a card area (default). */
  variant?: "default" | "bordered" | "inline";
  className?: string;
};

const variantClass: Record<
  NonNullable<SetupEmptyStateProps["variant"]>,
  string
> = {
  default: "py-10 text-center",
  inline: "py-8 text-center",
  bordered:
    "rounded-xl border border-dashed border-gray-300 bg-gray-50/80 px-4 py-10 text-center dark:border-gray-600 dark:bg-gray-900/20",
};

export default function SetupEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  variant = "default",
  className = "",
}: SetupEmptyStateProps) {
  const iconSize = variant === "bordered" ? "size-9" : "size-10";

  return (
    <div className={`${variantClass[variant]} ${className}`.trim()}>
      <Icon
        className={`mx-auto ${iconSize} text-gray-300 dark:text-gray-600`}
        aria-hidden
      />
      <p className="mt-4 text-sm font-medium text-gray-800 dark:text-gray-200">
        {title}
      </p>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
