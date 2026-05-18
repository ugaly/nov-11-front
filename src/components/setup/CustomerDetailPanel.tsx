"use client";

import { getApiErrorMessage } from "@/api/errors";
import {
  getCustomer,
  getEngagement,
  listCustomerEngagements,
} from "@/api/template-config/template-config.api";
import type {
  CustomerEngagementResponse,
  CustomerResponse,
  EngagementStatus,
} from "@/api/types/template-config";
import EngagementDetailBody from "@/components/setup/EngagementDetailBody";
import EngagementFormModal from "@/components/setup/EngagementFormModal";
import {
  ActiveBadge,
  SetupAvatar,
  SetupBackLink,
  SetupContactLine,
} from "@/components/setup/setup-pro-ui";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import Button from "@/components/ui/button/Button";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronLeft,
  CirclePause,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  XCircle,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

function statusIcon(status: EngagementStatus): LucideIcon {
  switch (status) {
    case "ACTIVE":
    case "COMPLETED":
      return CheckCircle2;
    case "ON_HOLD":
      return CirclePause;
    case "CANCELLED":
      return XCircle;
    case "DRAFT":
    default:
      return FileText;
  }
}

export default function CustomerDetailPanel({
  customerId,
}: {
  customerId: string;
}) {
  const { companyId, loading: ctxLoading, error: ctxError, reload } =
    useCompanyContext();
  const [customer, setCustomer] = useState<CustomerResponse | null>(null);
  const [engagements, setEngagements] = useState<CustomerEngagementResponse[]>(
    []
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailRetry, setDetailRetry] = useState(0);
  const detailCache = useRef<Map<string, CustomerEngagementResponse>>(new Map());
  const [activeDetail, setActiveDetail] =
    useState<CustomerEngagementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [engagementModalOpen, setEngagementModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const [c, e] = await Promise.all([
        getCustomer(companyId, customerId),
        listCustomerEngagements(companyId, customerId),
      ]);
      setCustomer(c);
      setEngagements(e);
      if (e.length > 0) {
        setSelectedId((prev) =>
          prev && e.some((x) => x.id === prev) ? prev : e[0]!.id
        );
      } else {
        setSelectedId(null);
        setActiveDetail(null);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load customer."));
    } finally {
      setLoading(false);
    }
  }, [companyId, customerId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!companyId || !selectedId) {
      setActiveDetail(null);
      return;
    }

    const cached = detailCache.current.get(selectedId);
    if (cached) {
      setActiveDetail(cached);
      setDetailError(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    setActiveDetail(null);

    void (async () => {
      try {
        const detail = await getEngagement(companyId, selectedId);
        if (cancelled) return;
        detailCache.current.set(selectedId, detail);
        setActiveDetail(detail);
      } catch (err) {
        if (cancelled) return;
        setDetailError(
          getApiErrorMessage(err, "Could not load engagement details.")
        );
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [companyId, selectedId, detailRetry]);

  if (ctxLoading) {
    return <p className="text-sm text-gray-500">Loading workspace…</p>;
  }
  if (ctxError || !companyId) {
    return (
      <div>
        <p className="text-sm text-error-600">{ctxError ?? "No company."}</p>
        <Button className="mt-2" size="sm" onClick={() => void reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SetupBackLink href="/setup/customers">
        <ChevronLeft className="size-4" aria-hidden />
        Back to customers
      </SetupBackLink>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading customer…
        </p>
      ) : error ? (
        <p className="text-sm text-error-600">{error}</p>
      ) : customer ? (
        <>
          {/* Profile hero */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-brand-50/30 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-brand-950/20">
            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start lg:p-8">
              <SetupAvatar name={customer.name} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {customer.name}
                  </h1>
                  <ActiveBadge active={customer.active} />
                </div>
                {customer.legalName ? (
                  <p className="mt-1 text-sm text-gray-500">{customer.legalName}</p>
                ) : null}
                <div className="mt-5 grid gap-x-6 gap-y-3 border-t border-gray-200/80 pt-5 dark:border-gray-800 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  <SetupContactLine
                    icon={Mail}
                    href={
                      customer.contactEmail
                        ? `mailto:${customer.contactEmail}`
                        : undefined
                    }
                    muted={!customer.contactEmail}
                  >
                    {customer.contactEmail ?? "No email"}
                  </SetupContactLine>
                  <SetupContactLine
                    icon={Phone}
                    href={
                      customer.contactPhone
                        ? `tel:${customer.contactPhone}`
                        : undefined
                    }
                    muted={!customer.contactPhone}
                  >
                    {customer.contactPhone ?? "No phone"}
                  </SetupContactLine>
                  <SetupContactLine
                    icon={MapPin}
                    muted={!customer.city && !customer.country}
                  >
                    {customer.city || customer.country
                      ? [customer.city, customer.country].filter(Boolean).join(", ")
                      : "No location"}
                  </SetupContactLine>
                  <SetupContactLine icon={Briefcase} muted={engagements.length === 0}>
                    {engagements.length === 0
                      ? "No engagements"
                      : `${engagements.length} engagement${engagements.length === 1 ? "" : "s"}${
                          engagements.some((e) => e.status === "ACTIVE")
                            ? ` · ${engagements.filter((e) => e.status === "ACTIVE").length} active`
                            : ""
                        }`}
                  </SetupContactLine>
                  <SetupContactLine icon={Building2} muted={!customer.officeName}>
                    {customer.officeName ?? "No office"}
                  </SetupContactLine>
                </div>
              </div>
            </div>
          </div>

          {/* Engagements — tabs only, no section title */}
          <section
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.02]"
            aria-label="Customer engagements"
          >
            <div className="border-b border-gray-200 bg-gray-50/70 px-3 pt-3 dark:border-gray-800 dark:bg-gray-900/50">
                  <div
                    className="flex gap-1 overflow-x-auto"
                    role="tablist"
                    aria-label="Engagement catalogs"
                  >
                    {engagements.map((e) => {
                      const Icon = statusIcon(e.status);
                      const active = selectedId === e.id;
                      return (
                        <button
                          key={e.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setSelectedId(e.id)}
                          className={`flex shrink-0 items-center gap-2 rounded-t-lg border px-5 py-3 text-sm font-medium transition-colors ${
                            active
                              ? "border-gray-200 border-b-white bg-white text-brand-600 shadow-sm dark:border-gray-700 dark:border-b-gray-900 dark:bg-gray-900 dark:text-brand-400"
                              : "border-transparent text-gray-600 hover:bg-white/70 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-200"
                          }`}
                        >
                          <Icon
                            className={`size-4 shrink-0 ${active ? "text-brand-500" : "text-gray-400"}`}
                            aria-hidden
                          />
                          <span
                            className="max-w-[14rem] truncate"
                            title={e.catalogName}
                          >
                            {e.catalogName}
                          </span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setEngagementModalOpen(true)}
                      className="ml-1 flex shrink-0 items-center gap-1.5 rounded-t-lg border border-dashed border-brand-300/80 px-4 py-3 text-sm font-medium text-brand-600 transition-colors hover:border-brand-400 hover:bg-brand-50/80 dark:border-brand-700 dark:text-brand-400 dark:hover:bg-brand-950/40"
                      title="Add engagement"
                    >
                      <Plus className="size-4 shrink-0" aria-hidden />
                      <span className="whitespace-nowrap">Add engagement</span>
                    </button>
                  </div>
                </div>

                <div className="min-h-[10rem] p-4 lg:p-5" role="tabpanel">
                  {engagements.length === 0 ? (
                    <div className="py-8 text-center">
                      <FileText
                        className="mx-auto size-10 text-gray-300 dark:text-gray-600"
                        aria-hidden
                      />
                      <p className="mt-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                        No engagements yet
                      </p>
                      <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                        Add an engagement to link a service catalog to this
                        customer.
                      </p>
                      <Button
                        type="button"
                        className="mt-6"
                        size="sm"
                        onClick={() => setEngagementModalOpen(true)}
                      >
                        <Plus className="mr-1.5 size-4" aria-hidden />
                        Add engagement
                      </Button>
                    </div>
                  ) : detailLoading ? (
                    <p className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Loading engagement…
                    </p>
                  ) : detailError ? (
                    <div className="flex items-start gap-2 text-sm text-error-600">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                      <div>
                        <p>{detailError}</p>
                        <Button
                          className="mt-3"
                          size="sm"
                          onClick={() => {
                            if (selectedId) {
                              detailCache.current.delete(selectedId);
                              setDetailRetry((n) => n + 1);
                            }
                          }}
                        >
                          Retry
                        </Button>
                      </div>
                    </div>
                  ) : activeDetail ? (
                    <EngagementDetailBody
                      engagement={activeDetail}
                      showOpenLink
                    />
                  ) : null}
                </div>
          </section>

          <EngagementFormModal
            open={engagementModalOpen}
            companyId={companyId}
            fixedCustomerId={customerId}
            fixedCustomerName={customer.name}
            onClose={() => setEngagementModalOpen(false)}
            onCreated={(created) => {
              setEngagementModalOpen(false);
              void (async () => {
                await load();
                setSelectedId(created.id);
                detailCache.current.delete(created.id);
              })();
            }}
          />

          {customer.notes ? (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.02] lg:p-8">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Notes
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {customer.notes}
              </p>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
