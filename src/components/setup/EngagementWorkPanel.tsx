"use client";

import type {
  CustomerEngagementResponse,
  CustomerResponse,
  WorkItemStatus,
} from "@/api/types/template-config";
import CatalogStructureModal from "@/components/setup/CatalogStructureModal";
import ExportListMenu from "@/components/setup/ExportListMenu";
import FieldBuilderModal from "@/components/setup/FieldBuilderModal";
import ExportGroupFormButton from "@/components/setup/ExportGroupFormButton";
import ShareFormLinkButton from "@/components/setup/ShareFormLinkButton";
import TaskClosureForm from "@/components/setup/TaskClosureForm";
import TaskClosureSummary from "@/components/setup/TaskClosureSummary";
import TaskFieldForm from "@/components/setup/TaskFieldForm";
import WorkItemSubmissionControls from "@/components/setup/WorkItemSubmissionControls";
import TaskStatusPicker from "@/components/setup/TaskStatusPicker";
import { useWorkItemClosure } from "@/hooks/useWorkItemClosure";
import { useWorkItemOutputFiles } from "@/hooks/useWorkItemOutputFiles";
import {
  isClosureStatus,
  type ClosureStatus,
} from "@/lib/work-item-closure-store";
import WorkItemGroupTree from "@/components/setup/WorkItemGroupTree";
import Button from "@/components/ui/button/Button";
import { useEngagementWorkItemStatuses } from "@/hooks/useEngagementWorkItemStatuses";
import { useWorkItemFieldState } from "@/hooks/useWorkItemFieldState";
import { prepareFieldValuesForApi } from "@/lib/work-item-field-store";
import {
  buildWorkGroupSections,
  buildWorkItemTree,
  countWorkItems,
} from "@/lib/work-item-tree";
import SetupEmptyState from "@/components/setup/SetupEmptyState";
import { ClipboardList, ListTree, Settings2, SlidersHorizontal } from "lucide-react";
import {
  loadExpandedGroups,
  saveExpandedGroups,
} from "@/lib/work-group-expanded-storage";
import { workItemHasExportableData } from "@/lib/export/work-item-field-format";
import {
  customerForTaskExport,
  exportWorkItemTaskExcel,
  exportWorkItemTaskPdf,
  type WorkItemTaskExportInput,
} from "@/lib/export/work-item-task-export";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function EngagementWorkPanel({
  companyId,
  engagement,
  customer,
  onEngagementRefresh,
}: {
  companyId: string;
  engagement: CustomerEngagementResponse;
  customer?: CustomerResponse;
  onEngagementRefresh?: () => void | Promise<void>;
}) {
  const { companyName } = useCompanyContext();
  const exportCustomer = useMemo(
    () => customerForTaskExport(engagement, customer),
    [engagement, customer]
  );
  const [structureOpen, setStructureOpen] = useState(false);
  const {
    getStatus,
    setStatus,
    mergedWorkItems,
    ready: statusReady,
    statusError,
  } = useEngagementWorkItemStatuses(
    companyId,
    engagement.id,
    engagement.workItems,
    onEngagementRefresh
  );

  const tree = useMemo(
    () => buildWorkItemTree(mergedWorkItems),
    [mergedWorkItems]
  );
  const sections = useMemo(() => buildWorkGroupSections(tree), [tree]);
  const counts = useMemo(
    () => countWorkItems(mergedWorkItems),
    [mergedWorkItems]
  );

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => loadExpandedGroups(engagement.id)
  );

  useEffect(() => {
    setExpandedGroups(loadExpandedGroups(engagement.id));
  }, [engagement.id]);

  useEffect(() => {
    saveExpandedGroups(engagement.id, expandedGroups);
  }, [engagement.id, expandedGroups]);

  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }, []);

  const progressPct =
    counts.tasks > 0 ? Math.round((counts.done / counts.tasks) * 100) : 0;

  if (engagement.workItems.length === 0) {
    return (
      <SetupEmptyState
        icon={ClipboardList}
        title="No work items on this engagement yet."
        variant="bordered"
      />
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

      {statusError ? (
        <p className="mt-2 text-xs text-error-600">{statusError}</p>
      ) : null}

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
          expandedGroups={expandedGroups}
          onToggleGroup={toggleGroup}
          renderGroupActions={(section) => (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ExportGroupFormButton
                companyId={companyId}
                engagement={engagement}
                customer={exportCustomer}
                companyName={companyName ?? "Company"}
                section={section}
              />
              <ShareFormLinkButton
                companyId={companyId}
                engagementId={engagement.id}
                workItemId={section.key}
                label="Share group"
                size="sm"
              />
            </div>
          )}
          renderTask={(task, ctx) => (
            <TaskWorkCard
              companyId={companyId}
              task={task}
              engagement={engagement}
              customer={exportCustomer}
              companyName={companyName ?? "Company"}
              groupLabel={
                ctx.groupNumber > 0
                  ? ctx.groupTitle ?? `Group ${ctx.groupNumber}`
                  : null
              }
              engagementId={engagement.id}
              status={getStatus(task)}
              onStatusChange={(s) => {
                if (ctx.groupKey) {
                  setExpandedGroups((prev) => ({
                    ...prev,
                    [ctx.groupKey!]: true,
                  }));
                }
                void setStatus(task.id, s);
              }}
              onTaskUpdated={onEngagementRefresh}
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

function TaskSectionExportMenu({
  input,
  disabled,
}: {
  input: WorkItemTaskExportInput;
  disabled?: boolean;
}) {
  return (
    <ExportListMenu
      label="Export section"
      disabled={disabled}
      onExportPdf={() => exportWorkItemTaskPdf(input)}
      onExportExcel={() => exportWorkItemTaskExcel(input)}
    />
  );
}

function TaskWorkCard({
  companyId,
  task,
  engagement,
  customer,
  companyName,
  groupLabel,
  engagementId,
  status,
  onStatusChange,
  onTaskUpdated,
}: {
  companyId: string;
  task: import("@/api/types/template-config").EngagementWorkItemResponse;
  engagement: CustomerEngagementResponse;
  customer: CustomerResponse;
  companyName: string;
  groupLabel: string | null;
  engagementId: string;
  status: WorkItemStatus;
  onStatusChange: (status: WorkItemStatus) => void;
  onTaskUpdated?: () => void | Promise<void>;
}) {
  const [builderOpen, setBuilderOpen] = useState(false);
  const {
    fields,
    values,
    savedAt,
    hydrated,
    isConfigured,
    responsesLocked,
    internalEditEnabled,
    publicSubmitEnabled,
    staffEditLocked,
    controlsSaving,
    patchSubmissionControls,
    formLinkUrl,
    error: fieldError,
    persistTemplate,
    persistValues,
    uploadFieldFile,
    ensureFormLink,
    reload: reloadFields,
    closureInitial,
  } = useWorkItemFieldState(companyId, engagementId, task.id);

  const closureMode = isClosureStatus(status);
  const {
    files: outputFiles,
    loading: outputFilesLoading,
    uploading: outputFilesUploading,
    error: outputFilesError,
    reload: reloadOutputFiles,
    uploadFile: uploadOutputFile,
    removeFile: removeOutputFile,
  } = useWorkItemOutputFiles(companyId, engagementId, task.id, {
    enabled: closureMode,
  });

  const afterMutation = async () => {
    await reloadFields();
    await reloadOutputFiles();
    await onTaskUpdated?.();
  };

  const {
    closure,
    hydrated: closureHydrated,
    showSummary,
    isClosure,
    error: closureError,
    setRemark,
    submitClosure,
    reopenClosure,
  } = useWorkItemClosure(engagementId, task.id, status, companyId, {
    initialClosure: closureInitial,
    onAfterSubmit: afterMutation,
  });

  if (!hydrated || !closureHydrated) {
    return (
      <article className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700">
        <p className="text-sm text-gray-400">Loading…</p>
      </article>
    );
  }

  const fieldFormProps = {
    fields,
    values,
    savedAt,
    workItemId: task.id,
    formLinkUrl,
    onEnsureFormLink: async () => {
      const link = await ensureFormLink();
      return link?.url ?? null;
    },
    onUploadFieldFile: uploadFieldFile,
    readOnly: staffEditLocked,
  };

  const exportInput: WorkItemTaskExportInput = {
    companyName,
    customer,
    engagement,
    task,
    groupLabel,
    fields,
    values,
    status,
    closureRemark: closure.remark,
    closureSubmittedAt: closure.submittedAt,
    outputFiles,
  };

  const hasExportData = workItemHasExportableData(fields, values, {
    closureRemark: closure.remark,
    closureSubmittedAt: closure.submittedAt,
    outputFiles,
  });

  return (
    <>
      <article className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900/20">
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800 sm:px-4">
          <div className="min-w-0 flex-1">
            <h6 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {task.name}
            </h6>
            {task.description ? (
              <p className="truncate text-xs text-gray-500">{task.description}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {hasExportData ? (
              <TaskSectionExportMenu input={exportInput} />
            ) : null}
            <TaskStatusPicker value={status} onChange={onStatusChange} />
          </div>
        </div>

        <div className="p-3 sm:p-4">
          {fieldError ? (
            <p className="mb-2 text-xs text-error-600">{fieldError}</p>
          ) : null}
          {closureError ? (
            <p className="mb-2 text-xs text-error-600">{closureError}</p>
          ) : null}

          {showSummary && isClosureStatus(status) ? (
            <>
              <TaskClosureSummary
                status={status as ClosureStatus}
                remark={closure.remark}
                submittedAt={closure.submittedAt!}
                fields={fields}
                values={values}
                outputFiles={outputFiles}
                onReopen={() => void reopenClosure()}
              />
            </>
          ) : isClosure ? (
            <>
              {isConfigured ? (
                <WorkItemSubmissionControls
                  publicSubmitEnabled={publicSubmitEnabled}
                  internalEditEnabled={internalEditEnabled}
                  responsesLocked={responsesLocked}
                  saving={controlsSaving}
                  onSave={patchSubmissionControls}
                />
              ) : null}
              <TaskClosureForm
              status={status as ClosureStatus}
              fields={fields}
              values={values}
              savedAt={savedAt}
              workItemId={task.id}
              remark={closure.remark}
              isConfigured={isConfigured}
              onRemarkChange={setRemark}
              onSaveValues={() => {}}
              onSubmit={async (nextValues, remark) => {
                await submitClosure(
                  status as ClosureStatus,
                  remark,
                  prepareFieldValuesForApi(nextValues, fields),
                  outputFiles.map((f) => f.id)
                );
              }}
              onEditFields={
                isConfigured ? () => setBuilderOpen(true) : undefined
              }
              formLinkUrl={formLinkUrl}
              onUploadFieldFile={uploadFieldFile}
              responsesLocked={staffEditLocked}
              outputFiles={outputFiles}
              outputFilesLoading={outputFilesLoading}
              outputFilesUploading={outputFilesUploading}
              outputFilesError={outputFilesError}
              onUploadOutputFile={async (file) => {
                await uploadOutputFile(file);
              }}
              onRemoveOutputFile={async (fileId) => {
                await removeOutputFile(fileId);
              }}
            />
            </>
          ) : !isConfigured ? (
            <SetupEmptyState
              icon={SlidersHorizontal}
              title="No fields configured yet"
              description="Choose what to capture — text, documents, dates, and notes."
              variant="bordered"
              action={
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setBuilderOpen(true)}
                >
                  <Settings2 className="mr-1.5 size-4" aria-hidden />
                  Choose fields to capture
                </Button>
              }
            />
          ) : (
            <>
              <WorkItemSubmissionControls
                publicSubmitEnabled={publicSubmitEnabled}
                internalEditEnabled={internalEditEnabled}
                responsesLocked={responsesLocked}
                saving={controlsSaving}
                onSave={patchSubmissionControls}
              />
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
                {...fieldFormProps}
                onSave={(v) => void persistValues(v)}
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
        onSave={async (next) => {
          await persistTemplate(next);
          await afterMutation();
        }}
      />
    </>
  );
}
