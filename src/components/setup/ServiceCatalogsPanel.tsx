"use client";

import { getApiErrorMessage } from "@/api/errors";
import {
  listServiceCatalogs,
  listServiceCategories,
} from "@/api/template-config/template-config.api";
import type {
  ServiceCatalogListParams,
  ServiceCatalogResponse,
  ServiceCategoryResponse,
} from "@/api/types/template-config";
import CatalogFormModal from "@/components/setup/CatalogFormModal";
import ExportListMenu from "@/components/setup/ExportListMenu";
import { SetupRowActionLink, SetupRowActions } from "@/components/setup/SetupRowActions";
import SetupEmptyState from "@/components/setup/SetupEmptyState";
import SetupPageShell from "@/components/setup/SetupPageShell";
import {
  setupListTableSectionClass,
  setupListTdClass,
  setupListThClass,
  setupTableClass,
  setupTableRowClass,
} from "@/components/setup/setup-table-styles";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { canManageSetup } from "@/lib/is-admin";
import {
  exportServiceCatalogsExcel,
  exportServiceCatalogsPdf,
} from "@/lib/export/service-catalogs-export";
import { formatCatalogRecurrence } from "@/lib/template-recurrence";
import { formatPricing } from "@/lib/template-pricing";
import { Filter, Library, Loader2, Plus, RefreshCw, Search } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

type CatalogFilters = {
  search: string;
  categoryId: string;
  priceSort: "" | "price-asc" | "price-desc";
};

const emptyFilters = (): CatalogFilters => ({
  search: "",
  categoryId: "",
  priceSort: "",
});

function filtersToApiParams(filters: CatalogFilters): ServiceCatalogListParams {
  const params: ServiceCatalogListParams = {};
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.priceSort === "price-asc") {
    params.sort = "price";
    params.order = "asc";
  } else if (filters.priceSort === "price-desc") {
    params.sort = "price";
    params.order = "desc";
  }
  return params;
}

function activeFilterCount(filters: CatalogFilters): number {
  let n = 0;
  if (filters.categoryId) n++;
  if (filters.priceSort) n++;
  return n;
}

export default function ServiceCatalogsPanel() {
  return (
    <SetupPageShell
      title="All service catalogs"
      description="Company-wide list. Create catalogs from a service category."
    >
      {({ companyId }) => <CatalogList companyId={companyId} />}
    </SetupPageShell>
  );
}

