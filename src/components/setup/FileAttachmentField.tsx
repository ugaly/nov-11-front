"use client";

import type { WorkItemFileAttachment } from "@/api/types/work-item-template";
import FilePreviewModal from "@/components/setup/FilePreviewModal";
import {
  FILE_TILE_ASPECT,
  FileAttachmentTileGrid,
} from "@/components/setup/file-attachment-tiles";
import {
  attachmentsToFieldPatch,
  getAttachments,
} from "@/lib/work-item-file-utils";
import type { WorkItemFieldValue } from "@/api/types/work-item-template";
import { Plus, Upload } from "lucide-react";
import { useState, type DragEvent, type ReactNode } from "react";

export default function FileAttachmentField({
  label,
  value,
  readOnly,
  allowMultiple,
  onChange,
  onUploadFile,
  emptyMessage,
  readOnlyHint,
  className,
  uploadStyle = "tile",
}: {
  label?: ReactNode | null;
  value?: WorkItemFieldValue;
  readOnly?: boolean;
  allowMultiple?: boolean;
  onChange: (patch: Partial<WorkItemFieldValue>) => void;
  /** When set, uploads to API instead of base64 local storage. */
  onUploadFile?: (file: File) => Promise<WorkItemFileAttachment>;
  /** Shown when read-only and there are no attachments yet. */
  emptyMessage?: ReactNode;
  /** Hint below tiles when read-only and files are present. */
  readOnlyHint?: string;
  className?: string;
  /** Banner = full-width drop zone (public customer forms). Tile = compact grid add tile. */
  uploadStyle?: "tile" | "banner";
}) {
  const attachments = getAttachments(value);
  const [previewFile, setPreviewFile] = useState<WorkItemFileAttachment | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  async function handleFiles(list: FileList | null) {
    if (!list?.length || readOnly) return;
    if (!onUploadFile) {
      setUploadError(
        "File upload is not ready. Wait for the form to load, then try again."
      );
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const incoming: WorkItemFileAttachment[] = [];
      for (const file of Array.from(list)) {
        try {
          incoming.push(await onUploadFile(file));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Upload failed.";
          setUploadError(
            message.includes("No company")
              ? "Cannot upload files until the page finishes loading."
              : `"${file.name}": ${message}`
          );
        }
      }
      if (!incoming.length) return;
      const next = allowMultiple
        ? [...attachments, ...incoming]
        : [incoming[0]!];
      onChange(attachmentsToFieldPatch(next));
    } finally {
      setUploading(false);
    }
  }

  function remove(id: string) {
    const next = attachments.filter((a) => a.id !== id);
    onChange(attachmentsToFieldPatch(next));
  }

  const showAddTile =
    uploadStyle === "tile" &&
    !readOnly &&
    (allowMultiple || attachments.length === 0);

  const showBannerUpload =
    uploadStyle === "banner" &&
    !readOnly &&
    (allowMultiple || attachments.length === 0);

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    if (!readOnly && !uploading) setDragActive(true);
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault();
    setDragActive(false);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragActive(false);
    void handleFiles(e.dataTransfer.files);
  }

  const bannerUpload = showBannerUpload ? (
    <label
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`relative flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
        attachments.length > 0 ? "py-5" : "py-10"
      } ${
        dragActive
          ? "border-brand-400 bg-brand-50/60 text-brand-700 dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-300"
          : "border-gray-300 bg-gray-50/80 text-gray-600 hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-700 dark:border-gray-600 dark:bg-gray-900/30 dark:text-gray-400 dark:hover:border-brand-600 dark:hover:text-brand-400"
      } ${uploading ? "pointer-events-none opacity-60" : ""}`}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
        <Upload className="size-5" aria-hidden />
      </span>
      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
        {uploading
          ? "Uploading…"
          : attachments.length > 0
            ? "Add another file"
            : allowMultiple
              ? "Upload your documents"
              : "Upload your document"}
      </span>
      <span className="max-w-sm text-xs text-gray-500">
        Drag and drop here, or click to choose · PDF, images, Excel, Word
      </span>
      <input
        type="file"
        className="sr-only"
        disabled={uploading}
        multiple={allowMultiple}
        accept="image/*,.pdf,.xlsx,.xls,.csv,.doc,.docx"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  ) : null;

  const addTile = showAddTile ? (
    <label
      className={`relative flex ${FILE_TILE_ASPECT} cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/80 text-gray-500 transition hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600 dark:border-gray-600 dark:bg-gray-900/30 dark:hover:border-brand-600 dark:hover:text-brand-400 ${uploading ? "pointer-events-none opacity-60" : ""}`}
    >
      <Plus className="size-6" aria-hidden />
      <span className="px-2 text-center text-xs font-medium">
        {uploading ? "Adding…" : allowMultiple ? "Add files" : "Add file"}
      </span>
      <input
        type="file"
        className="sr-only"
        disabled={uploading}
        multiple={allowMultiple}
        accept="image/*,.pdf,.xlsx,.xls,.csv,.doc,.docx"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  ) : null;

  return (
    <div className={className ?? "sm:col-span-2"}>
      {label ? label : null}

      <div
        className={
          uploadStyle === "banner" ? "mt-2 space-y-3" : "mt-2"
        }
      >
        {uploadStyle === "banner" && attachments.length === 0 ? bannerUpload : null}
        {(attachments.length > 0 || uploadStyle === "tile") && (
          <FileAttachmentTileGrid
            files={attachments}
            readOnly={readOnly}
            onOpen={setPreviewFile}
            onRemove={readOnly ? undefined : remove}
            addTile={addTile}
            emptyMessage={emptyMessage}
          />
        )}
        {uploadStyle === "banner" && attachments.length > 0 ? bannerUpload : null}
      </div>

      {uploadError ? (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          {uploadError}
        </p>
      ) : null}

      {!readOnly && attachments.length > 0 ? (
        <p className="mt-2 text-xs text-gray-500">
          {uploadStyle === "banner"
            ? "Tap a file to preview · use the × to remove"
            : "Click a tile to preview · use the × badge to remove"}
        </p>
      ) : null}

      {readOnly && attachments.length > 0 && readOnlyHint ? (
        <p className="mt-2 text-xs text-gray-500">{readOnlyHint}</p>
      ) : null}

      <FilePreviewModal
        file={previewFile}
        open={previewFile != null}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}
