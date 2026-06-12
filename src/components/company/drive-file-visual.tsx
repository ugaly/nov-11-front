"use client";

import { fetchAuthenticatedPreviewBlob } from "@/api/company/company-files.api";
import type { CompanyDriveFile } from "@/api/types/company-files";
import {
  Download,
  Eye,
  EyeOff,
  File,
  FileSpreadsheet,
  FileText,
  FileType,
  Folder,
  ImageIcon,
  Loader2,
  MoreVertical,
  Pencil,
  Share2,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

export type DriveFileKind = "image" | "pdf" | "word" | "excel" | "text" | "generic";

const PREVIEW_PANE =
  "relative flex h-44 w-full items-center justify-center overflow-hidden bg-[#f8f9fa] dark:bg-gray-800/80";

export function resolveDriveFileKind(mimeType: string, fileName: string): DriveFileKind {
  const mime = (mimeType ?? "").toLowerCase();
  const ext = fileName.includes(".")
    ? fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase()
    : "";

  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (
    mime.includes("word") ||
    mime === "application/msword" ||
    ext === "doc" ||
    ext === "docx"
  ) {
    return "word";
  }
  if (
    mime.includes("sheet") ||
    mime.includes("excel") ||
    ext === "xls" ||
    ext === "xlsx"
  ) {
    return "excel";
  }
  if (mime.startsWith("text/") || ext === "txt" || ext === "csv") return "text";
  return "generic";
}

export function isPreviewableInList(kind: DriveFileKind): boolean {
  return kind === "image" || kind === "pdf";
}

export function DriveFileTypeIcon({
  kind,
  fileName,
  size = "md",
}: {
  kind: DriveFileKind;
  fileName?: string;
  size?: "sm" | "md";
}) {
  const cls = size === "sm" ? "size-4" : "size-5";
  const ext = fileName?.includes(".")
    ? fileName.slice(fileName.lastIndexOf(".") + 1).toUpperCase().slice(0, 4)
    : null;

  switch (kind) {
    case "pdf":
      return <FileText className={`${cls} shrink-0 text-rose-600`} aria-hidden />;
    case "word":
      return <FileType className={`${cls} shrink-0 text-blue-600`} aria-hidden />;
    case "excel":
      return <FileSpreadsheet className={`${cls} shrink-0 text-emerald-600`} aria-hidden />;
    case "image":
      return <ImageIcon className={`${cls} shrink-0 text-violet-600`} aria-hidden />;
    case "text":
      return <FileText className={`${cls} shrink-0 text-slate-600`} aria-hidden />;
    default:
      return <File className={`${cls} shrink-0 text-brand-600`} aria-hidden />;
  }
}

function DriveTypeBadgeLarge({
  kind,
  fileName,
}: {
  kind: DriveFileKind;
  fileName: string;
}) {
  const ext = fileName.includes(".")
    ? fileName.slice(fileName.lastIndexOf(".") + 1).toUpperCase().slice(0, 4)
    : "FILE";

  const labels: Record<DriveFileKind, { label: string; bg: string; color: string }> = {
    pdf: { label: "PDF", bg: "from-rose-50 to-red-100", color: "text-rose-600" },
    word: { label: "WORD", bg: "from-blue-50 to-indigo-100", color: "text-blue-600" },
    excel: { label: "EXCEL", bg: "from-emerald-50 to-green-100", color: "text-emerald-600" },
    text: { label: ext, bg: "from-slate-50 to-gray-100", color: "text-slate-600" },
    image: { label: "IMAGE", bg: "from-violet-50 to-purple-100", color: "text-violet-600" },
    generic: { label: ext, bg: "from-brand-50 to-sky-100", color: "text-brand-600" },
  };
  const style = labels[kind];

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${style.bg} dark:from-gray-800 dark:to-gray-900`}
    >
      <DriveFileTypeIcon kind={kind} fileName={fileName} size="md" />
      <span className={`mt-2 text-xs font-bold tracking-wider ${style.color}`}>
        {style.label}
      </span>
    </div>
  );
}

type PreviewLoaderProps = {
  file: CompanyDriveFile;
  companyId?: string;
  publicToken?: string;
};

function usePreviewBlob({ file, companyId, publicToken }: PreviewLoaderProps) {
  const kind = resolveDriveFileKind(file.mimeType, file.name);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(isPreviewableInList(kind));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isPreviewableInList(kind) || (!companyId && !publicToken)) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    setLoading(true);
    setFailed(false);
    setUrl(null);

    async function load() {
      try {
        let blob: Blob;
        if (publicToken) {
          const { fetchPublicCompanyDriveFileBlob } = await import(
            "@/api/company/company-files.api"
          );
          blob = await fetchPublicCompanyDriveFileBlob(publicToken, file.id, "preview");
        } else if (companyId) {
          blob = await fetchAuthenticatedPreviewBlob(companyId, file.id);
        } else {
          throw new Error("No auth");
        }
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [kind, companyId, publicToken, file.id]);

  return { kind, url, loading, failed };
}

export function DriveFilePreviewPane(props: PreviewLoaderProps) {
  const { kind, url, loading, failed } = usePreviewBlob(props);

  if (loading) {
    return (
      <div className={PREVIEW_PANE}>
        <Loader2 className="size-6 animate-spin text-gray-400" aria-hidden />
      </div>
    );
  }

  if (kind === "image" && url && !failed) {
    return (
      <div className={PREVIEW_PANE}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={props.file.name}
          className="h-full w-full object-cover object-top"
          loading="lazy"
        />
      </div>
    );
  }

  if (kind === "pdf" && url && !failed) {
    return (
      <div className={`${PREVIEW_PANE} items-start justify-center p-2`}>
        <iframe
          src={`${url}#view=FitH&toolbar=0&navpanes=0`}
          title={props.file.name}
          className="pointer-events-none h-[200%] w-full origin-top scale-[0.5] border-0 bg-white"
        />
      </div>
    );
  }

  return (
    <div className={PREVIEW_PANE}>
      <DriveTypeBadgeLarge kind={kind} fileName={props.file.name} />
    </div>
  );
}

