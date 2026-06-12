"use client";

import {
  browseCompanyDrive,
  createCompanyDriveFolder,
  createCompanyDriveShareLink,
  deleteCompanyDriveFile,
  deleteCompanyDriveFolder,
  downloadCompanyDriveFile,
  fetchAuthenticatedPreviewBlob,
  updateCompanyDriveFile,
  updateCompanyDriveFolder,
  uploadCompanyDriveFile,
} from "@/api/company/company-files.api";
import type {
  CompanyDriveBrowse,
  CompanyDriveFile,
  CompanyDriveFolder,
} from "@/api/types/company-files";
import CompanyFileShareModal from "@/components/company/CompanyFileShareModal";
import {
  DriveFileCard,
  DriveFolderCard,
  isPreviewableInList,
  resolveDriveFileKind,
} from "@/components/company/drive-file-visual";
import FileDropUpload from "@/components/company/FileDropUpload";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/api/errors";
import { useMyCompanyId } from "@/lib/company/use-my-company-id";
import {
  ChevronRight,
  Eye,
  Folder,
  FolderPlus,
  Loader2,
  Lock,
  Upload,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type RenameTarget =
  | { kind: "folder"; item: CompanyDriveFolder }
  | { kind: "file"; item: CompanyDriveFile };

export default function CompanyFilesPanel() {
  const toast = useToast();
  const { companyId, loading: idLoading, error: idError } = useMyCompanyId();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [browse, setBrowse] = useState<CompanyDriveBrowse | null>(null);
  const [loading, setLoading] = useState(true);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareTitle, setShareTitle] = useState("");
  const [previewFile, setPreviewFile] = useState<CompanyDriveFile | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderVisible, setNewFolderVisible] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadVisible, setUploadVisible] = useState(false);
  const [renameName, setRenameName] = useState("");
  const [renameVisible, setRenameVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const data = await browseCompanyDrive(companyId, currentFolderId);
      setBrowse(data);
    } catch (e) {
      toast.showError(getApiErrorMessage(e, "Could not load files"));
    } finally {
      setLoading(false);
    }
  }, [companyId, currentFolderId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    };
  }, [previewBlobUrl]);

  async function openPreview(file: CompanyDriveFile) {
    if (!companyId || !file.previewable) return;
    setPreviewFile(file);
    setPreviewLoading(true);
    setPreviewBlobUrl(null);
    try {
      const blob = await fetchAuthenticatedPreviewBlob(companyId, file.id);
      setPreviewBlobUrl(URL.createObjectURL(blob));
    } catch {
      toast.showError("Could not preview file");
      setPreviewFile(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  function closePreview() {
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    setPreviewBlobUrl(null);
    setPreviewFile(null);
  }

  async function handleCreateFolder() {
    if (!companyId || !newFolderName.trim()) return;
    setSaving(true);
    try {
      await createCompanyDriveFolder(companyId, {
        parentFolderId: currentFolderId,
        name: newFolderName.trim(),
        visibleToCompany: newFolderVisible,
      });
      toast.showSuccess("Folder created");
      setFolderModalOpen(false);
      setNewFolderName("");
      setNewFolderVisible(false);
      await load();
    } catch (e) {
      toast.showError(getApiErrorMessage(e, "Could not create folder"));
    } finally {
      setSaving(false);
    }
  }

  async function handleRename() {
    if (!companyId || !renameTarget || !renameName.trim()) return;
    setSaving(true);
    try {
      if (renameTarget.kind === "folder") {
        await updateCompanyDriveFolder(companyId, renameTarget.item.id, {
          name: renameName.trim(),
          visibleToCompany: renameVisible,
        });
      } else {
        await updateCompanyDriveFile(companyId, renameTarget.item.id, {
          name: renameName.trim(),
          visibleToCompany: renameVisible,
        });
      }
      toast.showSuccess("Updated");
      setRenameTarget(null);
      await load();
    } catch (e) {
      toast.showError(getApiErrorMessage(e, "Could not update"));
    } finally {
      setSaving(false);
    }
  }

  async function handleShare(
    target: { kind: "folder"; id: string; name: string } | { kind: "file"; id: string; name: string }
  ) {
    if (!companyId) return;
    try {
      const link = await createCompanyDriveShareLink(
        companyId,
        target.kind === "folder" ? { folderId: target.id } : { fileId: target.id }
      );
      setShareTitle(target.name);
      setShareUrl(link.publicUrl);
      await load();
    } catch (e) {
      toast.showError(getApiErrorMessage(e, "Could not create share link"));
    }
  }

  async function handleDeleteFolder(folder: CompanyDriveFolder) {
    if (!companyId || !folder.canManage) return;
    if (!window.confirm(`Delete folder "${folder.name}" and everything inside?`)) return;
    try {
      await deleteCompanyDriveFolder(companyId, folder.id);
      toast.showSuccess("Folder deleted");
      await load();
    } catch (e) {
      toast.showError(getApiErrorMessage(e, "Could not delete folder"));
    }
  }

  async function handleDeleteFile(file: CompanyDriveFile) {
    if (!companyId || !file.canManage) return;
    if (!window.confirm(`Delete "${file.name}"?`)) return;
    try {
      await deleteCompanyDriveFile(companyId, file.id);
      toast.showSuccess("File deleted");
      await load();
    } catch (e) {
      toast.showError(getApiErrorMessage(e, "Could not delete file"));
    }
  }

  if (idLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
      </div>
    );
  }

  if (idError || !companyId) {
    return (
      <p className="text-sm text-rose-600">{idError ?? "Company not found for your account."}</p>
    );
  }

  const storage = browse?.storage;
  const isEmpty =
    browse && browse.folders.length === 0 && browse.files.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Company Files
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Store, organize, and share company documents — like Google Drive.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setFolderModalOpen(true)}>
            <FolderPlus className="mr-1.5 size-4" aria-hidden />
            New folder
          </Button>
          <Button size="sm" onClick={() => setUploadModalOpen(true)}>
            <Upload className="mr-1.5 size-4" aria-hidden />
            Upload
          </Button>
        </div>
      </div>

      {storage ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-900/40">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Storage</span>
            <span className="text-gray-500">
              {storage.usedLabel} of {storage.quotaLabel} used
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-full rounded-full transition-all ${
                storage.usedPercent > 90
                  ? "bg-rose-500"
                  : storage.usedPercent > 75
                    ? "bg-amber-500"
                    : "bg-brand-500"
              }`}
              style={{ width: `${Math.min(100, storage.usedPercent)}%` }}
            />
          </div>
        </div>
      ) : null}

      <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
        <button
          type="button"
          className="rounded px-1.5 py-0.5 font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400"
          onClick={() => setCurrentFolderId(null)}
        >
          My Drive
        </button>
        {browse?.breadcrumbs.map((crumb) => (
          <span key={crumb.id} className="flex items-center gap-1">
            <ChevronRight className="size-3.5" aria-hidden />
            <button
              type="button"
              className="rounded px-1.5 py-0.5 font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400"
              onClick={() => setCurrentFolderId(crumb.id)}
            >
              {crumb.name}
            </button>
          </span>
        ))}
      </nav>

      <section className="overflow-visible rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Files & folders
          </h3>
        </div>
        <div className="overflow-visible p-5">
        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
          </div>
        ) : isEmpty ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
            <Folder className="size-12 text-gray-300" aria-hidden />
            <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              This folder is empty
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Upload a file or create a folder to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-6 overflow-visible">
            {browse && browse.folders.length > 0 ? (
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Folders
                </h4>
                <div className="grid grid-cols-1 gap-2 overflow-visible lg:grid-cols-2">
                  {browse.folders.map((folder) => (
                    <DriveFolderCard
                      key={folder.id}
                      name={folder.name}
                      meta={folder.createdByUserName}
                      visible={folder.visibleToCompany}
                      canManage={folder.canManage}
                      menuOpen={menuOpenId === `f-${folder.id}`}
                      onMenuToggle={() =>
                        setMenuOpenId(menuOpenId === `f-${folder.id}` ? null : `f-${folder.id}`)
                      }
                      onOpen={() => setCurrentFolderId(folder.id)}
                      onRename={() => {
                        setRenameTarget({ kind: "folder", item: folder });
                        setRenameName(folder.name);
                        setRenameVisible(folder.visibleToCompany);
                        setMenuOpenId(null);
                      }}
                      onShare={() => {
                        void handleShare({ kind: "folder", id: folder.id, name: folder.name });
                        setMenuOpenId(null);
                      }}
                      onDelete={() => {
                        void handleDeleteFolder(folder);
                        setMenuOpenId(null);
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {browse && browse.files.length > 0 ? (
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Files
                </h4>
                <div className="grid grid-cols-1 gap-4 overflow-visible sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {browse.files.map((file) => {
                    const kind = resolveDriveFileKind(file.mimeType, file.name);
                    const canPreview = isPreviewableInList(kind) || file.previewable;
                    return (
                      <DriveFileCard
                        key={file.id}
                        file={file}
                        companyId={companyId ?? undefined}
                        menuOpen={menuOpenId === `file-${file.id}`}
                        onMenuToggle={() =>
                          setMenuOpenId(
                            menuOpenId === `file-${file.id}` ? null : `file-${file.id}`
                          )
                        }
                        onOpen={() => {
                          if (canPreview) void openPreview(file);
                          else if (companyId)
                            void downloadCompanyDriveFile(companyId, file.id, file.name);
                        }}
                        onPreview={
                          canPreview ? () => void openPreview(file) : undefined
                        }
                        onDownload={() => {
                          if (companyId)
                            void downloadCompanyDriveFile(companyId, file.id, file.name);
                          setMenuOpenId(null);
                        }}
                        onRename={() => {
                          setRenameTarget({ kind: "file", item: file });
                          setRenameName(file.name);
                          setRenameVisible(file.visibleToCompany);
                          setMenuOpenId(null);
                        }}
                        onShare={() => {
                          if (file.sharePublicUrl) {
                            setShareTitle(file.name);
                            setShareUrl(file.sharePublicUrl);
                          } else {
                            void handleShare({ kind: "file", id: file.id, name: file.name });
                          }
                          setMenuOpenId(null);
                        }}
                        onDelete={() => {
                          void handleDeleteFile(file);
                          setMenuOpenId(null);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}
        </div>
      </section>

      {/* New folder modal */}
      <Modal isOpen={folderModalOpen} onClose={() => setFolderModalOpen(false)} className="max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New folder</h2>
        <div className="mt-4 space-y-4">
          <div>
            <Label>Folder name</Label>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Contracts"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={newFolderVisible}
              onChange={(e) => setNewFolderVisible(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Users className="size-4 text-gray-400" aria-hidden />
            Visible to all company users
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setFolderModalOpen(false)}>
            Cancel
          </Button>
          <Button disabled={saving || !newFolderName.trim()} onClick={() => void handleCreateFolder()}>
            {saving ? "Creating…" : "Create folder"}
          </Button>
        </div>
      </Modal>

      {/* Upload modal */}
      <Modal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} className="max-w-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload file</h2>
        <div className="mt-4 space-y-4">
          <div>
            <Label>Display name (optional)</Label>
            <Input
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              placeholder="Uses file name if empty"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={uploadVisible}
              onChange={(e) => setUploadVisible(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Users className="size-4 text-gray-400" aria-hidden />
            Visible to all company users
          </label>
          <FileDropUpload
            label="Drag & drop a file here"
            onUpload={async (file, onProgress) => {
              await uploadCompanyDriveFile(companyId, file, {
                folderId: currentFolderId,
                name: uploadName.trim() || undefined,
                visibleToCompany: uploadVisible,
                onProgress,
              });
              toast.showSuccess("File uploaded");
              setUploadModalOpen(false);
              setUploadName("");
              setUploadVisible(false);
              await load();
            }}
          />
        </div>
      </Modal>

      {/* Rename / permissions modal */}
      <Modal
        isOpen={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        className="max-w-md p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {renameTarget?.kind === "folder" ? "Edit folder" : "Edit file"}
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={renameName} onChange={(e) => setRenameName(e.target.value)} />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={renameVisible}
              onChange={(e) => setRenameVisible(e.target.checked)}
              className="rounded border-gray-300"
            />
            {renameVisible ? (
              <Eye className="size-4 text-emerald-500" aria-hidden />
            ) : (
              <Lock className="size-4 text-gray-400" aria-hidden />
            )}
            Visible to all company users
          </label>
          {!renameVisible ? (
            <p className="text-xs text-gray-500">
              Only you can see this {renameTarget?.kind === "folder" ? "folder" : "file"}.
            </p>
          ) : null}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setRenameTarget(null)}>
            Cancel
          </Button>
          <Button disabled={saving || !renameName.trim()} onClick={() => void handleRename()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </Modal>

      {/* Preview modal */}
      <Modal
        isOpen={previewFile !== null}
        onClose={closePreview}
        className="!w-[80vw] max-w-[80vw] p-6 pt-12"
      >
        {previewFile ? (
          <div>
            <h2 className="mb-4 truncate pr-12 text-lg font-semibold text-gray-900 dark:text-white">
              {previewFile.name}
            </h2>
            {previewLoading ? (
              <div className="flex h-[min(85vh,820px)] items-center justify-center">
                <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
              </div>
            ) : previewBlobUrl && previewFile.mimeType.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewBlobUrl}
                alt={previewFile.name}
                className="mx-auto max-h-[min(85vh,820px)] w-full rounded-lg object-contain"
              />
            ) : previewBlobUrl && previewFile.mimeType === "application/pdf" ? (
              <iframe
                src={previewBlobUrl}
                title={previewFile.name}
                className="h-[min(85vh,820px)] w-full rounded-lg border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <p className="text-sm text-gray-500">Preview not available for this file type.</p>
            )}
          </div>
        ) : null}
      </Modal>

      <CompanyFileShareModal
        isOpen={shareUrl !== null}
        onClose={() => setShareUrl(null)}
        title={shareTitle}
        publicUrl={shareUrl ?? ""}
        onCopy={() => toast.showSuccess("Link copied")}
      />
    </div>
  );
}
