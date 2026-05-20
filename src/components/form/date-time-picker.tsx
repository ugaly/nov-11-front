"use client";

import { CalenderIcon } from "@/icons";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { useEffect, useId, useRef } from "react";
import Label from "./Label";

const inputClassName =
  "h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:border-gray-700 dark:focus:border-brand-800";

type DateTimePickerProps = {
  id?: string;
  label?: string;
  placeholder?: string;
  /** `YYYY-MM-DD HH:mm` */
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
};

export default function DateTimePicker({
  id: idProp,
  label,
  placeholder = "Select date & time",
  value = "",
  onValueChange,
  className = "",
  disabled = false,
}: DateTimePickerProps) {
  const autoId = useId().replace(/:/g, "");
  const id = idProp ?? `datetime-picker-${autoId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<flatpickr.Instance | null>(null);
  const onValueChangeRef = useRef(onValueChange);
  onValueChangeRef.current = onValueChange;

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const instance = flatpickr(el, {
      enableTime: true,
      time_24hr: false,
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d H:i",
      disableMobile: true,
      defaultDate: value || undefined,
      onChange: (_selectedDates, dateStr) => {
        if (typeof dateStr === "string" && onValueChangeRef.current) {
          onValueChangeRef.current(dateStr);
        }
      },
    });

    fpRef.current = Array.isArray(instance) ? instance[0]! : instance;

    return () => {
      fpRef.current?.destroy();
      fpRef.current = null;
    };
  }, [id]);

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
