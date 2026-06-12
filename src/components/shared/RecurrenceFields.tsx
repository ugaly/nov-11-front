"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Repeat } from "lucide-react";

export type RecurrenceConfig = {
  autoCreateEnabled: boolean;
  dayOfMonth: number;
  reminderDaysBefore: number;
};

type RecurrenceFieldsProps = {
  value: RecurrenceConfig;
  onChange: (value: RecurrenceConfig) => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  className?: string;
};

export default function RecurrenceFields({
  value,
  onChange,
  enabled,
  onEnabledChange,
  className = "",
}: RecurrenceFieldsProps) {
  return (
    <div className={className}>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 size-4 rounded border-gray-300"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
        />
        <span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800 dark:text-white">
            <Repeat className="size-3.5" aria-hidden />
            Repeat monthly (auto-create)
          </span>
          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
            On the 1st of each month a new draft is created. Turn off to stop future
            copies (existing drafts stay).
          </span>
        </span>
      </label>
      {enabled ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Day of month (1–28)</Label>
            <Input
              type="number"
              min="1"
              max="28"
              value={String(value.dayOfMonth)}
              onChange={(e) =>
                onChange({
                  ...value,
                  dayOfMonth: Math.min(28, Math.max(1, Number(e.target.value) || 1)),
                })
              }
            />
          </div>
          <div>
            <Label>Remind days before</Label>
            <Input
              type="number"
              min="1"
              max="90"
              value={String(value.reminderDaysBefore)}
              onChange={(e) =>
                onChange({
                  ...value,
                  reminderDaysBefore: Math.min(
                    90,
                    Math.max(1, Number(e.target.value) || 7)
                  ),
                })
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
