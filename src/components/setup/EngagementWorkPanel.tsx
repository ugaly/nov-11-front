"use client";

import type {
  CustomerEngagementResponse,
  WorkItemStatus,
} from "@/api/types/template-config";
import CatalogStructureModal from "@/components/setup/CatalogStructureModal";
import FieldBuilderModal from "@/components/setup/FieldBuilderModal";
import TaskClosureForm from "@/components/setup/TaskClosureForm";
import TaskClosureSummary from "@/components/setup/TaskClosureSummary";
import TaskFieldForm from "@/components/setup/TaskFieldForm";
import TaskStatusPicker from "@/components/setup/TaskStatusPicker";
import { useWorkItemClosure } from "@/hooks/useWorkItemClosure";
import { isClosureStatus, type ClosureStatus } from "@/lib/work-item-closure-store";
import WorkItemGroupTree from "@/components/setup/WorkItemGroupTree";
import Button from "@/components/ui/button/Button";
import { useEngagementWorkItemStatuses } from "@/hooks/useEngagementWorkItemStatuses";
import { useWorkItemFieldState } from "@/hooks/useWorkItemFieldState";
import {
  buildWorkGroupSections,
  buildWorkItemTree,
  countWorkItems,
} from "@/lib/work-item-tree";
import { ClipboardList, ListTree, Settings2, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

export default function EngagementWorkPanel({
  engagement,
}: {
  engagement: CustomerEngagementResponse;
}) {
  const [structureOpen, setStructureOpen] = useState(false);
  const { getStatus, setStatus, mergedWorkItems, ready: statusReady } =
    useEngagementWorkItemStatuses(engagement.id, engagement.workItems);

  const tree = useMemo(
    () => buildWorkItemTree(mergedWorkItems),
    [mergedWorkItems]
  );
  const sections = useMemo(() => buildWorkGroupSections(tree), [tree]);
  const counts = useMemo(
    () => countWorkItems(mergedWorkItems),
    [mergedWorkItems]
  );

  const progressPct =
    counts.tasks > 0 ? Math.round((counts.done / counts.tasks) * 100) : 0;

  if (engagement.workItems.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No work items on this engagement yet.
      </p>
    );
  }

  if (!statusReady) {
    return (
      <p className="text-sm text-gray-500">Loading work items…</p>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-white/90">
            <ClipboardList className="size-4 text-brand-500" aria-hidden />
            Work progress
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {counts.groups} group{counts.groups === 1 ? "" : "s"} · {counts.tasks}{" "}
            task{counts.tasks === 1 ? "" : "s"} ·{" "}
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {counts.done} done
            </span>
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setStructureOpen(true)}
        >
          <ListTree className="mr-1.5 size-4" aria-hidden />
          View service structure
        </Button>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusChip label="Pending" count={counts.pending} color="gray" />
        <StatusChip label="In progress" count={counts.inProgress} color="blue" />
        <StatusChip label="Done" count={counts.done} color="emerald" />
        <StatusChip label="Blocked" count={counts.blocked} color="rose" />
        <StatusChip label="N/A" count={counts.notApplicable} color="slate" />
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Groups are collapsed by default — expand to work on tasks. For Done,
        Blocked, or N/A, add a remark and submit to view a summary table.
      </p>

      <div className="mt-4">
        <WorkItemGroupTree
          sections={sections}
          renderTask={(task, ctx) => (
            <TaskWorkCard
              task={task}
              engagementId={engagement.id}
              status={getStatus(task)}
              onStatusChange={(s) => setStatus(task.id, s)}
            />
          )}
        />
      </div>

      <CatalogStructureModal
        open={structureOpen}
        onClose={() => setStructureOpen(false)}
        catalogName={engagement.catalogName}
        workItems={mergedWorkItems}
      />
    </>
  );
}

function StatusChip({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: "gray" | "blue" | "emerald" | "rose" | "slate";
}) {
  const styles = {
    gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    blue: "bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
    emerald:
      "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    rose: "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${styles[color]}`}
    >
      {label}
      <span className="font-bold tabular-nums">{count}</span>
    </span>
  );
}

function TaskWorkCard({
  task,
  engagementId,
  status,
  onStatusChange,
}: {
  task: import("@/api/types/template-config").EngagementWorkItemResponse;
  engagementId: string;
  status: WorkItemStatus;
  onStatusChange: (status: WorkItemStatus) => void;
}) {
  const [builderOpen, setBuilderOpen] = useState(false);
  const {
    fields,
    values,
    savedAt,
    hydrated,
    isConfigured,
    persistTemplate,
    persistValues,
  } = useWorkItemFieldState(engagementId, task.id);

  const {
    closure,
    hydrated: closureHydrated,
    showSummary,
    isClosure,
    setRemark,
    submitClosure,
    reopenClosure,
  } = useWorkItemClosure(engagementId, task.id, status);

  if (!hydrated || !closureHydrated) {
    return (
      <article className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700">
        <p className="text-sm text-gray-400">Loading…</p>
      </article>
    );
  }

  return (
    <>
      <article className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900/20">
        <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800 sm:px-4">
          <div className="min-w-0 flex-1">
            <h6 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {task.name}
            </h6>
            {task.description ? (
              <p className="truncate text-xs text-gray-500">{task.description}</p>
            ) : null}
          </div>
          <TaskStatusPicker value={status} onChange={onStatusChange} />
        </div>

        <div className="p-3 sm:p-4">
          {showSummary && isClosureStatus(status) ? (
            <TaskClosureSummary
              status={status as ClosureStatus}
              remark={closure.remark}
              submittedAt={closure.submittedAt!}
              fields={fields}
              values={values}
              onReopen={reopenClosure}
            />
          ) : isClosure ? (
            <TaskClosureForm
              status={status as ClosureStatus}
              fields={fields}
              values={values}
              savedAt={savedAt}
              workItemId={task.id}
              remark={closure.remark}
              isConfigured={isConfigured}
              onRemarkChange={setRemark}
              onSaveValues={persistValues}
              onSubmit={(nextValues, remark) => {
                persistValues(nextValues);
                submitClosure(status, remark);
              }}
              onEditFields={
                isConfigured ? () => setBuilderOpen(true) : undefined
              }
            />
          ) : !isConfigured ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/80 px-4 py-8 text-center dark:border-gray-600 dark:bg-gray-900/20">
              <SlidersHorizontal
                className="mx-auto size-8 text-gray-300 dark:text-gray-600"
                aria-hidden
              />
              <p className="mt-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                No fields configured yet
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
                Choose what to capture — text, documents, dates, and notes.
              </p>
              <Button
                type="button"
                className="mt-4"
                size="sm"
                onClick={() => setBuilderOpen(true)}
              >
                <Settings2 className="mr-1.5 size-4" aria-hidden />
                Choose fields to capture
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBuilderOpen(true)}
                >
                  <Settings2 className="mr-1.5 size-3.5" aria-hidden />
                  Edit fields
                </Button>
              </div>
              <TaskFieldForm
                fields={fields}
                values={values}
                savedAt={savedAt}
                readOnly={false}
                workItemId={task.id}
                onSave={persistValues}
              />
            </>
          )}
        </div>
      </article>

      <FieldBuilderModal
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        taskName={task.name}
        initialFields={fields}
        onSave={persistTemplate}
      />
    </>
  );
}
