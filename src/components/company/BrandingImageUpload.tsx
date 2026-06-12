"use client";

import FileDropUpload from "@/components/company/FileDropUpload";
import Button from "@/components/ui/button/Button";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

type Props = {
  label: string;
  imageUrl?: string | null;
  accept?: string;
  previewClassName?: string;
  emptyHint?: string;
  onUpload: (file: File, onProgress: (pct: number) => void) => Promise<void>;
  onRemove?: () => Promise<void>;
};

export default function BrandingImageUpload({
  label,
  imageUrl,
  accept = "image/jpeg,image/png,image/gif,image/webp",
  previewClassName = "h-32 w-full object-contain bg-gray-50 p-2 dark:bg-gray-900",
  emptyHint,
  onUpload,
  onRemove,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [changing, setChanging] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleFile(file: File) {
    setChanging(true);
    try {
      await onUpload(file, () => {});
    } finally {
      setChanging(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-800 dark:text-white/90">{label}</p>
      {imageUrl ? (
        <div className="mt-2 space-y-3">
          <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={label} className={previewClassName} />
            {changing ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="size-8 animate-spin text-white" aria-hidden />
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={changing || removing}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus className="mr-1.5 size-4" aria-hidden />
              Change image
            </Button>
            {onRemove ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={changing || removing}
                onClick={() =>
                  void (async () => {
                    setRemoving(true);
                    try {
                      await onRemove();
                    } finally {
                      setRemoving(false);
                    }
                  })()
                }
              >
                {removing ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="mr-1.5 size-4" aria-hidden />
                )}
                Remove
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-gray-500">
            Upload a new file to replace the current image.
          </p>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept={accept}
            disabled={changing || removing}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void handleFile(file);
            }}
          />
        </div>
      ) : (
        <div className="mt-2">
          {emptyHint ? (
            <p className="mb-2 text-xs text-gray-500">{emptyHint}</p>
          ) : null}
          <FileDropUpload
            label={`Upload ${label.toLowerCase()}`}
            accept={accept}
            disabled={changing}
            onUpload={onUpload}
          />
        </div>
      )}
    </div>
  );
}
