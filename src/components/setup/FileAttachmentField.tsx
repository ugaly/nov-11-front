"use client";

import type { WorkItemFileAttachment } from "@/api/types/work-item-template";
import FilePreviewModal from "@/components/setup/FilePreviewModal";
import { attachmentPreviewSrc } from "@/lib/work-item-api-files";
import {
  attachmentsToFieldPatch,
  formatFileSize,
  getAttachments,
} from "@/lib/work-item-file-utils";
import type { WorkItemFieldValue } from "@/api/types/work-item-template";
import {
  FileSpreadsheet,
  FileText,
  FileType2,
  Plus,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

const TILE_ASPECT = "aspect-[5/4]";

function TileIcon({ kind }: { kind: WorkItemFileAttachment["kind"] }) {
  switch (kind) {
    case "pdf":
      return (
        <FileText
          className="size-10 text-rose-500 drop-shadow-sm"
          aria-hidden
        />
      );
    case "spreadsheet":
      return (
        <FileSpreadsheet
          className="size-10 text-emerald-600 drop-shadow-sm"
          aria-hidden
        />
      );
    case "document":
      return (
        <FileType2
          className="size-10 text-blue-500 drop-shadow-sm"
          aria-hidden
        />
      );
    default:
      return (
        <FileType2 className="size-10 text-gray-400" aria-hidden />
      );
  }
}

function tileBg(kind: WorkItemFileAttachment["kind"]) {
  switch (kind) {
    case "pdf":
      return "bg-gradient-to-br from-rose-50 to-rose-100/80 dark:from-rose-950/50 dark:to-rose-900/30";
    case "spreadsheet":
      return "bg-gradient-to-br from-emerald-50 to-emerald-100/80 dark:from-emerald-950/50 dark:to-emerald-900/30";
    case "document":
      return "bg-gradient-to-br from-blue-50 to-blue-100/80 dark:from-blue-950/50 dark:to-blue-900/30";
    default:
      return "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900";
  }
}

function AttachmentTile({
  file,
  readOnly,
  onOpen,
  onRemove,
}: {
  file: WorkItemFileAttachment;
  readOnly?: boolean;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const previewSrc = attachmentPreviewSrc(file);
  const isImage =
    (file.kind === "image" ||
      file.mimeType.startsWith("image/")) &&
    Boolean(previewSrc);

  return (
    <div
      className={`group relative ${TILE_ASPECT} overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-100 transition hover:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:ring-gray-800 dark:hover:ring-brand-700`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 z-0 flex w-full flex-col"
        aria-label={`Preview ${file.name}`}
      >
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewSrc}
            alt={file.name}
            className="size-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className={`flex flex-1 flex-col items-center justify-center gap-2 px-2 ${tileBg(file.kind)}`}
          >
            <TileIcon kind={file.kind} />
            <span className="max-w-full truncate px-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              {file.kind === "spreadsheet"
                ? "Excel / CSV"
                : file.kind === "pdf"
                  ? "PDF"
                  : "File"}
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-2 pb-2 pt-8">
          <p className="truncate text-left text-[11px] font-medium text-white">
            {file.name}
          </p>
          <p className="text-left text-[10px] text-white/75">
            {formatFileSize(file.size)}
          </p>
        </div>
      </button>

      {!readOnly ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-1.5 top-1.5 z-10 flex size-7 items-center justify-center rounded-full bg-gray-900/75 text-white shadow-md backdrop-blur-sm transition hover:bg-error-600"
          aria-label={`Remove ${file.name}`}
        >
          <X className="size-3.5" strokeWidth={2.5} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

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

  return (
    <div className="sm:col-span-2">
      {label ? label : null}

      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {attachments.map((file) => (
          <AttachmentTile
            key={file.id}
            file={file}
            readOnly={readOnly}
            onOpen={() => setPreviewFile(file)}
            onRemove={() => remove(file.id)}
          />
        ))}

        {showAddTile ? (
          <label
            className={`relative flex ${TILE_ASPECT} cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/80 text-gray-500 transition hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600 dark:border-gray-600 dark:bg-gray-900/30 dark:hover:border-brand-600 dark:hover:text-brand-400 ${uploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <Plus className="size-6" aria-hidden />
            <span className="px-2 text-center text-xs font-medium">
              {uploading
                ? "Adding…"
                : allowMultiple
                  ? "Add files"
                  : "Add file"}
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
        ) : null}
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
