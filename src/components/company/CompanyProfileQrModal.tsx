"use client";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { Download, Loader2, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  publicUrl: string;
};

export default function CompanyProfileQrModal({
  isOpen,
  onClose,
  companyName,
  publicUrl,
}: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !publicUrl) {
      setDataUrl(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void QRCode.toDataURL(publicUrl, {
      width: 320,
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

  function downloadQr() {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${companyName.replace(/[^a-zA-Z0-9._-]+/g, "_") || "company"}-profile-qr.png`;
    link.click();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900">
          <QrCode className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Profile QR code
          </h2>
          <p className="text-sm text-gray-500">Scan to open the public company page</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center">
        {loading ? (
          <div className="flex h-[320px] w-[320px] items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
            <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
          </div>
        ) : dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={`QR code for ${companyName} public profile`}
            className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700"
            width={320}
            height={320}
          />
        ) : (
          <p className="text-sm text-rose-600">Could not generate QR code.</p>
        )}
        <p className="mt-4 break-all text-center text-xs text-gray-500">{publicUrl}</p>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button disabled={!dataUrl} onClick={downloadQr}>
          <Download className="mr-1.5 size-4" aria-hidden />
          Download PNG
        </Button>
      </div>
    </Modal>
  );
}
