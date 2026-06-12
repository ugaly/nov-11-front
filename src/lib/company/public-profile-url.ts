/** Absolute URL for the public company profile page (client-only). */
export function companyPublicProfileUrl(companyId: string): string {
  if (typeof window === "undefined") {
    return `/company/${companyId}`;
  }
  return `${window.location.origin}/company/${companyId}`;
}
