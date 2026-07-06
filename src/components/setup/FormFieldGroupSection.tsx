"use client";

import type { ReactNode } from "react";

/** Boxed section for grouped form fields — clear header + contained inputs. */
export default function FormFieldGroupSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50/50 shadow-sm dark:border-gray-700 dark:bg-gray-900/25">
      <div className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900/50">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
