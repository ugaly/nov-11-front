"use client";

import { Loader2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";

const DEFAULT_ACCEPT =
  "image/jpeg,image/png,image/gif,image/webp,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv";

type Props = {
  label?: string;
  accept?: string;
  disabled?: boolean;
  onUpload: (file: File, onProgress: (pct: number) => void) => Promise<void>;
};

export default function FileDropUpload({
  label = "Drop files here or click to upload",
  accept = DEFAULT_ACCEPT,
  disabled = false,
  onUpload,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const runUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setProgress(0);
      try {
        await onUpload(file, setProgress);
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [onUpload]
  );

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (disabled) return;
          const file = e.dataTransfer.files?.[0];
          if (file) void runUpload(file);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragOver
            ? "border-brand-500 bg-brand-50/50 dark:bg-brand-950/20"
            : "border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-900/30"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        {uploading ? (
          <Loader2 className="size-8 animate-spin text-brand-500" aria-hidden />
        ) : (
          <Upload className="size-8 text-gray-400" aria-hidden />
        )}
        <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {uploading ? `Uploading… ${progress}%` : label}
        </p>
        <p className="mt-1 text-xs text-gray-500">Max 15 MB per file</p>
        {uploading ? (
          <div className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          disabled={disabled || uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void runUpload(file);
          }}
        />
      </div>
    </div>
  );
}
