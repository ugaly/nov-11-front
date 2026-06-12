"use client";

import { getApiErrorMessage } from "@/api/errors";
import {
  createPaymentMethod,
  deactivatePaymentMethod,
  listPaymentMethods,
  updatePaymentMethod,
} from "@/api/payment/payment-config.api";
import type { CompanyPaymentMethodResponse } from "@/api/types/payment-config";
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
import { CreditCard, Loader2, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function PaymentMethodsConfigPanel() {
  const canEdit = canManageSetup();
  return (
    <SetupPageShell
      title="Payment methods"
      description="Configure how payments are settled (bank transfer, mobile money, etc.)."
    >
      {({ companyId }) => (
        <MethodList companyId={companyId} canEdit={canEdit} />
      )}
    </SetupPageShell>
  );
}

function MethodList({
  companyId,
  canEdit,
}: {
  companyId: string;
  canEdit: boolean;
}) {
  const toast = useToast();
  const [items, setItems] = useState<CompanyPaymentMethodResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyPaymentMethodResponse | null>(null);
  const [deactivateTarget, setDeactivateTarget] =
    useState<CompanyPaymentMethodResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listPaymentMethods(companyId, false));
    } catch (e) {
      toast.showError(getApiErrorMessage(e, "Could not load methods."));
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
            Add method
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
            icon={CreditCard}
            title="No payment methods"
            description="Add settlement methods for your company."
          />
        ) : (
          <Table className={setupTableClass}>
            <TableHeader>
              <TableRow>
                {["Name", "Code", "Order", "Status", ""].map((h) => (
                  <TableCell key={h || "actions"} isHeader className={setupListThClass}>
                    {h}
                  </TableCell>
                ))}
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

      <MethodFormModal
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
        title="Deactivate method?"
        description={`"${deactivateTarget?.name}" will no longer appear when marking payments paid.`}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={async () => {
          if (!deactivateTarget) return;
          await deactivatePaymentMethod(companyId, deactivateTarget.id);
          toast.showSuccess("Method deactivated.");
          setDeactivateTarget(null);
          void load();
        }}
      />
    </div>
  );
}

function MethodFormModal({
  open,
  companyId,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  companyId: string;
  editing: CompanyPaymentMethodResponse | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setCode(editing?.code ?? "");
    setSortOrder(String(editing?.sortOrder ?? 0));
    setActive(editing?.active ?? true);
  }, [open, editing]);

  async function submit() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updatePaymentMethod(companyId, editing.id, {
          name: name.trim(),
          code: code.trim() || undefined,
          sortOrder: Number(sortOrder) || 0,
          active,
        });
        toast.showSuccess("Method updated.");
      } else {
        await createPaymentMethod(companyId, {
          name: name.trim(),
          code: code.trim() || undefined,
          sortOrder: Number(sortOrder) || 0,
        });
        toast.showSuccess("Method created.");
      }
      onSaved();
    } catch (e) {
      toast.showError(getApiErrorMessage(e, "Could not save method."));
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} className={setupFormModalClass}>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {editing ? "Edit method" : "New payment method"}
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
