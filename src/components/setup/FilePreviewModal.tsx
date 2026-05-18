"use client";

import type { WorkItemFileAttachment } from "@/api/types/work-item-template";
import {
  filePreviewModalClass,
  setupFormModalClass,
} from "@/components/setup/setupFormModal";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import {
  canPreviewAttachment,
  formatFileSize,
} from "@/lib/work-item-file-utils";
import {
  attachmentEmbedSrc,
  attachmentOpenUrl,
  attachmentPreviewSrc,
} from "@/lib/work-item-api-files";
import {
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FileType2,
} from "lucide-react";

function FileKindIcon({
  kind,
  className,
}: {
  kind: WorkItemFileAttachment["kind"];
  className?: string;
}) {
  const cn = className ?? "size-16";
  switch (kind) {
    case "pdf":
      return <FileText className={`${cn} text-rose-500`} aria-hidden />;
    case "spreadsheet":
      return (
        <FileSpreadsheet className={`${cn} text-emerald-600`} aria-hidden />
      );
    case "document":
      return <FileType2 className={`${cn} text-blue-500`} aria-hidden />;
    default:
      return <FileType2 className={`${cn} text-gray-400`} aria-hidden />;
  }
}

export default function FilePreviewModal({
  file,
  open,
  onClose,
}: {
  file: WorkItemFileAttachment | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!file) return null;

  const src = attachmentPreviewSrc(file);
  const embedSrc = attachmentEmbedSrc(file);
  const openUrl = attachmentOpenUrl(file);
  const hasData = Boolean(src);
  const previewable = canPreviewAttachment(file) || Boolean(file.url);
  const isImage =
    hasData &&
    (file.kind === "image" || file.mimeType.startsWith("image/"));
  const isPdf =
    hasData &&
    (file.kind === "pdf" || file.mimeType === "application/pdf");
  const isVisualPreview = isImage || isPdf;

  function download() {
    if (!openUrl || !file) return;
    const a = document.createElement("a");
    a.href = openUrl;
    a.download = file.name;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  }

  function openInNewTab() {
    if (!openUrl) return;
    window.open(openUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className={
        isVisualPreview ? filePreviewModalClass : setupFormModalClass
      }
    >
      <div
        className={
          isVisualPreview
            ? "flex max-h-[calc(98vh-2.5rem)] min-h-0 flex-col pr-10"
            : "pr-10"
        }
      >
        <div className="shrink-0">
          <p className="truncate text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
            {file.name}
          </p>
          <p className="mt-0.5 text-sm text-gray-500">
            {formatFileSize(file.size)}
            {file.mimeType ? ` · ${file.mimeType}` : null}
          </p>
        </div>

        <div
          className={
            isVisualPreview
              ? "mt-4 flex min-h-[min(70vh,40rem)] flex-1 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-950/5 dark:border-gray-700 dark:bg-gray-900/50"
              : "mt-5 flex min-h-[12rem] items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50"
          }
          style={
            isVisualPreview
              ? { height: "min(88vh, 60rem)" }
              : undefined
          }
        >
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={file.name}
              className="max-h-[min(88vh,60rem)] w-full object-contain"
              referrerPolicy="no-referrer"
            />
          ) : isPdf ? (
            <object
              data={embedSrc}
              type="application/pdf"
              className="size-full min-h-[min(70vh,40rem)] bg-white"
              style={{ height: "min(88vh, 60rem)" }}
            >
              <iframe
                title={file.name}
                src={embedSrc}
                className="size-full min-h-[min(70vh,40rem)] bg-white"
                style={{ height: "min(88vh, 60rem)" }}
              />
            </object>
          ) : (
            <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
              <div className="flex size-28 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
                <FileKindIcon kind={file.kind} className="size-14" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {file.kind === "spreadsheet"
                    ? "Spreadsheet"
                    : file.kind === "pdf"
                      ? "PDF document"
                      : "File"}
                </p>
                <p className="mt-1 max-w-sm text-xs text-gray-500">
                  {previewable
                    ? "Preview could not be loaded."
                    : file.kind === "spreadsheet"
                      ? "Download to open in Excel or Sheets."
                      : "Download to view on your device."}
                </p>
              </div>
              {hasData ? (
                <Button type="button" size="sm" onClick={download}>
                  <Download className="mr-1.5 size-4" aria-hidden />
                  Download file
                </Button>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  File content is not stored — re-upload to preview.
                </p>
              )}
            </div>
          )}
        </div>

        {hasData && isPdf ? (
          <div className="mt-4 flex shrink-0 justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openInNewTab}
            >
              <ExternalLink className="mr-1.5 size-4" aria-hidden />
              Open in new tab
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={download}>
              <Download className="mr-1.5 size-4" aria-hidden />
              Download
            </Button>
          </div>
        ) : null}

        {hasData && !isImage && !isPdf ? (
          <div className="mt-4 flex shrink-0 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={download}>
              <Download className="mr-1.5 size-4" aria-hidden />
              Download
            </Button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
