import {
  EXPORT_LOGO_PATH,
  INVOICE_EXPORT_LOGO_PATH,
  LOGO_FALLBACK_PATHS,
} from "@/lib/export/constants";

export type LogoDataUrl = {
  dataUrl: string;
  format: "JPEG" | "PNG";
};

function absolutePublicUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

function imageToDataUrl(img: HTMLImageElement): LogoDataUrl {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare logo for export.");
  ctx.drawImage(img, 0, 0);
  const dataUrl = canvas.toDataURL("image/png");
  return { dataUrl, format: "PNG" };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

async function tryLoadLogo(path: string): Promise<LogoDataUrl | null> {
  try {
    const img = await loadImage(absolutePublicUrl(path));
    if (!img.naturalWidth && !img.width) return null;
    return imageToDataUrl(img);
  } catch {
    return null;
  }
}

/** Loads sidebar logo for PDF header; falls back to SVG logos. */
export async function loadExportLogo(): Promise<LogoDataUrl | null> {
  const primary = await tryLoadLogo(EXPORT_LOGO_PATH);
  if (primary) return primary;
  for (const path of LOGO_FALLBACK_PATHS) {
    const logo = await tryLoadLogo(path);
    if (logo) return logo;
  }
  return null;
}

/** Invoice document PDF — uses `invoice-logo.png` (white background). */
export async function loadInvoiceExportLogo(): Promise<LogoDataUrl | null> {
  return tryLoadLogo(INVOICE_EXPORT_LOGO_PATH);
}
