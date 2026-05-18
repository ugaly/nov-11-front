import type { WorkItemFileDto } from "@/api/types/work-item-api";
import type { WorkItemFileAttachment } from "@/api/types/work-item-template";
import { isApiMediaUrl, toMediaProxyUrl } from "@/lib/media-proxy-url";
import { normalizeAttachmentFromApi } from "@/lib/work-item-file-utils";

/** Map API file DTO to UI attachment (preview via `url`). */
export function apiFileToAttachment(dto: WorkItemFileDto): WorkItemFileAttachment {
  return normalizeAttachmentFromApi({
    id: dto.id,
    name: dto.name,
    mimeType: dto.mimeType,
    size: dto.size,
    url: dto.url,
    dataUrl: "",
  });
}

export { normalizeAttachmentFromApi } from "@/lib/work-item-file-utils";

export function attachmentPreviewSrc(att: WorkItemFileAttachment): string {
  const raw = att.url ?? att.dataUrl ?? "";
  return raw.trim();
}

/** Open media URL (absolute from API). */
export function attachmentOpenUrl(att: WorkItemFileAttachment): string {
  return attachmentPreviewSrc(att);
}

function isPdfAttachment(att: WorkItemFileAttachment): boolean {
  return att.kind === "pdf" || att.mimeType === "application/pdf";
}

/** Src for iframe/object embed — PDFs from API use same-origin proxy. */
export function attachmentEmbedSrc(att: WorkItemFileAttachment): string {
  const src = attachmentPreviewSrc(att);
  if (!src) return src;
  if (isPdfAttachment(att) && isApiMediaUrl(src)) {
    return toMediaProxyUrl(src);
  }
  return src;
}

export function canPreviewApiAttachment(att: WorkItemFileAttachment): boolean {
  const src = attachmentPreviewSrc(att);
  if (!src) return false;
  const kind =
    att.kind ??
    (att.mimeType.startsWith("image/")
      ? "image"
      : att.mimeType === "application/pdf"
        ? "pdf"
        : "other");
  return kind === "image" || kind === "pdf" || kind === "spreadsheet";
}
