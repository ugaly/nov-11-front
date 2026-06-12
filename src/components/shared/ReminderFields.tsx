"use client";

import DateTimePicker from "@/components/form/date-time-picker";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import {
  createEmptyReminder,
  reminderScheduleOptions,
  type ReminderEntry,
  type ReminderReferenceKind,
  type ReminderSchedule,
} from "@/lib/reminders/reminder-types";
import { Bell, Plus, X } from "lucide-react";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

type ReminderFieldsProps = {
  value: ReminderEntry[];
  onChange: (items: ReminderEntry[]) => void;
  /** `YYYY-MM-DD` — due date (payments) or expense date (expenses). */
  referenceDate: string;
  referenceKind?: ReminderReferenceKind;
  /** When true, reminders can be omitted entirely (no default row). */
  optional?: boolean;
  className?: string;
};

export default function ReminderFields({
  value,
  onChange,
  referenceDate,
  referenceKind = "due",
  optional = false,
  className = "",
}: ReminderFieldsProps) {
  const rows = optional
    ? value
    : value.length > 0
      ? value
      : [createEmptyReminder()];
  const scheduleOptions = reminderScheduleOptions(referenceKind);

  function updateRow(id: string, patch: Partial<ReminderEntry>) {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function updateSchedule(id: string, schedule: ReminderSchedule) {
    updateRow(id, {
      schedule,
      at: schedule === "CUSTOM" ? rows.find((r) => r.id === id)?.at ?? "" : undefined,
    });
  }

  function removeRow(id: string) {
    const next = rows.filter((r) => r.id !== id);
    if (optional) {
      onChange(next);
    } else {
      onChange(next.length > 0 ? next : [createEmptyReminder()]);
    }
  }

  function addRow() {
    onChange([...rows, createEmptyReminder()]);
  }

  const refHint =
    referenceKind === "expense" ? "expense date" : "due date";

  if (optional && rows.length === 0) {
    return (
      <div className={className}>
        <Label className="mb-0 flex items-center gap-1.5">
          <Bell className="size-3.5 text-gray-500" aria-hidden />
          Email reminders
          <span className="font-normal text-gray-400">(optional)</span>
        </Label>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Skip if you do not need a reminder. You can add one relative to the{" "}
          {refHint}
          {referenceDate ? ` (${referenceDate})` : ""}.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => onChange([createEmptyReminder()])}
        >
          <Plus className="mr-1 size-3.5" aria-hidden />
          Add reminder
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <Label className="mb-0 flex items-center gap-1.5">
          <Bell className="size-3.5 text-gray-500" aria-hidden />
          {optional ? "Email reminders" : "Reminders"}
          {optional ? (
            <span className="font-normal text-gray-400">(optional)</span>
          ) : null}
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-1 size-3.5" aria-hidden />
          Add reminder
        </Button>
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Choose when to be reminded relative to the {refHint}
        {referenceDate ? ` (${referenceDate})` : ""}, or specify an exact date.
      </p>
      <ul className="mt-3 space-y-3">
        {rows.map((row, index) => {
          const schedule = row.schedule ?? "ONE_WEEK_BEFORE";
          const isCustom = schedule === "CUSTOM";
          const canRemove = optional || rows.length > 1;

          return (
            <li
              key={row.id}
              className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 dark:border-gray-700 dark:bg-gray-900/40"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-gray-500">
                  Reminder {index + 1}
                </span>
                {canRemove ? (
                  <button
                    type="button"
                    className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-rose-600 dark:hover:bg-gray-800"
                    onClick={() => removeRow(row.id)}
                    aria-label="Remove reminder"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                ) : null}
              </div>
              <div className="mt-2 space-y-3">
                <div>
                  <Label>When to remind</Label>
                  <select
                    className={`${selectClass} mt-1.5`}
                    value={schedule}
                    onChange={(e) =>
                      updateSchedule(row.id, e.target.value as ReminderSchedule)
                    }
                  >
                    {scheduleOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {isCustom ? (
                  <DateTimePicker
                    id={`reminder-at-${row.id}`}
                    label="Date & time"
                    value={row.at ?? ""}
                    onValueChange={(at) => updateRow(row.id, { at })}
                  />
                ) : null}

                <div>
                  <Label>Note (optional)</Label>
                  <Input
                    value={row.note ?? ""}
                    onChange={(e) => updateRow(row.id, { note: e.target.value })}
                    placeholder="e.g. Follow up with finance"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
