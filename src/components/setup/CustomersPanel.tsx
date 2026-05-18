"use client";

import { getApiErrorMessage } from "@/api/errors";
import { listOffices } from "@/api/organization/organization.api";
import {
  createCustomer,
  deleteCustomer,
  listCustomersPaginated,
  listServiceCatalogs,
  listServiceCategories,
} from "@/api/template-config/template-config.api";
import type {
  CustomerListItemResponse,
  CustomerPageSize,
  EngagementStatus,
  PageResponse,
  ServiceCatalogResponse,
  ServiceCategoryResponse,
} from "@/api/types/template-config";
import type { OfficeResponse } from "@/api/types/organization";
import CategoriesCell from "@/components/setup/CategoriesCell";
import DeactivateConfirmModal from "@/components/setup/DeactivateConfirmModal";
import {
  SetupRowActionDeactivate,
  SetupRowActionLink,
  SetupRowActions,
} from "@/components/setup/SetupRowActions";
import SetupPageShell from "@/components/setup/SetupPageShell";
import { setupFormModalClass } from "@/components/setup/setupFormModal";
import {
  setupListTableSectionClass,
  setupListTdClass,
  setupListThClass,
  setupTableClass,
  setupTableRowClass,
} from "@/components/setup/setup-table-styles";
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
import { getAccessToken } from "@/lib/auth-storage";
import { formatMoneyTotals } from "@/lib/format-money";
import { canManageSetup } from "@/lib/is-admin";
import {
  SetupAvatar,
  SetupContactLine,
} from "@/components/setup/setup-pro-ui";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";

const PAGE_SIZES: CustomerPageSize[] = [50, 100, 200];

const ENGAGEMENT_STATUSES: EngagementStatus[] = [
  "DRAFT",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
];

const selectClass =
  "h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function CustomersPanel() {
  const canEdit = canManageSetup();
  return (
    <SetupPageShell
      title="Customers"
      description="Clients, engagements, and catalog assignments."
    >
      {({ companyId }) => (
        <CustomerList companyId={companyId} canEdit={canEdit} />
      )}
    </SetupPageShell>
  );
}

type FiltersState = {
  search: string;
  categoryId: string;
  catalogId: string;
  officeId: string;
  engagementStatus: string;
  hasEngagements: string;
  city: string;
  country: string;
  size: CustomerPageSize;
};

function countActiveFilters(f: FiltersState): number {
  let n = 0;
  if (f.categoryId) n++;
  if (f.catalogId) n++;
  if (f.officeId) n++;
  if (f.engagementStatus) n++;
  if (f.hasEngagements) n++;
  if (f.city.trim()) n++;
  if (f.country.trim()) n++;
  return n;
}

const emptyFilters = (): FiltersState => ({
  search: "",
  categoryId: "",
  catalogId: "",
  officeId: "",
  engagementStatus: "",
  hasEngagements: "",
  city: "",
  country: "",
  size: 50,
});

