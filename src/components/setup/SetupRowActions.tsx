"use client";

import {
  setupRowIconBtnClass,
  setupRowIconBtnDangerClass,
} from "@/components/setup/setup-table-styles";
import { Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function SetupRowActions({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center justify-end gap-0.5">{children}</div>
  );
}

export function SetupRowActionLink({
  href,
  title,
}: {
  href: string;
  title: string;
}) {
  return (
    <Link href={href} className={setupRowIconBtnClass} title={title}>
      <Eye className="size-3.5" aria-hidden />
      <span className="sr-only">{title}</span>
    </Link>
  );
}

export function SetupRowActionDeactivate({
  title,
  onClick,
}: {
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      className={setupRowIconBtnDangerClass}
      onClick={onClick}
    >
      <Trash2 className="size-3.5" aria-hidden />
      <span className="sr-only">{title}</span>
    </button>
  );
}
