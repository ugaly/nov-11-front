"use client";

import { getApiErrorMessage } from "@/api/errors";
import {
  createEngagement,
  getServiceCatalog,
  listCustomerEngagements,
  listCustomers,
  listServiceCatalogs,
  listServiceCategories,
  suggestEngagementPeriods,
} from "@/api/template-config/template-config.api";
import type {
  CustomerEngagementResponse,
  CustomerListItemResponse,
  PeriodSuggestionDto,
  ServiceCatalogNodeResponse,
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
  formatNodeRecurrence,
  nodeRecurrenceType,
  recurrenceHint,
} from "@/lib/template-recurrence";
import { useEffect, useMemo, useState } from "react";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

type PeriodDraft = {
  label: string;
  periodStart: string;
  periodEnd: string | null;
  sortOrder: number;
};

function pickDefaultCategory(
  categories: ServiceCategoryResponse[]
): ServiceCategoryResponse | undefined {
  return (
    categories.find((c) => (c.catalogs?.length ?? 0) > 0) ?? categories[0]
  );
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

function rootGroupNodes(
  nodes: ServiceCatalogNodeResponse[] | undefined
): ServiceCatalogNodeResponse[] {
  return (nodes ?? []).filter((n) => n.nodeType === "GROUP");
}

function toPeriodDrafts(suggestions: PeriodSuggestionDto[]): PeriodDraft[] {
  return suggestions.map((s) => ({
    label: s.label,
    periodStart: s.periodStart,
    periodEnd: s.periodEnd,
    sortOrder: s.sortOrder,
  }));
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
  const [catalogDetail, setCatalogDetail] = useState<ServiceCatalogResponse | null>(
    null
  );
  const [selectedRootIds, setSelectedRootIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [periodDrafts, setPeriodDrafts] = useState<PeriodDraft[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
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

  const rootGroups = useMemo(
    () => rootGroupNodes(catalogDetail?.nodes),
    [catalogDetail?.nodes]
  );

  const selectedRoots = rootGroups.filter((n) => selectedRootIds.includes(n.id));
  const recurringSelected = selectedRoots.filter(
    (n) => nodeRecurrenceType(n) !== "ONE_OFF"
  );
  const configurePeriodsAtCreate =
    selectedRoots.length === 1 && recurringSelected.length === 1;
  const singleRecurringRoot = configurePeriodsAtCreate
    ? recurringSelected[0]
    : undefined;
  const recurrenceType = singleRecurringRoot
    ? nodeRecurrenceType(singleRecurringRoot)
    : "ONE_OFF";
  const isRecurring = configurePeriodsAtCreate;
  const needsPeriodStart = engagementRequiresPeriodStart(
    configurePeriodsAtCreate ? recurrenceType : "ONE_OFF"
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
      setPeriodDrafts([]);
      setCatalogDetail(null);
      setSelectedRootIds([]);
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

  useEffect(() => {
    if (!open || !catalogId || !companyId) {
      setCatalogDetail(null);
      setSelectedRootIds([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const detail = await getServiceCatalog(companyId, catalogId);
        if (!cancelled) {
          setCatalogDetail(detail);
          const roots = rootGroupNodes(detail.nodes);
          setSelectedRootIds((prev) => {
            const stillValid = prev.filter((id) =>
              roots.some((n) => n.id === id)
            );
            return stillValid.length > 0
              ? stillValid
              : roots.map((n) => n.id);
          });
        }
      } catch {
        if (!cancelled) {
          setCatalogDetail(null);
          setSelectedRootIds([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, catalogId, companyId]);

  useEffect(() => {
    if (!open || !companyId || !catalogId || !singleRecurringRoot) {
      setPeriodDrafts([]);
      return;
    }
    if (!isRecurring) {
      setPeriodDrafts([]);
      return;
    }
    if (needsPeriodStart && !periodStart.trim()) {
      setPeriodDrafts([]);
      return;
    }
    let cancelled = false;
    setLoadingPeriods(true);
    void (async () => {
      try {
        const suggestions = await suggestEngagementPeriods(
          companyId,
          catalogId,
          singleRecurringRoot.id,
          { periodStart: periodStart.trim() || undefined }
        );
        if (!cancelled) {
          setPeriodDrafts(toPeriodDrafts(suggestions));
        }
      } catch {
        if (!cancelled) setPeriodDrafts([]);
      } finally {
        if (!cancelled) setLoadingPeriods(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    open,
    companyId,
    catalogId,
    singleRecurringRoot?.id,
    isRecurring,
    needsPeriodStart,
    periodStart,
  ]);

  function toggleRoot(id: string) {
    setSelectedRootIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function updatePeriodLabel(index: number, label: string) {
    setPeriodDrafts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, label } : p))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const resolvedCustomerId = fixedCustomerId ?? customerId;
    if (!resolvedCustomerId || !categoryId || !catalogId || !title.trim()) {
      setError("Category, catalog, and title are required.");
      return;
    }
    if (selectedRootIds.length === 0) {
      setError("Select at least one root service group.");
      return;
    }
    if (configurePeriodsAtCreate && needsPeriodStart && !periodStart.trim()) {
      setError("Cycle anchor is required for the recurring group.");
      return;
    }
    if (excludedCatalogIds.has(catalogId)) {
      setError("This customer already has an engagement for that service catalog.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const useMultiRoot = rootGroups.length > 1;
      const created = await createEngagement(companyId, {
        customerId: resolvedCustomerId,
        catalogId,
        catalogEntryNodeId:
          !useMultiRoot && selectedRootIds.length === 1
            ? selectedRootIds[0]
            : undefined,
        includedRootNodeIds: useMultiRoot ? selectedRootIds : undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        periodStart: periodStart.trim() || undefined,
        periodEnd: !configurePeriodsAtCreate
          ? periodEnd.trim() || undefined
          : undefined,
        periods:
          configurePeriodsAtCreate && periodDrafts.length > 0
          ? periodDrafts.map((p) => ({
              catalogNodeId: singleRecurringRoot!.id,
              label: p.label.trim() || p.periodStart,
              periodStart: p.periodStart,
              periodEnd: p.periodEnd,
              sortOrder: p.sortOrder,
            }))
          : undefined,
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
        Reference number is assigned automatically. Select which root groups to
        include; configure recurring period tabs when you open the engagement
        (or now if only one recurring group is selected).
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
            disabled={loadingAssignments || categoryOptions.length === 0}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categoryOptions.length === 0 ? (
              <option value="">
                {loadingAssignments ? "Loading…" : "No service categories"}
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
        </div>

        {rootGroups.length > 0 ? (
          <div className="space-y-2">
            <Label>Root service groups *</Label>
            <p className="text-xs text-gray-500">
              Include one-off and recurring groups together. Period tabs for
              recurring groups can be set when you open the engagement.
            </p>
            <div className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              {rootGroups.map((n) => {
                const type = nodeRecurrenceType(n);
                const checked = selectedRootIds.includes(n.id);
                return (
                  <label
                    key={n.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-900/40"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRoot(n.id)}
                      className="mt-1 size-4 rounded border-gray-300"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-gray-800 dark:text-white/90">
                        {n.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatNodeRecurrence(n)}
                        {type === "ONE_OFF"
                          ? " · work uses catalog default forms"
                          : ` · ${recurrenceHint(type)}`}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            {recurringSelected.length > 1 ? (
              <p className="text-xs text-brand-600 dark:text-brand-400">
                Multiple recurring groups selected — configure each group&apos;s
                period tabs after creating the engagement.
              </p>
            ) : null}
          </div>
        ) : catalogId ? (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            This catalog has no root GROUP nodes yet. Add one in the catalog
            structure with recurrence configured.
          </p>
        ) : null}

        <DatePicker
          id="engagement-period-start"
          label={`Cycle anchor${needsPeriodStart ? " *" : ""}`}
          placeholder="Select start date"
          value={periodStart}
          onValueChange={setPeriodStart}
        />

        {!isRecurring ? (
          <div>
            <DatePicker
              id="engagement-period-end"
              label="Period end"
              placeholder="Select end date"
              value={periodEnd}
              onValueChange={setPeriodEnd}
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional for one-off engagements (defaults to today).
            </p>
          </div>
        ) : null}

        {configurePeriodsAtCreate ? (
          <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Period tabs (optional now)
            </p>
            <p className="text-xs text-gray-500">
              Only one recurring group is selected — name each cycle now, or
              skip and configure when you open the engagement.
            </p>
            {loadingPeriods ? (
              <p className="text-xs text-gray-500">Generating periods…</p>
            ) : periodDrafts.length === 0 ? (
              <p className="text-xs text-gray-500">
                Set a cycle anchor date to generate period tabs.
              </p>
            ) : (
              <div className="space-y-2">
                {periodDrafts.map((p, index) => (
                  <div
                    key={`${p.sortOrder}-${p.periodStart}`}
                    className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40"
                  >
                    <span className="min-w-[4.5rem] text-xs font-medium text-gray-500">
                      Tab {index + 1}
                    </span>
                    <Input
                      value={p.label}
                      onChange={(e) => updatePeriodLabel(index, e.target.value)}
                      placeholder="e.g. January 2026"
                      className="min-w-[10rem] flex-1"
                    />
                    <span className="text-xs text-gray-500">
                      {p.periodEnd
                        ? `${p.periodStart} → ${p.periodEnd}`
                        : p.periodStart}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

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
              selectedRootIds.length === 0 ||
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
