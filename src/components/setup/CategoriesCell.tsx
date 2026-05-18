"use client";

import type { CustomerCategoryAssignmentDto } from "@/api/types/template-config";
import { useCallback, useRef, useState, type ReactNode } from "react";

const HIDE_DELAY_MS = 120;

export default function CategoriesCell({
  categories,
  compact = false,
}: {
  categories: CustomerCategoryAssignmentDto[];
  compact?: boolean;
}) {
  if (!categories.length) {
    return <span className="text-gray-400">—</span>;
  }

  if (categories.length === 1) {
    const cat = categories[0]!;
    return (
      <CategoriesHoverCard categories={categories}>
        <span
          className={`block max-w-[11rem] cursor-default truncate font-medium text-gray-800 underline decoration-gray-300 decoration-dotted underline-offset-2 dark:text-white/90 dark:decoration-gray-600 ${compact ? "text-xs" : "text-sm"}`}
        >
          {cat.categoryName}
        </span>
      </CategoriesHoverCard>
    );
  }

  return (
    <CategoriesHoverCard categories={categories}>
      <span
        className={`inline-flex cursor-default items-center rounded-full bg-brand-50 font-semibold text-brand-700 ring-1 ring-inset ring-brand-200/80 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/30 ${compact ? "px-1.5 py-px text-[10px]" : "px-2.5 py-1 text-xs"}`}
      >
        {categories.length} categories
      </span>
    </CategoriesHoverCard>
  );
}

function CategoriesHoverCard({
  categories,
  children,
}: {
  categories: CustomerCategoryAssignmentDto[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setOpen(true);
  }, []);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setOpen(false), HIDE_DELAY_MS);
  }, []);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
      onFocus={show}
      onBlur={scheduleHide}
    >
      {children}
      <div
        className={`absolute left-0 top-full z-[200] pt-1 transition-opacity duration-100 ${
          open
            ? "pointer-events-auto visible opacity-100"
            : "pointer-events-none invisible opacity-0"
        }`}
        aria-hidden={!open}
      >
        <CategoriesPopover categories={categories} />
      </div>
    </div>
  );
}

function CategoriesPopover({
  categories,
}: {
  categories: CustomerCategoryAssignmentDto[];
}) {
  return (
    <div
      className="min-w-[16rem] max-w-xs rounded-xl border border-gray-200 bg-white p-3 text-left shadow-xl dark:border-gray-700 dark:bg-gray-900"
      role="tooltip"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Categories & catalogs
      </p>
      <ul className="max-h-56 space-y-2 overflow-y-auto text-xs">
        {categories.map((cat) => (
          <li key={cat.categoryId}>
            <p className="font-medium text-gray-800 dark:text-white/90">
              {cat.categoryName}
              {cat.categoryCode ? (
                <span className="ml-1 font-mono font-normal text-gray-400">
                  {cat.categoryCode}
                </span>
              ) : null}
            </p>
            {cat.catalogs.length > 0 ? (
              <ul className="mt-1 space-y-0.5 border-l-2 border-brand-200 pl-2 dark:border-brand-800">
                {cat.catalogs.map((catalog) => (
                  <li
                    key={catalog.catalogId}
                    className="text-gray-600 dark:text-gray-400"
                  >
                    {catalog.catalogName}
                    {catalog.catalogPrice != null && catalog.currency ? (
                      <span className="ml-1 tabular-nums text-gray-500">
                        · {catalog.currency}{" "}
                        {catalog.catalogPrice.toLocaleString()}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-0.5 text-gray-400">No catalogs</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
