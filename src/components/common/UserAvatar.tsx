"use client";

import { API_BASE_URL } from "@/api/config";

/** Absolute URL for `<img src>` — API may return absolute, site-relative, or API-root-relative paths. */
export function resolveAvatarSrc(
  avatarUrl: string | null | undefined
): string | null {
  const u = avatarUrl?.trim();
  if (!u) return null;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${API_BASE_URL}${u}`;
  return u;
}

export function initialsFromFullName(name: string | null | undefined): string {
  const n = name?.trim();
  if (!n) return "?";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0];
    const b = parts[parts.length - 1][0];
    return `${a}${b}`.toUpperCase();
  }
  if (parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  return parts[0][0]!.toUpperCase();
}

export type UserAvatarProps = {
  fullName: string | null | undefined;
  avatarUrl: string | null | undefined;
  sizeClass?: string;
  textClass?: string;
  className?: string;
};

export default function UserAvatar({
  fullName,
  avatarUrl,
  sizeClass = "h-11 w-11",
  textClass = "text-sm",
  className = "",
}: UserAvatarProps) {
  const src = resolveAvatarSrc(avatarUrl);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- dynamic API URLs
      <img
        src={src}
        alt=""
        className={`rounded-full object-cover ${sizeClass} ${className}`}
      />
    );
  }
  const ini = initialsFromFullName(fullName);
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-300 font-semibold text-gray-700 dark:from-gray-600 dark:to-gray-700 dark:text-gray-100 ${sizeClass} ${textClass} ${className}`}
      aria-hidden
    >
      {ini}
    </div>
  );
}
