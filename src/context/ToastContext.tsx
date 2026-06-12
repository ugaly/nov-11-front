"use client";

import { CheckCircle2, AlertCircle, X } from "lucide-react";
import type React from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastKind = "success" | "error";

type ToastItem = {
  id: string;
  kind: ToastKind;
  message: string;
};

type ToastContextType = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function toastId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((kind: ToastKind, message: string) => {
    const id = toastId();
    setItems((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => remove(id), 3200);
  }, [remove]);

  const value = useMemo<ToastContextType>(
    () => ({
      showSuccess: (message) => show("success", message),
      showError: (message) => show("error", message),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex w-full max-w-sm flex-col gap-3">
        {items.map((item) => {
          const success = item.kind === "success";
          return (
            <div
              key={item.id}
              className={`pointer-events-auto relative overflow-hidden rounded-2xl border px-3 py-3 shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-right-3 fade-in ${
                success
                  ? "border-emerald-200/80 bg-white/95 text-emerald-800 dark:border-emerald-900/80 dark:bg-gray-900/95 dark:text-emerald-200"
                  : "border-rose-200/80 bg-white/95 text-rose-800 dark:border-rose-900/80 dark:bg-gray-900/95 dark:text-rose-200"
              }`}
              role="status"
              aria-live="polite"
            >
              <div
                className={`absolute left-0 top-0 h-full w-1 ${
                  success ? "bg-emerald-500" : "bg-rose-500"
                }`}
                aria-hidden
              />
              <div className="ml-1 flex w-full items-start gap-2.5">
                <span
                  className={`mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full ${
                    success
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300"
                  }`}
                >
                  {success ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <AlertCircle className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                    {success ? "Success" : "Error"}
                  </p>
                  <p className="mt-0.5 text-sm leading-5">{item.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="rounded-md p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                  aria-label="Dismiss notification"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
