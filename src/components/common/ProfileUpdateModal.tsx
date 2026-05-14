"use client";

import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import React from "react";

export type ProfileUpdateModalProps = {
  isOpen: boolean;
  variant: "success" | "error";
  title: string;
  message: string;
  onClose: () => void;
};

export default function ProfileUpdateModal({
  isOpen,
  variant,
  title,
  message,
  onClose,
}: ProfileUpdateModalProps) {
  const isOk = variant === "success";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="m-4 max-w-[420px] overflow-hidden p-0 shadow-2xl"
    >
      <div
        className={`px-6 pb-6 pt-8 text-center sm:px-8 ${
          isOk
            ? "border-t-4 border-emerald-500 bg-white dark:bg-gray-900"
            : "border-t-4 border-red-500 bg-white dark:bg-gray-900"
        }`}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
          {isOk ? (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          )}
        </div>
        <h3
          className={`text-lg font-semibold ${
            isOk
              ? "text-emerald-900 dark:text-emerald-100"
              : "text-red-900 dark:text-red-100"
          }`}
        >
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {message}
        </p>
        <div className="mt-6 flex justify-center">
          <Button type="button" size="md" onClick={onClose}>
            OK
          </Button>
        </div>
      </div>
    </Modal>
  );
}
