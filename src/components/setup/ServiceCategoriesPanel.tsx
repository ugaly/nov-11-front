"use client";

import { getApiErrorMessage } from "@/api/errors";
import {
  createServiceCategory,
  deleteServiceCategory,
  listServiceCategories,
} from "@/api/template-config/template-config.api";
import type {
  CreateServiceCategoryRequest,
  ServiceCatalogResponse,
  ServiceCategoryResponse,
} from "@/api/types/template-config";
import DeactivateConfirmModal from "@/components/setup/DeactivateConfirmModal";
import SetupEmptyState from "@/components/setup/SetupEmptyState";
import ExportListMenu from "@/components/setup/ExportListMenu";
import PricingFields from "@/components/setup/PricingFields";
import {
  SetupRowActionDeactivate,
  SetupRowActionLink,
  SetupRowActions,
} from "@/components/setup/SetupRowActions";
import { setupFormModalClass } from "@/components/setup/setupFormModal";
import {
  setupListTableSectionClass,
  setupListTdClass,
  setupListThClass,
  setupTableClass,
  setupRowIconBtnClass,
  setupTableRowClass,
} from "@/components/setup/setup-table-styles";
import SetupPageShell from "@/components/setup/SetupPageShell";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useTemplateOptions } from "@/hooks/useTemplateOptions";
import {
  exportServiceCategoriesExcel,
  exportServiceCategoriesPdf,
} from "@/lib/export/service-categories-export";
import { canManageSetup } from "@/lib/is-admin";
import {
  appendPricingFields,
  emptyPricingForm,
  formatPricing,
  type PricingFormState,
} from "@/lib/template-pricing";
import { formatCatalogRecurrence } from "@/lib/template-recurrence";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  FolderTree,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";

export default function ServiceCategoriesPanel() {
  const canEdit = canManageSetup();
  return (
    <SetupPageShell
      title="Service categories"
      description="Top-level groupings for service catalogs (e.g. secretarial services)."
    >
      {({ companyId }) => (
        <CategoryList companyId={companyId} canEdit={canEdit} />
      )}
    </SetupPageShell>
  );
}

