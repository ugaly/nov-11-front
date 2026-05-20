"use client";

import type {
  WorkItemFieldDefinition,
  WorkItemFieldValue,
} from "@/api/types/work-item-template";
import ClosureOutputFilesField from "@/components/setup/ClosureOutputFilesField";
import TaskFieldForm from "@/components/setup/TaskFieldForm";
import { statusLabel } from "@/components/setup/TaskStatusPicker";
import type { WorkItemFileAttachment } from "@/api/types/work-item-template";
import type { ClosureStatus } from "@/lib/work-item-closure-store";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import { useEffect, useRef, useState } from "react";

export default function TaskClosureForm({
  status,
  fields,
  values,
  savedAt,
  workItemId,
  remark,
  isConfigured,
  onRemarkChange,
  onSaveValues,
  onSubmit,
  onEditFields,
  formLinkUrl,
  onUploadFieldFile,
  responsesLocked,
  outputFiles,
  outputFilesLoading,
  outputFilesUploading,
  outputFilesError,
  onUploadOutputFile,
  onRemoveOutputFile,
}: {
  status: ClosureStatus;
  fields: WorkItemFieldDefinition[];
  values: WorkItemFieldValue[];
  savedAt: string | null;
  workItemId: string;
  remark: string;
  isConfigured: boolean;
  onRemarkChange: (remark: string) => void;
  onSaveValues: (values: WorkItemFieldValue[]) => void | Promise<void>;
  onSubmit: (values: WorkItemFieldValue[], remark: string) => void | Promise<void>;
  onEditFields?: () => void;
  formLinkUrl?: string | null;
  onUploadFieldFile?: (
    fieldId: string,
    file: File
  ) => Promise<WorkItemFileAttachment>;
  responsesLocked?: boolean;
  outputFiles?: WorkItemFileAttachment[];
  outputFilesLoading?: boolean;
  outputFilesUploading?: boolean;
  outputFilesError?: string | null;
  onUploadOutputFile?: (file: File) => Promise<void>;
  onRemoveOutputFile?: (fileId: string) => Promise<void>;
}) {
  const [draftRemark, setDraftRemark] = useState(remark);
  const [submitting, setSubmitting] = useState(false);
  const getValuesRef = useRef<() => WorkItemFieldValue[]>(() => values);

  useEffect(() => {
    setDraftRemark(remark);
  }, [remark]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const nextValues = getValuesRef.current();
      onRemarkChange(draftRemark);
      await onSubmit(nextValues, draftRemark);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
        Marked as <strong>{statusLabel(status)}</strong> — add a remark and
        submit to lock this section. Responses will display in a summary table.
      </p>

      {isConfigured ? (
        <>
          {onEditFields ? (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onEditFields}
              >
                Edit fields
              </Button>
            </div>
          ) : null}
          <TaskFieldForm
            fields={fields}
            values={values}
            savedAt={savedAt}
            readOnly={responsesLocked ?? false}
            workItemId={workItemId}
            formLinkUrl={formLinkUrl}
            onUploadFieldFile={onUploadFieldFile}
            onSave={onSaveValues}
            hideActions
            registerGetValues={(fn) => {
              getValuesRef.current = fn;
            }}
          />
        </>
      ) : null}

      <div>
        <Label>Closure remark</Label>
        <textarea
          rows={3}
          value={draftRemark}
          onChange={(e) => setDraftRemark(e.target.value)}
          disabled={responsesLocked}
          placeholder={`Why is this task ${statusLabel(status).toLowerCase()}?`}
          className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        />
        <p className="mt-1 text-xs text-gray-500">
          Stored as the closure note (`remark` on POST /closure).
        </p>
      </div>

      <ClosureOutputFilesField
        files={outputFiles ?? []}
        readOnly={responsesLocked}
        loading={outputFilesLoading}
        uploading={outputFilesUploading}
        error={outputFilesError}
        onUpload={
          onUploadOutputFile
            ? async (file) => {
                await onUploadOutputFile(file);
              }
            : undefined
        }
        onRemove={onRemoveOutputFile}
      />

      <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit closure"}
        </Button>
      </div>
    </form>
  );
}
