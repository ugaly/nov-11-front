"use client";

import type { WorkItemFileAttachment } from "@/api/types/work-item-template";
import { attachmentPreviewSrc } from "@/lib/work-item-api-files";
import { formatFileSize } from "@/lib/work-item-file-utils";
import {
  FileSpreadsheet,
  FileText,
  FileType2,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

export const FILE_TILE_ASPECT = "aspect-[5/4]";

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
        <FileType2 className="size-10 text-gray-400 drop-shadow-sm" aria-hidden />
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

export function FileAttachmentTile({
  file,
  readOnly,
  onOpen,
  onRemove,
}: {
  file: WorkItemFileAttachment;
  readOnly?: boolean;
  onOpen: () => void;
  onRemove?: () => void;
}) {
  const previewSrc = attachmentPreviewSrc(file);
  const isImage =
    (file.kind === "image" || file.mimeType.startsWith("image/")) &&
    Boolean(previewSrc);

  return (
    <div
      className={`group relative ${FILE_TILE_ASPECT} overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-100 transition hover:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:ring-gray-800 dark:hover:ring-brand-700`}
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

      {!readOnly && onRemove ? (
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

export function FileAttachmentTileGrid({
  files,
  readOnly,
  onOpen,
  onRemove,
  addTile,
  emptyMessage,
}: {
  files: WorkItemFileAttachment[];
  readOnly?: boolean;
  onOpen: (file: WorkItemFileAttachment) => void;
  onRemove?: (fileId: string) => void;
  addTile?: ReactNode;
  emptyMessage?: ReactNode;
}) {
  if (!files.length && !addTile) {
    return emptyMessage ? (
      <p className="text-xs text-gray-500 italic">{emptyMessage}</p>
    ) : null;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {files.map((file) => (
        <FileAttachmentTile
          key={file.id}
          file={file}
          readOnly={readOnly}
          onOpen={() => onOpen(file)}
          onRemove={onRemove ? () => onRemove(file.id) : undefined}
        />
      ))}
      {addTile}
    </div>
  );
}
