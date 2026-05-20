"use client";

import type { PatchWorkItemSubmissionControlsRequest } from "@/api/types/work-item-api";
import Button from "@/components/ui/button/Button";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";

const checkboxClass =
  "size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20 dark:border-gray-600";

export default function WorkItemSubmissionControls({
  publicSubmitEnabled,
  internalEditEnabled,
  responsesLocked,
  saving,
  onSave,
}: {
  publicSubmitEnabled: boolean;
  internalEditEnabled: boolean;
  responsesLocked: boolean;
  saving?: boolean;
  onSave: (patch: PatchWorkItemSubmissionControlsRequest) => Promise<void>;
}) {
  const [customerOn, setCustomerOn] = useState(publicSubmitEnabled);
  const [staffOn, setStaffOn] = useState(internalEditEnabled);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setCustomerOn(publicSubmitEnabled);
    setStaffOn(internalEditEnabled);
    setDirty(false);
  }, [publicSubmitEnabled, internalEditEnabled]);

  async function handleSave() {
    const patch: PatchWorkItemSubmissionControlsRequest = {};
    if (customerOn !== publicSubmitEnabled) {
      patch.publicSubmitEnabled = customerOn;
    }
    if (staffOn !== internalEditEnabled) {
      patch.internalEditEnabled = staffOn;
    }
    if (!Object.keys(patch).length) return;
    await onSave(patch);
    setDirty(false);
  }

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-900/40">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Form access
      </p>

      {responsesLocked ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
          <Lock className="size-3.5 shrink-0" aria-hidden />
          Closed by office — responses are locked after closure submit.
        </p>
      ) : null}

      <div className="mt-3 space-y-2.5">
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            className={`mt-0.5 ${checkboxClass}`}
            checked={customerOn}
            disabled={saving}
            onChange={(e) => {
              setCustomerOn(e.target.checked);
              setDirty(true);
            }}
          />
          <span>
            <span className="font-medium">Allow customer to submit form</span>
            <span className="mt-0.5 block text-xs text-gray-500">
              When off, the public link is read-only (no submit or draft).
            </span>
          </span>
        </label>

        <label
          className={`flex items-start gap-2.5 text-sm ${
            responsesLocked
              ? "cursor-not-allowed text-gray-400"
              : "cursor-pointer text-gray-700 dark:text-gray-300"
          }`}
        >
          <input
            type="checkbox"
            className={`mt-0.5 ${checkboxClass}`}
            checked={staffOn}
            disabled={saving || responsesLocked}
            onChange={(e) => {
              setStaffOn(e.target.checked);
              setDirty(true);
            }}
          />
          <span>
            <span className="font-medium">Allow staff to edit responses</span>
            <span className="mt-0.5 block text-xs text-gray-500">
              When off, staff cannot save field values or upload field files.
            </span>
          </span>
        </label>
      </div>

      {dirty ? (
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            size="sm"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? "Saving…" : "Save access settings"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
