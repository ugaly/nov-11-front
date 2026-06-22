"use client";

import { getApiErrorMessage } from "@/api/errors";
import {
  getExpenseSettings,
  updateExpenseSettings,
} from "@/api/expense/expense-config.api";
import type { CompanyExpenseSettingsResponse } from "@/api/types/expense-config";
import SetupPageShell from "@/components/setup/SetupPageShell";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useToast } from "@/context/ToastContext";
import { canManageSetup } from "@/lib/is-admin";
import { useGeneralAccess } from "@/lib/general/use-general-access";
import { Bell, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const PRESET_DAYS = [
  { value: 7, label: "1 week before expense date" },
  { value: 14, label: "2 weeks before expense date" },
  { value: 21, label: "3 weeks before expense date" },
];

export default function ExpenseReminderConfigPanel() {
  const { access: generalAccess } = useGeneralAccess();
  const canEdit = canManageSetup(generalAccess);
  return (
    <SetupPageShell
      title="Expense reminders"
      description="Email users who can approve or mark expenses when an approved expense is still unpaid before the expense date."
    >
      {({ companyId }) => (
        <SettingsForm companyId={companyId} canEdit={canEdit} />
      )}
    </SetupPageShell>
  );
}

function SettingsForm({
  companyId,
  canEdit,
}: {
  companyId: string;
  canEdit: boolean;
}) {
  const toast = useToast();
  const [settings, setSettings] = useState<CompanyExpenseSettingsResponse | null>(
    null
  );
  const [enabled, setEnabled] = useState(true);
  const [days, setDays] = useState("7");
  const [customDays, setCustomDays] = useState(false);
  const [recurringTime, setRecurringTime] = useState("09:00");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExpenseSettings(companyId);
      setSettings(data);
      setEnabled(data.expenseRemindersEnabled);
      const d = data.expenseReminderDaysBefore;
      const preset = PRESET_DAYS.some((p) => p.value === d);
      setCustomDays(!preset);
      setDays(String(d));
      setRecurringTime(data.recurringReminderTime ?? "09:00");
    } catch (e) {
      toast.showError(getApiErrorMessage(e, "Could not load expense settings."));
    } finally {
      setLoading(false);
    }
  }, [companyId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    const parsed = Number(days);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 90) {
      toast.showError("Reminder lead time must be between 1 and 90 days.");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateExpenseSettings(companyId, {
        expenseRemindersEnabled: enabled,
        expenseReminderDaysBefore: parsed,
        recurringReminderTime: recurringTime.trim() || "09:00",
      });
      setSettings(updated);
      toast.showSuccess("Expense reminder settings saved.");
    } catch (e) {
      toast.showError(getApiErrorMessage(e, "Could not save settings."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[20vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start gap-3">
        <Bell className="mt-0.5 size-5 text-amber-600" aria-hidden />
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Unpaid expense emails
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sent daily to office users with approve or mark-paid permission while an
            expense is approved and unpaid and the expense date is approaching.
          </p>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 size-4 rounded border-gray-300"
          checked={enabled}
          disabled={!canEdit}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <span className="text-sm text-gray-800 dark:text-gray-200">
          Enable expense payment reminders
        </span>
      </label>

      <div className="space-y-3">
        <Label>When to start reminding (before expense date)</Label>
        <div className="space-y-2">
          {PRESET_DAYS.map((preset) => (
            <label
              key={preset.value}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name="expense-reminder-days"
                disabled={!canEdit || !enabled}
                checked={!customDays && Number(days) === preset.value}
                onChange={() => {
                  setCustomDays(false);
                  setDays(String(preset.value));
                }}
              />
              {preset.label}
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="expense-reminder-days"
              disabled={!canEdit || !enabled}
              checked={customDays}
              onChange={() => setCustomDays(true)}
            />
            Custom (days)
          </label>
        </div>
        {customDays ? (
          <Input
            type="number"
            min="1"
            max="90"
            value={days}
            disabled={!canEdit || !enabled}
            onChange={(e) => setDays(e.target.value)}
            className="max-w-[8rem]"
          />
        ) : null}
      </div>

      <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
        <Label>Recurring auto-create reminder time (HH:mm)</Label>
        <p className="mt-1 text-xs text-gray-500">
          Used for email reminders on expenses created by monthly repeat rules.
        </p>
        <Input
          type="text"
          value={recurringTime}
          disabled={!canEdit}
          placeholder="09:00"
          onChange={(e) => setRecurringTime(e.target.value)}
          className="mt-2 max-w-[8rem]"
        />
      </div>

      {settings ? (
        <p className="text-xs text-gray-500">
          Current: {settings.expenseRemindersEnabled ? "on" : "off"},{" "}
          {settings.expenseReminderDaysBefore} day(s) before expense date. Recurring
          reminders at {settings.recurringReminderTime ?? "09:00"}.
        </p>
      ) : null}

      {canEdit ? (
        <Button disabled={saving} onClick={() => void save()}>
          {saving ? (
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
          ) : null}
          Save settings
        </Button>
      ) : (
        <p className="text-sm text-gray-500">Only admins can change these settings.</p>
      )}
    </div>
  );
}
