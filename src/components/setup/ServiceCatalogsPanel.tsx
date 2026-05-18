"use client";

import { getApiErrorMessage } from "@/api/errors";
import { listServiceCatalogs } from "@/api/template-config/template-config.api";
import type { ServiceCatalogResponse } from "@/api/types/template-config";
import CatalogFormModal from "@/components/setup/CatalogFormModal";
import ExportListMenu from "@/components/setup/ExportListMenu";
import SetupPageShell from "@/components/setup/SetupPageShell";
import Button from "@/components/ui/button/Button";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { canManageSetup } from "@/lib/is-admin";
import {
  exportServiceCatalogsExcel,
  exportServiceCatalogsPdf,
} from "@/lib/export/service-catalogs-export";
import { formatCatalogRecurrence } from "@/lib/template-recurrence";
import { formatPricing } from "@/lib/template-pricing";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listServiceCatalogs(companyId));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load catalogs."));
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <ExportListMenu
          disabled={loading || items.length === 0}
          onExportPdf={() =>
            exportServiceCatalogsPdf(companyName ?? "Company", items)
          }
          onExportExcel={() =>
            exportServiceCatalogsExcel(companyName ?? "Company", items)
          }
        />
        {canEdit ? (
          <Button size="sm" onClick={() => setModalOpen(true)}>
            Add catalog
          </Button>
        ) : null}
      </div>
      {!canEdit ? (
        <p className="text-sm text-gray-500">
          Sign in with an active account to create catalogs.
        </p>
      ) : null}
      {loading ? (
        <p className="text-sm text-gray-500">Loading catalogs…</p>
      ) : error ? (
        <div>
          <p className="text-sm text-error-600">{error}</p>
          <Button className="mt-2" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">No service catalogs yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Catalog</th>
                <th className="px-4 py-3">Recurrence</th>
                <th className="px-4 py-3">Pricing</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">{c.categoryName}</td>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-xs">
                    {formatCatalogRecurrence(c)}
                  </td>
                  <td className="px-4 py-3">{formatPricing(c.pricing)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/setup/service-catalogs/${c.id}`}
                      className="text-brand-600 hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
