"use client";

import { API_BASE_URL } from "@/api/config";
import { useEffect, useState } from "react";

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

/** First letter of the display name (fallback when no photo). */
export function firstLetterFromName(name: string | null | undefined): string {
  const n = name?.trim();
  if (!n) return "?";
  return n[0]!.toUpperCase();
}

const AVATAR_PALETTES = [
  "bg-brand-500 text-white",
  "bg-violet-500 text-white",
  "bg-emerald-500 text-white",
  "bg-amber-500 text-white",
  "bg-rose-500 text-white",
  "bg-cyan-600 text-white",
] as const;

function avatarPalette(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length]!;
}

export type UserAvatarProps = {
  fullName: string | null | undefined;
  avatarUrl: string | null | undefined;
  sizeClass?: string;
  textClass?: string;
  className?: string;
  /** `circle` for header; `rounded` for dashboard hero. */
  shape?: "circle" | "rounded";
};

export default function UserAvatar({
  fullName,
  avatarUrl,
  sizeClass = "h-11 w-11",
  textClass = "text-sm",
  className = "",
  shape = "circle",
}: UserAvatarProps) {
  const displayName = fullName?.trim() || "User";
  const src = resolveAvatarSrc(avatarUrl);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  const radius = shape === "rounded" ? "rounded-2xl" : "rounded-full";
  const letter = firstLetterFromName(displayName);

  if (src && !imgFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- dynamic API URLs
      <img
        src={src}
        alt=""
        className={`object-cover ${radius} ${sizeClass} ${className}`}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center font-semibold ${radius} ${avatarPalette(displayName)} ${sizeClass} ${textClass} ${className}`}
      aria-hidden
      title={displayName}
    >
      {letter}
    </div>
  );
}
