"use client";

import { getApiErrorMessage } from "@/api/errors";
import {
  createCatalogNode,
  deleteCatalogNode,
  getServiceCatalog,
} from "@/api/template-config/template-config.api";
import type {
  CatalogNodeType,
  ServiceCatalogNodeResponse,
  ServiceCatalogResponse,
} from "@/api/types/template-config";
import CatalogNodeTableView from "@/components/setup/CatalogNodeTableView";
import DeactivateConfirmModal from "@/components/setup/DeactivateConfirmModal";
import ExportListMenu from "@/components/setup/ExportListMenu";
import SetupEmptyState from "@/components/setup/SetupEmptyState";
import PricingFields from "@/components/setup/PricingFields";
import { SetupRowActionDeactivate } from "@/components/setup/SetupRowActions";
import { setupFormModalClass } from "@/components/setup/setupFormModal";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useTemplateOptions } from "@/hooks/useTemplateOptions";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { canManageSetup } from "@/lib/is-admin";
import { formatCatalogRecurrence } from "@/lib/template-recurrence";
import { listDepartments } from "@/api/organization/organization.api";
import type { DepartmentResponse } from "@/api/types/organization";
import { getAccessToken } from "@/lib/auth-storage";
import { buildCreateCatalogNodeRequest } from "@/lib/catalog-node-payload";
import {
  exportCatalogStructureExcel,
  exportCatalogStructurePdf,
} from "@/lib/export/catalog-structure-export";
import {
  emptyPricingForm,
  formatPricing,
  validateCatalogNodePricingForm,
  type PricingFormState,
} from "@/lib/template-pricing";
import { ListTree } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";

type NodeViewMode = "tree" | "table";

