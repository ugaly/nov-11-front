"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import type { Currency, TimelineUnit } from "@/api/types/template-config";
import type { PricingFormState } from "@/lib/template-pricing";
import React from "react";

type PricingFieldsProps = {
  value: PricingFormState;
  onChange: (next: PricingFormState) => void;
  currencies: Currency[];
  timelineUnits: TimelineUnit[];
  /** Catalog nodes use duration + durationUnit on the API. */
  variant?: "timeline" | "duration";
};

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function PricingFields({
  value,
  onChange,
  currencies,
  timelineUnits,
  variant = "timeline",
}: PricingFieldsProps) {
  const isDuration = variant === "duration";
  return (
    <fieldset className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <legend className="px-1 text-xs font-medium uppercase tracking-wide text-gray-500">
        {isDuration ? "Price & duration (optional)" : "Price & timeline (optional)"}
      </legend>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Price</Label>
          <Input
            type="number"
            value={value.price}
            onChange={(e) => onChange({ ...value, price: e.target.value })}
            placeholder="Leave empty if none"
          />
        </div>
        <div>
          <Label>Currency</Label>
          <select
            className={selectClass}
            value={value.currency}
            onChange={(e) =>
              onChange({ ...value, currency: e.target.value as Currency })
            }
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>{isDuration ? "Duration" : "Timeline value"}</Label>
          <Input
            value={value.timelineValue}
            onChange={(e) =>
              onChange({ ...value, timelineValue: e.target.value })
            }
            placeholder={isDuration ? "e.g. 30" : "e.g. 7"}
          />
        </div>
        <div>
          <Label>{isDuration ? "Duration unit" : "Timeline unit"}</Label>
          <select
            className={selectClass}
            value={value.timelineUnit}
            onChange={(e) =>
              onChange({
                ...value,
                timelineUnit: e.target.value as TimelineUnit,
              })
            }
          >
            {timelineUnits.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        If price is set, currency is required.{" "}
        {isDuration
          ? "Duration and duration unit must both be set or both omitted."
          : "Timeline value and unit must both be set or both omitted."}
      </p>
    </fieldset>
  );
}
