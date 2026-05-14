"use client";

import { getApiErrorMessage } from "@/api/errors";
import type { CurrentUserResponse } from "@/api/types/user-me";
import { getCurrentUser, postChangePassword } from "@/api/users/users.api";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useId, useState } from "react";

const MIN_LEN = 8;
const MAX_LEN = 128;

function meetsActivationPasswordRules(p: string): boolean {
  if (p.length < MIN_LEN || p.length > MAX_LEN) return false;
  if (!/[a-z]/.test(p)) return false;
  if (!/[A-Z]/.test(p)) return false;
  if (!/\d/.test(p)) return false;
  if (!/[^A-Za-z0-9]/.test(p)) return false;
  return true;
}

export type ChangePasswordModalProps = {
  open: boolean;
  onClose: () => void;
  onUpdated: (user: CurrentUserResponse) => void;
  onNotify: (payload: {
    variant: "success" | "error";
    title: string;
    message: string;
  }) => void;
};

export default function ChangePasswordModal({
  open,
  onClose,
  onUpdated,
  onNotify,
}: ChangePasswordModalProps) {
  const router = useRouter();
  const titleId = useId();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPw(false);
      setSubmitting(false);
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cur = currentPassword;
    if (!cur) {
      setError("Enter your current password.");
      return;
    }

    const next = newPassword;
    const confirm = confirmPassword;
    if (next.length < MIN_LEN || next.length > MAX_LEN) {
      setError(`New password must be ${MIN_LEN}–${MAX_LEN} characters.`);
      return;
    }
    if (next !== confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (!meetsActivationPasswordRules(next)) {
      setError(
        "New password must include a lowercase letter, uppercase letter, digit, and a special character."
      );
      return;
    }

    setSubmitting(true);
    try {
      const { message } = await postChangePassword({
        currentPassword: cur,
        newPassword: next,
        confirmPassword: confirm,
      });
      const user = await getCurrentUser();
      onUpdated(user);
      onClose();
      const okMsg =
        typeof message === "string" && message.trim().length > 0
          ? message.trim()
          : "Your password was changed successfully.";
      onNotify({
        variant: "success",
        title: "Password updated",
        message: okMsg,
      });
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 401 || status === 403) {
        router.replace("/");
        return;
      }
      setError(
        getApiErrorMessage(
          err,
          "Could not change password. Check your current password and try again."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="m-4 max-w-[440px] overflow-hidden p-0 shadow-2xl"
    >
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="px-6 pb-6 pt-10 sm:px-8"
        aria-labelledby={titleId}
      >
        <h2
          id={titleId}
          className="text-lg font-semibold text-gray-800 dark:text-white/90"
        >
          Change password
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Enter your current password, then a new password ({MIN_LEN}–{MAX_LEN}{" "}
          characters: lower, upper, digit, special) and confirm it.
        </p>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700 dark:bg-error-500/15 dark:text-error-100"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-5 space-y-4">
          <div>
            <Label>Current password</Label>
            <Input
              type={showPw ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <Label>New password</Label>
            <Input
              type={showPw ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              placeholder={`${MIN_LEN}–${MAX_LEN} characters`}
            />
          </div>
          <div>
            <Label>Confirm new password</Label>
            <Input
              type={showPw ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Same as new password"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={showPw}
              onChange={(e) => setShowPw(e.target.checked)}
              className="rounded border-gray-300"
            />
            Show passwords
          </label>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            disabled={submitting}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="md"
            disabled={submitting}
            className="!bg-black !text-white hover:!bg-gray-900 disabled:!opacity-50"
          >
            {submitting ? "Saving…" : "Update password"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
