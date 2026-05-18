import { APP_LOGO_SRC } from "@/lib/brand-logo";

/** Same asset as the app sidebar (`AppSidebar`). */
export const EXPORT_LOGO_PATH = APP_LOGO_SRC;

export const LOGO_FALLBACK_PATHS = [
  "/images/logo/logo-dark.svg",
  "/images/logo/logo.svg",
] as const;

export const EXPORT_SERVICES_DESCRIPTION =
  "List of services for a company";

/** Black & white PDF theme (matches app). */
export const PDF_HEADER_RGB: [number, number, number] = [17, 17, 17];
export const PDF_TABLE_HEAD_RGB: [number, number, number] = [23, 23, 23];
export const PDF_TEXT_RGB: [number, number, number] = [17, 24, 39];
export const PDF_MUTED_RGB: [number, number, number] = [107, 114, 128];
