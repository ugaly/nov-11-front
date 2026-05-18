"use client";

import { getApiErrorMessage } from "@/api/errors";
import {
  createEngagement,
  listCustomerEngagements,
  listCustomers,
  listServiceCatalogs,
  listServiceCategories,
} from "@/api/template-config/template-config.api";
import type {
  CustomerEngagementResponse,
  CustomerListItemResponse,
  ServiceCatalogResponse,
  ServiceCategoryResponse,
} from "@/api/types/template-config";
import { setupFormModalClass } from "@/components/setup/setupFormModal";
import DatePicker from "@/components/form/date-picker";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import {
  engagementRequiresPeriodStart,
  recurrenceHint,
} from "@/lib/template-recurrence";
import { useEffect, useMemo, useState } from "react";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

function pickDefaultCategory(
  categories: ServiceCategoryResponse[]
): ServiceCategoryResponse | undefined {
  return (
    categories.find((c) => (c.catalogs?.length ?? 0) > 0) ?? categories[0]
  );
}

function pickDefaultCatalog(
  category: ServiceCategoryResponse | undefined
): string {
  return category?.catalogs?.[0]?.id ?? "";
}

function mergeCatalogsIntoCategories(
  categories: ServiceCategoryResponse[],
  allCatalogs: ServiceCatalogResponse[]
): ServiceCategoryResponse[] {
  const byCategory = new Map<string, ServiceCatalogResponse[]>();
  for (const catalog of allCatalogs) {
    const list = byCategory.get(catalog.categoryId) ?? [];
    list.push(catalog);
    byCategory.set(catalog.categoryId, list);
  }
  return categories.map((cat) => ({
    ...cat,
    catalogs:
      (cat.catalogs?.length ?? 0) > 0
        ? cat.catalogs!
        : (byCategory.get(cat.id) ?? []),
  }));
}

function countAvailableCatalogs(
  catalogs: ServiceCatalogResponse[] | undefined,
  excludedCatalogIds: Set<string>
): number {
  return (catalogs ?? []).filter((c) => !excludedCatalogIds.has(c.id)).length;
}

