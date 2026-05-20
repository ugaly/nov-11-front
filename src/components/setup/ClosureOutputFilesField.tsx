"use client";

import type { WorkItemFileAttachment } from "@/api/types/work-item-template";
import FilePreviewModal from "@/components/setup/FilePreviewModal";
import {
  FILE_TILE_ASPECT,
  FileAttachmentTileGrid,
} from "@/components/setup/file-attachment-tiles";
import Label from "@/components/form/Label";
import { normalizeAttachmentFromApi } from "@/lib/work-item-file-utils";
import { Loader2, Plus } from "lucide-react";
import { useMemo, useState } from "react";

export default function ClosureOutputFilesField({
  files,
  readOnly,
  loading,
  uploading,
  error,
  compact,
  hideLabel,
  onUpload,
  onRemove,
}: {
  files: WorkItemFileAttachment[];
  readOnly?: boolean;
  loading?: boolean;
  uploading?: boolean;
  error?: string | null;
  /** Shorter layout for closure summary table */
  compact?: boolean;
  hideLabel?: boolean;
  onUpload?: (file: File) => Promise<void>;
  onRemove?: (fileId: string) => Promise<void>;
}) {
  const [previewFile, setPreviewFile] =
    useState<WorkItemFileAttachment | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const normalized = useMemo(
    () => files.map(normalizeAttachmentFromApi),
    [files]
  );

  async function handleFiles(list: FileList | null) {
    if (!list?.length || readOnly || !onUpload) return;
    setUploadError(null);
    for (const file of Array.from(list)) {
      try {
        await onUpload(file);
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : "Upload failed."
        );
      }
    }
  }

  const addTile =
    !readOnly && onUpload ? (
      <label
        className={`relative flex ${FILE_TILE_ASPECT} cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/80 text-gray-500 transition hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600 dark:border-gray-600 dark:bg-gray-900/30 dark:hover:border-brand-600 dark:hover:text-brand-400 ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <Plus className="size-6" aria-hidden />
        <span className="px-2 text-center text-xs font-medium">
          {uploading ? "Uploading…" : "Add deliverable"}
        </span>
        <input
          type="file"
          className="sr-only"
          disabled={uploading}
          multiple
          accept="image/*,.pdf,.xlsx,.xls,.csv,.doc,.docx"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
    ) : null;

  return (
    <div>
      {!hideLabel ? (
        <Label>
          {compact ? "Deliverables" : "Deliverables (output files)"}
        </Label>
      ) : null}
      {!compact && !hideLabel ? (
        <p className="mt-0.5 text-xs text-gray-500">
          Optional files attached when closing this task (contracts, signed
          PDFs, etc.). Upload before submit closure.
        </p>
      ) : null}

      {loading ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Loading deliverables…
        </p>
      ) : (
        <div className={compact ? "mt-1" : "mt-3"}>
          <FileAttachmentTileGrid
            files={normalized}
            readOnly={readOnly}
            onOpen={setPreviewFile}
            onRemove={!readOnly && onRemove ? onRemove : undefined}
            addTile={addTile}
            emptyMessage={
              readOnly ? "No deliverables." : undefined
            }
          />
        </div>
      )}

      {!readOnly && normalized.length > 0 ? (
        <p className="mt-2 text-xs text-gray-500">
          Click a tile to preview · use × to remove
        </p>
      ) : null}

      {uploadError ? (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          {uploadError}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-error-600">{error}</p>
      ) : null}

      <FilePreviewModal
        file={previewFile}
        open={previewFile != null}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}
