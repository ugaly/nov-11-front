"use client";

import type { PaymentWorkflowStatus } from "@/api/types/payment";
import { Check } from "lucide-react";

const WORKFLOW_STEPS: {
  status: PaymentWorkflowStatus;
  label: string;
}[] = [
  { status: "DRAFT", label: "Draft" },
  { status: "SUBMITTED_FOR_APPROVAL", label: "Pending" },
  { status: "APPROVED", label: "Approved" },
  { status: "PARTIALLY_PAID", label: "Partial" },
  { status: "PAID", label: "Paid" },
];

/** Odoo-style chevron tab: flat left, arrow point on the right */
const CHEVRON_CLIP =
  "[clip-path:polygon(0_0,calc(100%-12px)_0,100%_50%,calc(100%-12px)_100%,0_100%,12px_50%)]";

type StepState = "done" | "current" | "upcoming" | "cancelled";

const STATUS_STEP_INDEX: Record<PaymentWorkflowStatus, number> = {
  DRAFT: 0,
  SUBMITTED_FOR_APPROVAL: 1,
  APPROVED: 2,
  PARTIALLY_PAID: 3,
  PAID: 4,
  CANCELLED: -1,
};

function stepIndex(status: PaymentWorkflowStatus): number {
  return STATUS_STEP_INDEX[status] ?? -1;
}

function stepState(
  index: number,
  currentIdx: number,
  status: PaymentWorkflowStatus
): StepState {
  if (status === "CANCELLED") return "cancelled";
  if (status === "PAID") return "done";
  if (currentIdx < 0) return "upcoming";
  if (index < currentIdx) return "done";
  if (index === currentIdx) return "current";
  return "upcoming";
}

const SEGMENT_STYLES: Record<StepState, string> = {
  done: "bg-emerald-600 text-white dark:bg-emerald-600",
  current:
    "bg-gray-900 text-white ring-2 ring-gray-900/20 dark:bg-white dark:text-gray-900 dark:ring-white/30",
  upcoming: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
  cancelled: "bg-gray-100 text-gray-400 dark:bg-gray-800/80 dark:text-gray-500",
};

export default function PaymentWorkflowStatusBar({
  status,
  className = "",
}: {
  status: PaymentWorkflowStatus;
  className?: string;
}) {
  const currentIdx = stepIndex(status);
  const cancelled = status === "CANCELLED";
  const allComplete = status === "PAID";
  const partialCurrent = status === "PARTIALLY_PAID";

  return (
    <div
      className={`flex min-w-0 max-w-full flex-col items-end gap-1 ${className}`}
      role="list"
      aria-label="Payment workflow progress"
    >
      <div className="inline-flex max-w-full overflow-x-auto rounded-sm pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {WORKFLOW_STEPS.map((step, index) => {
          const state = stepState(index, currentIdx, status);
          const isCurrent = !allComplete && state === "current";
          const isDone = state === "done";
          const isLastStep = index === WORKFLOW_STEPS.length - 1;
          const isFirst = index === 0;
          const segmentStyle =
            partialCurrent && isCurrent
              ? "bg-amber-500 text-white ring-2 ring-amber-500/30 dark:bg-amber-500"
              : SEGMENT_STYLES[state];

          return (
            <div
              key={step.status}
              role="listitem"
              aria-current={
                isCurrent || (allComplete && isLastStep) ? "step" : undefined
              }
              className={`relative flex min-w-[5.5rem] flex-none items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold leading-tight sm:min-w-[6.5rem] sm:gap-2 sm:px-3.5 sm:py-3 ${CHEVRON_CLIP} ${segmentStyle} ${
                isFirst ? "pl-4 sm:pl-4" : "-ml-2.5 sm:-ml-3"
              } ${isLastStep ? "pr-4 sm:pr-4" : "pr-5 sm:pr-6"} ${isCurrent ? "z-10 scale-[1.02] shadow-md" : ""}`}
            >
              {isDone ? (
                <Check className="size-3.5 shrink-0 opacity-95 sm:size-4" aria-hidden />
              ) : isCurrent ? (
                <span
                  className="size-1.5 shrink-0 rounded-full bg-white/90 sm:size-2 dark:bg-gray-900"
                  aria-hidden
                />
              ) : (
                <span
                  className="size-1.5 shrink-0 rounded-full bg-current opacity-35"
                  aria-hidden
                />
              )}
              <span className="whitespace-nowrap">{step.label}</span>
            </div>
          );
        })}
      </div>
      {cancelled ? (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-600 sm:text-xs dark:text-rose-400">
          Cancelled
        </p>
      ) : null}
    </div>
  );
}
