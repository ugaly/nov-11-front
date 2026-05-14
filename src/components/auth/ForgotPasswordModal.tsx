"use client";

import { forgotPassword } from "@/api/auth/auth.api";
import { getApiErrorMessage } from "@/api/errors";
import Button from "@/components/ui/button/Button";
import React, { useCallback, useEffect, useId, useState } from "react";

type Channel = "email" | "phone";

const EMAIL_RE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export type ForgotPasswordModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function ForgotPasswordModal({
  open,
  onClose,
}: ForgotPasswordModalProps) {
  const titleId = useId();
  const [channel, setChannel] = useState<Channel>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = useCallback(() => {
    setChannel("email");
    setEmail("");
    setPhone("");
    setSubmitting(false);
    setError(null);
    setSuccess(null);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (channel === "phone") {
      const trimmed = phone.trim();
      if (trimmed.length < 8) {
        setError("Enter a valid phone number (at least 8 digits).");
        return;
      }
      setSuccess(
        "Password reset is sent by email only on this workspace. Please use the Email tab with the address you registered, or contact your administrator if you no longer have access to that inbox."
      );
      return;
    }

    const normalized = normalizeEmail(email);
    if (!EMAIL_RE.test(normalized)) {
      setError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await forgotPassword({ email: normalized });
      setSuccess(res.message);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Something went wrong. Try again in a few minutes."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-zinc-950/55 backdrop-blur-[2px] transition-opacity"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[101] w-full max-w-[440px] overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_24px_80px_-24px_rgba(0,0,0,0.45)] dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="h-1 w-full bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-900" />

        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-6 pb-4 pt-5 dark:border-white/10 sm:px-8">
          <div>
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              Reset your password
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              We will send instructions to the email on your account.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden
            >
              <path
                d="M5 5L15 15M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 sm:px-8 sm:py-6">
          <div className="mb-5 flex rounded-full bg-gray-100 p-1 dark:bg-white/10">
            <button
              type="button"
              onClick={() => {
                setChannel("email");
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
                channel === "email"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => {
                setChannel("phone");
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
                channel === "phone"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              Phone
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {channel === "email" ? (
              <div>
                <label
                  htmlFor="forgot-email"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-white/30"
                />
              </div>
            ) : (
              <div>
                <label
                  htmlFor="forgot-phone"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Phone number
                </label>
                <input
                  id="forgot-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+255 769 000 000"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-white/30"
                />
                <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  The API sends reset links by email only. Use this tab if you
                  need guidance; submit to see how to proceed.
                </p>
              </div>
            )}

            {error ? (
              <p className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700 dark:bg-error-500/15 dark:text-error-200">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="rounded-lg bg-success-50 px-3 py-2 text-sm text-success-800 dark:bg-emerald-950/40 dark:text-emerald-100">
                {success}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="h-11 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <Button
                size="md"
                disabled={submitting}
                className="h-11 w-full !bg-black !py-0 !text-white hover:!bg-gray-900 disabled:!opacity-60 sm:w-auto sm:min-w-[120px]"
              >
                {channel === "email"
                  ? submitting
                    ? "Sending…"
                    : "Send reset link"
                  : "Continue"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
