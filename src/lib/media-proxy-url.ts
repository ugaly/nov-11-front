import { API_BASE_URL } from "@/api/config";

const MEDIA_PATH = "/media/";

/** True when URL points at backend `/media/...` (needs proxy for iframe PDF). */
export function isApiMediaUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return false;
  }
  if (trimmed.startsWith("/api/media-proxy/")) return true;

  const base = API_BASE_URL.replace(/\/$/, "");
  if (trimmed.startsWith(`${base}${MEDIA_PATH}`)) return true;
  if (trimmed.startsWith(MEDIA_PATH)) return true;

  try {
    const u = new URL(trimmed);
    const b = new URL(base);
    return u.origin === b.origin && u.pathname.startsWith(MEDIA_PATH);
  } catch {
    return false;
  }
}

/** Same-origin path so PDFs can embed in iframe (avoids cross-origin frame restrictions). */
export function toMediaProxyUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("/api/media-proxy/")) return trimmed;
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;

  const base = API_BASE_URL.replace(/\/$/, "");
  let mediaPath: string | null = null;

  if (trimmed.startsWith(`${base}${MEDIA_PATH}`)) {
    mediaPath = trimmed.slice(`${base}${MEDIA_PATH}`.length);
  } else if (trimmed.startsWith(MEDIA_PATH)) {
    mediaPath = trimmed.slice(MEDIA_PATH.length);
  } else {
    try {
      const u = new URL(trimmed);
      const b = new URL(base);
      if (u.origin === b.origin && u.pathname.startsWith(MEDIA_PATH)) {
        mediaPath =
          u.pathname.slice(MEDIA_PATH.length).replace(/^\//, "") + u.search;
      }
    } catch {
      /* not a URL */
    }
  }

  if (!mediaPath) return trimmed;
  return `/api/media-proxy/${mediaPath.replace(/^\//, "")}`;
}
