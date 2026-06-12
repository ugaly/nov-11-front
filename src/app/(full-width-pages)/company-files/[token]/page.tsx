"use client";

import {
  fetchPublicCompanyDriveFileBlob,
  formatDriveBytes,
  getPublicCompanyDriveShare,
} from "@/api/company/company-files.api";
import type { CompanyDriveFile } from "@/api/types/company-files";
import CompanyFileShareModal from "@/components/company/CompanyFileShareModal";
import {
  DriveFileCard,
  DriveFolderCard,
  isPreviewableInList,
  resolveDriveFileKind,
} from "@/components/company/drive-file-visual";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { getApiErrorMessage } from "@/api/errors";
import { ChevronRight, Download, Loader2, QrCode } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function PublicCompanyFilesPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [folderId, setFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareType, setShareType] = useState<"FILE" | "FOLDER">("FILE");
  const [name, setName] = useState("");
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [files, setFiles] = useState<CompanyDriveFile[]>([]);
  const [singleFile, setSingleFile] = useState<CompanyDriveFile | null>(null);
  const [previewFile, setPreviewFile] = useState<CompanyDriveFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/company-files/${token}`
      : `/company-files/${token}`;

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicCompanyDriveShare(token, folderId);
      setShareType(data.shareType as "FILE" | "FOLDER");
      setName(data.name);
      if (data.shareType === "FILE" && data.file) {
        setSingleFile(data.file);
        setFolders([]);
        setFiles([]);
      } else {
        setSingleFile(null);
        setFolders(data.folders.map((f) => ({ id: f.id, name: f.name })));
        setFiles(data.files);
      }
    } catch (e) {
      setError(getApiErrorMessage(e, "This share link is unavailable."));
    } finally {
      setLoading(false);
    }
  }, [token, folderId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function openPreview(file: CompanyDriveFile) {
    if (!token) return;
    const kind = resolveDriveFileKind(file.mimeType, file.name);
    if (!isPreviewableInList(kind) && !file.previewable) return;
    setPreviewFile(file);
    setPreviewLoading(true);
    setPreviewUrl(null);
    try {
      const blob = await fetchPublicCompanyDriveFileBlob(token, file.id, "preview");
      setPreviewUrl(URL.createObjectURL(blob));
    } catch {
      setError("Could not preview file");
      setPreviewFile(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  function closePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewFile(null);
  }

  async function downloadFile(file: CompanyDriveFile) {
    if (!token) return;
    const blob = await fetchPublicCompanyDriveFileBlob(token, file.id, "download");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openFile(file: CompanyDriveFile) {
    const kind = resolveDriveFileKind(file.mimeType, file.name);
    if (isPreviewableInList(kind) || file.previewable) void openPreview(file);
    else void downloadFile(file);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="size-10 animate-spin text-gray-400" aria-hidden />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Shared company files
            </p>
            <h1 className="mt-0.5 text-lg font-semibold text-gray-900 dark:text-white">
              {name}
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => setQrOpen(true)}>
            <QrCode className="mr-1.5 size-4" aria-hidden />
            QR code
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {shareType === "FILE" && singleFile ? (
          <div className="max-w-sm">
            <DriveFileCard
              file={singleFile}
              publicToken={token}
              readOnly
              onOpen={() => openFile(singleFile)}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {(isPreviewableInList(resolveDriveFileKind(singleFile.mimeType, singleFile.name)) ||
                singleFile.previewable) && (
                <Button size="sm" onClick={() => void openPreview(singleFile)}>
                  Preview
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => void downloadFile(singleFile)}>
                <Download className="mr-1.5 size-4" aria-hidden />
                Download · {formatDriveBytes(singleFile.sizeBytes)}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {folderId ? (
              <button
                type="button"
                className="flex items-center gap-1 text-sm text-brand-600 hover:underline"
                onClick={() => setFolderId(null)}
              >
                <ChevronRight className="size-4 rotate-180" aria-hidden />
                Back
              </button>
            ) : null}

            {folders.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {folders.map((folder) => (
                  <DriveFolderCard
                    key={folder.id}
                    name={folder.name}
                    meta="Shared folder"
                    visible
                    canManage={false}
                    readOnly
                    onOpen={() => setFolderId(folder.id)}
                  />
                ))}
              </div>
            ) : null}

            {files.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {files.map((file) => (
                  <DriveFileCard
                    key={file.id}
                    file={file}
                    publicToken={token}
                    readOnly
                    onOpen={() => openFile(file)}
                  />
                ))}
              </div>
            ) : null}

            {folders.length === 0 && files.length === 0 ? (
              <p className="text-center text-sm text-gray-500">This folder is empty.</p>
            ) : null}
          </div>
        )}
      </main>

      <Modal isOpen={previewFile !== null} onClose={closePreview} className="!w-[80vw] max-w-[80vw] p-6 pt-12">
        {previewFile ? (
          <div>
            <h2 className="mb-4 truncate pr-12 text-lg font-semibold">{previewFile.name}</h2>
            {previewLoading ? (
              <div className="flex h-[min(85vh,820px)] items-center justify-center">
                <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
              </div>
            ) : previewUrl && previewFile.mimeType.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={previewFile.name} className="mx-auto max-h-[min(85vh,820px)] w-full object-contain" />
            ) : previewUrl && previewFile.mimeType === "application/pdf" ? (
              <iframe src={previewUrl} title={previewFile.name} className="h-[min(85vh,820px)] w-full rounded-lg border" />
            ) : null}
          </div>
        ) : null}
      </Modal>

      <CompanyFileShareModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        title={name}
        publicUrl={publicUrl}
      />
    </div>
  );
}
