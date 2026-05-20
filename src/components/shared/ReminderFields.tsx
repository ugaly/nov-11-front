"use client";

import DateTimePicker from "@/components/form/date-time-picker";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import {
  createEmptyReminder,
  type ReminderEntry,
} from "@/lib/reminders/reminder-types";
import { Bell, Plus, X } from "lucide-react";

type ReminderFieldsProps = {
  value: ReminderEntry[];
  onChange: (items: ReminderEntry[]) => void;
  className?: string;
};

export default function ReminderFields({
  value,
  onChange,
  className = "",
}: ReminderFieldsProps) {
  const rows = value.length > 0 ? value : [createEmptyReminder()];

  function updateRow(id: string, patch: Partial<ReminderEntry>) {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    const next = rows.filter((r) => r.id !== id);
    onChange(next.length > 0 ? next : [createEmptyReminder()]);
  }

  function addRow() {
    onChange([...rows, createEmptyReminder()]);
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <Label className="mb-0 flex items-center gap-1.5">
          <Bell className="size-3.5 text-gray-500" aria-hidden />
          Reminders
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-1 size-3.5" aria-hidden />
          Add reminder
        </Button>
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Schedule one or more date & time reminders (optional).
      </p>
      <ul className="mt-3 space-y-3">
        {rows.map((row, index) => (
          <li
            key={row.id}
            className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 dark:border-gray-700 dark:bg-gray-900/40"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium text-gray-500">
                Reminder {index + 1}
              </span>
              {rows.length > 1 ? (
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
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <DateTimePicker
                id={`reminder-at-${row.id}`}
                label="Date & time"
                value={row.at}
                onValueChange={(at) => updateRow(row.id, { at })}
              />
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
        ))}
      </ul>
    </div>
  );
}