/** @deprecated use DriveFilePreviewPane in card layout */
export function DriveFileVisual(props: PreviewLoaderProps) {
  return <DriveFilePreviewPane {...props} />;
}

export function DriveFolderVisual() {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/50">
      <Folder className="size-6 text-amber-600 dark:text-amber-400" aria-hidden />
    </div>
  );
}

export function formatDriveActivity(
  uploadedAt: string,
  uploadedByUserName: string,
  ownedByCurrentUser: boolean
): string {
  const d = new Date(uploadedAt);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const who = ownedByCurrentUser ? "You uploaded" : `${uploadedByUserName} uploaded`;

  if (diffDays === 0) return `${who} • Today`;
  if (diffDays === 1) return `${who} • Yesterday`;
  if (diffDays < 7) return `${who} • ${diffDays}d ago`;
  return `${who} • ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

/* ── Google Drive-style cards ── */

type MenuHandlers = {
  menuOpen: boolean;
  onMenuToggle: () => void;
  onPreview?: () => void;
  onDownload?: () => void;
  onRename: () => void;
  onShare: () => void;
  onDelete: () => void;
};

type VisibilityProps = {
  visible: boolean;
  canManage: boolean;
};

function ItemMenu({
  canManage,
  menuOpen,
  onMenuToggle,
  onPreview,
  onDownload,
  onRename,
  onShare,
  onDelete,
}: MenuHandlers & { canManage: boolean }) {
  if (!canManage) return null;
  return (
    <div className="relative z-[110] shrink-0">
      <button
        type="button"
        className={`rounded-full p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 ${
          menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onMenuToggle();
        }}
        aria-label="More actions"
      >
        <MoreVertical className="size-4" aria-hidden />
      </button>
      {menuOpen ? (
        <div className="absolute right-0 z-[9999] mt-1 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-xl ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-900 dark:ring-white/10">
          {onPreview ? (
            <MenuAction icon={<Eye className="size-4" />} label="Preview" onClick={onPreview} />
          ) : null}
          {onDownload ? (
            <MenuAction icon={<Download className="size-4" />} label="Download" onClick={onDownload} />
          ) : null}
          <MenuAction icon={<Share2 className="size-4" />} label="Share link" onClick={onShare} />
          <MenuAction icon={<Pencil className="size-4" />} label="Edit" onClick={onRename} />
          <MenuAction icon={<Trash2 className="size-4" />} label="Delete" onClick={onDelete} danger />
        </div>
      ) : null}
    </div>
  );
}

