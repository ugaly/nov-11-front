"use client";

import { searchInvoiceRecipients } from "@/api/invoice/invoice.api";
import type { InvoiceRecipientSearchResult } from "@/api/types/invoice";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { Building2, Loader2, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type InvoiceBillTo = {
  billToName: string;
  billToEmail: string;
  customerId?: string;
};

type Props = {
  officeId: string;
  value: InvoiceBillTo;
  onChange: (next: InvoiceBillTo) => void;
  disabled?: boolean;
};

export default function InvoiceRecipientAutocomplete({
  officeId,
  value,
  onChange,
  disabled,
}: Props) {
  const [query, setQuery] = useState(value.billToEmail);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<InvoiceRecipientSearchResult[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value.billToEmail);
  }, [value.billToEmail]);

  const runSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (trimmed.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        setResults(await searchInvoiceRecipients(officeId, trimmed));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [officeId]
  );

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => void runSearch(query), 280);
    return () => window.clearTimeout(t);
  }, [query, open, runSearch]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(r: InvoiceRecipientSearchResult) {
    onChange({
      billToName: r.displayName,
      billToEmail: r.email,
      customerId: r.kind === "CUSTOMER" ? r.customerId ?? undefined : undefined,
    });
    setQuery(r.email);
    setOpen(false);
  }

  function onEmailChange(email: string) {
    setQuery(email);
    onChange({
      billToName: value.billToName,
      billToEmail: email,
      customerId: undefined,
    });
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div ref={wrapRef} className="relative">
        <Label>Bill to email *</Label>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          Search customers and team members by email, or type any address to bill
          someone who is not in the system.
        </p>
        <div className="relative mt-1.5">
          <input
            type="email"
            value={query}
            disabled={disabled}
            placeholder="name@company.com"
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
            onFocus={() => setOpen(true)}
            onChange={(e) => onEmailChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
          />
          {loading ? (
            <Loader2
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-gray-400"
              aria-hidden
            />
          ) : null}
        </div>
        {open && results.length > 0 ? (
          <ul
            className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
            role="listbox"
          >
            {results.map((r) => (
              <li key={`${r.kind}-${r.email}`}>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(r)}
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    {r.kind === "CUSTOMER" ? (
                      <Building2 className="size-4 text-gray-600 dark:text-gray-300" />
                    ) : (
                      <User className="size-4 text-gray-600 dark:text-gray-300" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-gray-900 dark:text-white">
                      {r.displayName}
                    </span>
                    <span className="block truncate text-gray-500 dark:text-gray-400">
                      {r.email}
                    </span>
                    {r.subtitle ? (
                      <span className="block text-xs text-gray-400">{r.subtitle}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div>
        <Label>Bill to name *</Label>
        <Input
          className="mt-1.5"
          value={value.billToName}
          disabled={disabled}
          placeholder="Recipient or company name"
          onChange={(e) =>
            onChange({ ...value, billToName: e.target.value, customerId: undefined })
          }
        />
      </div>
    </div>
  );
}
