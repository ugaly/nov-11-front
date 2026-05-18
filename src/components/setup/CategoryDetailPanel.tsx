"use client";

import { getApiErrorMessage } from "@/api/errors";
import {
  deleteServiceCatalog,
  getServiceCategory,
} from "@/api/template-config/template-config.api";
import type { ServiceCatalogResponse } from "@/api/types/template-config";
import CatalogFormModal from "@/components/setup/CatalogFormModal";
import DeactivateConfirmModal from "@/components/setup/DeactivateConfirmModal";
import ExportListMenu from "@/components/setup/ExportListMenu";
import SetupEmptyState from "@/components/setup/SetupEmptyState";
import {
  SetupRowActionDeactivate,
  SetupRowActionLink,
  SetupRowActions,
} from "@/components/setup/SetupRowActions";
import Button from "@/components/ui/button/Button";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { canManageSetup } from "@/lib/is-admin";
import {
  exportServiceCatalogsExcel,
  exportServiceCatalogsPdf,
} from "@/lib/export/service-catalogs-export";
import { formatCatalogRecurrence } from "@/lib/template-recurrence";
import { formatPricing } from "@/lib/template-pricing";
import { FolderOpen } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";

export default function CategoryDetailPanel({
  categoryId,
}: {
  categoryId: string;
}) {
  const {
    companyId,
    companyName,
    loading: ctxLoading,
    error: ctxError,
    reload,
  } = useCompanyContext();
  const canEdit = canManageSetup();
  const [categoryName, setCategoryName] = useState("");
  const [categoryPricing, setCategoryPricing] =
    useState<string>("");
  const [catalogs, setCatalogs] = useState<ServiceCatalogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const cat = await getServiceCategory(companyId, categoryId);
      setCategoryName(cat.name);
      setCategoryPricing(formatPricing(cat.pricing));
      setCatalogs(cat.catalogs ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load category."));
    } finally {
      setLoading(false);
    }
  }, [companyId, categoryId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmDeactivateCatalog() {
    if (!deactivateTarget || !companyId) return;
    setDeactivating(true);
    try {
      await deleteServiceCatalog(companyId, deactivateTarget.id);
      setDeactivateTarget(null);
      await load();
    } catch (err) {
      alert(getApiErrorMessage(err, "Could not deactivate catalog."));
    } finally {
      setDeactivating(false);
    }
  }

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
      <Link
        href="/setup/service-categories"
        className="text-sm text-brand-600 hover:underline"
      >
        ← Service categories
      </Link>
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : error ? (
        <p className="text-sm text-error-600">{error}</p>
      ) : (
        <>
          <div>
            <h2 className="text-xl font-semibold">{categoryName}</h2>
            <p className="mt-1 text-sm text-gray-600">{categoryPricing}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-medium">Service catalogs</h3>
            <div className="flex flex-wrap items-center gap-2">
              <ExportListMenu
                disabled={catalogs.length === 0}
                onExportPdf={() =>
                  exportServiceCatalogsPdf(companyName ?? "Company", catalogs, {
                    title: "Service catalogs",
                    subtitle: `${categoryName} · ${catalogs.length} catalog${catalogs.length === 1 ? "" : "s"}`,
                    filePrefix: "category-catalogs",
                  })
                }
                onExportExcel={() =>
                  exportServiceCatalogsExcel(companyName ?? "Company", catalogs, {
                    filePrefix: "category-catalogs",
                    sheetName: categoryName.slice(0, 31) || "Catalogs",
                  })
                }
              />
              {canEdit ? (
                <Button size="sm" onClick={() => setModalOpen(true)}>
                  Add catalog
                </Button>
              ) : null}
            </div>
          </div>
          {catalogs.length === 0 ? (
            <SetupEmptyState
              icon={FolderOpen}
              title="No catalogs in this category yet."
              variant="bordered"
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Recurrence</th>
                    <th className="px-4 py-3">Pricing</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {catalogs.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-xs">
                        {formatCatalogRecurrence(c)}
                      </td>
                      <td className="px-4 py-3">{formatPricing(c.pricing)}</td>
                      <td className="px-4 py-3 text-right">
                        <SetupRowActions>
                          <SetupRowActionLink
                            href={`/setup/service-catalogs/${c.id}`}
                            title="Open catalog tree"
                          />
                          {canEdit ? (
                            <SetupRowActionDeactivate
                              title="Deactivate catalog"
                              onClick={() =>
                                setDeactivateTarget({ id: c.id, name: c.name })
                              }
                            />
                          ) : null}
                        </SetupRowActions>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      <DeactivateConfirmModal
        open={deactivateTarget != null}
        title="Deactivate catalog?"
        description="This deactivates the catalog and all nodes under it."
        itemName={deactivateTarget?.name}
        loading={deactivating}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => void confirmDeactivateCatalog()}
      />

      {companyId ? (
        <CatalogFormModal
          open={modalOpen}
          companyId={companyId}
          categoryId={categoryId}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