function VisibilityBadge({ visible }: { visible: boolean }) {
  return visible ? (
    <span title="Visible to company" className="shrink-0 rounded-full bg-emerald-50 p-1 dark:bg-emerald-950/40">
      <Users className="size-3 text-emerald-600" aria-hidden />
    </span>
  ) : (
    <span title="Private" className="shrink-0 rounded-full bg-gray-100 p-1 dark:bg-gray-800">
      <EyeOff className="size-3 text-gray-500" aria-hidden />
    </span>
  );
}

export function DriveFolderCard({
  name,
  meta,
  visible,
  canManage,
  onOpen,
  readOnly = false,
  ...menu
}: {
  name: string;
  meta: string;
  visible: boolean;
  canManage: boolean;
  onOpen: () => void;
  readOnly?: boolean;
} & Partial<MenuHandlers>) {
  const showMenu = !readOnly && canManage;
  return (
    <div
      className={`group relative flex items-center gap-3 overflow-visible rounded-xl border border-gray-200 bg-white px-4 py-3 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900/50 ${
        menu.menuOpen ? "z-[100]" : "z-0"
      }`}
    >
      <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={onOpen}>
        <DriveFolderVisual />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{name}</p>
          <p className="truncate text-xs text-gray-500">{meta}</p>
        </div>
      </button>
      {!readOnly ? <VisibilityBadge visible={visible} /> : null}
      {showMenu ? (
        <ItemMenu
          canManage={canManage}
          menuOpen={menu.menuOpen ?? false}
          onMenuToggle={menu.onMenuToggle ?? (() => {})}
          onPreview={menu.onPreview}
          onDownload={menu.onDownload}
          onRename={menu.onRename ?? (() => {})}
          onShare={menu.onShare ?? (() => {})}
          onDelete={menu.onDelete ?? (() => {})}
        />
      ) : null}
    </div>
  );
}

export function DriveFileCard({
  file,
  companyId,
  publicToken,
  onOpen,
  readOnly = false,
  ...menu
}: {
  file: CompanyDriveFile;
  companyId?: string;
  publicToken?: string;
  onOpen: () => void;
  readOnly?: boolean;
} & Partial<MenuHandlers>) {
  const kind = resolveDriveFileKind(file.mimeType, file.name);
  const showMenu = !readOnly && file.canManage;

  return (
    <div
      className={`group relative overflow-visible rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900/50 ${
        menu.menuOpen ? "z-[100]" : "z-0"
      }`}
    >
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
        <DriveFileTypeIcon kind={kind} fileName={file.name} size="sm" />
        <button
          type="button"
          className="min-w-0 flex-1 truncate text-left text-sm font-medium text-gray-900 dark:text-white"
          onClick={onOpen}
          title={file.name}
        >
          {file.name}
        </button>
        {!readOnly ? <VisibilityBadge visible={file.visibleToCompany} /> : null}
        {showMenu ? (
          <ItemMenu
            canManage={file.canManage}
            menuOpen={menu.menuOpen ?? false}
            onMenuToggle={menu.onMenuToggle ?? (() => {})}
            onPreview={menu.onPreview}
            onDownload={menu.onDownload}
            onRename={menu.onRename ?? (() => {})}
            onShare={menu.onShare ?? (() => {})}
            onDelete={menu.onDelete ?? (() => {})}
          />
        ) : null}
      </div>

      <button type="button" className="block w-full text-left" onClick={onOpen}>
        <DriveFilePreviewPane file={file} companyId={companyId} publicToken={publicToken} />
      </button>

      <div className="flex items-center gap-2 border-t border-gray-100 px-3 py-2 dark:border-gray-800">
        <DriveFileTypeIcon kind={kind} fileName={file.name} size="sm" />
        <p className="truncate text-xs text-gray-500">
          {formatDriveActivity(file.uploadedAt, file.uploadedByUserName, file.ownedByCurrentUser)}
        </p>
      </div>
    </div>
  );
}

function MenuAction({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
        danger
          ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {icon}
      {label}
    </button>
  );
}
