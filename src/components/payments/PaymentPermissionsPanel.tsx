"use client";

import {
  listGeneralPermissions,
  upsertGeneralPermission,
} from "@/api/general/general.api";
import {
  listExpensePermissions,
  upsertExpensePermission,
} from "@/api/expense/expense.api";
import {
  listInvoicePermissions,
  upsertInvoicePermission,
} from "@/api/invoice/invoice.api";
import {
  listPaymentPermissions,
  upsertPaymentPermission,
} from "@/api/payment/payment.api";
import type { GeneralPermissionDto } from "@/api/types/general";
import type { ExpensePermissionDto } from "@/api/types/expense";
import type {
  InvoicePermissionDto,
  UpsertInvoicePermissionRequest,
} from "@/api/types/invoice";
import type {
  PaymentPermissionDto,
  UpsertPaymentPermissionRequest,
} from "@/api/types/payment";
import GeneralPermissionsCards, {
  defaultGeneralPermissionRow,
} from "@/components/setup/GeneralPermissionsCards";
import PermissionModuleCard, {
  type PermissionToggle,
} from "@/components/setup/PermissionModuleCard";
import { SetupAvatar } from "@/components/setup/setup-pro-ui";
import SetupEmptyState from "@/components/setup/SetupEmptyState";
import SetupPageShell from "@/components/setup/SetupPageShell";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/context/ToastContext";
import { useExpenseAccess } from "@/lib/expenses/use-expense-access";
import { useInvoiceAccess } from "@/lib/invoices/use-invoice-access";
import { useGeneralAccess } from "@/lib/general/use-general-access";
import { isAdminUser } from "@/lib/is-admin";
import { usePaymentAccess } from "@/lib/payments/use-payment-access";
import {
  FileText,
  Loader2,
  PieChart,
  RefreshCw,
  Shield,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type PaymentPermFlags = Omit<UpsertPaymentPermissionRequest, "userId">;
type InvoicePermFlags = Omit<UpsertInvoicePermissionRequest, "userId">;

const INVOICE_PERM_META: {
  key: keyof InvoicePermFlags;
  label: string;
  description: string;
  requiresVisible?: boolean;
}[] = [
  {
    key: "visible",
    label: "See module",
    description: "Show Invoices in the menu and allow opening it.",
  },
  {
    key: "canCreate",
    label: "Create",
    description: "Create and edit draft invoices.",
    requiresVisible: true,
  },
  {
    key: "canSend",
    label: "Send",
    description: "Email invoices to recipients.",
    requiresVisible: true,
  },
  {
    key: "canMarkPaid",
    label: "Mark paid",
    description: "Record when an invoice is paid.",
    requiresVisible: true,
  },
  {
    key: "canManagePermissions",
    label: "Manage permissions",
    description: "Configure office access in Setup.",
    requiresVisible: true,
  },
];

const MODULE_PERM_META: {
  key: keyof PaymentPermFlags;
  label: string;
  description: string;
  requiresVisible?: boolean;
}[] = [
  {
    key: "visible",
    label: "See module",
    description: "Show the module in the menu and allow opening it.",
  },
  {
    key: "canCreate",
    label: "Create",
    description: "Create and edit draft records.",
    requiresVisible: true,
  },
  {
    key: "canSubmit",
    label: "Submit",
    description: "Send drafts for approval.",
    requiresVisible: true,
  },
  {
    key: "canApprove",
    label: "Approve",
    description: "Approve or reject submitted records.",
    requiresVisible: true,
  },
  {
    key: "canMarkPaid",
    label: "Mark paid",
    description: "Record payment or reimbursement.",
    requiresVisible: true,
  },
  {
    key: "canManagePermissions",
    label: "Manage permissions",
    description: "Configure office access in Setup.",
    requiresVisible: true,
  },
];

function defaultPaymentRow(user: {
  userId: string;
  userFullName: string;
  userEmail: string;
}): PaymentPermissionDto {
  return {
    userId: user.userId,
    userFullName: user.userFullName,
    userEmail: user.userEmail,
    visible: false,
    canCreate: false,
    canSubmit: false,
    canApprove: false,
    canMarkPaid: false,
    canManagePermissions: false,
  };
}

function defaultExpenseRow(user: {
  userId: string;
  userFullName: string;
  userEmail: string;
}): ExpensePermissionDto {
  return {
    userId: user.userId,
    userFullName: user.userFullName,
    userEmail: user.userEmail,
    visible: false,
    canCreate: false,
    canSubmit: false,
    canApprove: false,
    canMarkPaid: false,
    canManagePermissions: false,
  };
}

function defaultInvoiceRow(user: {
  userId: string;
  userFullName: string;
  userEmail: string;
}): InvoicePermissionDto {
  return {
    userId: user.userId,
    userFullName: user.userFullName,
    userEmail: user.userEmail,
    visible: false,
    canCreate: false,
    canSend: false,
    canMarkPaid: false,
    canManagePermissions: false,
  };
}

export default function PaymentPermissionsPanel() {
  const toast = useToast();
  const { access: generalAccess, loading: generalAccessLoading } =
    useGeneralAccess();
  const { officeId, access: paymentAccess, loading: paymentAccessLoading } =
    usePaymentAccess();
  const { access: expenseAccess, loading: expenseAccessLoading } =
    useExpenseAccess();
  const { access: invoiceAccess, loading: invoiceAccessLoading } =
    useInvoiceAccess();
  const accessLoading =
    paymentAccessLoading ||
    expenseAccessLoading ||
    invoiceAccessLoading ||
    generalAccessLoading;
  const canManageGeneral =
    isAdminUser() || Boolean(generalAccess?.canManageGeneralPermissions);
  const canManage =
    canManageGeneral ||
    Boolean(paymentAccess?.canManagePermissions) ||
    Boolean(expenseAccess?.canManagePermissions) ||
    Boolean(invoiceAccess?.canManagePermissions);
  const canManagePayments = Boolean(paymentAccess?.canManagePermissions);
  const canManageExpenses = Boolean(expenseAccess?.canManagePermissions);
  const canManageInvoices = Boolean(invoiceAccess?.canManagePermissions);

  const [paymentRows, setPaymentRows] = useState<PaymentPermissionDto[]>([]);
  const [expenseRows, setExpenseRows] = useState<ExpensePermissionDto[]>([]);
  const [invoiceRows, setInvoiceRows] = useState<InvoicePermissionDto[]>([]);
  const [generalRows, setGeneralRows] = useState<GeneralPermissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const refresh = useCallback(async () => {
    if (!officeId) return;
    setLoading(true);
    try {
      const [paymentsResult, expensesResult, invoicesResult, generalResult] =
        await Promise.allSettled([
          canManagePayments
            ? listPaymentPermissions(officeId)
            : Promise.resolve([] as PaymentPermissionDto[]),
          canManageExpenses
            ? listExpensePermissions(officeId)
            : Promise.resolve([] as ExpensePermissionDto[]),
          canManageInvoices
            ? listInvoicePermissions(officeId)
            : Promise.resolve([] as InvoicePermissionDto[]),
          canManageGeneral
            ? listGeneralPermissions(officeId)
            : Promise.resolve([] as GeneralPermissionDto[]),
        ]);

      const payments =
        paymentsResult.status === "fulfilled" ? paymentsResult.value : [];
      const expenses =
        expensesResult.status === "fulfilled" ? expensesResult.value : [];
      const invoices =
        invoicesResult.status === "fulfilled" ? invoicesResult.value : [];
      const general =
        generalResult.status === "fulfilled" ? generalResult.value : [];

      if (paymentsResult.status === "rejected") {
        toast.showError("Could not load payment permissions.");
      }
      if (expensesResult.status === "rejected") {
        toast.showError("Could not load expense permissions.");
      }
      if (invoicesResult.status === "rejected") {
        toast.showError("Could not load invoice permissions.");
      }
      if (generalResult.status === "rejected") {
        toast.showError("Could not load general module permissions.");
      }

      setPaymentRows(payments);
      setExpenseRows(expenses);
      setInvoiceRows(invoices);
      setGeneralRows(general);

      const userIds = new Set<string>();
      for (const row of payments) userIds.add(row.userId);
      for (const row of expenses) userIds.add(row.userId);
      for (const row of invoices) userIds.add(row.userId);
      for (const row of general) userIds.add(row.userId);
      const mergedIds = [...userIds];

      setSelectedUserId((prev) => {
        if (prev && mergedIds.includes(prev)) return prev;
        return mergedIds[0] ?? null;
      });
    } catch (e) {
      toast.showError(
        e instanceof Error ? e.message : "Could not load permissions."
      );
    } finally {
      setLoading(false);
    }
  }, [
    officeId,
    canManagePayments,
    canManageExpenses,
    canManageInvoices,
    canManageGeneral,
    toast,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const mergedUsers = useMemo(() => {
    const map = new Map<
      string,
      { userId: string; userFullName: string; userEmail: string }
    >();
    for (const row of paymentRows) {
      map.set(row.userId, {
        userId: row.userId,
        userFullName: row.userFullName,
        userEmail: row.userEmail,
      });
    }
    for (const row of expenseRows) {
      if (!map.has(row.userId)) {
        map.set(row.userId, {
          userId: row.userId,
          userFullName: row.userFullName,
          userEmail: row.userEmail,
        });
      }
    }
    for (const row of invoiceRows) {
      if (!map.has(row.userId)) {
        map.set(row.userId, {
          userId: row.userId,
          userFullName: row.userFullName,
          userEmail: row.userEmail,
        });
      }
    }
    for (const row of generalRows) {
      if (!map.has(row.userId)) {
        map.set(row.userId, {
          userId: row.userId,
          userFullName: row.userFullName,
          userEmail: row.userEmail,
        });
      }
    }
    return [...map.values()].sort((a, b) =>
      a.userFullName.localeCompare(b.userFullName)
    );
  }, [paymentRows, expenseRows, invoiceRows, generalRows]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mergedUsers;
    return mergedUsers.filter(
      (u) =>
        u.userFullName.toLowerCase().includes(q) ||
        u.userEmail.toLowerCase().includes(q)
    );
  }, [mergedUsers, search]);

  const selectedPayment =
    paymentRows.find((r) => r.userId === selectedUserId) ??
    (selectedUserId
      ? defaultPaymentRow(
          mergedUsers.find((u) => u.userId === selectedUserId) ?? {
            userId: selectedUserId,
            userFullName: "User",
            userEmail: "",
          }
        )
      : null);

  const selectedExpense =
    expenseRows.find((r) => r.userId === selectedUserId) ??
    (selectedUserId
      ? defaultExpenseRow(
          mergedUsers.find((u) => u.userId === selectedUserId) ?? {
            userId: selectedUserId,
            userFullName: "User",
            userEmail: "",
          }
        )
      : null);

  const selectedInvoice =
    invoiceRows.find((r) => r.userId === selectedUserId) ??
    (selectedUserId
      ? defaultInvoiceRow(
          mergedUsers.find((u) => u.userId === selectedUserId) ?? {
            userId: selectedUserId,
            userFullName: "User",
            userEmail: "",
          }
        )
      : null);

  const selectedGeneral =
    generalRows.find((r) => r.userId === selectedUserId) ??
    (selectedUserId
      ? defaultGeneralPermissionRow(
          mergedUsers.find((u) => u.userId === selectedUserId) ?? {
            userId: selectedUserId,
            userFullName: "User",
            userEmail: "",
          }
        )
      : null);

  const selectedUser = mergedUsers.find((u) => u.userId === selectedUserId) ?? null;

  async function saveGeneralFlags(
    next: Omit<GeneralPermissionDto, "id" | "userId" | "userFullName" | "userEmail">
  ) {
    if (!officeId || !selectedUserId) return;
    setSavingGeneral(true);
    try {
      const updated = await upsertGeneralPermission(officeId, {
        userId: selectedUserId,
        ...next,
      });
      setGeneralRows((prev) => {
        const exists = prev.some((r) => r.userId === updated.userId);
        if (exists) {
          return prev.map((r) => (r.userId === updated.userId ? updated : r));
        }
        return [...prev, updated];
      });
      toast.showSuccess("General permissions saved.");
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSavingGeneral(false);
    }
  }

  async function savePaymentFlags(next: PaymentPermFlags) {
    if (!officeId || !selectedUserId) return;
    setSavingPayment(true);
    try {
      const updated = await upsertPaymentPermission(officeId, {
        userId: selectedUserId,
        ...next,
      });
      setPaymentRows((prev) => {
        const exists = prev.some((r) => r.userId === updated.userId);
        if (exists) {
          return prev.map((r) => (r.userId === updated.userId ? updated : r));
        }
        return [...prev, updated];
      });
      toast.showSuccess("Payment permissions saved.");
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSavingPayment(false);
    }
  }

  async function saveInvoiceFlags(next: InvoicePermFlags) {
    if (!officeId || !selectedUserId) return;
    setSavingInvoice(true);
    try {
      const updated = await upsertInvoicePermission(officeId, {
        userId: selectedUserId,
        ...next,
      });
      setInvoiceRows((prev) => {
        const exists = prev.some((r) => r.userId === updated.userId);
        if (exists) {
          return prev.map((r) => (r.userId === updated.userId ? updated : r));
        }
        return [...prev, updated];
      });
      toast.showSuccess("Invoice permissions saved.");
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSavingInvoice(false);
    }
  }

  async function saveExpenseFlags(next: PaymentPermFlags) {
    if (!officeId || !selectedUserId) return;
    setSavingExpense(true);
    try {
      const updated = await upsertExpensePermission(officeId, {
        userId: selectedUserId,
        ...next,
      });
      setExpenseRows((prev) => {
        const exists = prev.some((r) => r.userId === updated.userId);
        if (exists) {
          return prev.map((r) => (r.userId === updated.userId ? updated : r));
        }
        return [...prev, updated];
      });
      toast.showSuccess("Expense permissions saved.");
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSavingExpense(false);
    }
  }

  function patchPaymentFlag(key: keyof PaymentPermFlags, value: boolean) {
    if (!selectedPayment) return;
    const next: PaymentPermFlags = {
      visible: selectedPayment.visible,
      canCreate: selectedPayment.canCreate,
      canSubmit: selectedPayment.canSubmit,
      canApprove: selectedPayment.canApprove,
      canMarkPaid: selectedPayment.canMarkPaid,
      canManagePermissions: selectedPayment.canManagePermissions,
      [key]: value,
    };
    if (key === "visible" && !value) {
      next.canCreate = false;
      next.canSubmit = false;
      next.canApprove = false;
      next.canMarkPaid = false;
      next.canManagePermissions = false;
    }
    void savePaymentFlags(next);
  }

  function patchExpenseFlag(key: keyof PaymentPermFlags, value: boolean) {
    if (!selectedExpense) return;
    const next: PaymentPermFlags = {
      visible: selectedExpense.visible,
      canCreate: selectedExpense.canCreate,
      canSubmit: selectedExpense.canSubmit,
      canApprove: selectedExpense.canApprove,
      canMarkPaid: selectedExpense.canMarkPaid,
      canManagePermissions: selectedExpense.canManagePermissions,
      [key]: value,
    };
    if (key === "visible" && !value) {
      next.canCreate = false;
      next.canSubmit = false;
      next.canApprove = false;
      next.canMarkPaid = false;
      next.canManagePermissions = false;
    }
    void saveExpenseFlags(next);
  }

  function patchInvoiceFlag(key: keyof InvoicePermFlags, value: boolean) {
    if (!selectedInvoice) return;
    const next: InvoicePermFlags = {
      visible: selectedInvoice.visible,
      canCreate: selectedInvoice.canCreate,
      canSend: selectedInvoice.canSend,
      canMarkPaid: selectedInvoice.canMarkPaid,
      canManagePermissions: selectedInvoice.canManagePermissions,
      [key]: value,
    };
    if (key === "visible" && !value) {
      next.canCreate = false;
      next.canSend = false;
      next.canMarkPaid = false;
      next.canManagePermissions = false;
    }
    void saveInvoiceFlags(next);
  }

  if (accessLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
      </div>
    );
  }

  if (!officeId || !canManage) {
    return (
      <SetupPageShell
        title="Office permissions"
        description="Configure module access per user for this office."
      >
        {() => (
          <SetupEmptyState
            icon={Shield}
            title="Not authorized"
            description='You need payment, expense, or invoice "Manage permissions", or an administrator role.'
          />
        )}
      </SetupPageShell>
    );
  }

  const paymentToggles: PermissionToggle[] = MODULE_PERM_META.map((meta) => ({
    key: meta.key,
    label: meta.label,
    description: meta.description.replace(
      "the module",
      "Payments"
    ),
    checked: selectedPayment ? selectedPayment[meta.key] : false,
    disabled:
      savingPayment || (meta.requiresVisible && !selectedPayment?.visible),
    onChange: (checked) => patchPaymentFlag(meta.key, checked),
  }));

  const invoiceToggles: PermissionToggle[] = INVOICE_PERM_META.map((meta) => ({
    key: meta.key,
    label: meta.label,
    description: meta.description,
    checked: selectedInvoice ? selectedInvoice[meta.key] : false,
    disabled:
      savingInvoice || (meta.requiresVisible && !selectedInvoice?.visible),
    onChange: (checked) => patchInvoiceFlag(meta.key, checked),
  }));

  const expenseToggles: PermissionToggle[] = MODULE_PERM_META.map((meta) => ({
    key: meta.key,
    label: meta.label,
    description: meta.description.replace(
      "the module",
      "Expenses"
    ),
    checked: selectedExpense ? selectedExpense[meta.key] : false,
    disabled:
      savingExpense || (meta.requiresVisible && !selectedExpense?.visible),
    onChange: (checked) => patchExpenseFlag(meta.key, checked),
  }));

  return (
    <SetupPageShell
      title="Office permissions"
      description="Select a user, then configure access by module. Permissions apply to this office only."
    >
      {() => (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <input
              type="search"
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 min-w-[12rem] flex-1 max-w-md rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => void refresh()}
            >
              <RefreshCw className="mr-1.5 size-4" aria-hidden />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
            </div>
          ) : mergedUsers.length === 0 ? (
            <SetupEmptyState
              icon={Shield}
              title="No office users"
              description="Assign users to this office first."
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(15rem,22rem)_1fr]">
              <aside className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
                <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Users ({filteredUsers.length})
                  </p>
                </div>
                <ul className="max-h-[32rem] overflow-y-auto p-2">
                  {filteredUsers.map((user) => {
                    const active = user.userId === selectedUserId;
                    const paymentRow = paymentRows.find(
                      (r) => r.userId === user.userId
                    );
                    const expenseRow = expenseRows.find(
                      (r) => r.userId === user.userId
                    );
                    const invoiceRow = invoiceRows.find(
                      (r) => r.userId === user.userId
                    );
                    const generalRow = generalRows.find(
                      (r) => r.userId === user.userId
                    );
                    const hasAccess =
                      Boolean(paymentRow?.visible) ||
                      Boolean(expenseRow?.visible) ||
                      Boolean(invoiceRow?.visible) ||
                      Boolean(generalRow?.visibleDashboard) ||
                      Boolean(generalRow?.visibleCustomers) ||
                      Boolean(generalRow?.visibleMail) ||
                      Boolean(generalRow?.visibleCompanyFiles) ||
                      Boolean(generalRow?.visibleSetup) ||
                      Boolean(generalRow?.visibleCompanyProfile);
                    return (
                      <li key={user.userId}>
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(user.userId)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                            active
                              ? "bg-brand-50 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:ring-brand-500/30"
                              : "hover:bg-gray-50 dark:hover:bg-gray-900/50"
                          }`}
                        >
                          <SetupAvatar name={user.userFullName} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                              {user.userFullName}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {user.userEmail}
                            </p>
                          </div>
                          <span
                            className={`size-2 shrink-0 rounded-full ${
                              hasAccess
                                ? "bg-emerald-500"
                                : "bg-gray-300 dark:bg-gray-600"
                            }`}
                            aria-hidden
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>

              <div className="space-y-4">
                {selectedUser ? (
                  <>
                    <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
                      <div className="flex flex-wrap items-center gap-3">
                        <SetupAvatar name={selectedUser.userFullName} size="md" />
                        <div>
                          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                            {selectedUser.userFullName}
                          </h2>
                          <p className="text-sm text-gray-500">
                            {selectedUser.userEmail}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                        <SlidersHorizontal className="size-3.5" aria-hidden />
                        Toggle module access and permissions below. Changes save
                        immediately.
                      </p>
                    </div>

                    {canManagePayments && selectedPayment ? (
                    <PermissionModuleCard
                      title="Payments"
                      description="Office payment requests, approvals, and settlements."
                      icon={Wallet}
                      enabled={selectedPayment.visible}
                      onEnabledChange={(v) => patchPaymentFlag("visible", v)}
                      permissions={paymentToggles}
                    />
                    ) : null}

                    {canManageExpenses && selectedExpense ? (
                    <PermissionModuleCard
                      title="Expenses"
                      description="Office expense claims, approvals, and reimbursements."
                      icon={PieChart}
                      enabled={selectedExpense.visible}
                      onEnabledChange={(v) => patchExpenseFlag("visible", v)}
                      permissions={expenseToggles}
                    />
                    ) : null}

                    {canManageInvoices && selectedInvoice ? (
                    <PermissionModuleCard
                      title="Invoices"
                      description="Create, email, and track office invoices."
                      icon={FileText}
                      enabled={selectedInvoice.visible}
                      onEnabledChange={(v) => patchInvoiceFlag("visible", v)}
                      permissions={invoiceToggles}
                    />
                    ) : null}

                    {canManageGeneral && selectedGeneral ? (
                      <GeneralPermissionsCards
                        selected={selectedGeneral}
                        saving={savingGeneral}
                        onPatch={(next) => void saveGeneralFlags(next)}
                      />
                    ) : null}
                  </>
                ) : (
                  <SetupEmptyState
                    icon={Shield}
                    title="Select a user"
                    description="Choose someone from the list to configure their access."
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </SetupPageShell>
  );
}