export default function EngagementFormModal({
  open,
  companyId,
  onClose,
  onCreated,
  fixedCustomerId,
  fixedCustomerName,
}: {
  open: boolean;
  companyId: string;
  onClose: () => void;
  onCreated: (engagement: CustomerEngagementResponse) => void;
  fixedCustomerId?: string;
  fixedCustomerName?: string;
}) {
  const [customers, setCustomers] = useState<CustomerListItemResponse[]>([]);
  const [categories, setCategories] = useState<ServiceCategoryResponse[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [catalogId, setCatalogId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignedCatalogIds, setAssignedCatalogIds] = useState<string[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const resolvedCustomerId = fixedCustomerId ?? customerId;

  const excludedCatalogIds = useMemo(
    () => new Set(assignedCatalogIds),
    [assignedCatalogIds]
  );

  const categoryOptions = useMemo(
    () => categories.filter((c) => c.active !== false),
    [categories]
  );

  const selectedCategory = categoryOptions.find((c) => c.id === categoryId);
  const catalogsInCategory = useMemo(
    () =>
      (selectedCategory?.catalogs ?? []).filter(
        (c) => !excludedCatalogIds.has(c.id)
      ),
    [selectedCategory, excludedCatalogIds]
  );

  const hasAssignableCatalog = useMemo(() => {
    for (const cat of categories) {
      if (countAvailableCatalogs(cat.catalogs, excludedCatalogIds) > 0) {
        return true;
      }
    }
    return false;
  }, [categories, excludedCatalogIds]);
  const selectedCatalog = catalogsInCategory.find((c) => c.id === catalogId);
  const needsPeriodStart = engagementRequiresPeriodStart(
    selectedCatalog?.recurrenceType
  );

  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const [categoryList, catalogList] = await Promise.all([
          listServiceCategories(companyId),
          listServiceCatalogs(companyId),
        ]);
        setCategories(mergeCatalogsIntoCategories(categoryList, catalogList));

        if (fixedCustomerId) {
          setCustomerId(fixedCustomerId);
        } else {
          const c = await listCustomers(companyId);
          setCustomers(c);
          if (c[0]) setCustomerId(c[0].id);
        }
      } catch {
        setError("Could not load form options.");
      }
    })();
  }, [open, companyId, fixedCustomerId]);

  useEffect(() => {
    if (!open || !resolvedCustomerId) {
      setAssignedCatalogIds([]);
      return;
    }
    let cancelled = false;
    setLoadingAssignments(true);
    void (async () => {
      try {
        const existing = await listCustomerEngagements(
          companyId,
          resolvedCustomerId
        );
        if (!cancelled) {
          setAssignedCatalogIds(existing.map((e) => e.catalogId));
        }
      } catch {
        if (!cancelled) setAssignedCatalogIds([]);
      } finally {
        if (!cancelled) setLoadingAssignments(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, companyId, resolvedCustomerId]);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setPeriodStart("");
      setPeriodEnd("");
      setError(null);
      setAssignedCatalogIds([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open || categories.length === 0 || loadingAssignments) return;

    const defaultCategory = pickDefaultCategory(categoryOptions);
    if (!defaultCategory) {
      setCategoryId("");
      setCatalogId("");
      return;
    }

    setCategoryId((prev) => {
      const categoryStillValid = categoryOptions.some((c) => c.id === prev);
      const nextCategoryId = categoryStillValid ? prev : defaultCategory.id;
      const cat =
        categoryOptions.find((c) => c.id === nextCategoryId) ?? defaultCategory;
      const list = (cat.catalogs ?? []).filter(
        (c) => !excludedCatalogIds.has(c.id)
      );
      setCatalogId((prevCatalog) =>
        list.some((c) => c.id === prevCatalog) ? prevCatalog : list[0]?.id ?? ""
      );
      return nextCategoryId;
    });
  }, [open, categories, categoryOptions, excludedCatalogIds, loadingAssignments]);

  useEffect(() => {
    if (!categoryId || !open || loadingAssignments) return;
    const cat = categoryOptions.find((c) => c.id === categoryId);
    const list = (cat?.catalogs ?? []).filter(
      (c) => !excludedCatalogIds.has(c.id)
    );
    setCatalogId((prev) =>
      list.some((c) => c.id === prev) ? prev : list[0]?.id ?? ""
    );
  }, [categoryId, categoryOptions, excludedCatalogIds, open, loadingAssignments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const resolvedCustomerId = fixedCustomerId ?? customerId;
    if (!resolvedCustomerId || !categoryId || !catalogId || !title.trim()) {
      setError("Category, catalog, and title are required.");
      return;
    }
    if (needsPeriodStart && !periodStart.trim()) {
      setError("Period start is required for this catalog’s recurrence.");
      return;
    }
    if (excludedCatalogIds.has(catalogId)) {
      setError("This customer already has an engagement for that service catalog.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await createEngagement(companyId, {
        customerId: resolvedCustomerId,
        catalogId,
        title: title.trim(),
        description: description.trim() || undefined,
        periodStart: periodStart.trim() || undefined,
        periodEnd: periodEnd.trim() || undefined,
      });
      onCreated(created);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create engagement."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} className={setupFormModalClass}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        New engagement
      </h3>
      <p className="mt-1 text-xs text-gray-500">
        Reference number is assigned automatically when saved.
      </p>
      <form className="mt-4 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
        {error ? <p className="text-sm text-error-600">{error}</p> : null}

        {fixedCustomerId ? (
          <div>
            <Label>Customer</Label>
            <p className="mt-1.5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-800 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white/90">
              {fixedCustomerName ?? "This customer"}
            </p>
          </div>
        ) : (
          <div>
            <Label>Customer *</Label>
            <select
              className={selectClass}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {loadingAssignments ? (
          <p className="text-xs text-gray-500">Checking existing engagements…</p>
        ) : null}

        {!loadingAssignments && !hasAssignableCatalog ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            This customer already has an engagement for every available service
            catalog.
          </p>
        ) : null}

        <div>
          <Label>Service category *</Label>
          <select
            className={selectClass}
            value={categoryId}
            disabled={
              loadingAssignments || categoryOptions.length === 0
            }
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categoryOptions.length === 0 ? (
              <option value="">
                {loadingAssignments
                  ? "Loading…"
                  : "No service categories"}
              </option>
            ) : (
              categoryOptions.map((c) => {
                const available = countAvailableCatalogs(
                  c.catalogs,
                  excludedCatalogIds
                );
                const total = c.catalogs?.length ?? 0;
                return (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {total > 0
                      ? ` (${available} of ${total} catalog${total === 1 ? "" : "s"} available)`
                      : ""}
                  </option>
                );
              })
            )}
          </select>
        </div>

        <div>
          <Label>Service catalog *</Label>
          <select
            className={selectClass}
            value={catalogId}
            disabled={
              loadingAssignments ||
              !categoryId ||
              catalogsInCategory.length === 0
            }
            onChange={(e) => setCatalogId(e.target.value)}
          >
            {catalogsInCategory.length === 0 ? (
              <option value="">
                {categoryId
                  ? "No more catalogs in this category for this customer"
                  : "Select a category first"}
              </option>
            ) : (
              catalogsInCategory.map((c: ServiceCatalogResponse) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            )}
          </select>
          {selectedCatalog?.recurrenceType ? (
            <p className="mt-1 text-xs text-gray-500">
              {recurrenceHint(selectedCatalog.recurrenceType)}
            </p>
          ) : null}
        </div>

        <DatePicker
          id="engagement-period-start"
          label={`Period start${needsPeriodStart ? " *" : ""}`}
          placeholder="Select start date"
          value={periodStart}
          onValueChange={setPeriodStart}
        />
        <div>
          <DatePicker
            id="engagement-period-end"
            label="Period end"
            placeholder="Select end date"
            value={periodEnd}
            onValueChange={setPeriodEnd}
          />
          <p className="mt-1 text-xs text-gray-500">
            Optional for annual catalogs (server sets end = start + 12 months).
          </p>
        </div>
        <div>
          <Label>Title *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={
              submitting ||
              loadingAssignments ||
              !categoryId ||
              !catalogId ||
              catalogsInCategory.length === 0 ||
              !hasAssignableCatalog
            }
          >
            {submitting ? "Creating…" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
