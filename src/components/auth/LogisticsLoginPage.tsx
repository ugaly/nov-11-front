"use client";

import { login } from "@/api/auth/auth.api";
import { getApiErrorMessage } from "@/api/errors";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { setAuthSession } from "@/lib/auth-storage";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const BG_IMAGE =
  "https://images.pexels.com/photos/6863183/pexels-photo-6863183.jpeg";
const LOGO_IMAGE = "/images/logo/Logo-White.jpg";

export default function LogisticsLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await login({
        username: username.trim(),
        password,
      });
      setAuthSession({
        accessToken: res.accessToken,
        user: res.user,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Sign-in failed. Check your details and try again.")
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <img
          src={BG_IMAGE}
          alt=""
          className="h-full w-full min-h-[100vh] min-w-[100vw] scale-105 object-cover object-center opacity-[0.78] blur-[1.5px] lg:opacity-[0.82] lg:blur-[1px]"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0 bg-portal-teal/48 lg:bg-portal-teal/40"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-portal-950/62 via-transparent to-portal-950/55"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-portal-950/35"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-tl from-transparent via-transparent to-portal-warm/8"
          aria-hidden
        />
      </div>

      <div className="relative z-10 w-full max-w-[400px] sm:max-w-[440px] lg:max-w-[520px] xl:max-w-[560px]">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_28px_90px_-20px_rgba(0,0,0,0.55)] dark:border-gray-200 dark:bg-white dark:shadow-[0_28px_90px_-20px_rgba(0,0,0,0.55)]">
          <div className="h-1.5 w-full bg-gradient-to-r from-portal-teal via-portal-accent to-portal-warm" />

          <div className="px-6 pb-8 pt-0 sm:px-10 sm:pb-10 lg:px-12 lg:pb-10">
            <div className="mb-4 flex flex-col items-center text-center">
              <div className="m-0 flex h-32 w-32 shrink-0 items-center justify-center rounded-xl bg-white p-0 sm:h-40 sm:w-40">
                <img
                  src={LOGO_IMAGE}
                  alt="Company logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <h1 className="mt-1.5 max-w-md text-balance font-semibold text-gray-900 text-title-sm dark:text-white sm:text-title-md">
                Internal user login panel
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5 sm:mt-7">
              {error ? (
                <p
                  role="alert"
                  className="rounded-lg bg-error-50 px-3 py-2.5 text-sm text-error-700 dark:bg-error-500/15 dark:text-error-100"
                >
                  {error}
                </p>
              ) : null}

              <div>
                <Label>
                  Username <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  name="username"
                  placeholder="e.g. jdoe"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Use the username you registered with (not necessarily your
                  email).
                </p>
              </div>
              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-current" />
                    ) : (
                      <EyeCloseIcon className="fill-current" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-sm font-medium text-portal-teal hover:text-portal-accent dark:text-portal-accent-soft dark:hover:text-white"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                className="w-full !bg-black !py-3.5 text-base !text-white !shadow-portal-card hover:!bg-gray-900 disabled:!bg-black/50"
                size="md"
                disabled={submitting}
              >
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-white/80 lg:mt-6">
          Internal use. IT issues access.
        </p>
      </div>

      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
}