function CustomerList({
  companyId,
  canEdit,
}: {
  companyId: string;
  canEdit: boolean;
}) {
  const [filters, setFilters] = useState<FiltersState>(emptyFilters);
  const [applied, setApplied] = useState<FiltersState>(emptyFilters);
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<CustomerListItemResponse> | null>(
    null
  );
  const [categories, setCategories] = useState<ServiceCategoryResponse[]>([]);
  const [catalogs, setCatalogs] = useState<ServiceCatalogResponse[]>([]);
  const [offices, setOffices] = useState<OfficeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [cats, catsLogs] = await Promise.all([
          listServiceCategories(companyId),
          listServiceCatalogs(companyId),
        ]);
        setCategories(cats);
        setCatalogs(catsLogs);
        const token = getAccessToken();
        if (token) {
          const off = await listOffices(token, companyId);
          setOffices(off);
        }
      } catch {
        /* filter options optional */
      }
    })();
  }, [companyId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listCustomersPaginated(companyId, {
        page,
        size: applied.size,
        search: applied.search.trim() || undefined,
        categoryId: applied.categoryId || undefined,
        catalogId: applied.catalogId || undefined,
        officeId: applied.officeId || undefined,
        engagementStatus:
          (applied.engagementStatus as EngagementStatus) || undefined,
        hasEngagements:
          applied.hasEngagements === ""
            ? undefined
            : applied.hasEngagements === "true",
        city: applied.city.trim() || undefined,
        country: applied.country.trim() || undefined,
      });
      setData(result);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load customers."));
    } finally {
      setLoading(false);
    }
  }, [companyId, page, applied]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setApplied((prev) =>
        prev.search === filters.search ? prev : { ...prev, search: filters.search }
      );
      setPage(0);
    }, 400);
    return () => window.clearTimeout(t);
  }, [filters.search]);

  function applyFilters() {
    setApplied({ ...filters });
    setPage(0);
  }

  function resetFilters() {
    const next = emptyFilters();
    setFilters(next);
    setApplied(next);
    setPage(0);
  }

  const items = data?.content ?? [];
  const rangeStart = data && data.totalElements > 0 ? data.page * data.size + 1 : 0;
  const rangeEnd = data
    ? Math.min((data.page + 1) * data.size, data.totalElements)
    : 0;
  const activeFilterCount = countActiveFilters(applied);

  async function confirmDeactivateCustomer() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await deleteCustomer(companyId, deactivateTarget.id);
      setDeactivateTarget(null);
      await load();
    } catch (err) {
      alert(getApiErrorMessage(err, "Could not deactivate customer."));
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar header */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-brand-50/40 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-brand-950/20">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200/80 px-5 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/25">
              <Users className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Customer directory
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {data
                  ? `${data.totalElements.toLocaleString()} customer${data.totalElements === 1 ? "" : "s"}`
                  : "Search and filter your client base"}
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
              All filters
              {activeFilterCount > 0 ? (
                <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
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
                Add customer
              </Button>
            ) : null}
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative min-w-0 flex-1">
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
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                placeholder="Search name, phone, email, TIN…"
                className="h-11 w-full rounded-xl border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
            {data ? (
              <p className="shrink-0 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                Showing{" "}
                <span className="font-semibold text-gray-800 dark:text-white">
                  {rangeStart > 0 ? `${rangeStart}–${rangeEnd}` : "0"}
                </span>{" "}
                of {data.totalElements.toLocaleString()}
              </p>
            ) : null}
          </div>

          {showFilters ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FilterSelect
                label="Category"
                value={filters.categoryId}
                onChange={(categoryId) => setFilters((f) => ({ ...f, categoryId }))}
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              />
              <FilterSelect
                label="Catalog"
                value={filters.catalogId}
                onChange={(catalogId) => setFilters((f) => ({ ...f, catalogId }))}
                options={catalogs.map((c) => ({
                  value: c.id,
                  label: `${c.categoryName} — ${c.name}`,
                }))}
              />
              <FilterSelect
                label="Office"
                value={filters.officeId}
                onChange={(officeId) => setFilters((f) => ({ ...f, officeId }))}
                options={offices.map((o) => ({ value: o.id, label: o.name }))}
              />
              <FilterSelect
                label="Engagement status"
                value={filters.engagementStatus}
                onChange={(engagementStatus) =>
                  setFilters((f) => ({ ...f, engagementStatus }))
                }
                options={ENGAGEMENT_STATUSES.map((s) => ({
                  value: s,
                  label: s.replace(/_/g, " "),
                }))}
              />
              <FilterSelect
                label="Has engagements"
                value={filters.hasEngagements}
                onChange={(hasEngagements) =>
                  setFilters((f) => ({ ...f, hasEngagements }))
                }
                options={[
                  { value: "true", label: "Yes" },
                  { value: "false", label: "No" },
                ]}
              />
              <div>
                <Label>City</Label>
                <Input
                  value={filters.city}
                  onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
                  placeholder="Exact match"
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={filters.country}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, country: e.target.value }))
                  }
                  placeholder="Exact match"
                />
              </div>
              <div>
                <Label>Page size</Label>
                <select
                  className={selectClass}
                  value={filters.size}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      size: Number(e.target.value) as CustomerPageSize,
                    }))
                  }
                >
                  {PAGE_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s} per page
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          {showFilters ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={applyFilters}>
                Apply filters
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          ) : null}
          {loading && !data ? (
            <p className="mt-6 flex items-center gap-2 border-t border-gray-200 pt-6 text-sm text-gray-500 dark:border-gray-800">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading customers…
            </p>
          ) : error ? (
            <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-800">
              <ListError message={error} onRetry={() => void load()} />
            </div>
          ) : items.length === 0 ? (
            <p className="mt-6 border-t border-dashed border-gray-300 px-6 py-12 text-center text-sm text-gray-500 dark:border-gray-700">
              No customers match your filters.
            </p>
          ) : (
            <div className={setupListTableSectionClass}>
              <Table className={setupTableClass}>
              <TableHeader>
                <TableRow>
                  {[
                    { label: "Customer", className: "w-[26%]" },
                    { label: "Contact", className: "w-[18%]" },
                    { label: "Engagements", className: "w-[14%]" },
                    { label: "Services", className: "w-[22%]" },
                    { label: "Total value", className: "w-[14%]" },
                    { label: "", className: "w-[6%] text-right" },
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
                  <CustomerRow
                    key={c.id}
                    customer={c}
                    companyId={companyId}
                    canEdit={canEdit}
                    onRequestDeactivate={(id, name) =>
                      setDeactivateTarget({ id, name })
                    }
                  />
                ))}
              </TableBody>
            </Table>

              <PaginationBar
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            totalElements={data!.totalElements}
            page={data!.page}
            totalPages={data!.totalPages}
            first={data!.first}
            last={data!.last}
            onPage={setPage}
              />
            </div>
          )}
        </div>
      </div>

      <DeactivateConfirmModal
        open={deactivateTarget != null}
        title="Deactivate customer?"
        description="This deactivates the customer record. Active engagements may still need to be cancelled separately."
        itemName={deactivateTarget?.name}
        loading={deactivating}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => void confirmDeactivateCustomer()}
      />

      <CustomerFormModal
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <Label>{label}</Label>
      <select
        className={selectClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CustomerRow({
  customer: c,
  companyId,
  canEdit,
  onRequestDeactivate,
}: {
  customer: CustomerListItemResponse;
  companyId: string;
  canEdit: boolean;
  onRequestDeactivate: (id: string, name: string) => void;
}) {
  const detailHref = `/setup/customers/${c.id}`;

  return (
    <TableRow className={`group ${setupTableRowClass}`}>
      <TableCell className={setupListTdClass}>
        <div className="flex items-center gap-2">
          <SetupAvatar name={c.name} size="xs" />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              <Link
                href={detailHref}
                onClick={(e) => e.stopPropagation()}
                className="truncate font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                {c.name}
              </Link>
              {!c.active ? (
                <span className="shrink-0 rounded bg-gray-200 px-1 py-px text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  Inactive
                </span>
              ) : null}
            </div>
            {c.officeName ? (
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {c.officeName}
              </p>
            ) : null}
          </div>
        </div>
      </TableCell>
      <TableCell className={setupListTdClass}>
        <SetupContactLine
          icon={Phone}
          href={c.contactPhone ? `tel:${c.contactPhone}` : undefined}
          muted={!c.contactPhone}
          compact
        >
          {c.contactPhone ?? "—"}
        </SetupContactLine>
      </TableCell>
      <TableCell
        className={`${setupListTdClass} tabular-nums text-gray-700 dark:text-gray-300`}
      >
        {c.totalEngagementCount}
      </TableCell>
      <TableCell className={`${setupListTdClass} overflow-visible`}>
        <CategoriesCell categories={c.categories} compact />
      </TableCell>
      <TableCell
        className={`${setupListTdClass} tabular-nums font-medium text-gray-900 dark:text-white`}
      >
        {formatMoneyTotals(c.assignedCatalogsPriceTotals)}
      </TableCell>
      <TableCell className={`${setupListTdClass} whitespace-nowrap text-right`}>
        <SetupRowActions>
          <SetupRowActionLink href={detailHref} title="View customer" />
          {canEdit ? (
            <SetupRowActionDeactivate
              title="Deactivate customer"
              onClick={() => onRequestDeactivate(c.id, c.name)}
            />
          ) : null}
        </SetupRowActions>
      </TableCell>
    </TableRow>
  );
}

function PaginationBar({
  rangeStart,
  rangeEnd,
  totalElements,
  page,
  totalPages,
  first,
  last,
  onPage,
}: {
  rangeStart: number;
  rangeEnd: number;
  totalElements: number;
  page: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  onPage: (page: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-3 dark:border-gray-800">
      <p className="shrink-0 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
        Showing {rangeStart}–{rangeEnd} of {totalElements.toLocaleString()}
      </p>
      <div className="flex shrink-0 flex-nowrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={first}
          className="shrink-0 whitespace-nowrap"
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Previous
        </Button>
        <span className="shrink-0 whitespace-nowrap px-1 text-sm text-gray-600 dark:text-gray-400">
          Page {page + 1} of {Math.max(totalPages, 1)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={last || totalPages <= 1}
          className="shrink-0 whitespace-nowrap"
          onClick={() => onPage(page + 1)}
        >
          Next
          <ChevronRight className="ml-1 size-4" aria-hidden />
        </Button>
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

function CustomerFormModal({
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
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("TZ");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setLegalName("");
      setContactEmail("");
      setContactPhone("");
      setCity("");
      setCountry("TZ");
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
    setSubmitting(true);
    setError(null);
    try {
      await createCustomer(companyId, {
        name: trimmed,
        legalName: legalName.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create customer."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} className={setupFormModalClass}>
      <h3 className="text-lg font-semibold">New customer</h3>
      <form className="mt-4 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
        {error ? <p className="text-sm text-error-600">{error}</p> : null}
        <div>
          <Label>Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Legal name</Label>
          <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} />
        </div>
        <div>
          <Label>Contact email</Label>
          <Input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>
        <div>
          <Label>Contact phone</Label>
          <Input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <Label>Country</Label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </div>
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