function CategoryList({
  companyId,
  canEdit,
}: {
  companyId: string;
  canEdit: boolean;
}) {
  const { companyName } = useCompanyContext();
  const [items, setItems] = useState<ServiceCategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deactivateTarget, setDeactivateTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setAppliedSearch(search), 400);
    return () => window.clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listServiceCategories(companyId, {
        search: appliedSearch.trim() || undefined,
      });
      setItems(list);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load categories."));
    } finally {
      setLoading(false);
    }
  }, [companyId, appliedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalCatalogs = items.reduce(
    (n, c) => n + (c.catalogs?.length ?? 0),
    0
  );

  function toggleExpanded(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function confirmDeactivate() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await deleteServiceCategory(companyId, deactivateTarget.id);
      setDeactivateTarget(null);
      await load();
    } catch (err) {
      alert(getApiErrorMessage(err, "Could not deactivate category."));
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-brand-50/40 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-brand-950/20">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200/80 px-5 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/25">
              <Layers className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Service categories
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {loading
                  ? "Loading…"
                  : `${items.length} categor${items.length === 1 ? "y" : "ies"} · ${totalCatalogs} catalog${totalCatalogs === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ExportListMenu
              disabled={loading || items.length === 0}
              onExportPdf={() =>
                exportServiceCategoriesPdf(
                  companyName ?? "Company",
                  items
                )
              }
              onExportExcel={() =>
                exportServiceCategoriesExcel(
                  companyName ?? "Company",
                  items
                )
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
                Add category
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category name…"
              className="h-11 w-full rounded-xl border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>

          {loading && items.length === 0 ? (
            <p className="mt-6 flex items-center gap-2 border-t border-gray-200 pt-6 text-sm text-gray-500 dark:border-gray-800">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading categories…
            </p>
          ) : error ? (
            <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-800">
              <ListError message={error} onRetry={() => void load()} />
            </div>
          ) : items.length === 0 ? (
            <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-800">
              <SetupEmptyState
                icon={Layers}
                title={
                  appliedSearch.trim()
                    ? "No categories match your search."
                    : "No categories yet."
                }
                description={
                  canEdit && !appliedSearch.trim()
                    ? "Add a category to start building templates."
                    : undefined
                }
                variant="inline"
              />
            </div>
          ) : (
            <div className={setupListTableSectionClass}>
              <Table className={setupTableClass}>
                <TableHeader>
                  <TableRow>
                    {[
                      { label: "", className: "w-[3%]" },
                      { label: "Category", className: "w-[36%]" },
                      { label: "Pricing", className: "w-[22%]" },
                      { label: "Catalogs", className: "w-[12%]" },
                      { label: "", className: "w-[12%] text-right" },
                    ].map((h) => (
                      <TableCell
                        key={h.label || "expand"}
                        isHeader
                        className={`${setupListThClass} ${h.className}`}
                      >
                        {h.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((category) => (
                    <CategoryTableRows
                      key={category.id}
                      category={category}
                      companyId={companyId}
                      canEdit={canEdit}
                      expanded={expanded[category.id] === true}
                      onToggle={() => toggleExpanded(category.id)}
                      onRequestDeactivate={(id, name) =>
                        setDeactivateTarget({ id, name })
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <DeactivateConfirmModal
        open={deactivateTarget != null}
        title="Deactivate category?"
        description="This deactivates the category and all catalogs and nodes under it. You can’t undo this from the app."
        itemName={deactivateTarget?.name}
        loading={deactivating}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => void confirmDeactivate()}
      />

      <CategoryFormModal
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

function CategoryTableRows({
  category,
  companyId,
  canEdit,
  expanded,
  onToggle,
  onRequestDeactivate,
}: {
  category: ServiceCategoryResponse;
  companyId: string;
  canEdit: boolean;
  expanded: boolean;
  onToggle: () => void;
  onRequestDeactivate: (id: string, name: string) => void;
}) {
  const catalogs = category.catalogs ?? [];
  const hasCatalogs = catalogs.length > 0;

  return (
    <>
      <TableRow className={`group ${setupTableRowClass}`}>
        <TableCell className={setupListTdClass}>
          <button
            type="button"
            onClick={onToggle}
            disabled={!hasCatalogs}
            className={`flex size-8 items-center justify-center rounded-lg transition-colors ${
              hasCatalogs
                ? "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                : "cursor-default text-gray-300 dark:text-gray-600"
            }`}
            aria-expanded={expanded}
            aria-label={
              hasCatalogs
                ? expanded
                  ? "Collapse catalogs"
                  : "Expand catalogs"
                : "No catalogs"
            }
          >
            {hasCatalogs ? (
              expanded ? (
                <ChevronDown className="size-4" aria-hidden />
              ) : (
                <ChevronRight className="size-4" aria-hidden />
              )
            ) : (
              <span className="size-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
            )}
          </button>
        </TableCell>
        <TableCell className={`${setupListTdClass} font-medium`}>
          <button
            type="button"
            onClick={hasCatalogs ? onToggle : undefined}
            className={`text-left ${hasCatalogs ? "hover:text-brand-600 dark:hover:text-brand-400" : ""}`}
          >
            {category.name}
          </button>
        </TableCell>
        <TableCell className={`${setupListTdClass} text-gray-600 dark:text-gray-400`}>
          {formatPricing(category.pricing)}
        </TableCell>
        <TableCell className={setupListTdClass}>
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {catalogs.length}
          </span>
        </TableCell>
        <TableCell className={`${setupListTdClass} whitespace-nowrap text-right`}>
          <SetupRowActions>
            <SetupRowActionLink
              href={`/setup/service-categories/${category.id}`}
              title="Open category"
            />
            {canEdit ? (
              <SetupRowActionDeactivate
                title="Deactivate category"
                onClick={() =>
                  onRequestDeactivate(category.id, category.name)
                }
              />
            ) : null}
          </SetupRowActions>
        </TableCell>
      </TableRow>

      {expanded && hasCatalogs ? (
        <tr className="bg-gray-50/80 dark:bg-gray-900/40">
          <td
            colSpan={5}
            className="border-b border-r-0 border-gray-200 p-0 dark:border-gray-700"
          >
            <CatalogNestedTable catalogs={catalogs} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function CatalogNestedTable({
  catalogs,
}: {
  catalogs: ServiceCatalogResponse[];
}) {
  return (
    <div className="border-t border-gray-200/80 px-3 py-3 dark:border-gray-700">
      <p className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        <FolderTree className="size-3.5" aria-hidden />
        Catalogs in this category
      </p>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/30">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50/90 text-left text-xs font-semibold text-gray-600 dark:bg-gray-900/60 dark:text-gray-400">
              <th className="border-b border-r border-gray-200 px-3 py-2 dark:border-gray-700">
                Catalog
              </th>
              <th className="border-b border-r border-gray-200 px-3 py-2 dark:border-gray-700">
                Recurrence
              </th>
              <th className="border-b border-r border-gray-200 px-3 py-2 dark:border-gray-700">
                Pricing
              </th>
              <th className="border-b border-gray-200 px-3 py-2 text-right dark:border-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {catalogs.map((catalog) => (
              <tr
                key={catalog.id}
                className="transition-colors hover:bg-brand-50/30 dark:hover:bg-brand-950/15"
              >
                <td className="border-b border-r border-gray-200 px-3 py-2 font-medium dark:border-gray-700">
                  {catalog.name}
                </td>
                <td className="border-b border-r border-gray-200 px-3 py-2 text-xs dark:border-gray-700">
                  {formatCatalogRecurrence(catalog)}
                </td>
                <td className="border-b border-r border-gray-200 px-3 py-2 text-gray-600 dark:border-gray-700 dark:text-gray-400">
                  {formatPricing(catalog.pricing)}
                </td>
                <td className="border-b border-gray-200 px-3 py-2 text-right dark:border-gray-700">
                  <Link
                    href={`/setup/service-catalogs/${catalog.id}`}
                    className={setupRowIconBtnClass}
                    title="Open catalog"
                  >
                    <Eye className="size-3.5" aria-hidden />
                    <span className="sr-only">Open catalog</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

function CategoryFormModal({
  open,
  companyId,
  onClose,
  onCreated,
}: {
  open: boolean;
  companyId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { currencies, timelineUnits } = useTemplateOptions(companyId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("10");
  const [pricing, setPricing] = useState<PricingFormState>(emptyPricingForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setSortOrder("10");
      setPricing(emptyPricingForm());
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    const body = appendPricingFields<CreateServiceCategoryRequest>(
      {
        name: trimmed,
        description: description.trim() || undefined,
        sortOrder: Number.parseInt(sortOrder, 10) || undefined,
      },
      pricing
    );
    setSubmitting(true);
    setError(null);
    try {
      await createServiceCategory(companyId, body);
      onCreated();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create category."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} className={setupFormModalClass}>
      <h3 className="text-lg font-semibold">New service category</h3>
      <p className="mt-1 text-xs text-gray-500">
        Code is generated automatically from the name.
      </p>
      <form className="mt-4 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
        {error ? <p className="text-sm text-error-600">{error}</p> : null}
        <div>
          <Label>Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <Label>Sort order</Label>
          <Input
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <PricingFields
          value={pricing}
          onChange={setPricing}
          currencies={currencies}
          timelineUnits={timelineUnits}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Saving…" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
