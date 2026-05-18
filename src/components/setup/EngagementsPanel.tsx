"use client";

import { getApiErrorMessage } from "@/api/errors";
import {
  deleteEngagement,
  listEngagements,
  listServiceCatalogs,
} from "@/api/template-config/template-config.api";
import type {
  CustomerEngagementResponse,
  ServiceCatalogResponse,
} from "@/api/types/template-config";
import DeactivateConfirmModal from "@/components/setup/DeactivateConfirmModal";
import EngagementFormModal from "@/components/setup/EngagementFormModal";
import {
  SetupRowActionDeactivate,
  SetupRowActionLink,
  SetupRowActions,
} from "@/components/setup/SetupRowActions";
import SetupEmptyState from "@/components/setup/SetupEmptyState";
import SetupPageShell from "@/components/setup/SetupPageShell";
import Button from "@/components/ui/button/Button";
import { formatEngagementPeriod } from "@/lib/template-recurrence";
import { formatPricing } from "@/lib/template-pricing";
import { Briefcase } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

export default function EngagementsPanel() {
  return (
    <SetupPageShell
      title="Engagements"
      description="Projects created from service catalogs for your customers."
    >
      {({ companyId }) => <EngagementList companyId={companyId} />}
    </SetupPageShell>
  );
}

function EngagementList({ companyId }: { companyId: string }) {
  const [items, setItems] = useState<CustomerEngagementResponse[]>([]);
  const [catalogs, setCatalogs] = useState<ServiceCatalogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const catalogPricingById = useMemo(() => {
    const map = new Map<string, ServiceCatalogResponse>();
    for (const c of catalogs) map.set(c.id, c);
    return map;
  }, [catalogs]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [engagements, catalogList] = await Promise.all([
        listEngagements(companyId),
        listServiceCatalogs(companyId),
      ]);
      setItems(engagements);
      setCatalogs(catalogList);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load engagements."));
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmCancelEngagement() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await deleteEngagement(companyId, cancelTarget.id);
      setCancelTarget(null);
      await load();
    } catch (err) {
      alert(getApiErrorMessage(err, "Could not cancel engagement."));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setModalOpen(true)}>
          New engagement
        </Button>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Loading engagements…</p>
      ) : error ? (
        <ListError message={error} onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <SetupEmptyState
          icon={Briefcase}
          title="No engagements yet."
          description="Create an engagement from a customer and service catalog."
          variant="bordered"
        />
      ) : (
        <>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            The list API returns engagements with empty{" "}
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">
              workItems
            </code>
            , so line-item prices are not on this screen.{" "}
            <strong>Catalog pricing</strong> is loaded from the catalog API; open
            a row for each task&apos;s price from the template.
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3">Ref</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Category / catalog</th>
                  <th className="px-4 py-3">Catalog pricing</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 font-mono text-xs">
                      {e.referenceNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">{e.title}</td>
                    <td className="px-4 py-3">{e.customerName}</td>
                    <td className="px-4 py-3">
                      {e.categoryName} / {e.catalogName}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {formatPricing(
                        catalogPricingById.get(e.catalogId)?.pricing ?? null
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                      {formatEngagementPeriod(e.period)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <SetupRowActions>
                        <SetupRowActionLink
                          href={`/setup/engagements/${e.id}`}
                          title="Open engagement"
                        />
                        <SetupRowActionDeactivate
                          title="Cancel engagement"
                          onClick={() =>
                            setCancelTarget({ id: e.id, title: e.title })
                          }
                        />
                      </SetupRowActions>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <DeactivateConfirmModal
        open={cancelTarget != null}
        title="Cancel engagement?"
        description="This cancels the engagement. Work items will no longer be active under it."
        itemName={cancelTarget?.title}
        confirmLabel="Cancel engagement"
        loading={cancelling}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => void confirmCancelEngagement()}
      />

      <EngagementFormModal
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
