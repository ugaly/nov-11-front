"use client";

import { setupConfirmModalClass } from "@/components/setup/setupFormModal";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { AlertTriangle } from "lucide-react";

export default function DeactivateConfirmModal({
  open,
  title,
  description,
  itemName,
  confirmLabel = "Deactivate",
  loading = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  itemName?: string;
  confirmLabel?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal isOpen={open} onClose={onClose} className={setupConfirmModalClass}>
      <div className="flex gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-error-50 text-error-600 dark:bg-error-950/40 dark:text-error-400">
          <AlertTriangle className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
          {itemName ? (
            <p className="mt-2 truncate rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white/90">
              {itemName}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          className="bg-error-600 hover:bg-error-700"
          disabled={loading}
          onClick={onConfirm}
        >
          {loading ? "Working…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
