"use client";

import { INVOICE_LOGO_SRC } from "@/lib/brand-logo";

/** Dark logo for white invoice documents (same brand as login). */
export default function InvoiceBrandLogo({
  className = "h-14 w-auto max-w-[180px] object-contain",
}: {
  className?: string;
}) {
  return (
    <img
      src={INVOICE_LOGO_SRC}
      alt="Company logo"
      className={className}
    />
  );
}
