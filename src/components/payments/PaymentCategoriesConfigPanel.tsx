"use client";

import { getApiErrorMessage } from "@/api/errors";
import {
  createPaymentCategory,
  deactivatePaymentCategory,
  listPaymentCategories,
  updatePaymentCategory,
} from "@/api/payment/payment-config.api";
import type { CompanyPaymentCategoryResponse } from "@/api/types/payment-config";
import DeactivateConfirmModal from "@/components/setup/DeactivateConfirmModal";
import SetupEmptyState from "@/components/setup/SetupEmptyState";
import SetupPageShell from "@/components/setup/SetupPageShell";
import { SetupRowActionDeactivate, SetupRowActions } from "@/components/setup/SetupRowActions";
import { setupFormModalClass } from "@/components/setup/setupFormModal";
import {
  setupListTableSectionClass,
  setupListTdClass,
  setupListThClass,
  setupTableClass,
  setupTableRowClass,
} from "@/components/setup/setup-table-styles";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/context/ToastContext";
import { canManageSetup } from "@/lib/is-admin";
import { FolderTree, Loader2, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function PaymentCategoriesConfigPanel() {
  const canEdit = canManageSetup();
  return (
    <SetupPageShell
      title="Payment categories"
      description="Configure payment types for your company (e.g. supplier, tax, reconciliation)."
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
  const toast = useToast();
  const [items, setItems] = useState<CompanyPaymentCategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyPaymentCategoryResponse | null>(null);
  const [deactivateTarget, setDeactivateTarget] =
    useState<CompanyPaymentCategoryResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listPaymentCategories(companyId, false));
    } catch (e) {
      toast.showError(getApiErrorMessage(e, "Could not load categories."));
    } finally {
      setLoading(false);
    }
  }, [companyId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" disabled={loading} onClick={() => void load()}>
          <RefreshCw className="mr-1.5 size-4" aria-hidden />
          Refresh
        </Button>
        {canEdit ? (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="mr-1.5 size-4" aria-hidden />
            Add category
          </Button>
        ) : null}
      </div>

      <div
        className={`rounded-2xl border border-gray-200 dark:border-gray-800 ${setupListTableSectionClass}`}
      >
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
          </div>
        ) : items.length === 0 ? (
          <SetupEmptyState
            icon={FolderTree}
            title="No categories"
            description="Add payment categories for your company."
          />
        ) : (
          <Table className={setupTableClass}>
            <TableHeader>
              <TableRow>
                {["Name", "Code", "Order", "Reconciliation note", "Status", ""].map(
                  (h) => (
                    <TableCell
                      key={h || "actions"}
                      isHeader
                      className={setupListThClass}
                    >
                      {h}
                    </TableCell>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id} className={setupTableRowClass}>
                  <TableCell className={setupListTdClass}>{row.name}</TableCell>
                  <TableCell className={`${setupListTdClass} font-mono text-xs`}>
                    {row.code ?? "—"}
                  </TableCell>
                  <TableCell className={setupListTdClass}>{row.sortOrder}</TableCell>
                  <TableCell className={setupListTdClass}>
                    {row.requiresReconciliationNote ? "Required" : "—"}
                  </TableCell>
                  <TableCell className={setupListTdClass}>
                    {row.active ? "Active" : "Inactive"}
                  </TableCell>
                  <TableCell className={setupListTdClass}>
                    {canEdit && row.active ? (
                      <SetupRowActions>
                        <button
                          type="button"
                          className="text-xs font-medium text-brand-600"
                          onClick={() => {
                            setEditing(row);
                            setModalOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <SetupRowActionDeactivate
                          title="Deactivate"
                          onClick={() => setDeactivateTarget(row)}
                        />
                      </SetupRowActions>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <CategoryFormModal
        open={modalOpen}
        companyId={companyId}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          void load();
        }}
      />

      <DeactivateConfirmModal
        open={deactivateTarget != null}
        title="Deactivate category?"
        description={`"${deactivateTarget?.name}" will no longer appear for new payments.`}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={async () => {
          if (!deactivateTarget) return;
          await deactivatePaymentCategory(companyId, deactivateTarget.id);
          toast.showSuccess("Category deactivated.");
          setDeactivateTarget(null);
          void load();
        }}
      />
    </div>
  );
}

function CategoryFormModal({
  open,
  companyId,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  companyId: string;
  editing: CompanyPaymentCategoryResponse | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [requiresReconciliation, setRequiresReconciliation] = useState(false);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setCode(editing?.code ?? "");
    setDescription(editing?.description ?? "");
    setSortOrder(String(editing?.sortOrder ?? 0));
    setRequiresReconciliation(editing?.requiresReconciliationNote ?? false);
    setActive(editing?.active ?? true);
  }, [open, editing]);

  async function submit() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updatePaymentCategory(companyId, editing.id, {
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
          sortOrder: Number(sortOrder) || 0,
          requiresReconciliationNote: requiresReconciliation,
          active,
        });
        toast.showSuccess("Category updated.");
      } else {
        await createPaymentCategory(companyId, {
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
          sortOrder: Number(sortOrder) || 0,
          requiresReconciliationNote: requiresReconciliation,
        });
        toast.showSuccess("Category created.");
      }
      onSaved();
    } catch (e) {
      toast.showError(getApiErrorMessage(e, "Could not save category."));
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} className={setupFormModalClass}>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {editing ? "Edit category" : "New payment category"}
      </h2>
      <div className="mt-4 space-y-4">
        <div>
          <Label>Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label>Code</Label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label>Sort order</Label>
          <Input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={requiresReconciliation}
            onChange={(e) => setRequiresReconciliation(e.target.checked)}
          />
          Require reconciliation note on payments
        </label>
        {editing ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Active
          </label>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={() => void submit()}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> : null}
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
