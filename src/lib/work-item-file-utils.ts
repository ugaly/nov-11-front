import type {
  WorkItemFileAttachment,
  WorkItemFileKind,
  WorkItemFieldValue,
} from "@/api/types/work-item-template";

/** Max size stored as data URL in localStorage (per file). */
export const MAX_FILE_DATA_URL_BYTES = 8 * 1024 * 1024;

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i;
const PDF_EXT = /\.pdf$/i;
const SHEET_EXT = /\.(xlsx?|csv|ods)$/i;
const DOC_EXT = /\.(docx?|pptx?|txt|rtf)$/i;

export function newAttachmentId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function kindFromMimeAndName(
  mimeType: string,
  name: string
): WorkItemFileKind {
  if (mimeType.startsWith("image/") || IMAGE_EXT.test(name)) return "image";
  if (mimeType === "application/pdf" || PDF_EXT.test(name)) return "pdf";
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv" ||
    SHEET_EXT.test(name)
  ) {
    return "spreadsheet";
  }
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    DOC_EXT.test(name)
  ) {
    return "document";
  }
  return "other";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function fileToAttachment(
  file: File
): Promise<WorkItemFileAttachment> {
  const kind = kindFromMimeAndName(file.type, file.name);
  let dataUrl = "";
  if (file.size <= MAX_FILE_DATA_URL_BYTES) {
    try {
      dataUrl = await readFileAsDataUrl(file);
    } catch {
      dataUrl = "";
    }
  }
  return {
    id: newAttachmentId(),
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    kind,
    dataUrl,
  };
}

/** Normalize legacy `fileNames`-only values into attachment records. */
export function getAttachments(
  value?: WorkItemFieldValue
): WorkItemFileAttachment[] {
  if (value?.attachments?.length) return value.attachments;
  return (value?.fileNames ?? []).map((name) => ({
    id: `legacy_${name}`,
    name,
    mimeType: "application/octet-stream",
    size: 0,
    kind: kindFromMimeAndName("", name),
    dataUrl: "",
  }));
}

export function attachmentsToFieldPatch(
  attachments: WorkItemFileAttachment[]
): Pick<WorkItemFieldValue, "attachments" | "fileNames"> {
  return {
    attachments,
    fileNames: attachments.map((a) => a.name),
  };
}

export function canPreviewAttachment(att: WorkItemFileAttachment): boolean {
  if (!att.dataUrl) return false;
  return (
    att.kind === "image" || att.kind === "pdf" || att.kind === "spreadsheet"
  );
}
