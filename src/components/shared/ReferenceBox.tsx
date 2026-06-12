"use client";

import { Copy, X } from "lucide-react";

export default function ReferenceBox({
  label,
  value,
  onRemove,
  onCopy,
  readOnly = false,
  className = "",
}: {
  label: string;
  value: string;
  onRemove?: () => void;
  onCopy?: () => void;
  readOnly?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex max-w-full min-w-[10rem] items-start gap-2 rounded-xl border border-gray-200 bg-gray-50/90 px-3 py-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-900/60 ${className}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <p className="mt-0.5 truncate font-mono text-sm font-semibold text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {onCopy ? (
          <button
            type="button"
            className="rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            onClick={onCopy}
            aria-label={`Copy ${label}`}
          >
            <Copy className="size-3.5" aria-hidden />
          </button>
        ) : null}
        {!readOnly && onRemove ? (
          <button
            type="button"
            className="rounded-md p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
            onClick={onRemove}
            aria-label={`Remove ${label}`}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