export default function CatalogDetailPanel({ catalogId }: { catalogId: string }) {
  const {
    companyId,
    companyName,
    loading: ctxLoading,
    error: ctxError,
    reload,
  } = useCompanyContext();
  const canEdit = canManageSetup();
  const [catalog, setCatalog] = useState<ServiceCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodeModal, setNodeModal] = useState<{
    parentId: string | null;
  } | null>(null);
  const [nodeView, setNodeView] = useState<NodeViewMode>("tree");
  const [deactivateTarget, setDeactivateTarget] = useState<{
    nodeId: string;
    name: string;
  } | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      setCatalog(await getServiceCatalog(companyId, catalogId));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load catalog."));
    } finally {
      setLoading(false);
    }
  }, [companyId, catalogId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmDeactivateNode() {
    if (!deactivateTarget || !companyId) return;
    setDeactivating(true);
    try {
      await deleteCatalogNode(companyId, catalogId, deactivateTarget.nodeId);
      setDeactivateTarget(null);
      await load();
    } catch (err) {
      alert(getApiErrorMessage(err, "Could not deactivate node."));
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
      <div>
        <Link
          href="/setup/service-catalogs"
          className="text-sm text-brand-600 hover:underline"
        >
          ← Service catalogs
        </Link>
        {loading ? (
          <p className="mt-4 text-sm text-gray-500">Loading…</p>
        ) : error ? (
          <p className="mt-4 text-sm text-error-600">{error}</p>
        ) : catalog ? (
          <>
            <h2 className="mt-2 text-xl font-semibold text-gray-800 dark:text-white/90">
              {catalog.name}
            </h2>
            <p className="text-sm text-gray-500">
              {catalog.categoryName}
              {" · Sort "}
              {catalog.sortOrder}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {formatCatalogRecurrence(catalog)}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {formatPricing(catalog.pricing)}
            </p>
            {catalog.description ? (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {catalog.description}
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      {canEdit && catalog ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setNodeModal({ parentId: null })}>
              Add root node
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Create <strong>GROUP</strong> roots first (e.g. “Registration of TRA”), then
            add children with <strong>parentId</strong>. Use <strong>TASK</strong> for
            leaf steps with optional price and duration.
          </p>
        </div>
      ) : null}

      {catalog?.nodes?.length ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-gray-800 dark:text-white/90">
              Template nodes
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <ExportListMenu
                disabled={!catalog?.nodes?.length}
                onExportPdf={() =>
                  exportCatalogStructurePdf(
                    companyName ?? "Company",
                    catalog!.name,
                    catalog!.categoryName,
                    catalog!.nodes
                  )
                }
                onExportExcel={() =>
                  exportCatalogStructureExcel(
                    companyName ?? "Company",
                    catalog!.name,
                    catalog!.nodes
                  )
                }
              />
              <div
              className="inline-flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700"
              role="group"
              aria-label="Node view"
            >
              <ViewModeButton
                active={nodeView === "tree"}
                onClick={() => setNodeView("tree")}
              >
                Tree
              </ViewModeButton>
              <ViewModeButton
                active={nodeView === "table"}
                onClick={() => setNodeView("table")}
              >
                Table
              </ViewModeButton>
            </div>
            </div>
          </div>
          {nodeView === "tree" ? (
            <ul className="space-y-2 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              {catalog.nodes.map((node) => (
                <NodeTree
                  key={node.id}
                  node={node}
                  depth={0}
                  admin={canEdit}
                  companyId={companyId}
                  catalogId={catalogId}
                  onAddChild={(parentId) => setNodeModal({ parentId })}
                  onRequestDeactivate={(nodeId, name) =>
                    setDeactivateTarget({ nodeId, name })
                  }
                />
              ))}
            </ul>
          ) : (
            <CatalogNodeTableView nodes={catalog.nodes} />
          )}
        </div>
      ) : (
        <SetupEmptyState
          icon={ListTree}
          title="No template nodes yet."
          description="Add a root GROUP node to build the catalog structure."
          variant="bordered"
        />
      )}

      <DeactivateConfirmModal
        open={deactivateTarget != null}
        title="Deactivate node?"
        description="This deactivates the node and any descendants under it."
        itemName={deactivateTarget?.name}
        loading={deactivating}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => void confirmDeactivateNode()}
      />

      {nodeModal && companyId ? (
        <NodeFormModal
          open
          companyId={companyId}
          catalogId={catalogId}
          parentId={nodeModal.parentId}
          onClose={() => setNodeModal(null)}
          onCreated={() => {
            setNodeModal(null);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

function ViewModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-brand-500 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function NodeTree({
  node,
  depth,
  admin,
  companyId,
  catalogId,
  onAddChild,
  onRequestDeactivate,
}: {
  node: ServiceCatalogNodeResponse;
  depth: number;
  admin: boolean;
  companyId: string;
  catalogId: string;
  onAddChild: (parentId: string) => void;
  onRequestDeactivate: (nodeId: string, name: string) => void;
}) {
  const pad = depth * 16;
  return (
    <li className="list-none">
      <div
        className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900/40"
        style={{ marginLeft: pad }}
      >
        <span className="font-medium">{node.name}</span>
        <span className="rounded bg-white px-1.5 text-xs text-gray-500 dark:bg-gray-800">
          {node.nodeType}
        </span>
        {node.departmentName ? (
          <span className="text-xs text-gray-500">{node.departmentName}</span>
        ) : null}
        <span className="text-xs text-gray-500">
          {formatPricing(node.pricing)}
        </span>
        {admin ? (
          <span className="ml-auto flex flex-wrap items-center gap-2">
            {node.nodeType === "GROUP" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onAddChild(node.id)}
              >
                Add child
              </Button>
            ) : (
              <span className="text-xs text-gray-400">Leaf task</span>
            )}
            <SetupRowActionDeactivate
              title="Deactivate node"
              onClick={() => onRequestDeactivate(node.id, node.name)}
            />
          </span>
        ) : null}
      </div>
      {node.children?.length ? (
        <ul className="mt-1 space-y-1">
          {node.children.map((child) => (
            <NodeTree
              key={child.id}
              node={child}
              depth={depth + 1}
              admin={admin}
              companyId={companyId}
              catalogId={catalogId}
              onAddChild={onAddChild}
              onRequestDeactivate={onRequestDeactivate}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function NodeFormModal({
  open,
  companyId,
  catalogId,
  parentId,
  onClose,
  onCreated,
}: {
  open: boolean;
  companyId: string;
  catalogId: string;
  parentId: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { currencies, timelineUnits } = useTemplateOptions(companyId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nodeType, setNodeType] = useState<CatalogNodeType>("GROUP");
  const [sortOrder, setSortOrder] = useState("10");
  const [departmentId, setDepartmentId] = useState("");
  const [requiresParentCompletion, setRequiresParentCompletion] = useState(false);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [pricing, setPricing] = useState<PricingFormState>(emptyPricingForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setNodeType("GROUP");
      setSortOrder("10");
      setDepartmentId("");
      setRequiresParentCompletion(false);
      setPricing(emptyPricingForm());
      setError(null);
      return;
    }
    setNodeType(parentId ? "TASK" : "GROUP");
    if (!parentId) {
      setDepartmentId("");
      setRequiresParentCompletion(false);
    }
    if (!parentId) {
      setDepartments([]);
      return;
    }
    const token = getAccessToken();
    if (!token) return;
    void listDepartments(token, companyId)
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, [open, parentId, companyId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    const pricingError = validateCatalogNodePricingForm(pricing);
    if (pricingError) {
      setError(pricingError);
      return;
    }
    const body = buildCreateCatalogNodeRequest({
      parentId,
      name,
      nodeType,
      sortOrder,
      description,
      departmentId,
      requiresParentCompletion,
      pricing,
    });
    setSubmitting(true);
    setError(null);
    try {
      await createCatalogNode(companyId, catalogId, body);
      onCreated();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create node."));
    } finally {
      setSubmitting(false);
    }
  }

  const selectClass =
    "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  return (
    <Modal isOpen={open} onClose={onClose} className={setupFormModalClass}>
      <h3 className="text-lg font-semibold">
        {parentId ? "Add child node" : "Add root node"}
      </h3>
      <p className="mt-1 text-xs text-gray-500">
        Code is generated automatically. Root requests omit <code>parentId</code>.
        Price requires currency; duration and duration unit are sent together.
      </p>
      <form className="mt-4 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
        {error ? <p className="text-sm text-error-600">{error}</p> : null}
        <div>
          <Label>Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Type *</Label>
          <select
            className={selectClass}
            value={nodeType}
            onChange={(e) => {
              const next = e.target.value as CatalogNodeType;
              setNodeType(next);
              if (next === "TASK") setDepartmentId("");
            }}
          >
            <option value="GROUP">GROUP — can contain children</option>
            <option value="TASK">TASK — leaf only</option>
          </select>
          {!parentId ? (
            <p className="mt-1 text-xs text-gray-500">
              Prefer GROUP roots when you need sub-items; TASK roots are single
              priced steps.
            </p>
          ) : null}
        </div>
        <div>
          <Label>Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
          />
        </div>
        {parentId && nodeType === "GROUP" ? (
          <div>
            <Label>Department</Label>
            <select
              className={selectClass}
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">None</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {parentId && nodeType === "GROUP" ? (
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={requiresParentCompletion}
              onChange={(e) => setRequiresParentCompletion(e.target.checked)}
              className="size-4 rounded border-gray-300"
            />
            Requires parent completion
          </label>
        ) : null}
        <div>
          <Label>Sort order</Label>
          <Input value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </div>
        <PricingFields
          value={pricing}
          onChange={setPricing}
          currencies={currencies}
          timelineUnits={timelineUnits}
          variant="duration"
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
