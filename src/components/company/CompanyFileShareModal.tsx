"use client";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { Copy, Download, Loader2, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  publicUrl: string;
  onCopy?: () => void;
};

export default function CompanyFileShareModal({
  isOpen,
  onClose,
  title,
  publicUrl,
  onCopy,
}: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !publicUrl) {
      setDataUrl(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void QRCode.toDataURL(publicUrl, {
      width: 280,
      margin: 2,
      color: { dark: "#111827", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, publicUrl]);

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadQr() {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${title.replace(/[^a-zA-Z0-9._-]+/g, "_") || "share"}-qr.png`;
    link.click();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-500 text-white">
          <QrCode className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Share link
          </h2>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Anyone with this link can view without signing in. Scan the QR code or copy the URL.
      </p>

      <div className="mt-5 flex flex-col items-center">
        {loading ? (
          <div className="flex h-[280px] w-[280px] items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
            <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
          </div>
        ) : dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={`QR code for ${title}`}
            className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700"
            width={280}
            height={280}
          />
        ) : (
          <p className="text-sm text-rose-600">Could not generate QR code.</p>
        )}
        <p className="mt-4 break-all text-center text-xs text-gray-500">{publicUrl}</p>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button variant="outline" onClick={() => void copyLink()}>
          <Copy className="mr-1.5 size-4" aria-hidden />
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button disabled={!dataUrl} onClick={downloadQr}>
          <Download className="mr-1.5 size-4" aria-hidden />
          Download QR
        </Button>
      </div>
    </Modal>
  );
}