function CatalogList({ companyId }: { companyId: string }) {
  const { companyName } = useCompanyContext();
  const canEdit = canManageSetup();
  const [items, setItems] = useState<ServiceCatalogResponse[]>([]);
  const [categories, setCategories] = useState<ServiceCategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState<CatalogFilters>(emptyFilters);
  const [applied, setApplied] = useState<CatalogFilters>(emptyFilters);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setApplied(filters), 400);
    return () => window.clearTimeout(t);
  }, [filters]);

  useEffect(() => {
    void listServiceCategories(companyId)
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [companyId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listServiceCatalogs(companyId, filtersToApiParams(applied)));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load catalogs."));
    } finally {
      setLoading(false);
    }
  }, [companyId, applied]);

  useEffect(() => {
    void load();
  }, [load]);

  const filterCount = useMemo(() => activeFilterCount(applied), [applied]);
  const hasSearch = applied.search.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-brand-50/40 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-brand-950/20">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200/80 px-5 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/25">
              <Library className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Service catalogs
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {loading
                  ? "Loading…"
                  : `${items.length} catalog${items.length === 1 ? "" : "s"}${
                      filterCount > 0 || hasSearch ? " (filtered)" : ""
                    }`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowFilters((v) => !v)}
            >
              <Filter className="mr-1.5 size-4" aria-hidden />
              Filters
              {filterCount > 0 ? (
                <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {filterCount}
                </span>
              ) : null}
            </Button>
            <ExportListMenu
              disabled={loading || items.length === 0}
              onExportPdf={() =>
                exportServiceCatalogsPdf(companyName ?? "Company", items)
              }
              onExportExcel={() =>
                exportServiceCatalogsExcel(companyName ?? "Company", items)
              }
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-1.5 size-4 ${loading ? "animate-spin" : ""}`}
                aria-hidden
              />
              Refresh
            </Button>
            {canEdit ? (
              <Button size="sm" onClick={() => setModalOpen(true)}>
                <Plus className="mr-1.5 size-4" aria-hidden />
                Add catalog
              </Button>
            ) : null}
          </div>
        </div>

        <div className="p-5">
          <div className="relative min-w-0">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <input
              type="search"
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              placeholder="Search catalog name…"
              className="h-11 w-full rounded-xl border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>

          {showFilters ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <FilterSelect
                label="Category"
                value={filters.categoryId}
                onChange={(categoryId) =>
                  setFilters((f) => ({ ...f, categoryId }))
                }
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              />
              <FilterSelect
                label="Sort by price"
                value={filters.priceSort}
                onChange={(priceSort) =>
                  setFilters((f) => ({
                    ...f,
                    priceSort: priceSort as CatalogFilters["priceSort"],
                  }))
                }
                options={[
                  { value: "price-asc", label: "Price: low to high" },
                  { value: "price-desc", label: "Price: high to low" },
                ]}
                emptyLabel="Default order"
              />
            </div>
          ) : null}

          {(filterCount > 0 || hasSearch) && !loading ? (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {hasSearch ? `Search: “${applied.search.trim()}”` : null}
              {hasSearch && filterCount > 0 ? " · " : null}
              {filterCount > 0 ? `${filterCount} filter${filterCount === 1 ? "" : "s"} active` : null}
              {" · "}
              <button
                type="button"
                className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                onClick={() => {
                  const next = emptyFilters();
                  setFilters(next);
                  setApplied(next);
                }}
              >
                Clear filters
              </button>
            </p>
          ) : null}

          {loading && items.length === 0 ? (
            <p className="mt-6 flex items-center gap-2 border-t border-gray-200 pt-6 text-sm text-gray-500 dark:border-gray-800">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading catalogs…
            </p>
          ) : error ? (
            <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-800">
              <ListError message={error} onRetry={() => void load()} />
            </div>
          ) : items.length === 0 ? (
            <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-800">
              <SetupEmptyState
                icon={Library}
                title={
                  hasSearch || filterCount > 0
                    ? "No catalogs match your filters."
                    : "No service catalogs yet."
                }
                description={
                  hasSearch || filterCount > 0
                    ? "Try a different search or clear filters."
                    : "Create a catalog from a service category."
                }
                variant="inline"
              />
            </div>
          ) : (
            <div className={`mt-6 border-t border-gray-200 pt-6 dark:border-gray-800 ${setupListTableSectionClass}`}>
              <Table className={setupTableClass}>
                <TableHeader>
                  <TableRow>
                    {[
                      { label: "Category", className: "w-[22%]" },
                      { label: "Catalog", className: "w-[28%]" },
                      { label: "Recurrence", className: "w-[22%]" },
                      { label: "Pricing", className: "w-[20%]" },
                      { label: "", className: "w-[8%] text-right" },
                    ].map((h) => (
                      <TableCell
                        key={h.label || "actions"}
                        isHeader
                        className={`${setupListThClass} ${h.className}`}
                      >
                        {h.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((c) => (
                    <TableRow key={c.id} className={setupTableRowClass}>
                      <TableCell className={`${setupListTdClass} text-gray-600 dark:text-gray-400`}>
                        {c.categoryName}
                      </TableCell>
                      <TableCell className={`${setupListTdClass} font-medium`}>
                        {c.name}
                      </TableCell>
                      <TableCell className={`${setupListTdClass} text-xs`}>
                        {formatCatalogRecurrence(c)}
                      </TableCell>
                      <TableCell className={setupListTdClass}>
                        {formatPricing(c.pricing)}
                      </TableCell>
                      <TableCell className={`${setupListTdClass} text-right`}>
                        <SetupRowActions>
                          <SetupRowActionLink
                            href={`/setup/service-catalogs/${c.id}`}
                            title="Open catalog"
                          />
                        </SetupRowActions>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {!canEdit ? (
        <p className="text-sm text-gray-500">
          Sign in with an active account to create catalogs.
        </p>
      ) : null}

      <CatalogFormModal
        open={modalOpen}
        companyId={companyId}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          void load();
        }}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  emptyLabel = "All",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  emptyLabel?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <select
        className={selectClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{emptyLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ListError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div>
      <p className="text-sm text-error-600">{message}</p>
      <Button className="mt-2" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
