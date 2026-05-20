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
import { Plus } from "lucide-react";
import { useState, type ReactNode } from "react";

export default function FileAttachmentField({
  label,
  value,
  readOnly,
  allowMultiple,
  onChange,
  onUploadFile,
}: {
  label?: ReactNode | null;
  value?: WorkItemFieldValue;
  readOnly?: boolean;
  allowMultiple?: boolean;
  onChange: (patch: Partial<WorkItemFieldValue>) => void;
  /** When set, uploads to API instead of base64 local storage. */
  onUploadFile?: (file: File) => Promise<WorkItemFileAttachment>;
}) {
  const attachments = getAttachments(value);
  const [previewFile, setPreviewFile] = useState<WorkItemFileAttachment | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  const showAddTile = !readOnly && (allowMultiple || attachments.length === 0);

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
    <div className="sm:col-span-2">
      {label ? label : null}

      <div className="mt-2">
        <FileAttachmentTileGrid
          files={attachments}
          readOnly={readOnly}
          onOpen={setPreviewFile}
          onRemove={readOnly ? undefined : remove}
          addTile={addTile}
        />
      </div>

      {uploadError ? (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          {uploadError}
        </p>
      ) : null}

      {!readOnly && attachments.length > 0 ? (
        <p className="mt-2 text-xs text-gray-500">
          Click a tile to preview · use the × badge to remove
        </p>
      ) : null}

      <FilePreviewModal
        file={previewFile}
        open={previewFile != null}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}
