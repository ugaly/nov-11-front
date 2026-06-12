"use client";

import { getApiErrorMessage } from "@/api/errors";
import {
  createExpenseType,
  deactivateExpenseType,
  listExpenseTypes,
  updateExpenseType,
} from "@/api/expense/expense-config.api";
import type { CompanyExpenseTypeResponse } from "@/api/types/expense-config";
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

export default function ExpenseTypesConfigPanel() {
  const canEdit = canManageSetup();
  return (
    <SetupPageShell
      title="Expense types"
      description="Configure expense categories for your company (e.g. travel, supplies, utilities)."
    >
      {({ companyId }) => (
        <TypeList companyId={companyId} canEdit={canEdit} />
      )}
    </SetupPageShell>
  );
}

function TypeList({
  companyId,
  canEdit,
}: {
  companyId: string;
  canEdit: boolean;
}) {
  const toast = useToast();
  const [items, setItems] = useState<CompanyExpenseTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyExpenseTypeResponse | null>(null);
  const [deactivateTarget, setDeactivateTarget] =
    useState<CompanyExpenseTypeResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listExpenseTypes(companyId, false));
    } catch (e) {
      toast.showError(getApiErrorMessage(e, "Could not load expense types."));
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
            Add type
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
            title="No expense types"
            description="Add expense types for your company."
          />
        ) : (
          <Table className={setupTableClass}>
            <TableHeader>
              <TableRow>
                {["Name", "Code", "Order", "Status", ""].map((h) => (
                  <TableCell
                    key={h || "actions"}
                    isHeader
                    className={setupListThClass}
                  >
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

      <TypeFormModal
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
        title="Deactivate expense type?"
        description={`"${deactivateTarget?.name}" will no longer appear for new expenses.`}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={async () => {
          if (!deactivateTarget) return;
          await deactivateExpenseType(companyId, deactivateTarget.id);
          toast.showSuccess("Expense type deactivated.");
          setDeactivateTarget(null);
          void load();
        }}
      />
    </div>
  );
}

function TypeFormModal({
  open,
  companyId,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  companyId: string;
  editing: CompanyExpenseTypeResponse | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [active, setActive] = useState(true);
  const [recurringDefault, setRecurringDefault] = useState(false);
  const [recurringDay, setRecurringDay] = useState("1");
  const [recurringReminderDays, setRecurringReminderDays] = useState("7");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setCode(editing?.code ?? "");
    setDescription(editing?.description ?? "");
    setSortOrder(String(editing?.sortOrder ?? 0));
    setActive(editing?.active ?? true);
    setRecurringDefault(editing?.recurringAutoCreateDefault ?? false);
    setRecurringDay(String(editing?.recurringDayOfMonth ?? 1));
    setRecurringReminderDays(String(editing?.recurringReminderDaysBefore ?? 7));
  }, [open, editing]);

  async function submit() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateExpenseType(companyId, editing.id, {
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
          sortOrder: Number(sortOrder) || 0,
          active,
          recurringAutoCreateDefault: recurringDefault,
          recurringDayOfMonth: Number(recurringDay) || 1,
          recurringReminderDaysBefore: Number(recurringReminderDays) || 7,
        });
        toast.showSuccess("Expense type updated.");
      } else {
        await createExpenseType(companyId, {
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
          sortOrder: Number(sortOrder) || 0,
          recurringAutoCreateDefault: recurringDefault,
          recurringDayOfMonth: Number(recurringDay) || 1,
          recurringReminderDaysBefore: Number(recurringReminderDays) || 7,
        });
        toast.showSuccess("Expense type created.");
      }
      onSaved();
    } catch (e) {
      toast.showError(getApiErrorMessage(e, "Could not save expense type."));
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} className={setupFormModalClass}>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {editing ? "Edit expense type" : "New expense type"}
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
        <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={recurringDefault}
              onChange={(e) => setRecurringDefault(e.target.checked)}
            />
            Suggest monthly auto-create (e.g. payroll)
          </label>
          {recurringDefault ? (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <Label>Default day of month</Label>
                <Input
                  type="number"
                  min="1"
                  max="28"
                  value={recurringDay}
                  onChange={(e) => setRecurringDay(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Remind days before</Label>
                <Input
                  type="number"
                  min="1"
                  max="90"
                  value={recurringReminderDays}
                  onChange={(e) => setRecurringReminderDays(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          ) : null}
        </div>
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
