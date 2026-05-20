import type { WorkItemFileAttachment } from "@/api/types/work-item-template";
import { getAccessToken } from "@/lib/auth-storage";
import { attachmentPreviewSrc } from "@/lib/work-item-api-files";
import { isApiMediaUrl, toMediaProxyUrl } from "@/lib/media-proxy-url";

function resolveFetchUrl(src: string): string {
  if (typeof window === "undefined") return src;
  if (src.startsWith("/") && !src.startsWith("//")) {
    return `${window.location.origin}${src}`;
  }
  return src;
}

export async function fetchAttachmentBytes(
  att: WorkItemFileAttachment
): Promise<ArrayBuffer> {
  const raw = attachmentPreviewSrc(att);
  if (!raw) throw new Error(`No URL for ${att.name}`);

  const proxied = isApiMediaUrl(raw) ? toMediaProxyUrl(raw) : raw;
  const url = resolveFetchUrl(proxied);
  const headers: HeadersInit = {};
  const token = getAccessToken();
  if (token && (url.includes("/api/media-proxy/") || url.includes("/media/"))) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers, credentials: "same-origin" });
  if (!res.ok) {
    throw new Error(`Could not load ${att.name} (${res.status})`);
  }
  return res.arrayBuffer();
}

/** Rasterize unsupported image types to JPEG for PDF embedding. */
export async function imageBytesForPdfEmbed(
  att: WorkItemFileAttachment,
  bytes: ArrayBuffer
): Promise<{ data: Uint8Array; format: "jpg" | "png" }> {
  const mime = att.mimeType.toLowerCase();
  if (mime === "image/png") {
    return { data: new Uint8Array(bytes), format: "png" };
  }
  if (mime === "image/jpeg" || mime === "image/jpg") {
    return { data: new Uint8Array(bytes), format: "jpg" };
  }

  const blob = new Blob([bytes], { type: mime || "image/*" });
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error(`Could not process image ${att.name}`);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error(`Could not encode image ${att.name}`);
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return { data: out, format: "jpg" };
}
