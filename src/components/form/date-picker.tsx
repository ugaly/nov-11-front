"use client";

import { CalenderIcon } from "@/icons";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { useEffect, useId, useRef } from "react";
import Label from "./Label";

type FlatpickrHook = flatpickr.Options.Hook;
type FlatpickrDateOption = flatpickr.Options.DateOption;

const inputClassName =
  "h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:border-gray-700 dark:focus:border-brand-800";

type DatePickerProps = {
  id?: string;
  mode?: "single" | "multiple" | "range" | "time";
  label?: string;
  placeholder?: string;
  /** ISO date `YYYY-MM-DD` */
  value?: string;
  onValueChange?: (value: string) => void;
  defaultDate?: FlatpickrDateOption;
  onChange?: FlatpickrHook | FlatpickrHook[];
  className?: string;
  disabled?: boolean;
};

export default function DatePicker({
  id: idProp,
  mode = "single",
  label,
  placeholder = "Select date",
  value = "",
  onValueChange,
  defaultDate,
  onChange,
  className = "",
  disabled = false,
}: DatePickerProps) {
  const autoId = useId().replace(/:/g, "");
  const id = idProp ?? `date-picker-${autoId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<flatpickr.Instance | null>(null);
  const onValueChangeRef = useRef(onValueChange);
  const onChangeRef = useRef(onChange);
  onValueChangeRef.current = onValueChange;
  onChangeRef.current = onChange;

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const instance = flatpickr(el, {
      mode,
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      defaultDate: defaultDate ?? (value || undefined),
      disableMobile: true,
      onChange: (selectedDates, dateStr, inst) => {
        if (typeof dateStr === "string" && onValueChangeRef.current) {
          onValueChangeRef.current(dateStr);
        }
        const hook = onChangeRef.current;
        if (hook) {
          const hooks = Array.isArray(hook) ? hook : [hook];
          for (const fn of hooks) fn(selectedDates, dateStr, inst);
        }
      },
    });

    fpRef.current = Array.isArray(instance) ? instance[0]! : instance;

    return () => {
      fpRef.current?.destroy();
      fpRef.current = null;
    };
  }, [id, mode]);

  useEffect(() => {
    const fp = fpRef.current;
    if (!fp) return;
    if (value) {
      if (fp.input.value !== value) fp.setDate(value, false);
    } else {
      fp.clear();
    }
  }, [value]);

  useEffect(() => {
    const fp = fpRef.current;
    if (!fp) return;
    fp.set("clickOpens", !disabled);
    fp.input.disabled = disabled;
  }, [disabled]);

  return (
    <div className={className}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          readOnly
          placeholder={placeholder}
          disabled={disabled}
          className={inputClassName}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
          <CalenderIcon className="size-6" />
        </span>
      </div>
    </div>
  );
}
