"use client";

import type { RecurrenceType } from "@/api/types/template-config";
import DatePicker from "@/components/form/date-picker";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import {
  RECURRENCE_INTERVAL_UNITS,
  RECURRENCE_LABELS,
  type RecurrenceFormState,
} from "@/lib/template-recurrence";
import React from "react";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function RecurrenceFields({
  value,
  onChange,
  recurrenceTypes,
}: {
  value: RecurrenceFormState;
  onChange: (next: RecurrenceFormState) => void;
  recurrenceTypes: RecurrenceType[];
}) {
  const set = (patch: Partial<RecurrenceFormState>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Recurrence & offering dates
      </p>
      <div>
        <Label>Recurrence type *</Label>
        <select
          className={selectClass}
          value={value.recurrenceType}
          onChange={(e) =>
            set({ recurrenceType: e.target.value as RecurrenceType })
          }
        >
          {recurrenceTypes.map((t) => (
            <option key={t} value={t}>
              {RECURRENCE_LABELS[t]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {value.recurrenceType === "ONE_OFF"
            ? "One engagement per company; when done, start a new engagement for another company."
            : value.recurrenceType === "ANNUAL"
              ? "Repeats every 12 months (exact). Each year is a new engagement with its own period."
              : value.recurrenceType === "CUSTOM"
                ? "Set your own interval (e.g. 90 days)."
                : "Repeating service — each cycle is a new engagement."}
        </p>
      </div>

      {value.recurrenceType === "CUSTOM" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Interval value *</Label>
            <Input
              type="number"
              value={value.recurrenceIntervalValue}
              onChange={(e) =>
                set({ recurrenceIntervalValue: e.target.value })
              }
              placeholder="90"
            />
          </div>
          <div>
            <Label>Interval unit *</Label>
            <select
              className={selectClass}
              value={value.recurrenceIntervalUnit}
              onChange={(e) =>
                set({
                  recurrenceIntervalUnit: e.target
                    .value as RecurrenceFormState["recurrenceIntervalUnit"],
                })
              }
            >
              {RECURRENCE_INTERVAL_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <DatePicker
          id="catalog-effective-from"
          label="Offering from"
          placeholder="Start date"
          value={value.catalogEffectiveFrom}
          onValueChange={(catalogEffectiveFrom) => set({ catalogEffectiveFrom })}
        />
        <DatePicker
          id="catalog-effective-to"
          label="Offering to"
          placeholder="End date"
          value={value.catalogEffectiveTo}
          onValueChange={(catalogEffectiveTo) => set({ catalogEffectiveTo })}
        />
      </div>
    </div>
  );
}
